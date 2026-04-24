import Notification from '../models/Notification';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export const createNotification = async (
    type: 'new_order' | 'low_stock' | 'new_review',
    message: string,
    link: string,
    additionalData?: any
) => {
    try {
        // Save to Database
        const notification = await Notification.create({ type, message, link });

        // Trigger free email alert for new orders
        if (type === 'new_order' && additionalData) {
            const { orderNumber, total } = additionalData;
            
            // Send to Admin email (ideally from env, using a placeholder for now)
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@eloriabd.com';
            
            await resend.emails.send({
                from: 'Eloria BD Alerts <no-reply@eloriabd.com>',
                to: adminEmail,
                subject: `🚨 New Order Received: ${orderNumber}`,
                html: `
                    <h2>New Order Alert!</h2>
                    <p><strong>Order Number:</strong> ${orderNumber}</p>
                    <p><strong>Total Amount:</strong> ৳${total}</p>
                    <p><a href="https://eloriabd.com${link}">Click here to view the order</a></p>
                `
            });
            console.log(`[Notification] Admin email alert sent for order ${orderNumber}`);
        }

        return notification;
    } catch (error) {
        console.error('[Notification] Error creating notification:', error);
    }
};
