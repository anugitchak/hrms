import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import api from "../../../api/axios";
import { formatDate } from "../../../utils/dateUtils";
import { useGlobalUI } from "../../../context/GlobalUIContext";
import { ArrowLeft, Calendar, Download, RefreshCw, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react";

const EmployeeAttendancePage = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useGlobalUI();

    // State
    const [employee, setEmployee] = useState(null);
    const [attendanceData, setAttendanceData] = useState({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
    const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, on_leave: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(searchParams.get("month") || currentMonth);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setSearchParams({ month });
        fetchEmployee();
        fetchAttendance();
        fetchSummary();
    }, [id, month, currentPage]);

    const fetchEmployee = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}`);
            setEmployee(response.data);
        } catch (err) {
            console.error("Failed to fetch employee", err);
            setError("Failed to load agent profile.");
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance`, {
                params: { month, page: currentPage }
            });
            setAttendanceData(response.data);
        } catch (err) {
            console.error("Failed to fetch attendance", err);
            setError("Failed to synchronize attendance data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance/summary`, {
                params: { month }
            });
            setSummary(response.data);
        } catch (err) {
            console.error("Failed to fetch summary", err);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/superadmin/employees/${id}/attendance/export`, {
                params: { month },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${employee?.employee_code}_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            addToast("Deployment data exported successfully", "success");
        } catch (err) {
            console.error("Failed to export attendance", err);
            addToast("Export sequence failed.", "error");
        }
    };

    const handleMonthChange = (offset) => {
        const date = new Date(month + "-01");
        date.setMonth(date.getMonth() + offset);
        const newMonth = date.toISOString().slice(0, 7);
        setMonth(newMonth);
        setCurrentPage(1);
    };

    const formatTime = (timeString) => {
        if (!timeString) return "--:--";
        const [hours, minutes] = timeString.split(":");
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case "Present":
                return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
            case "Absent":
                return "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
            case "Late":
                return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
            case "On Leave":
                return "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
        }
    };

    if (error) {
        return (
            <div className="p-10 text-center animate-in fade-in zoom-in-95">
                <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-500/20 p-8 rounded-[2rem] inline-block">
                    <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-[1600px] mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-indigo-500/5 rounded-[3rem] blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
                    <div className="relative">
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight lowercase">
                            <span className="italic">Deployment</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">History</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-4">
                            <span className="h-1.5 w-12 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-lg shadow-indigo-500/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Agent Profile: {employee?.user?.name || "Loading..."}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        to="/superadmin/employees"
                        className="px-8 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900/10 rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(71,85,105,0.05)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:translate-y-1 active:shadow-none flex items-center gap-3"
                    >
                        <ArrowLeft size={16} />
                        Return to Hub
                    </Link>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Present Days", value: summary.present, color: "emerald", icon: CheckCircle },
                    { label: "Absences", value: summary.absent, color: "rose", icon: XCircle },
                    { label: "Late Arrivals", value: summary.late, color: "amber", icon: Clock },
                    { label: "On Leave", value: summary.on_leave, color: "sky", icon: AlertCircle }
                ].map((stat, i) => (
                    <div key={i} className="group relative">
                        <div className={`absolute inset-0 bg-${stat.color}-500 blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                        <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-900/10 shadow-[8px_8px_0px_0px_rgba(71,85,105,0.05)] transition-all flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight">
                                    {stat.value.toString().padStart(2, '0')}
                                </h3>
                            </div>
                            <div className={`w-14 h-14 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center`}>
                                <stat.icon className={`text-${stat.color}-500`} size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8 bg-slate-900 dark:bg-indigo-600 p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(71,85,105,0.1)]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleMonthChange(-1)} 
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="relative bg-white/10 rounded-xl px-2 py-1 flex items-center gap-3 border border-white/20">
                        <Calendar className="text-white/60 ml-2" size={16} />
                        <input 
                            type="month" 
                            value={month} 
                            onChange={(e) => setMonth(e.target.value)} 
                            className="bg-transparent text-white font-black uppercase text-xs outline-none py-2 cursor-pointer [color-scheme:dark]" 
                        />
                    </div>
                    <button 
                        onClick={() => handleMonthChange(1)} 
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all active:scale-95"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchAttendance} 
                        className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button 
                        onClick={handleExport} 
                        className="p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Download size={16} />
                        Export Log
                    </button>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-900/10 shadow-[12px_12px_0px_0px_rgba(71,85,105,0.05)] overflow-hidden transition-all duration-300">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-slate-900/5 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Logs...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5 border-b-2 border-slate-900/5">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Weekday</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activation</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Termination</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-900/5">
                                {attendanceData.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="bg-slate-50 dark:bg-white/5 inline-block p-8 rounded-[2.5rem] border-2 border-dashed border-slate-900/10">
                                                <Calendar className="mx-auto text-slate-300 mb-4" size={40} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No deployment logs found for this period.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    attendanceData.data.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 font-paperlogy text-xs font-black">
                                                        {new Date(record.date).getDate().toString().padStart(2, '0')}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{formatDate(record.date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full">
                                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{formatTime(record.check_in)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{formatTime(record.check_out)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${getStatusStyles(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {attendanceData.meta.last_page > 1 && (
                    <div className="flex justify-between items-center p-8 bg-slate-50 dark:bg-white/5 border-t-2 border-slate-900/5">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-slate-900/5">
                            Page <span className="text-slate-900 dark:text-white">{currentPage}</span> of <span className="text-slate-900 dark:text-white">{attendanceData.meta.last_page}</span>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className="px-6 py-3 border-2 border-slate-900/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(attendanceData.meta.last_page, p + 1))} 
                                disabled={currentPage === attendanceData.meta.last_page} 
                                className="px-6 py-3 border-2 border-slate-900/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeAttendancePage;
; 