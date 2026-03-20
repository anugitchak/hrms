import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useGlobalUI } from '../../context/GlobalUIContext';
import { X, Clock, MapPin, Smartphone, Zap, CheckCircle, XCircle, Calendar, LogOut } from 'lucide-react';

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
            case 'Present': return { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle size={11} /> };
            case 'Absent': return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700 border-red-300', icon: <XCircle size={11} /> };
            case 'Weekend': return { bar: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: <Calendar size={11} /> };
            default: return { bar: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-300', icon: <Clock size={11} /> };
        }
    };

    if (!isOpen) return null;

    const filteredHistory = history.filter(r => statusFilter ? r.status === statusFilter : true);
    const presentCount = history.filter(r => r.status === 'Present').length;
    const absentCount = history.filter(r => r.status === 'Absent').length;

    return (
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
                        <div className="flex h-full flex-col bg-white shadow-2xl border-l-4 border-black overflow-hidden">

                            {/* Header */}
                            <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-base border border-white/30">
                                            {employee?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-extrabold text-white leading-tight">Attendance History</h2>
                                            <p className="text-[11px] text-white/70 font-medium">{employee?.name} · {employee?.code}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl p-1.5 bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/20"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Mini Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {[
                                        { label: 'Present', val: presentCount, color: 'bg-green-500/20 text-green-100 border-green-400/30' },
                                        { label: 'Absent', val: absentCount, color: 'bg-red-500/20 text-red-100 border-red-400/30' },
                                        { label: 'Total', val: history.length, color: 'bg-white/10 text-white border-white/20' },
                                    ].map(s => (
                                        <div key={s.label} className={`${s.color} border rounded-xl p-2 text-center`}>
                                            <div className="text-lg font-black">{s.val}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Filters */}
                                <div className="flex gap-2">
                                    <input
                                        id="drawer_month_filter"
                                        name="drawer_month"
                                        type="month"
                                        value={currentMonth}
                                        onChange={(e) => setCurrentMonth(e.target.value)}
                                        className="flex-1 text-xs p-2 rounded-lg bg-white/10 text-white border border-white/20 outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50"
                                    />
                                    <select
                                        id="history_status_filter"
                                        name="status_filter"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="flex-1 text-xs p-2 rounded-lg bg-white/10 text-white border border-white/20 outline-none focus:ring-2 focus:ring-white/50"
                                    >
                                        <option value="">All Status</option>
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Weekend">Weekend</option>
                                    </select>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20"></div>
                                        ))}
                                    </div>
                                ) : error ? (
                                    <div className="text-center text-red-500 mt-10 font-bold">{error}</div>
                                ) : filteredHistory.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-16 font-medium">No records found.</div>
                                ) : (
                                    <ul className="space-y-2.5">
                                        {filteredHistory.map((record) => {
                                            const sc = getStatusConfig(record.status);
                                            return (
                                                <li key={record.id} className="relative rounded-2xl border-2 border-black/10 bg-white overflow-hidden hover:border-black/20 transition-all">
                                                    {/* Left color bar */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${sc.bar}`} />

                                                    <div className="pl-4 pr-3 py-3">
                                                        {/* Date + Status */}
                                                        <div className="flex items-center justify-between mb-2.5">
                                                            <span className="text-sm font-extrabold text-black">
                                                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                            </span>
                                                            <span className={`flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${sc.badge}`}>
                                                                {sc.icon}
                                                                {record.status}
                                                            </span>
                                                        </div>

                                                        {/* In / Out / Duration */}
                                                        <div className="grid grid-cols-3 gap-1.5">
                                                            {[
                                                                { label: 'IN', val: record.check_in || '—', color: record.check_in ? 'text-green-600' : 'text-gray-400' },
                                                                { label: 'OUT', val: record.check_out || '—', color: record.check_out ? 'text-blue-600' : 'text-gray-400' },
                                                                { label: 'DURATION', val: formatDuration(record.total_hours), color: 'text-gray-700' },
                                                            ].map(col => (
                                                                <div key={col.label} className="bg-gray-50 rounded-lg p-2 text-center">
                                                                    <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">{col.label}</div>
                                                                    <div className={`text-xs font-bold ${col.color}`}>{col.val}</div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Overtime */}
                                                        {record.overtime_start && (
                                                            <div className="mt-2.5 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5">
                                                                <Zap size={12} className="text-purple-600 shrink-0" />
                                                                <div className="text-xs font-bold text-purple-700">
                                                                    OT: {record.overtime_start} → {record.overtime_end || 'In Progress'}
                                                                    {record.overtime_hours && <span className="text-green-600 ml-1">({record.overtime_hours}h)</span>}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Location */}
                                                        {record.check_in_latitude && (
                                                            <div className="mt-2 flex items-start gap-1.5">
                                                                <MapPin size={11} className="text-green-500 shrink-0 mt-0.5" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] text-gray-500 truncate">{record.check_in_location || `${record.check_in_latitude}, ${record.check_in_longitude}`}</p>
                                                                    <a href={`https://www.google.com/maps?q=${record.check_in_latitude},${record.check_in_longitude}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline font-bold">View on Map</a>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Device */}
                                                        {record.device_id && (
                                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                                <Smartphone size={11} className="text-gray-400 shrink-0" />
                                                                <p className="text-[10px] text-gray-500 truncate">{record.device_type || 'Device'} · {record.device_id}</p>
                                                            </div>
                                                        )}

                                                        {/* Force Checkout */}
                                                        {(user?.role_id === 1 || user?.can_force_checkout) && !record.check_out && record.check_in && (
                                                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-end">
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        const confirmed = await confirm({
                                                                            title: "Force Checkout",
                                                                            message: `Force checkout for ${new Date(record.date).toLocaleDateString()}?`,
                                                                            confirmText: "Force Checkout",
                                                                            type: "warning"
                                                                        });
                                                                        if (!confirmed) return;
                                                                        try {
                                                                            setLoading(true);
                                                                            await api.post(`/attendances/${record.id}/checkout`);
                                                                            addToast("Employee checked out successfully", "success");
                                                                            fetchHistory();
                                                                        } catch (err) {
                                                                            console.error("Checkout failed", err);
                                                                            addToast(err.response?.data?.message || "Failed to checkout employee", "error");
                                                                            setLoading(false);
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 border-2 border-red-300 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                                                                >
                                                                    <LogOut size={11} />
                                                                    Force Out
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
