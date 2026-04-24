import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subscribeToPush = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const response = await api.get('/api/admin/push/vapidPublicKey');
        const vapidPublicKey = response.data.publicKey;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        await api.post('/api/admin/push/subscribe', subscription);
      } catch (error) {
        console.error('Push subscription failed:', error);
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/admin/me');
        setUser(response.data.user);
        if (Notification.permission === 'granted') {
          subscribeToPush();
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      subscribeToPush();
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/admin/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
      setUser(null); // Clear user anyway
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
