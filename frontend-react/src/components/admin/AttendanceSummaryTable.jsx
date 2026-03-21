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
                return { 
                    badge: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20', 
                    dot: 'bg-green-500', 
                    icon: <CheckCircle size={12} /> 
                };
            case 'Absent':
                return { 
                    badge: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20', 
                    dot: 'bg-red-500', 
                    icon: <XCircle size={12} /> 
                };
            default:
                return { 
                    badge: 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10', 
                    dot: 'bg-slate-400', 
                    icon: <Clock size={12} /> 
                };
        }
    };

    const getAvatarColor = (name) => {
        const colors = [
            'bg-purple-400 text-black',
            'bg-blue-400 text-black',
            'bg-teal-400 text-black',
            'bg-pink-400 text-black',
            'bg-orange-400 text-black',
            'bg-brand-400 text-black',
        ];
        const idx = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[idx];
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.15)] animate-pulse border-2 border-slate-50 dark:border-white/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-slate-50 dark:bg-white/5 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="h-20 bg-slate-50 dark:bg-white/5 rounded-2xl w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (summary.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-20 rounded-[3rem] shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] text-center flex flex-col items-center gap-6 border-2 border-slate-50 dark:border-white/5">
                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                    <Calendar size={64} className="text-slate-300 dark:text-slate-600" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">No attendance records</h3>
                    <p className="text-slate-400 dark:text-slate-500 font-bold mt-2">No records found for the selected criteria.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {summary.map((employee) => {
                const sc = getStatusConfig(employee.today_status);
                const hasPendingCheckout = employee.pending_checkout_dates?.length > 0;
                return (
                    <div
                        key={employee.id}
                        onClick={() => onEmployeeClick(employee)}
                        className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-6 group cursor-pointer border-2 border-transparent hover:border-brand-500/20"
                    >
                        {/* Top: Avatar + Status */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl ${getAvatarColor(employee.name)} flex items-center justify-center text-xl font-bold border border-white dark:border-slate-800 shadow-md group-hover:scale-110 transition-transform duration-500`}>
                                    {employee.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight tracking-tight">{employee.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{employee.code}</p>
                                </div>
                            </div>
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-full shadow-sm border transition-all ${sc.badge}`}>
                                <span className={`w-2 h-2 rounded-full ${sc.dot} ${employee.today_status === 'Present' ? 'animate-pulse' : ''}`}></span>
                                {employee.today_status}
                            </span>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-brand-800/20 rounded-2xl p-4 border border-slate-900/5 dark:border-white/5 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/5 transition-colors duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={14} className="text-brand-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">{employee.total_working_days}</span>
                                    <span className="text-[10px] font-bold text-slate-400">/mo</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-brand-800/20 rounded-2xl p-4 border border-slate-900/5 dark:border-white/5 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/5 transition-colors duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <Timer size={14} className="text-teal-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours</span>
                                </div>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{formatDuration(employee.total_hours)}</span>
                            </div>
                        </div>

                        {/* Pending Checkout Warning */}
                        {hasPendingCheckout && (
                            <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-4 shadow-sm">
                                <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-tight">
                                        {employee.pending_checkout_dates.length} Pending Checkout{employee.pending_checkout_dates.length > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-[10px] text-orange-600 dark:text-orange-500 font-bold mt-1 leading-relaxed">
                                        {employee.pending_checkout_dates.slice(0, 2).map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')}
                                        {employee.pending_checkout_dates.length > 2 ? ` +${employee.pending_checkout_dates.length - 2}` : ''}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Footer Action Hint */}
                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-900/5 dark:border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{employee.department}</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                <span>History</span>
                                <History size={12} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AttendanceSummaryTable;
