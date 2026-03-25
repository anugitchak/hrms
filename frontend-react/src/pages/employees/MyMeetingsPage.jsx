import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { 
    Calendar, Clock, Video, MapPin, CalendarCheck, 
    CheckCircle2, XCircle, ExternalLink, CalendarDays,
    RefreshCw, MoreVertical, Link, User, Shield
} from "lucide-react";
import { useGlobalUI } from "../../context/GlobalUIContext";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Icon size={18} /></div>}
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-6 flex-1 flex flex-col">{children}</div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon, type = "button" }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md transform hover:-translate-y-0.5",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
        ghost: "bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
        danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-md",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

const MyMeetingsPage = () => {
    const { addToast } = useGlobalUI();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyMeetings();
    }, []);

    const fetchMyMeetings = async () => {
        setLoading(true);
        try {
            const res = await api.get("/meetings");
            setMeetings(res.data);
        } catch (err) {
            console.error("Failed to fetch meetings", err);
            addToast("Failed to retrieve operational schedule.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (id, status) => {
        try {
            await api.post(`/meetings/${id}/respond`, { status });
            addToast(`Broadcast Signal Recorded: ${status.toUpperCase()}`, "success");
            fetchMyMeetings();
        } catch (err) {
            console.error("Failed to respond to meeting", err);
            addToast("Signal Transmission Failure.", "error");
        }
    };

    const generateGCalLink = (meeting) => {
        const startDate = new Date(meeting.start_time);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
        const start = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const details = encodeURIComponent(meeting.description || "");
        const location = encodeURIComponent(meeting.location || meeting.meeting_link || "");
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=${start}/${end}&details=${details}&location=${location}`;
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'accepted':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'declined':
                return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
            default:
                return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        }
    };

    if (loading && !meetings.length) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-16 h-16 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#00b9cd] animate-pulse">Syncing Communication Nodes...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen font-paperlogy mesh-bg">
            {/* Tactical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Meetings <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Operational briefings and tactical syncs</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        onClick={fetchMyMeetings} 
                        icon={RefreshCw}
                        disabled={loading}
                        className={loading ? "animate-spin" : ""}
                    >
                        Re-scan Uplink
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {meetings.map((meeting) => {
                    const myStatus = meeting.participants?.find(p => p.pivot)?.pivot?.attendance_status || 'pending';
                    const startTime = new Date(meeting.start_time);
                    
                    return (
                        <Card key={meeting.id} className="group relative overflow-hidden">
                            {/* Status Banner */}
                            <div className={`absolute top-0 right-0 px-6 py-2 rounded-10-3xl border-l-2 border-b-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all z-10 ${getStatusStyles(myStatus)}`}>
                                {myStatus}
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="pr-12">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight mb-2 group-hover:text-[#00b9cd] transition-colors line-clamp-2">
                                        {meeting.title}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest line-clamp-3 leading-relaxed">
                                        {meeting.description || 'No mission briefing provided.'}
                                    </p>
                                </div>

                                {/* Intelligence Data Box */}
                                <div className="bg-slate-50 dark:bg-white/5 rounded-10 p-6 space-y-4 border-2 border-slate-100 dark:border-white/5 group-hover:border-[#00b9cd]/20 transition-all duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-10 shadow-sm text-[#00b9cd]">
                                            <Calendar size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temporal Vector</span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                {startTime.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-10 shadow-sm text-[#00b9cd]">
                                            <Clock size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tactical Window</span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                {startTime.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {meeting.meeting_link && (
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-10 shadow-sm text-emerald-500">
                                                <Video size={14} />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Uplink</span>
                                                <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="text-sm font-black text-[#00b9cd] hover:underline uppercase tracking-tighter truncate flex items-center gap-1">
                                                    Establish Link <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {meeting.location && !meeting.meeting_link && (
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-10 shadow-sm text-rose-500">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Command Point</span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">
                                                    {meeting.location}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t-2 border-slate-100 dark:border-white/5">
                                {myStatus === 'pending' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            onClick={() => handleResponse(meeting.id, 'accepted')} 
                                            icon={CheckCircle2}
                                            variant="success"
                                        >
                                            Confirm
                                        </Button>
                                        <Button 
                                            onClick={() => handleResponse(meeting.id, 'declined')} 
                                            icon={XCircle}
                                            variant="outline"
                                            className="hover:!bg-rose-500 hover:!text-white hover:border-transparent"
                                        >
                                            Deny
                                        </Button>
                                    </div>
                                ) : (
                                    <a 
                                        href={generateGCalLink(meeting)} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="w-full bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-400 py-4 rounded-10 text-[10px] font-black uppercase tracking-[0.2em] hover:border-[#00b9cd] hover:text-[#00b9cd] transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        <CalendarDays className="w-4 h-4 group-hover/btn:scale-110 transition-transform" /> 
                                        Sync G-Archive
                                    </a>
                                )}

                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-10 bg-[#00b9cd]"></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">MISSION LEAD: {meeting.creator?.name || 'CENTRAL'}</span>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {meetings.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-slate-900/40 rounded-10 border-2 border-dashed border-slate-100 dark:border-white/5">
                        <div className="p-6 bg-[#00b9cd]/5 rounded-10 mb-6">
                            <CalendarDays size={64} className="text-[#00b9cd]/20" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-2">Comms Zero</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tactical briefings detected in this quadrant.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyMeetingsPage;