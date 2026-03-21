import React from "react";
import { X, Calendar, User, FileText, Download, Eye, Megaphone, Hash } from "lucide-react";

const AnnouncementViewer = ({ isOpen, onClose, announcement }) => {
    if (!isOpen || !announcement) return null;

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

    return (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.35)] w-full max-w-lg overflow-hidden transform transition-all duration-300 rounded-3xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500">
                            <Megaphone size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Announcement Details</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Intelligence report and attachment preview.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl tracking-wide ${getCategoryStyles(announcement.category)} border border-white/30 dark:border-white/10 shadow-sm`}>
                            <Hash size={12} strokeWidth={3} />
                            {announcement.category}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-900/5 dark:border-white/5">
                            <Calendar size={14} />
                            {new Date(announcement.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                        {announcement.title}
                    </h2>

                    {/* Meta Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Broadcasted By</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <User size={14} className="text-brand-500" />
                                {announcement.user?.name || "System Agent"}
                            </span>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engagement</span>
                            <span className="text-sm focet-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Eye size={14} className="text-brand-500" />
                                {announcement.views_count || 0} Intelligence Reads
                            </span>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Message Intel</h4>
                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 leading-relaxed text-sm min-h-[150px] italic">
                            "{(announcement.message || "").replace(/<[^>]+>/g, '') || "No intelligence report provided for this dispatch."}"
                        </div>
                    </div>

                    {/* Attachment */}
                    {announcement.file_path && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Evidentiary Documentation</h4>
                            <div className="group p-5 bg-white dark:bg-slate-900/50 border-2 border-brand-500/10 dark:border-brand-500/10 rounded-2xl flex items-center justify-between hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-500 rounded-xl text-white shadow-lg shadow-brand-500/20 group-hover:rotate-6 transition-transform">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">SUPPORTING_DOC.PDF</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Secure Transport PDF</span>
                                    </div>
                                </div>
                                <a
                                    href={announcement.file_path}
                                    download
                                    className="p-3 bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Download size={18} strokeWidth={3} />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-transparent">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all font-paperlogy"
                    >
                        Close Information Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementViewer;
