import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BD8R9HuXMF5O80vXon4YSIrFfuxv2wRU_EZT0k2HiUkMAvp9DkDux1doMXx2fO_bO-_VaWW_-cPyX9EwBwff_SA';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'OWCIXmURU_rgrS0ZY2PbSjAeU8g4L_ONek_E0t9xbTM'; // Valid fallback keys
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@eloriabd.com';

webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);

export const sendPushNotification = async (payload: { title: string; body: string; url?: string }) => {
    try {
        const subscriptions = await PushSubscription.find();
        
        if (subscriptions.length === 0) {
            return;
        }

        const notifications = subscriptions.map(sub => 
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: sub.keys
                },
                JSON.stringify(payload)
            ).catch(err => {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    // Subscription has expired or is no longer valid
                    console.log('Subscription has expired or is no longer valid: ', err);
                    return PushSubscription.deleteOne({ _id: sub._id });
                } else {
                    console.error('Error sending push notification: ', err);
                }
            })
        );

        await Promise.all(notifications);
    } catch (error) {
        console.error('Failed to send push notifications:', error);
    }
};

export const getVapidPublicKey = () => publicVapidKey;
