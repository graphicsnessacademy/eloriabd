import { Request, Response, NextFunction } from 'express';
import geoip from 'geoip-lite';
import { PageView } from '../models/PageView';

export const pageViewMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only track GET requests
    if (req.method !== 'GET') {
        return next();
    }

    // Ignore admin and upload routes
    if (req.originalUrl.startsWith('/api/admin') || req.originalUrl.startsWith('/api/upload')) {
        return next();
    }

    // Don't delay the response, process asynchronously
    res.on('finish', async () => {
        try {
            // Only track successful or caching responses (200, 304, etc.)
            if (res.statusCode >= 400) return;

            // Get IP
            let ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
            if (Array.isArray(ip)) ip = ip[0];
            if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();

            // For local development, ::1 or 127.0.0.1 might not yield geo info, but that's fine
            const geo = ip ? geoip.lookup(ip as string) : null;

            const pageViewData = {
                path: req.path,
                referrer: req.headers.referer || req.headers.referrer,
                utmSource: req.query.utm_source,
                utmMedium: req.query.utm_medium,
                utmCampaign: req.query.utm_campaign,
                userAgent: req.headers['user-agent'],
                geoCountry: geo?.country || 'Unknown',
                geoCity: geo?.city || 'Unknown',
            };

            await PageView.create(pageViewData);
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    });

    next();
};
