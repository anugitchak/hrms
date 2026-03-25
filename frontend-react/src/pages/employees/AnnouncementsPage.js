import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import api from '../../api/axios';
import { 
    Bell, Calendar, ArrowLeft, RefreshCw, 
    MessageSquare, FileText, Info, ExternalLink 
} from 'lucide-react';

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out ${className}`}>
        {(title || Icon) && (
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Icon size={18} /></div>}
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} ${className}`}
        >

            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

const AnnouncementsPage = () => {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements');
            const data = response.data.data || response.data;

            if (Array.isArray(data)) {
                setAnnouncements(data);
            } else {
                console.error('Unexpected response format:', response.data);
                setAnnouncements([]);
                setError('Invalid data format received from server.');
            }
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError(err.response?.data?.message || 'Failed to load announcements.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-16 h-16 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#00b9cd] animate-pulse">Synchronizing Comms...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1200px] mx-auto min-h-screen font-paperlogy mesh-bg">
            {/* Tactical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Announce<span className="text-transparent bg-clip-text bg-[#00b9cd]">ments</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic">Latest updates from Command</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate("/employee/dashboard")}
                        icon={ArrowLeft}
                    >
                        Dashboard
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={fetchAnnouncements} 
                        icon={RefreshCw}
                        disabled={loading}
                        className={loading ? "animate-spin" : ""}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-10">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                        <Info size={14} /> {error}
                    </p>
                </div>
            )}

            {/* Content */}
            {!loading && !error && announcements.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-10 flex items-center justify-center mb-6 text-slate-300">
                        <Bell size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Radio Silence</h3>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest max-w-sm">
                        No active announcements detected in this sector.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-8">
                    {announcements.map((announcement) => (
                        <Card 
                            key={announcement.id}
                            className="relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00b9cd] group-hover:w-2 transition-all"></div>
                            
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight mb-2">
                                        {announcement.title}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-white/5">
                                            <Calendar size={12} className="text-[#00b9cd]" />
                                            {formatDate(announcement.created_at)}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#00b9cd]/5 rounded-10 text-[10px] font-black text-[#00b9cd] uppercase tracking-widest border border-[#00b9cd]/10">
                                            <MessageSquare size={12} />
                                            Official
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-bold text-sm whitespace-pre-line mb-6">
                                {announcement.content || announcement.message}
                            </div>

                            {announcement.attachment_url && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                    <a
                                        href={announcement.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#00b9cd] hover:text-blue-600 transition-colors group/link"
                                    >
                                        <div className="p-2 bg-[#00b9cd]/10 rounded-10 group-hover/link:bg-blue-600/10">
                                            <ExternalLink size={16} />
                                        </div>
                                        Secure Document Attached
                                    </a>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPage;
