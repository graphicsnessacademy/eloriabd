import { api } from '../api/axios';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const getVisitorId = (): string => {
    let visitorId = localStorage.getItem('eloria_visitor_id');
    if (!visitorId) {
        visitorId = generateId();
        localStorage.setItem('eloria_visitor_id', visitorId);
    }
    return visitorId;
};

export const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('eloria_session_id');
    if (!sessionId) {
        sessionId = generateId();
        sessionStorage.setItem('eloria_session_id', sessionId);
    }
    return sessionId;
};

export const trackEvent = async (eventType: string, payload: Record<string, unknown> = {}) => {
    try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();

        // Optional: Get user ID if stored in localStorage by AuthContext
        let userId = undefined;
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const parsed = JSON.parse(userInfo);
                if (parsed._id) userId = parsed._id;
            }
        } catch {
            // ignore
        }

        await api.post('/api/events', {
            visitorId,
            sessionId,
            userId,
            eventType,
            payload
        });
    } catch (error) {
        // Silent fail: warn instead of throwing to prevent analytics failures from slowing UX
        console.warn('Failed to track event:', error);
    }
};

export const mergeUser = async (userId: string) => {
    try {
        const visitorId = getVisitorId();
        await api.post('/api/events/merge', { visitorId, userId });
    } catch (error) {
        // Silent fail: warn instead of throwing to prevent analytics failures from slowing UX
        console.warn('Failed to merge identity:', error);
    }
};
