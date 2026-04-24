import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingBag, Package, Star, CheckCircle } from 'lucide-react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// A subtle ding sound
const DING_SOUND = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

interface Notification {
    _id: string;
    type: 'new_order' | 'low_stock' | 'new_review';
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

export const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(DING_SOUND);
        requestBrowserPermission();
        fetchNotifications();

        // Polling every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const requestBrowserPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const fetchNotifications = async () => {
        try {
            // Fetch top 10 latest
            const res = await api.get('/api/admin/notifications');
            const countRes = await api.get('/api/admin/notifications/count');
            
            const newNotifications: Notification[] = res.data;
            const newUnreadCount = countRes.data.unreadCount;

            // Check if there's a new unread "new_order" notification we haven't seen yet
            if (newUnreadCount > unreadCount) {
                const latestUnread = newNotifications.find(n => !n.isRead);
                if (latestUnread && latestUnread.type === 'new_order') {
                    playDing();
                    showBrowserNotification(latestUnread);
                }
            }

            setNotifications(newNotifications.slice(0, 10));
            setUnreadCount(newUnreadCount);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const playDing = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
        }
    };

    const showBrowserNotification = (notif: Notification) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Eloria Admin', {
                body: `🛍️ ${notif.message}`,
                icon: '/favicon.ico' // Assuming standard favicon location
            });
        }
    };

    const markAsRead = async (id: string, link: string) => {
        try {
            await api.patch(`/api/admin/notifications/${id}/read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setIsOpen(false);
            navigate(link);
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/api/admin/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const getRelativeTime = (dateString: string) => {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const daysDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const hoursDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60));
        const minutesDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60));

        if (Math.abs(minutesDifference) < 60) return rtf.format(minutesDifference, 'minute');
        if (Math.abs(hoursDifference) < 24) return rtf.format(hoursDifference, 'hour');
        return rtf.format(daysDifference, 'day');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_order': return <ShoppingBag size={16} className="text-blue-600" />;
            case 'low_stock': return <Package size={16} className="text-rose-600" />;
            case 'new_review': return <Star size={16} className="text-amber-500" />;
            default: return <Bell size={16} className="text-slate-600" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
            >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold uppercase tracking-wider text-[#534AB7] hover:underline flex items-center gap-1"
                                >
                                    <CheckCircle size={12} /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map(notif => (
                                        <div 
                                            key={notif._id} 
                                            onClick={() => markAsRead(notif._id, notif.link)}
                                            className={`p-4 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-[#534AB7]/5' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                                                    {getRelativeTime(notif.createdAt)}
                                                </p>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-[#534AB7] mt-1.5 shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
