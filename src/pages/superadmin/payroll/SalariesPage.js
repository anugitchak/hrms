import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { formatDate } from "../../../utils/dateUtils";
import { useAuth } from "../../../context/AuthContext";
import { useGlobalUI } from "../../../context/GlobalUIContext";
import { Search, Filter, Calendar, Users, Briefcase, DollarSign, Download, RefreshCw, ChevronRight, History, Edit2, TrendingUp, TrendingDown, Wallet } from "lucide-react";

// --- Components ---

const StatCard = ({ label, value, icon: Icon, color, bg, border, loading }) => (
    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex items-center gap-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out group overflow-hidden">
        <div className={`${bg} ${color} ${border} border-2 p-3.5 rounded-10 shadow-md group-hover:scale-110 transition-transform shrink-0`}>
            <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
            <div className="text-lg xl:text-xl font-black text-slate-900 dark:text-white leading-none mb-1 truncate" title={value}>
                {loading ? <div className="h-6 w-20 bg-slate-100 dark:bg-white/5 animate-pulse rounded-10" /> : value}
            </div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase truncate">{label}</div>
        </div>
    </div>
);

const SalariesPage = () => {
    const { user } = useAuth();
    const { addToast } = useGlobalUI();
    const canManageSalary = user?.role_id === 1 || user?.permissions?.includes("can_manage_salaries");

    // State
    const [salaries, setSalaries] = useState({ data: [], current_page: 1, last_page: 1, total: 0 });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payrollConfig, setPayrollConfig] = useState({});

    // Filters
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(currentMonth);
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        employee_id: "",
        gross_salary: "",
        pf_opt_out: false,
        esic_opt_out: false,
        ptax_opt_out: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const fetchPayrollPolicy = async () => {
        try {
            const res = await api.get('/payroll-policy');
            if (res.data) {
                const config = { ...res.data };
                config.basic_percentage = parseFloat(config.basic_percentage) || 70;
                config.pf_enabled = config.pf_enabled == '1' || config.pf_enabled === true;
                config.esic_enabled = config.esic_enabled == '1' || config.esic_enabled === true;
                config.ptax_enabled = config.ptax_enabled == '1' || config.ptax_enabled === true;
                
                if (typeof config.ptax_slabs === 'string') {
                    try {
                        config.ptax_slabs = JSON.parse(config.ptax_slabs);
                    } catch (e) {
                        config.ptax_slabs = [];
                    }
                }
                setPayrollConfig(config);
            }
        } catch (err) {
            console.error("Failed to fetch payroll policy", err);
        }
    };

    const loadSalaries = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                search,
                department_id: departmentId,
                month
            };
            const response = await api.get("/salaries", { params });
            setSalaries(response.data);
        } catch (err) {
            console.error("Failed to load salaries", err);
            setError("Failed to load salary records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        if (user?.role_id === 1 || user?.permissions?.includes("can_view_salaries") || user?.permissions?.includes("can_manage_salaries")) {
            fetchPayrollPolicy();
        }
    }, [user]);

    useEffect(() => {
        loadSalaries();
    }, [currentPage, departmentId, month]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) loadSalaries();
            else setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleEdit = (salary) => {
        setSelectedSalary(salary);
        const emp = salary.employee || {};
        setFormData({
            employee_id: salary.employee_id,
            gross_salary: salary.gross_salary || "",
            pf_opt_out: Boolean(emp.pf_opt_out),
            esic_opt_out: Boolean(emp.esic_opt_out),
            ptax_opt_out: Boolean(emp.ptax_opt_out)
        });
        setIsEditModalOpen(true);
    };

    const handleHistory = async (employeeId) => {
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const response = await api.get(`/salaries/history/${employeeId}`);
            setSalaryHistory(response.data);
        } catch (err) {
            console.error("Failed to load history", err);
            setSalaryHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/salaries/update", {
                employee_id: formData.employee_id,
                gross_salary: formData.gross_salary
            });
            loadSalaries();
            setIsEditModalOpen(false);
            addToast("Salary updated successfully", "success");
        } catch (err) {
            addToast("Failed to update salary.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get("/salaries/export", {
                params: { month, department_id: departmentId, search },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salaries_export_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            addToast("Export successful", "info");
        } catch (err) {
            addToast("Failed to export salaries.", "error");
        }
    };

    const formatINR = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
        }).format(value);
    };

    const stats = (() => {
        if (!salaries.data.length) return { totalEmployees: 0, totalExpense: 0, avgSalary: 0, highest: 0, lowest: 0 };
        const totalEmployees = salaries.total;
        const currentData = salaries.data;
        const totalExpense = currentData.reduce((sum, s) => sum + parseFloat(s.gross_salary || 0), 0);
        const avgSalary = totalExpense / (currentData.length || 1);
        const grossSalaries = currentData.map(s => parseFloat(s.gross_salary || 0));
        return {
            totalEmployees,
            totalExpense,
            avgSalary,
            highest: Math.max(...grossSalaries, 0),
            lowest: Math.min(...grossSalaries.filter(s => s > 0), 0)
        };
    })();

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none">
                        Salary <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage and review employee salary structures.</p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                    >
                        <Download size={16} className="text-emerald-500" />
                        <span className="uppercase tracking-widest">Export CSV</span>
                    </button>
                    <button
                        onClick={loadSalaries}
                        className="flex items-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span className="uppercase tracking-widest">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <StatCard label="Total Staff" value={stats.totalEmployees} icon={Users} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" loading={loading} />
                <StatCard label="Total Payout" value={formatINR(stats.totalExpense)} icon={Wallet} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" loading={loading} />
                <StatCard label="Avg Salary" value={formatINR(stats.avgSalary)} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" border="border-purple-100" loading={loading} />
                <StatCard label="Highest" value={formatINR(stats.highest)} icon={TrendingUp} color="text-[#00b9cd]" bg="bg-[#00b9cd]/10" border="border-[#00b9cd]/10" loading={loading} />
                <StatCard label="Lowest" value={formatINR(stats.lowest)} icon={TrendingDown} color="text-red-600" bg="bg-red-50" border="border-red-100" loading={loading} />
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 flex flex-wrap gap-5 border-2 border-slate-50 dark:border-white/5">
                <div className="relative flex-1 min-w-[240px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b9cd] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search employee or ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white transition-all font-paperlogy"
                    />
                </div>
                <div className="flex flex-wrap gap-4 flex-1 justify-end">
                    <div className="relative min-w-[180px]">
                        <select
                            value={departmentId}
                            onChange={e => setDepartmentId(e.target.value)}
                            className="appearance-none pl-5 pr-12 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                    <div className="relative min-w-[180px]">
                        <input
                            type="month"
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                            className="pl-5 pr-5 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/5 dark:border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <RefreshCw className="w-10 h-10 animate-spin text-[#00b9cd] mx-auto mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Records...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center">
                        <p className="text-red-500 font-bold">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-white/5 border-b-2 border-slate-900/5 dark:border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Information</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Components</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">PF / ESIC</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Gross Salary</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {salaries.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-bold">No salary records found for this period.</td>
                                        </tr>
                                    ) : (
                                        salaries.data.map((salary) => (
                                            <tr key={salary.employee_id} className="hover:bg-[#00b9cd]/10/30 dark:hover:bg-[#00b9cd]/80/5 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-[#00b9cd] dark:group-hover:text-[#00b9cd] transition-colors">{salary.employee?.user?.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{salary.employee?.employee_code}</span>
                                                        <div className="h-1 w-1 rounded-10 bg-slate-300"></div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{salary.employee?.department?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 font-medium text-slate-600 dark:text-slate-400 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between w-32 border-b border-dashed border-slate-200 dark:border-white/5 pb-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Basic</span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(salary.basic || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between w-32">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">HRA</span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(salary.hra || 0)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex justify-center gap-3">
                                                        <div className={`px-2 py-1 rounded-10 text-[9px] font-black uppercase tracking-tighter border ${salary.pf > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>PF</div>
                                                        <div className={`px-2 py-1 rounded-10 text-[9px] font-black uppercase tracking-tighter border ${salary.esic > 0 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>ESIC</div>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-red-500 mt-2">-{formatINR(salary.deductions || 0)}</div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-paperlogy">
                                                        {formatINR(salary.gross_salary || salary.employee?.salary || 0)}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                        Updated {salary.updated_at ? formatDate(salary.updated_at) : "Never"}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleHistory(salary.employee_id)}
                                                            className="p-2.5 rounded-10 border-2 border-slate-900/5 dark:border-white/10 hover:border-[#00b9cd] hover:text-[#00b9cd] dark:hover:text-[#00b9cd] transition-all shadow-md bg-white dark:bg-slate-800"
                                                            title="Salary History"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                        {canManageSalary && (
                                                            <button
                                                                onClick={() => handleEdit(salary)}
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-[#00b9cd]/80 text-white rounded-10 text-[10px] font-black uppercase tracking-widest hover:-translate-y-0.5 transition-all shadow-md active:translate-y-0"
                                                            >
                                                                <Edit2 size={12} />
                                                                {salary.id ? "Adjust" : "Set Structure"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {salaries.last_page > 1 && (
                            <div className="px-8 py-6 border-t-2 border-slate-900/5 dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-white/5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 rounded-10 text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:scale-95 transition-all hover:bg-slate-50"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Page</span>
                                    <span className="h-8 w-8 rounded-10 bg-[#00b9cd] text-white flex items-center justify-center font-black text-sm shadow-md">{currentPage}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">of {salaries.last_page}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(salaries.last_page, p + 1))}
                                    disabled={currentPage === salaries.last_page}
                                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 rounded-10 text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:scale-95 transition-all hover:bg-slate-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-10 max-w-lg w-full p-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900 dark:border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#f06464]"></div>
                        <h2 className="text-3xl font-black mb-8 text-slate-900 dark:text-white uppercase tracking-tight">Adjust Salary</h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Gross Salary (Monthly)</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={formData.gross_salary}
                                        onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                                        className="w-full pl-12 pr-6 py-5 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-black text-xl text-slate-900 dark:text-white transition-all shadow-inner"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 px-1 uppercase tracking-wider">Components will be auto-split per policy</p>
                            </div>

                            {/* PREVIEW BOX */}
                            {(() => {
                                const gross = parseFloat(formData.gross_salary) || 0;
                                const basicPercent = payrollConfig.basic_percentage || 70;
                                const basic = Math.round((gross * basicPercent) / 100);
                                const hra = gross - basic;
                                
                                let pf = 0; if (!formData.pf_opt_out && payrollConfig.pf_enabled) pf = Math.round(basic * 0.12);
                                let esic = 0; if (!formData.esic_opt_out && payrollConfig.esic_enabled && gross <= 21000) esic = Math.ceil(gross * 0.0075);
                                let ptax = 0; if (!formData.ptax_opt_out && payrollConfig.ptax_enabled && Array.isArray(payrollConfig.ptax_slabs)) {
                                    const slab = payrollConfig.ptax_slabs.find(s => {
                                        const min = parseFloat(s.min_salary || 0);
                                        const max = s.max_salary === null || s.max_salary === "" ? Infinity : parseFloat(s.max_salary);
                                        return gross >= min && gross <= max;
                                    });
                                    if (slab) ptax = parseFloat(slab.tax_amount || 0);
                                }
                                const totalDed = pf + esic + ptax;
                                const net = gross - totalDed;

                                return (
                                    <div className="bg-slate-50 dark:bg-white/5 border-2 border-slate-900/5 dark:border-white/10 rounded-10 p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-10 border border-slate-100 flex flex-col items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Basic</span>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatINR(basic)}</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-10 border border-slate-100 flex flex-col items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HRA</span>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatINR(hra)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center px-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Deductions</span>
                                                <span className="text-xs font-bold text-red-500">-{formatINR(totalDed)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-[#00b9cd] uppercase tracking-widest leading-none block mb-1">Est. Net Pay</span>
                                                <span className="text-2xl font-black text-slate-900 dark:text-white font-paperlogy leading-none">{formatINR(net)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="flex justify-end gap-3 mt-10">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-10 py-4 bg-[#00b9cd] hover:bg-[#00b9cd]/80 text-white rounded-10 text-xs font-black uppercase tracking-widest shadow-lg active:translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    {isSubmitting && <RefreshCw className="animate-spin w-4 h-4" />}
                                    {isSubmitting ? "Finalizing..." : "Update Structure"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-10 max-w-3xl w-full p-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Salary Log</h2>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-10 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-all border border-slate-100">
                                ✕
                            </button>
                        </div>

                        {historyLoading ? (
                            <div className="py-20 text-center">
                                <RefreshCw className="w-10 h-10 animate-spin text-[#00b9cd] mx-auto" />
                            </div>
                        ) : salaryHistory.length === 0 ? (
                            <div className="py-20 text-center">
                                <History size={48} className="text-slate-100 mx-auto mb-4" />
                                <p className="font-bold text-slate-400 uppercase tracking-widest">No previous revisions</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-10 border-2 border-slate-900/5 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b-2 border-slate-900/5">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross (₹)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Basic (₹)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Deductions (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {salaryHistory.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{item.month}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">{formatINR(item.gross_salary)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-500">{formatINR(item.basic)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-red-500">-{formatINR(item.deductions)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="mt-10 flex justify-end">
                            <button onClick={() => setIsHistoryModalOpen(false)} className="px-8 py-4 bg-[#00b9cd]/80 text-white rounded-10 text-[10px] font-black uppercase tracking-widest shadow-md">
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalariesPage;