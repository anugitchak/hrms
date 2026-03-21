import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useGlobalUI } from '../../context/GlobalUIContext';
import { X, Clock, MapPin, Smartphone, Zap, CheckCircle, XCircle, Calendar, LogOut, Filter } from 'lucide-react';

const AttendanceHistoryDrawer = ({ employee, isOpen, onClose, month }) => {
    const { user } = useAuth();
    const { addToast, confirm } = useGlobalUI();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [currentMonth, setCurrentMonth] = useState(month);

    const formatDuration = (hours) => {
        if (!hours) return "—";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    useEffect(() => {
        if (isOpen && employee) setCurrentMonth(month);
    }, [isOpen, employee, month]);

    useEffect(() => {
        if (isOpen && employee) fetchHistory();
    }, [currentMonth, isOpen, employee]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/employee/${employee.id}?month=${currentMonth}`);
            setHistory(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch history", err);
            setError("Failed to load attendance history.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Present': return { bar: 'bg-teal-500', badge: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-500/20', icon: <CheckCircle size={11} /> };
            case 'Absent': return { bar: 'bg-red-500', badge: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20', icon: <XCircle size={11} /> };
            case 'Weekend': return { bar: 'bg-indigo-500', badge: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20', icon: <Calendar size={11} /> };
            default: return { bar: 'bg-slate-400', badge: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-500/20', icon: <Clock size={11} /> };
        }
    };

    if (!isOpen) return null;

    const filteredHistory = history.filter(r => statusFilter ? r.status === statusFilter : true);
    const presentCount = history.filter(r => r.status === 'Present').length;
    const absentCount = history.filter(r => r.status === 'Absent').length;    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Drawer */}
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                    <div className="pointer-events-auto w-screen max-w-sm">
                        <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-white dark:bg-slate-900 px-6 py-6 border-b border-slate-100 dark:border-white/5">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-black text-xl shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)]">
                                            {employee?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight font-paperlogy tracking-tight">
                                                <span className="italic">Attendance</span> <span className="text-teal-600">History</span>
                                            </h2>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">{employee?.name} · {employee?.code || 'EMP'}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all border border-slate-100 dark:border-white/10 shadow-sm active:scale-95"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Mini Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[
                                        { label: 'Present', val: presentCount, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-500/10' },
                                        { label: 'Absent', val: absentCount, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
                                        { label: 'Total', val: history.length, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-white/5' },
                                    ].map(s => (
                                        <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center shadow-[4px_4px_0px_0px_rgba(71,85,105,0.08)] dark:shadow-none border border-slate-100 dark:border-white/5`}>
                                            <div className={`text-xl font-black ${s.color} font-paperlogy tracking-tight`}>{s.val}</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-80">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Filters */}
                                <div className="flex gap-3">
                                    <div className="relative flex-1 group">
                                        <input
                                            id="drawer_month_filter"
                                            name="drawer_month"
                                            type="month"
                                            value={currentMonth}
                                            onChange={(e) => setCurrentMonth(e.target.value)}
                                            className="w-full text-xs font-bold p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-2 border-transparent focus:border-teal-500/30 outline-none transition-all shadow-inner uppercase"
                                        />
                                    </div>
                                    <div className="relative flex-1 group">
                                        <select
                                            id="history_status_filter"
                                            name="status_filter"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full text-xs font-bold p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-2 border-transparent focus:border-teal-500/30 outline-none transition-all shadow-inner appearance-none uppercase"
                                        >
                                            <option value="">All Status</option>
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                            <option value="Weekend">Weekend</option>
                                        </select>
                                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={12} />
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="animate-pulse bg-slate-50 dark:bg-white/5 rounded-2xl h-24"></div>
                                        ))}
                                    </div>
                                ) : error ? (
                                    <div className="text-center text-red-500 mt-10 font-bold">{error}</div>
                                ) : filteredHistory.length === 0 ? (
                                    <div className="text-center text-slate-400 mt-16 font-black uppercase tracking-widest text-xs">No Records Found</div>
                                ) : (
                                    <ul className="space-y-4">
                                        {filteredHistory.map((record) => {
                                            const sc = getStatusConfig(record.status);
                                            return (
                                                <li key={record.id} className="relative rounded-3xl bg-white dark:bg-slate-800/40 shadow-[4px_4px_0px_0px_rgba(71,85,105,0.12)] dark:shadow-none border border-slate-100 dark:border-white/5 overflow-hidden hover:-translate-y-1 transition-all duration-300">
                                                    {/* Left color bar */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sc.bar}`} />

                                                    <div className="pl-6 pr-5 py-5">
                                                        {/* Date + Status */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-paperlogy">
                                                                    {new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                                                </span>
                                                            </div>
                                                            <span className={`flex items-center gap-1 text-[9px] font-black border rounded-full px-2.5 py-1 uppercase tracking-widest ${sc.badge}`}>
                                                                {sc.icon}
                                                                {record.status}
                                                            </span>
                                                        </div>

                                                        {/* In / Out / Duration */}
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { label: 'IN', val: record.check_in || '—', color: record.check_in ? 'text-teal-600' : 'text-slate-300' },
                                                                { label: 'OUT', val: record.check_out || '—', color: record.check_out ? 'text-teal-600' : 'text-slate-300' },
                                                                { label: 'DURATION', val: formatDuration(record.total_hours), color: 'text-slate-900 dark:text-slate-100' },
                                                            ].map(col => (
                                                                <div key={col.label} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-2.5 text-center shadow-inner border border-slate-50/50 dark:border-white/5">
                                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{col.label}</div>
                                                                    <div className={`text-xs font-black ${col.color}`}>{col.val}</div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Overtime */}
                                                        {record.overtime_start && (
                                                            <div className="mt-4 flex items-center gap-3 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl px-3 py-2">
                                                                <Zap size={14} className="text-purple-600 shrink-0" />
                                                                <div className="text-[11px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-tight">
                                                                    OT: {record.overtime_start} → {record.overtime_end || 'Live'}
                                                                    {record.overtime_hours && <span className="text-teal-600 ml-1">({record.overtime_hours}h)</span>}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Location & Device */}
                                                        {(record.check_in_latitude || record.device_id) && (
                                                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 flex flex-col gap-2">
                                                                {record.check_in_latitude && (
                                                                    <div className="flex items-start gap-2">
                                                                        <MapPin size={12} className="text-teal-500 shrink-0 mt-0.5" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate leading-tight">{record.check_in_location || `${record.check_in_latitude}, ${record.check_in_longitude}`}</p>
                                                                            <a href={`https://www.google.com/maps?q=${record.check_in_latitude},${record.check_in_longitude}`} target="_blank" rel="noopener noreferrer" className="text-[9px] text-teal-600 hover:text-teal-500 font-black uppercase tracking-widest mt-0.5 inline-block">Explore Geo-Tag</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {record.device_id && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Smartphone size={12} className="text-slate-400 shrink-0" />
                                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">{record.device_type || 'Terminal'} · <span className="text-slate-400">{record.device_id}</span></p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Force Checkout */}
                                                        {(user?.role_id === 1 || user?.can_force_checkout) && !record.check_out && record.check_in && (
                                                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 flex justify-end">
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        const confirmed = await confirm({
                                                                            title: "Force Termination",
                                                                            message: `Initiate mandatory session termination for ${new Date(record.date).toLocaleDateString()}?`,
                                                                            confirmText: "Execute Force Out",
                                                                            type: "warning"
                                                                        });
                                                                        if (!confirmed) return;
                                                                        try {
                                                                            setLoading(true);
                                                                            await api.post(`/attendances/${record.id}/checkout`);
                                                                            addToast("Session terminated successfully", "success");
                                                                            fetchHistory();
                                                                        } catch (err) {
                                                                            console.error("Termination failed", err);
                                                                            addToast(err.response?.data?.message || "Failed to terminate session", "error");
                                                                            setLoading(false);
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-2 text-[10px] font-black px-4 py-2 border-2 border-red-500/20 text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-all shadow-sm active:translate-y-0.5 uppercase tracking-widest"
                                                                >
                                                                    <LogOut size={12} />
                                                                    Force Terminal Out
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistoryDrawer;
