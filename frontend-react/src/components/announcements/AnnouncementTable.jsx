import React from "react";
import { Eye, Edit2, Trash2, ChevronLeft, ChevronRight, Users, Calendar, BarChart2 } from "lucide-react";

const AnnouncementTable = ({ announcements = [], loading, pagination, onPageChange, onView, onEdit, onDelete }) => {
    const getStatusBadge = (status) => {
        const styles = status === "Active"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles}`}>
                {status}
            </span>
        );
    };

    const getCategoryBadge = (category) => {
        const colors = {
            General: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
            HR: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
            Payroll: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
            Events: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
            Urgent: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[category] || "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                {category}
            </span>
        );
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading announcements...</div>;
    }



    const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

    if (safeAnnouncements.length === 0) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">No announcements found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {safeAnnouncements.map((item) => {
                    const categoryColors = {
                        General: "bg-blue-100 text-blue-800 border-blue-400",
                        HR: "bg-purple-100 text-purple-800 border-purple-400",
                        Payroll: "bg-green-100 text-green-800 border-green-400",
                        Events: "bg-yellow-100 text-yellow-800 border-yellow-400",
                        Urgent: "bg-red-100 text-red-800 border-red-400",
                    };
                    const catStyle = categoryColors[item.category] || "bg-gray-100 text-gray-800 border-gray-400";
                    
                    return (
                        <div key={item.id} className="bg-white p-5 flex flex-col gap-4 border-4 border-black rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all duration-200 flex-1">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <h3 className="font-black text-black text-xl tracking-tight leading-tight line-clamp-2 uppercase">{item.title}</h3>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className={`px-3 py-1 text-xs font-black border-2 rounded-lg uppercase tracking-wider ${catStyle}`}>
                                            {item.category}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-black border-2 rounded-lg uppercase tracking-wider ${item.status === 'Active' ? 'bg-green-200 text-green-900 border-green-600' : 'bg-gray-200 text-gray-700 border-gray-600'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Body (Message snippet) */}
                            <div className="text-sm text-black font-bold line-clamp-3 my-2 bg-gray-50 border-2 border-black p-4 rounded-xl flex-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                {(item.message || "").replace(/<[^>]+>/g, '') || <span className="text-gray-500 italic">No description provided...</span>}
                            </div>

                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-3 text-xs font-black text-black border-t-4 border-gray-100 pt-4 mt-2">
                                <div className="flex items-center gap-2 bg-gray-50 flex-1 p-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                    <Users size={16} className="text-black stroke-[3]" />
                                    <span className="truncate uppercase">{Array.isArray(item.target_audience) ? item.target_audience.join(", ") : item.target_audience}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 flex-1 p-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                    <Calendar size={16} className="text-black stroke-[3]" />
                                    <span className="uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 flex-1 p-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                    <Edit2 size={16} className="text-black stroke-[3]" />
                                    <span className="truncate uppercase">{item.user?.name || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-brand-200 flex-1 p-2.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-black">
                                    <BarChart2 size={16} className="text-black stroke-[3]" />
                                    <span className="uppercase">{item.views_count || 0} Views</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => onView(item)} className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg border-2 border-black text-black bg-blue-200 hover:bg-blue-300 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex justify-center items-center gap-2">
                                    <Eye size={16} strokeWidth={3} /> View
                                </button>
                                <button onClick={() => onEdit(item)} className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg border-2 border-black text-black bg-purple-200 hover:bg-purple-300 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex justify-center items-center gap-2">
                                    <Edit2 size={16} strokeWidth={3} /> Edit
                                </button>
                                <button onClick={() => onDelete(item.id)} className="flex-none px-4 py-2.5 text-xs rounded-lg border-2 border-black text-white bg-red-600 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex justify-center items-center">
                                    <Trash2 size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.last_page > 1 && (
                <div className="mt-8 flex items-center justify-between border-t-4 border-black pt-6">
                    <button
                        onClick={() => onPageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-extrabold text-black bg-white border-2 border-black rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={16} strokeWidth={3} /> Previous
                    </button>
                    <span className="text-sm font-extrabold text-black bg-gray-100 px-4 py-2 rounded-lg border-2 border-black">
                        Page {pagination.current_page} of {pagination.last_page}
                    </span>
                    <button
                        onClick={() => onPageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-extrabold text-black bg-white border-2 border-black rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
                    >
                        Next <ChevronRight size={16} strokeWidth={3} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementTable;
