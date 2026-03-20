import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/timeAgo";

const NotificationDropdown = ({ onClose, onSelect }) => {
    const { notifications, fetchNotifications, markRead, markAllRead, loading } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleItemClick = (notification) => {
        if (!notification.is_read) {
            markRead(notification.id);
        }
        // Instead of navigating, pass to parent to open modal
        if (onSelect) {
            onSelect(notification);
        }
        onClose();
    };

    const handleViewAll = () => {
        if (user?.role_id === 1) {
            navigate("/superadmin/notifications");
        } else if (user?.role_id === 4) {
            navigate("/employee/notifications");
        } else if (user?.role_id === 2) {
            navigate("/admin/notifications");
        } else if (user?.role_id === 3) {
            navigate("/hr/notifications");
        }
        onClose();
    };

    const getBorderColorClass = (type) => {
        switch (type) {
            case 'leave': return 'border-l-amber-500'; // Orange
            case 'attendance': return 'border-l-blue-500'; // Blue
            case 'hr-action': return 'border-l-violet-500'; // Purple
            case 'admin-action': return 'border-l-emerald-500'; // Green
            case 'security': return 'border-l-red-500'; // Red
            default: return 'border-l-gray-500'; // Gray
        }
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute top-12 right-0 w-[360px] bg-white dark:bg-gray-800 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] border-4 border-black z-50 flex flex-col max-h-[480px] transition-colors duration-200 overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b-4 border-black bg-brand-200 flex justify-between items-center">
                <h3 className="text-lg font-black text-black m-0 uppercase tracking-tight">Notifications</h3>
                <button
                    onClick={markAllRead}
                    className="text-xs font-bold text-black hover:text-blue-700 bg-white border-2 border-black rounded px-2 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                    Mark all read
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900">
                {loading ? (
                    <div className="p-8 text-center text-black font-bold animate-pulse">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-bold">You're all caught up! 🚀</div>
                ) : (
                    notifications.slice(0, 10).map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleItemClick(n)}
                            className={`
                                p-4 border-b-2 border-black cursor-pointer transition-all duration-200 relative group
                                ${n.is_read ? 'bg-white opacity-80' : 'bg-white hover:-translate-y-0.5 hover:shadow-[0px_4px_0px_rgba(0,0,0,0.1)]'}
                            `}
                        >
                            {!n.is_read && <div className="absolute top-5 left-2 w-2 h-2 rounded-full bg-blue-600 animate-pulse border border-black z-10"></div>}
                            <div className={`flex justify-between items-start mb-2 ${!n.is_read ? 'pl-3' : ''}`}>
                                <span className={`text-sm tracking-tight pr-2 ${n.is_read ? 'font-bold text-gray-800 dark:text-gray-300' : 'font-black text-black dark:text-white'}`}>
                                    {n.title}
                                </span>
                                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2 py-0.5 border-2 border-black rounded-full whitespace-nowrap">{timeAgo(n.created_at)}</span>
                            </div>
                            <p className={`text-xs m-0 leading-relaxed ${n.is_read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                {n.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t-4 border-black bg-white">
                <button
                    onClick={handleViewAll}
                    className="w-full py-2.5 bg-blue-100 hover:bg-blue-200 border-2 border-black rounded-lg text-sm font-black text-blue-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest cursor-pointer"
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
