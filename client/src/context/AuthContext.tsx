/**
 * AuthContext.tsx
 * Unified Authentication for Eloria BD
 * Handles Persistence, Session Validation, and Profile Syncing
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/axios';
import { mergeUser } from '../utils/tracker';

// Define the User shape based on Eloria MongoDB Schema
interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    addresses: any[];
    wishlist?: string[]; // Array of product IDs
    cart?: any[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * 1. SESSION CHECK (On App Load)
     * Verifies the token and fetches the freshest data from MongoDB
     */
    const checkUserSession = async () => {
        const token = localStorage.getItem('eloria_token');

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Fetch profile - interceptor handles the Authorization header
            const res = await api.get('/api/user/profile');
            if (res.data) {
                setUser(res.data);
                mergeUser(res.data._id); // Tracking
            }
        } catch (err) {
            console.error("Session invalid or expired");
            localStorage.removeItem('eloria_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserSession();
    }, []);

    /**
     * 2. LOGIN / SYNC
     * Called after successful Login, Signup, or OTP Verification
     */
    const login = (token: string, userData: User) => {
        localStorage.setItem('eloria_token', token);
        setUser(userData);
        mergeUser(userData._id);
    };

    /**
     * 3. LOGOUT
     * Wipes session and forces a clean state
     */
    const logout = () => {
        localStorage.removeItem('eloria_token');
        setUser(null);
        // Direct redirect to ensure all context states are cleared
        window.location.href = '/';
    };

    /**
     * 4. UPDATE USER STATE
     * Used for minor UI updates like adding a single address or updating phone
     */
    const updateUser = (userData: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...userData } : null);
    };

    /**
     * 5. REFRESH PROFILE
     * Force-fetches the latest user data from the server
     * Useful after placing an order to update the cart/wishlist state
     */
    const refreshProfile = async () => {
        try {
            const res = await api.get('/api/user/profile');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to refresh profile");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook for easy usage
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};