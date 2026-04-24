import express, { Request, Response } from 'express';
import { Parser } from 'json2csv';
import puppeteer from 'puppeteer';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import adminAuth from '../middleware/adminAuth';
import { User } from '../models/User';
import Order from '../models/Order';

const router = express.Router();

// GET /api/admin/users/export
router.get('/users/export', adminAuth(['super_admin', 'editor']), async (req: Request, res: Response) => {
    try {
        const { status, city } = req.query;
        let query: any = {};
        
        if (status && status !== 'All') {
            query.status = status;
        }
        if (city && city !== 'All') {
            query['addresses.district'] = city;
        }

        const users = await User.find(query).lean();
        
        const userIds = users.map(u => u._id);
        const orders = await Order.aggregate([
            { $match: { userId: { $in: userIds }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: '$userId', count: { $sum: 1 }, totalSpent: { $sum: '$total' } } }
        ]);
        
        const orderMap = new Map(orders.map(o => [o._id.toString(), o]));

        const data = users.map(u => {
            const stats = orderMap.get(u._id.toString()) || { count: 0, totalSpent: 0 };
            return {
                Name: u.name,
                Email: u.email,
                Phone: u.phone,
                District: u.addresses && u.addresses.length > 0 ? u.addresses[0].district : '',
                Status: u.status,
                'Order Count': stats.count,
                'Total Spent (৳)': stats.totalSpent,
                'Join Date': new Date(u.createdAt).toLocaleDateString()
            };
        });

        const parser = new Parser();
        const csv = parser.parse(data);

        const filename = `eloria-users-${new Date().toISOString().split('T')[0]}.csv`;
        res.header('Content-Type', 'text/csv');
        res.attachment(filename);
        res.send(csv);

    } catch (error) {
        console.error('Users export error:', error);
        res.status(500).json({ message: 'Failed to export users' });
    }
});

// GET /api/admin/orders/export
router.get('/orders/export', adminAuth(['super_admin', 'editor']), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, status } = req.query;
        let query: any = {};

        if (status && status !== 'All') {
            query.status = status;
        }
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }

        const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

        const data = orders.map(o => ({
            'Order #': o.orderNumber,
            'Customer Name': o.customer?.name || '',
            'Phone': o.customer?.phone || '',
            'Items Count': o.items ? o.items.length : 0,
            'Subtotal': o.subtotal,
            'Shipping': o.shippingCost,
            'Discount': o.couponDiscount || 0,
            'Total (৳)': o.total,
            'Status': o.status,
            'Date': new Date(o.createdAt).toLocaleDateString()
        }));

        const parser = new Parser();
        const csv = parser.parse(data);

        const filename = `eloria-orders-${new Date().toISOString().split('T')[0]}.csv`;
        res.header('Content-Type', 'text/csv');
        res.attachment(filename);
        res.send(csv);

    } catch (error) {
        console.error('Orders export error:', error);
        res.status(500).json({ message: 'Failed to export orders' });
    }
});

// GET /api/admin/analytics/report
router.get('/analytics/report', adminAuth(['super_admin', 'editor']), async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ status: { $ne: 'Cancelled' } }).lean();
        
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        
        const labels: string[] = [];
        const salesData: number[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));
            
            const dayStart = new Date(d.setHours(0,0,0,0));
            const dayEnd = new Date(d.setHours(23,59,59,999));
            
            const daySales = orders.filter(o => {
                const od = new Date(o.createdAt);
                return od >= dayStart && od <= dayEnd;
            }).reduce((sum, o) => sum + (o.total || 0), 0);
            salesData.push(daySales);
        }

        const productCounts: Record<string, {name: string, count: number, revenue: number}> = {};
        orders.forEach(o => {
            if(o.items) {
                o.items.forEach(i => {
                    const idStr = i.productId.toString();
                    if(!productCounts[idStr]) {
                        productCounts[idStr] = { name: i.name, count: 0, revenue: 0 };
                    }
                    productCounts[idStr].count += i.quantity;
                    productCounts[idStr].revenue += (i.price * i.quantity);
                });
            }
        });
        const topProducts = Object.values(productCounts).sort((a,b) => b.count - a.count).slice(0, 5);

        const width = 800;
        const height = 400;
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
        const configuration: any = {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Revenue (৳)',
                    data: salesData,
                    borderColor: '#534AB7',
                    backgroundColor: 'rgba(83, 74, 183, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        };
        const chartBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const chartBase64 = chartBuffer.toString('base64');
        const chartUri = `data:image/png;base64,${chartBase64}`;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; color: #1c1c1c; margin: 0; padding: 40px; }
                h1, h2, h3 { font-family: 'Playfair Display', serif; color: #534AB7; }
                .header { text-align: center; border-bottom: 2px solid #534AB7; padding-bottom: 20px; margin-bottom: 40px; }
                .header h1 { font-size: 36px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
                .header p { color: #666; font-size: 14px; margin-top: 5px; }
                .cards { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .card { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 0 10px; text-align: center; border: 1px solid #e9ecef; }
                .card h3 { margin: 0 0 10px 0; font-size: 16px; color: #666; font-family: 'Inter', sans-serif; }
                .card p { margin: 0; font-size: 24px; font-weight: bold; color: #534AB7; }
                .chart-container { margin-bottom: 40px; text-align: center; }
                .chart-container img { max-width: 100%; height: auto; border: 1px solid #e9ecef; border-radius: 8px; padding: 10px; }
                table { w-full: 100%; width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
                th { background: #534AB7; color: white; font-weight: 500; font-family: 'Playfair Display', serif; }
                tr:nth-child(even) { background: #f8f9fa; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ELORIA BD</h1>
                <p>Executive Performance Summary • ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="cards">
                <div class="card">
                    <h3>Total Revenue</h3>
                    <p>৳${totalRevenue.toLocaleString()}</p>
                </div>
                <div class="card">
                    <h3>Total Orders</h3>
                    <p>${orders.length}</p>
                </div>
                <div class="card">
                    <h3>Avg Order Value</h3>
                    <p>৳${Math.round(avgOrderValue).toLocaleString()}</p>
                </div>
            </div>

            <div class="chart-container">
                <h2>Revenue (Last 7 Days)</h2>
                <img src="${chartUri}" />
            </div>

            <h2>Top 5 Selling Masterpieces</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Units Sold</th>
                        <th>Revenue Generated</th>
                    </tr>
                </thead>
                <tbody>
                    ${topProducts.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.count}</td>
                            <td>৳${p.revenue.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdf.length,
            'Content-Disposition': `attachment; filename=Eloria-Executive-Report-${new Date().toISOString().split('T')[0]}.pdf`
        });
        
        res.send(pdf);

    } catch (error) {
        console.error('Report export error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
});

export default router;
