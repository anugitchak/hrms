import React, { useState, useEffect, useCallback } from "react";
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth } from "../../../context/AuthContext";
import { timeAgo } from "../../../utils/timeAgo";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, CheckAll, Search, Filter, Loader2, ChevronRight } from "lucide-react";
import NotificationDetailModal from "../../../components/ui/NotificationDetailModal";

const NotificationsPage = () => {
    const { notifications, fetchNotifications, markRead, markAllRead, loading } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getDashboardPath = useCallback(() => {
        switch (user?.role_id) {
            case 1: return "/superadmin/dashboard";
            case 2: return "/admin/dashboard";
            case 3: return "/hr/dashboard";
            case 4: return "/employee/dashboard";
            default: return "/login";
        }
    }, [user]);

    const [selectedNotification, setSelectedNotification] = useState(null);

    const handleItemClick = (notification) => {
        if (!notification.is_read) {
            markRead(notification.id);
        }
        if (notification.type === 'announcement' || notification.title.toLowerCase().includes('announcement')) {
            navigate("/superadmin/communication/announcements");
            return;
        }
        setSelectedNotification(notification);
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title?.toLowerCase().includes(search.toLowerCase()) || 
                             n.message?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (filter === "all") return true;
        if (filter === "unread") return !n.is_read;
        return n.type === filter;
    });

    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getBadgeStyle = (type) => {
        switch (type) {
            case 'leave': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'attendance': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'hr-action': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'admin-action': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'security': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none mb-2">
                        Activity <span className="text-transparent bg-clip-text bg-[#00b9cd]">Stream</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Stay updated with real-time system alerts and requests.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-6 py-3.5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0"
                    >
                        <Bell size={18} className="text-[#00b9cd]" />
                        <span className="uppercase tracking-widest">Mark All Read</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search Bar */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 border-2 border-slate-50 dark:border-white/5 space-y-5">
                <div className="flex flex-wrap gap-3">
                    {['all', 'unread', 'leave', 'attendance', 'hr-action', 'admin-action', 'security'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => { setFilter(f); setCurrentPage(1); }} 
                            className={`px-5 py-2 rounded-10 text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === f 
                                    ? "bg-slate-900 text-white shadow-md -translate-y-0.5" 
                                    : "bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent hover:border-slate-200"
                            }`}
                        >
                            {f.replace('-', ' ')}
                        </button>
                    ))}
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b9cd] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search activity manifest..." 
                        value={search} 
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white transition-all shadow-inner" 
                    />
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/60 rounded-10 border-2 border-dashed border-slate-200 dark:border-white/10">
                        <Loader2 size={48} className="animate-spin text-[#00b9cd] mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Synchronizing activity streams...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/60 rounded-10 border-2 border-dashed border-slate-200 dark:border-white/10">
                        <Bell size={64} className="text-slate-100 dark:text-white/5 mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching activities found.</p>
                    </div>
                ) : (
                    <>
                        {paginatedNotifications.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => handleItemClick(n)} 
                                className={`group bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 border-2 cursor-pointer relative overflow-hidden flex items-center gap-6 ${
                                    n.is_read 
                                        ? 'border-slate-100 dark:border-white/5 opacity-70 grayscale-[0.5]' 
                                        : 'border-slate-900 dark:border-[#00b9cd]/30 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1'
                                }`}
                            >
                                <div className={`w-14 h-14 shrink-0 rounded-10 border-2 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${getBadgeStyle(n.type)}`}>
                                    <Bell size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate flex items-center gap-3">
                                            {n.title}
                                            {!n.is_read && <span className="w-2 h-2 rounded-10 bg-[#00b9cd] animate-pulse"></span>}
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ml-4">
                                            {timeAgo(n.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{n.message}</p>
                                </div>
                                <div className="text-slate-300 group-hover:text-[#00b9cd] transition-colors ml-2">
                                    <ChevronRight size={24} strokeWidth={3} />
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-10 p-6 bg-slate-900 dark:bg-slate-900/60 rounded-10 border-4 border-slate-900">
                                <button 
                                    onClick={() => handlePageChange(currentPage - 1)} 
                                    disabled={currentPage === 1} 
                                    className="px-6 py-3 bg-white text-slate-900 rounded-10 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:scale-95 transition-all hover:bg-[#00b9cd]/10" 
                                > 
                                    Previous 
                                </button>
                                <div className="flex items-center gap-3 text-white">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Stream Layer</span>
                                    <span className="w-8 h-8 flex items-center justify-center bg-[#00b9cd] text-white rounded-10 font-black text-sm shadow-lg">{currentPage}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">of {totalPages}</span>
                                </div>
                                <button 
                                    onClick={() => handlePageChange(currentPage + 1)} 
                                    disabled={currentPage === totalPages} 
                                    className="px-6 py-3 bg-white text-slate-900 rounded-10 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:scale-95 transition-all hover:bg-[#00b9cd]/10" 
                                > 
                                    Next 
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            <NotificationDetailModal 
                isOpen={!!selectedNotification} 
                onClose={() => setSelectedNotification(null)} 
                notification={selectedNotification} 
            />
        </div>
    );
};

export default NotificationsPage;