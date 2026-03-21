import { useState, useEffect } from "react";
import api from "../../../api/axios";
import AttendanceSummaryTable from "../../../components/admin/AttendanceSummaryTable";
import AttendanceHistoryDrawer from "../../../components/admin/AttendanceHistoryDrawer";
import { Search, Filter, Calendar, Users, CheckCircle, XCircle, Timer, RefreshCw } from "lucide-react";

const SuperAdminAttendancePage = () => {
    const [summary, setSummary] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // Today's Status: Present/Absent
    const [page, setPage] = useState(1);
    const [viewType, setViewType] = useState('monthly'); // 'monthly' | 'weekly'
    const [weekDate, setWeekDate] = useState(new Date().toISOString().slice(0, 10)); // Picked date for week view
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchSummary();
        const intervalId = setInterval(() => {
            fetchSummary(true); // silent fetch
        }, 5000);
        return () => clearInterval(intervalId);
    }, [page, monthFilter, searchTerm, departmentId, statusFilter, viewType, weekDate]);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const fetchSummary = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = {
                page: page,
                search: searchTerm,
                department_id: departmentId,
                status: statusFilter
            };
            if (viewType === 'monthly') {
                params.month = monthFilter;
            } else {
                const date = new Date(weekDate);
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const start = new Date(date.setDate(diff));
                const end = new Date(date.setDate(start.getDate() + 6));
                params.start_date = start.toISOString().slice(0, 10);
                params.end_date = end.toISOString().slice(0, 10);
            }
            const response = await api.get(`/attendance/summary`, { params });
            setSummary(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
            setError(null);
        } catch (err) {
            console.error("Failed to fetch attendance summary", err);
            if (!silent) setError("Failed to load attendance records.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleDepartmentChange = (e) => {
        setDepartmentId(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const handleMonthChange = (e) => {
        setMonthFilter(e.target.value);
        setPage(1);
    };

    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setIsDrawerOpen(true);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight">
                        <span className="italic">Attendance</span> <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Track, Manage, and Optimize Employee Attendance</p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchSummary()}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                    >
                        <RefreshCw size={16} className={`text-orange-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                        <span className="uppercase tracking-widest">Refresh</span>
                    </button>
                    <div className="flex bg-white dark:bg-slate-900/60 p-1 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.1)]">
                        {['monthly', 'weekly'].map((type) => (
                            <button
                                key={type}
                                onClick={() => { setViewType(type); setPage(1); }}
                                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewType === type ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Staff', val: pagination.total || 0, icon: <Users size={22} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Present Today', val: summary.filter(s => s.today_status === 'Present').length, icon: <CheckCircle size={22} />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                    { label: 'Absent Today', val: summary.filter(s => s.today_status === 'Absent').length, icon: <XCircle size={22} />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                    { label: 'Work Hours', val: '---', icon: <Timer size={22} />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' }
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex items-center gap-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-lg transition-all duration-300">
                        <div className={`${s.bg} ${s.color} ${s.border} border-2 p-3.5 rounded-2xl shadow-sm`}>{s.icon}</div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{s.val}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] mb-10 flex flex-wrap gap-5">
                <div className="relative flex-1 min-w-[240px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all font-paperlogy"
                    />
                </div>
                <div className="flex flex-wrap gap-4 flex-1 justify-end">
                    <div className="relative min-w-[160px]">
                        <select
                            value={departmentId}
                            onChange={handleDepartmentChange}
                            className="appearance-none pl-5 pr-12 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                    <div className="relative min-w-[160px]">
                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="appearance-none pl-5 pr-12 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                        >
                            <option value="">All Status (Today)</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                        </select>
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                    {viewType === 'monthly' ? (
                        <div className="relative min-w-[160px]">
                            <input
                                type="month"
                                value={monthFilter}
                                onChange={handleMonthChange}
                                className="pl-5 pr-5 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all"
                            />
                        </div>
                    ) : (
                        <div className="relative min-w-[160px]">
                            <input
                                type="date"
                                value={weekDate}
                                onChange={(e) => { setWeekDate(e.target.value); setPage(1); }}
                                className="pl-5 pr-5 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Error Area */}
            {error && (
                <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <XCircle className="text-red-600" size={20} />
                        <p className="text-sm font-bold text-red-700">{error}</p>
                    </div>
                    <button onClick={() => fetchSummary()} className="text-red-600 font-bold hover:underline">Retry</button>
                </div>
            )}

            {/* Main Content Area */}
            <AttendanceSummaryTable
                summary={summary}
                loading={loading}
                onEmployeeClick={handleEmployeeClick}
            />

            {/* Pagination Placeholder Integration */}
            {!loading && summary.length > 0 && pagination.last_page > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Showing <span className="text-slate-900 dark:text-white">{pagination.from || 0}</span> to <span className="text-slate-900 dark:text-white">{pagination.to || 0}</span> of <span className="text-slate-900 dark:text-white">{pagination.total}</span> employees
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-brand-800/20 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-800/40 disabled:opacity-50 transition-all"
                        >
                            Previous
                        </button>
                        <div className="px-4 py-2 text-[10px] font-black bg-brand-500 text-white rounded-xl shadow-md">
                            Page {page} of {pagination.last_page}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                            disabled={page === pagination.last_page}
                            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-brand-800/20 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-800/40 disabled:opacity-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <AttendanceHistoryDrawer
                employee={selectedEmployee}
                isOpen={isDrawerOpen}
                month={monthFilter}
                onClose={() => setIsDrawerOpen(false)}
            />
        </div>
    );
};

export default SuperAdminAttendancePage;