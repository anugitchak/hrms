import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { 
    Calendar as CalendarIcon, List, ChevronLeft, ChevronRight,
    MapPin, Info, RefreshCw, Star, Activity, Plus, History,
    LayoutGrid, CalendarDays
} from "lucide-react";
import { useGlobalUI } from "../../context/GlobalUIContext";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    {Icon && <div className="p-3 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd] group-hover:bg-[#00b9cd] group-hover:text-white transition-all duration-500"><Icon size={20} /></div>}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-8 flex-1 flex flex-col">{children}</div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
        ghost: "bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

// --- Page Component ---

const HolidayCalendarPage = () => {
    const { addToast } = useGlobalUI();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("calendar");
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await api.get("/holidays");
            setHolidays(res.data || []);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
            addToast("Temporal archive synchronization failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const getHolidaysForDate = (day) => {
        if (!day) return [];
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return holidays.filter(h => {
            const start = h.start_date;
            const end = h.end_date;
            return dateStr >= start && dateStr <= end;
        });
    };

    const isToday = (day) => {
        if (!day) return false;
        const today = new Date();
        return today.getDate() === day && 
               today.getMonth() === currentMonth.getMonth() && 
               today.getFullYear() === currentMonth.getFullYear();
    };

    const renderCalendar = () => {
        const { days, firstDay } = getDaysInMonth(currentMonth);
        const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
        const daysArray = Array.from({ length: totalSlots }, (_, i) => {
            if (i < firstDay || i >= firstDay + days) return null;
            return i - firstDay + 1;
        });

        return (
            <div className="bg-slate-50/50 dark:bg-white/5 rounded-10 border-2 border-slate-100 dark:border-white/5 overflow-hidden shadow-inner backdrop-blur-md">
                <div className="grid grid-cols-7 border-b-2 border-slate-100 dark:border-white/5">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className="py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 text-center">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr">
                    {daysArray.map((day, idx) => {
                        const dayHolidays = getHolidaysForDate(day);
                        const hasHoliday = dayHolidays.length > 0;
                        const isWeekend = (idx % 7 === 0 || idx % 7 === 6);

                        return (
                            <div key={idx} className={`min-h-[140px] border-b-2 border-r-2 border-slate-100 dark:border-white/5 p-4 transition-all duration-300 relative group hover:bg-white dark:hover:bg-slate-800/50 ${!day ? 'bg-slate-50/30' : ''}`}>
                                {day && (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`w-8 h-8 flex items-center justify-center rounded-10 text-xs font-black transition-all duration-500 ${isToday(day) ? 'bg-[#00b9cd] text-white shadow-[0_5px_15px_rgba(0,185,205,0.4)] scale-110' : hasHoliday ? 'text-[#00b9cd] bg-[#00b9cd]/10' : 'text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 dark:group-hover:text-white dark:group-hover:bg-white/10'}`}>
                                                {day}
                                            </span>
                                            {hasHoliday && (
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-10 bg-[#00b9cd] animate-pulse"></span>
                                                    <span className="w-1.5 h-1.5 rounded-10 bg-amber-500"></span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {dayHolidays.map(h => (
                                                <div key={h.id} className="p-2 bg-[#00b9cd]/5 border-l-4 border-[#00b9cd] rounded-10-xl transition-all hover:bg-[#00b9cd]/10 group/item relative overflow-hidden">
                                                    <div className="text-[10px] font-black text-[#00b9cd] uppercase tracking-tighter line-clamp-2 leading-tight"> {h.name}</div>
                                                    <div className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest opacity-0 group-hover/item:opacity-100 transition-opacity">GLOBAL PROTOCOL</div>
                                                </div>
                                            ))}
                                        </div>
                                        {isWeekend && !hasHoliday && (
                                            <div className="absolute inset-0 bg-slate-100/10 pointer-events-none"></div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-12 h-12 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00b9cd]">Accessing Temporal Node...</div>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-[1700px] mx-auto min-h-screen font-paperlogy mesh-bg">

            {/* Tactical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Holiday <span className="text-transparent bg-clip-text bg-[#00b9cd]">Calendar</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic">Operational Exclusion Scheduling</p>
                    </div>
                </div>
                <div className="flex gap-6 bg-white dark:bg-slate-900/60 p-2 rounded-10 shadow-lg border-2 border-slate-100 dark:border-white/5 backdrop-blur-md">
                    <button 
                        onClick={() => setViewMode("calendar")} 
                        className={`p-4 rounded-10 transition-all duration-500 ${viewMode === 'calendar' ? 'bg-[#00b9cd] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                    >
                        <CalendarDays size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode("list")} 
                        className={`p-4 rounded-10 transition-all duration-500 ${viewMode === 'list' ? 'bg-[#00b9cd] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            <Card 
                title={viewMode === "calendar" ? currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }) : "Annual Exclusion Registry"} 
                icon={viewMode === "calendar" ? CalendarDays : List}
                actions={viewMode === "calendar" && (
                    <div className="flex gap-3">
                        <Button variant="ghost" className="!p-3" onClick={prevMonth}><ChevronLeft size={20} /></Button>
                        <Button variant="ghost" className="!p-3" onClick={() => setCurrentMonth(new Date())} icon={RefreshCw}>Today</Button>
                        <Button variant="ghost" className="!p-3" onClick={nextMonth}><ChevronRight size={20} /></Button>
                    </div>
                )}
            >
                {viewMode === "list" ? (
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                                    <th className="px-8 pb-4">Protocol Identity</th>
                                    <th className="px-8 pb-4">Temporal Range</th>
                                    <th className="px-8 pb-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holidays.map((h) => (
                                    <tr key={h.id} className="group transition-all duration-300">
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 rounded-10-[2rem] border-y-2 border-l-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-10 shadow-sm text-[#00b9cd] group-hover:scale-110 transition-transform">
                                                    <Star size={18} />
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{h.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <CalendarIcon size={14} className="text-slate-400" />
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase">
                                                    {h.start_date} {h.start_date !== h.end_date && <span className="mx-2 text-slate-300">→</span>} {h.start_date !== h.end_date && h.end_date}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 rounded-10-[2rem] border-y-2 border-r-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all text-right shadow-sm">
                                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 rounded-10 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">SYSTEM EXCLUSION</span>
                                        </td>
                                    </tr>
                                ))}
                                {holidays.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-20">
                                                <Activity size={64} className="mb-6 animate-spin-slow text-[#00b9cd]" />
                                                <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-400 italic">No Operational Disruptions Archieved</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="mt-8 transform transition-all duration-700 animate-in fade-in slide-in-from-bottom-10">
                        {renderCalendar()}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default HolidayCalendarPage;