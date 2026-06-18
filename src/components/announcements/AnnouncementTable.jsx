import React from "react";
import { Eye, Edit2, Trash2, ChevronLeft, ChevronRight, Megaphone, Calendar, Hash, X } from "lucide-react";

const AnnouncementTable = ({ announcements = [], loading, pagination, onPageChange, onView, onEdit, onDelete, canManageAnnouncements = false }) => {
    const getCategoryStyles = (category) => {
        const colors = {
            General: "bg-blue-100 text-blue-800 border-blue-300",
            HR: "bg-purple-100 text-purple-800 border-purple-300",
            Payroll: "bg-green-100 text-green-800 border-green-300",
            Events: "bg-pink-100 text-pink-800 border-pink-300",
            Urgent: "bg-red-100 text-red-800 border-red-300",
        };
        return colors[category] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    if (loading) {
        return <div className="p-16 text-center font-bold text-gray-600">Loading announcements...</div>;
    }

    const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

    if (safeAnnouncements.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900/60 p-16 text-center flex flex-col items-center gap-4 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out">
                <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-10">
                    <Megaphone size={48} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">No announcements found</h3>
                <p className="text-gray-600 dark:text-gray-400">Awaiting system-wide dispatch initialization.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {safeAnnouncements.map((item) => {
                    const styles = getCategoryStyles(item.category);
                    return (
                        <div key={item.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col gap-6 group">
                            {/* Top: Icon + Badge */}
                            <div className="flex items-start justify-between">
                                <div className="w-14 h-14 rounded-10 flex items-center justify-center text-xl font-bold bg-brand-400 text-black border border-white dark:border-slate-800 shadow-md group-hover:scale-110 transition-transform duration-500">
                                    <Megaphone size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col items-end gap-2.5">
                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-10 tracking-wide ${styles} border border-white/30 dark:border-white/10 shadow-sm`}>
                                        <Hash size={12} strokeWidth={3} />
                                        {item.category}
                                    </span>
                                    <span className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold rounded-10 ${item.status === 'Active'
                                            ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20'
                                            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                                        } shadow-sm transition-all`}>
                                        <span className={`w-2 h-2 rounded-10 ${item.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
                                        {item.status === 'Active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {/* Title + Snippet */}
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight tracking-tight line-clamp-2 min-h-[3rem]">{item.title}</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 break-all bg-slate-50 dark:bg-brand-800/30 border border-slate-900/10 dark:border-white/5 p-2 rounded-10 line-clamp-3 italic">
                                    "{(item.message || "").replace(/<[^>]+>/g, '') || "No details provided."}"
                                </p>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 tracking-wide mt-auto">
                                <Calendar size={12} />
                                Released {new Date(item.created_at).toLocaleDateString()}
                                <span className="mx-1">•</span>
                                <Eye size={12} />
                                {item.views_count || 0} Views
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => onView(item)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-2 border-slate-200 dark:border-white/10 rounded-10 bg-white dark:bg-brand-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-800/60 hover:border-slate-300 dark:hover:border-white/20 shadow-sm transition-all focus:ring-2 focus:ring-brand-500/10 active:scale-[0.98]">
                                    <div className="bg-[#00b9cd]/20 dark:bg-teal-700/50 p-1.5 rounded-10">
                                        <Eye size={13} strokeWidth={2.5} />
                                    </div>
                                    Access
                                </button>
                                {canManageAnnouncements && (
                                    <div className="flex gap-2">
                                        <button onClick={() => onEdit(item)} className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-10 text-brand-600 hover:bg-brand-100 border border-brand-100 dark:border-brand-500/20 transition-all shadow-sm active:scale-90">
                                            <Edit2 size={16} strokeWidth={2.5} />
                                        </button>
                                        <button onClick={() => onDelete(item.id)} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-10 text-red-600 hover:bg-red-100 border border-red-100 dark:border-red-900/20 transition-all shadow-sm active:scale-90">
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-center gap-4 pt-10 border-t border-slate-900/5 dark:border-white/5">
                    <button
                        onClick={() => onPageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="p-3 bg-white dark:bg-slate-900 border-2 border-slate-900/10 dark:border-white/10 rounded-10 shadow-sm hover:shadow-md disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="bg-brand-500 text-white px-6 py-2.5 rounded-10 text-[12px] font-bold shadow-lg shadow-brand-500/20">
                        {pagination.current_page} / {pagination.last_page}
                    </div>
                    <button
                        onClick={() => onPageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="p-3 bg-white dark:bg-slate-900 border-2 border-slate-900/10 dark:border-white/10 rounded-10 shadow-sm hover:shadow-md disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementTable;
