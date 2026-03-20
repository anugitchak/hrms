import React from 'react';
import { Clock, Calendar, AlertTriangle, History, CheckCircle, XCircle, Timer } from 'lucide-react';

const AttendanceSummaryTable = ({ summary, loading, onEmployeeClick }) => {
    const formatDuration = (hours) => {
        if (!hours) return "—";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Present':
            case 'Checked In':
                return { bg: 'bg-green-50 border-green-300', badge: 'bg-green-100 text-green-700 border-green-300', dot: 'bg-green-500', icon: <CheckCircle size={13} /> };
            case 'Absent':
                return { bg: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500', icon: <XCircle size={13} /> };
            default:
                return { bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400', icon: <Clock size={13} /> };
        }
    };

    const getAvatarColor = (name) => {
        const colors = [
            'bg-gradient-to-br from-purple-500 to-purple-700',
            'bg-gradient-to-br from-blue-500 to-blue-700',
            'bg-gradient-to-br from-teal-500 to-teal-700',
            'bg-gradient-to-br from-pink-500 to-pink-700',
            'bg-gradient-to-br from-orange-500 to-orange-700',
            'bg-gradient-to-br from-indigo-500 to-indigo-700',
        ];
        const idx = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[idx];
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                    <div key={i} className="card p-5 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-200"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (summary.length === 0) {
        return (
            <div className="card p-16 text-center flex flex-col items-center gap-4">
                <div className="bg-gray-100 p-5 rounded-2xl">
                    <Calendar size={48} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-black">No attendance records</h3>
                <p className="text-gray-500 font-medium">No records found for this period.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((employee) => {
                const sc = getStatusConfig(employee.today_status);
                const hasPendingCheckout = employee.pending_checkout_dates?.length > 0;
                return (
                    <div
                        key={employee.id}
                        onClick={() => onEmployeeClick(employee)}
                        className={`card p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 border-2 ${sc.bg} flex flex-col gap-4`}
                    >
                        {/* Top: Avatar + Status */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl ${getAvatarColor(employee.name)} text-white flex items-center justify-center text-xl font-black border-2 border-black shadow-[2px_2px_0px_black] shrink-0`}>
                                    {employee.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-black text-sm leading-tight">{employee.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{employee.code}</p>
                                    <p className="text-xs text-gray-400">{employee.department}</p>
                                </div>
                            </div>
                            <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold border rounded-full shrink-0 ${sc.badge}`}>
                                {sc.icon}
                                {employee.today_status}
                            </span>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/70 rounded-xl p-3 border border-black/10">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar size={12} className="text-brand-500" />
                                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Working Days</span>
                                </div>
                                <span className="text-lg font-black text-black">{employee.total_working_days}</span>
                                <span className="text-xs font-medium text-gray-500"> days</span>
                            </div>
                            <div className="bg-white/70 rounded-xl p-3 border border-black/10">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Timer size={12} className="text-teal-500" />
                                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Total Hours</span>
                                </div>
                                <span className="text-lg font-black text-black">{formatDuration(employee.total_hours)}</span>
                            </div>
                        </div>

                        {/* Pending Checkout Warning */}
                        {hasPendingCheckout && (
                            <div className="flex items-start gap-2 bg-orange-50 border-2 border-orange-300 rounded-xl px-3 py-2">
                                <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-extrabold text-orange-700">
                                        {employee.pending_checkout_dates.length} Pending Checkout{employee.pending_checkout_dates.length > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-[10px] text-orange-600 font-medium mt-0.5">
                                        {employee.pending_checkout_dates.slice(0,2).map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')}
                                        {employee.pending_checkout_dates.length > 2 ? ` +${employee.pending_checkout_dates.length - 2} more` : ''}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* View History Button */}
                        <div className="flex items-center justify-end pt-1 border-t-2 border-black/5">
                            <button className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
                                <History size={13} />
                                View History
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AttendanceSummaryTable;
