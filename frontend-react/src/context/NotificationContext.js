import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Simple web audio API notification sound
const playNotificationSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
        console.warn('Audio play restricted by browser setting', e);
    }
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all notifications
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await api.get("/notifications");
            setNotifications(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
            setError("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch only unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        // Don't fetch if offline
        if (!navigator.onLine) return;

        try {
            const response = await api.get("/notifications/unread-count");
            const newCount = response.data.unread;
            setUnreadCount(prev => {
                if (newCount > prev) {
                    playNotificationSound();
                }
                return newCount;
            });
        } catch (err) {
            // Suppress network errors (often happens on wake from sleep or offline)
            if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
                // benign error, ignore to avoid console spam
                return;
            }
            console.error("Failed to fetch unread count", err);
        }
    }, [user]);

    // Mark single as read
    const markRead = async (id) => {
        try {
            await api.post(`/notifications/mark-read/${id}`);
            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    // Mark all as read
    const markAllRead = async () => {
        try {
            await api.post("/notifications/mark-all-read");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    // Auto-refresh logic
    useEffect(() => {
        if (!user) return;

        // Initial fetch
        fetchUnreadCount();

        // Poll every 30 seconds (5s was too aggressive and caused network stack issues on sleep)
        const interval = setInterval(() => {
            // Only poll if page is visible to save resources and reduce errors
            if (document.visibilityState === 'visible') {
                fetchUnreadCount();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [user, fetchUnreadCount]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            error,
            fetchNotifications,
            fetchUnreadCount,
            markRead,
            markAllRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
