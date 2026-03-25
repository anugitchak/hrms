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
            className="absolute top-12 right-0 w-[380px] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border border-slate-200 dark:border-slate-800 z-50 flex flex-col max-h-[520px] transition-all duration-300 overflow-hidden"
        >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                <h3 className="text-base font-black text-slate-800 dark:text-white m-0 uppercase tracking-wider">Notifications</h3>
                <button
                    onClick={markAllRead}
                    className="text-[10px] font-black text-black dark:text-white hover:text-white bg-slate-200 dark:bg-slate-700 hover:bg-[#00b9cd] dark:hover:bg-[#00b9cd] border-none rounded-lg px-3 py-1.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-widest shadow-sm"
                >
                    Mark all read
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-bold animate-pulse text-sm uppercase tracking-widest">Synchronizing...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-bold text-sm">You're all caught up! 🚀</div>
                ) : (
                    notifications.slice(0, 10).map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleItemClick(n)}
                            className={`
                                p-5 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all duration-300 relative group
                                ${n.is_read ? 'bg-transparent opacity-60' : 'bg-transparent hover:bg-[#00b9cd]/5 dark:hover:bg-[#00b9cd]/10'}
                            `}
                        >
                            {!n.is_read && (
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#00b9cd] shadow-[2px_0_12px_rgba(0,185,205,0.6)] group-hover:w-1.5 transition-all duration-300"></div>
                            )}
                            <div className="flex justify-between items-start mb-2 group-hover:translate-x-1 transition-transform duration-300">
                                <span className={`text-sm tracking-tight pr-4 leading-tight ${n.is_read ? 'font-bold text-slate-600 dark:text-slate-400' : 'font-black text-slate-900 dark:text-white'}`}>
                                    {n.title}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                    {timeAgo(n.created_at)}
                                </span>
                            </div>
                            <p className={`text-xs m-0 leading-relaxed line-clamp-2 group-hover:translate-x-1 transition-transform duration-300 ${n.is_read ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                                {n.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={handleViewAll}
                    className="w-full py-3.5 bg-[#00b9cd] hover:bg-[#00a5b9] text-black dark:text-white font-black uppercase tracking-[0.2em] text-xs rounded-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_-5px_rgba(0,185,205,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(0,185,205,0.4)] cursor-pointer border-none"
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
