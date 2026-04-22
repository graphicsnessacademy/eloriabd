import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/axios';

// Define the User shape based on our Eloria MongoDB Schema
interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    addresses?: any[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. PERSISTENCE: Check if user is already logged in when the app starts
    useEffect(() => {
        const checkUserSession = async () => {
            const token = localStorage.getItem('eloria_token');

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Fetch the latest profile data from backend
                // The axios interceptor we built will automatically attach the token
                const res = await api.get('/api/user/profile');
                setUser(res.data);
            } catch (err) {
                console.error("Auth session expired or invalid");
                localStorage.removeItem('eloria_token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkUserSession();
    }, []);

    // 2. LOGIN: Save token and set user state
    const login = (token: string, userData: User) => {
        localStorage.setItem('eloria_token', token);
        setUser(userData);
    };

    // 3. LOGOUT: Clear everything
    const logout = () => {
        localStorage.removeItem('eloria_token');
        setUser(null);
        // Optional: Redirect to home or refresh
        window.location.href = '/';
    };

    // 4. UPDATE: Sync profile changes (like after adding an address)
    const updateUser = (userData: User) => {
        setUser(userData);
    };

    return (
       <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
        {children} 
    </AuthContext.Provider>
    );
};

// Custom hook for easy access
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};