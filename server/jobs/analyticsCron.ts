import cron from 'node-cron';
import { PageView } from '../models/PageView';
import { DailySummary } from '../models/DailySummary';

export const aggregateDailyAnalytics = async (dateStr?: string) => {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    if (!dateStr) {
        targetDate.setDate(targetDate.getDate() - 1); // Aggregate for yesterday by default
    }
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    try {
        const pipeline: any[] = [
            {
                $match: {
                    timestamp: { $gte: targetDate, $lt: nextDate }
                }
            },
            {
                $facet: {
                    totalViews: [{ $count: "count" }],
                    uniquePaths: [
                        { $group: { _id: "$path", count: { $sum: 1 } } },
                        { $project: { _id: 0, path: "$_id", count: 1 } },
                        { $sort: { count: -1 } },
                        { $limit: 100 }
                    ],
                    topReferrers: [
                        { $match: { referrer: { $exists: true, $ne: null } } },
                        { $group: { _id: "$referrer", count: { $sum: 1 } } },
                        { $project: { _id: 0, source: "$_id", count: 1 } },
                        { $sort: { count: -1 } },
                        { $limit: 50 }
                    ],
                    topUTMSources: [
                        { $match: { utmSource: { $exists: true, $ne: null } } },
                        { $group: { _id: "$utmSource", count: { $sum: 1 } } },
                        { $project: { _id: 0, source: "$_id", count: 1 } },
                        { $sort: { count: -1 } },
                        { $limit: 50 }
                    ],
                    topCities: [
                        { $match: { geoCity: { $exists: true, $nin: [null, 'Unknown'] } } },
                        { $group: { _id: "$geoCity", count: { $sum: 1 } } },
                        { $project: { _id: 0, city: "$_id", count: 1 } },
                        { $sort: { count: -1 } },
                        { $limit: 50 }
                    ]
                }
            }
        ];

        const [results] = await PageView.aggregate(pipeline) as any[];

        const totalViews = results?.totalViews?.length > 0 ? results.totalViews[0].count : 0;

        await DailySummary.findOneAndUpdate(
            { date: targetDate },
            {
                date: targetDate,
                totalViews,
                uniquePaths: results.uniquePaths,
                topReferrers: results.topReferrers,
                topUTMSources: results.topUTMSources,
                topCities: results.topCities
            },
            { upsert: true, new: true }
        );

        console.log(`Analytics aggregated for ${targetDate.toISOString()}`);
        return { success: true, date: targetDate, totalViews };

    } catch (error) {
        console.error('Failed to aggregate daily analytics:', error);
        return { success: false, error };
    }
};

// Run at 00:00 every day
export const initAnalyticsCron = () => {
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily analytics aggregation...');
        aggregateDailyAnalytics();
    });
};
