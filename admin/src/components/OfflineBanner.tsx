import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-center space-x-2 w-full z-50 fixed top-0 left-0 text-sm shadow-md">
            <WifiOff className="w-4 h-4 text-rose-400" />
            <span className="font-medium tracking-wide">You are offline. Showing cached data. Reconnect to update.</span>
        </div>
    );
};
