import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios";
import { Search, Filter, Calendar, Users, CheckCircle, XCircle, Clock, ChevronRight, RefreshCw, Layers } from "lucide-react";
import { useGlobalUI } from "../../../context/GlobalUIContext";
import { useAuth } from "../../../context/AuthContext";
import { formatDate } from "../../../utils/dateUtils";

// --- Components ---

const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case "Approved": return "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20 shadow-md";
            case "Partially Approved": return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20 shadow-md";
            case "Rejected": return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20 shadow-md";
            case "Pending": return "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-500/20 shadow-md";
            case "Withdrawn": return "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 shadow-md";
            default: return "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 shadow-md";
        }
    };
    return (
        <span className={`px-2 py-1 rounded-10 text-xs font-semibold ${getStatusStyle(status)}`}>
            {status}
        </span>
    );
};

const ApprovalModal = ({ leave, isOpen, onClose, onAction }) => {
    const [action, setAction] = useState("approve");
    const [dates, setDates] = useState({ start: "", end: "" });
    const [days, setDays] = useState(0);

    useEffect(() => {
        if (leave) {
            setDates({ start: leave.start_date, end: leave.end_date });
            calculateDays(leave.start_date, leave.end_date);
        }
    }, [leave]);

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const diff = new Date(end) - new Date(start);
        const d = diff / (1000 * 60 * 60 * 24) + 1;
        setDays(Math.max(0, d));
    };

    const handleDateChange = (field, value) => {
        const newDates = { ...dates, [field]: value };
        setDates(newDates);
        calculateDays(newDates.start, newDates.end);
    };

    const handleSubmit = () => {
        onAction(action, dates);
    };

    if (!isOpen || !leave) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-10 max-w-md w-full p-8 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-[#00b9cd]"></div>

                <h3 className="text-2xl font-black mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Review Leave Request</h3>

                <div className="space-y-6">
                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-slate-900/5 dark:border-white/5 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{leave.employee?.user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{leave.leave_type?.name}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-900/5 dark:border-white/5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Reason</span>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">"{leave.reason}"</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Choose Action</label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-slate-900 dark:text-white cursor-pointer transition-all appearance-none"
                        >
                            <option value="approve">Approve Full Leave</option>
                            <option value="partial">Approve Partial Leave</option>
                            <option value="reject">Reject Leave</option>
                        </select>
                    </div>

                    {action === "partial" && (
                        <div className="grid grid-cols-2 gap-4 p-5 bg-blue-50/50 dark:bg-brand-500/5 border-2 border-brand-500/20 rounded-10">
                            <div>
                                <label className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-2 px-1">Start Date</label>
                                <input
                                    type="date"
                                    value={dates.start}
                                    min={leave.start_date}
                                    max={leave.end_date}
                                    onChange={(e) => handleDateChange("start", e.target.value)}
                                    className="w-full text-xs p-3 rounded-10 border-2 border-slate-900/10 dark:border-white/10 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-2 px-1">End Date</label>
                                <input
                                    type="date"
                                    value={dates.end}
                                    min={dates.start}
                                    max={leave.end_date}
                                    onChange={(e) => handleDateChange("end", e.target.value)}
                                    className="w-full text-xs p-3 rounded-10 border-2 border-slate-900/10 dark:border-white/10 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div className="col-span-2 flex justify-end items-center gap-2 mt-2 pt-2 border-t border-brand-500/10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modified Duration:</span>
                                <span className="text-sm font-black text-brand-600">{days} Days</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`px-8 py-3 rounded-10 text-white text-xs font-black uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:translate-y-0.5 active:shadow-none transition-all ${action === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'
                                }`}
                        >
                            Confirm Action
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmployeeSummaryCard = ({ group, isSelected, onClick }) => {
    const { employee, leaves } = group;
    const pendingCount = leaves.filter(l => l.status === 'Pending').length;

    return (
        <div
            onClick={onClick}
            className={`p-5 rounded-10 border-2 cursor-pointer relative overflow-hidden group mb-4 ${isSelected
                ? 'bg-white dark:bg-brand-500/10 border-brand-500 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out -translate-y-1'
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-900/5 dark:border-white/5 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:border-slate-300 dark:hover:border-white/10 '
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-10 flex items-center justify-center font-black text-xs border shadow-md transition-all duration-500 ${isSelected
                    ? 'bg-brand-500 text-white border-white dark:border-slate-800 scale-110 shadow-md'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'
                    }`}>
                    {employee?.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden flex-1">
                    <h4 className={`font-black text-sm truncate uppercase tracking-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900'}`}>
                        {employee?.user?.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1">
                        {employee?.employee_code} • {employee?.department?.name}
                    </p>
                </div>
                {isSelected && (
                    <div className="bg-brand-500 rounded-10 p-1 text-white shadow-md">
                        <ChevronRight size={14} strokeWidth={3} />
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-10 border font-black text-[10px] uppercase tracking-widest transition-colors ${isSelected ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-900/5'
                    }`}>
                    <CheckCircle size={12} className={isSelected ? 'text-green-500' : 'text-slate-300'} />
                    <span>{employee?.total_approved_days || 0} Days</span>
                </div>

                {pendingCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-10 text-[10px] font-black uppercase tracking-widest shadow-md animate-pulse">
                        <Clock size={12} strokeWidth={3} />
                        <span>{pendingCount} Pending</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const EmployeeDetailPanel = ({ employeeId, onReview, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const canApprove = user?.role_id === 1 || user?.can_manage_leaves === true;

    useEffect(() => {
        if (employeeId) {
            fetchHistory();
        }
    }, [employeeId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get("/leaves", {
                params: {
                    employee_id: employeeId,
                    per_page: 50
                }
            });
            setHistory(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!employeeId) {
        return (
            <div className="h-[calc(100vh-320px)] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-12 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm border-2 border-dashed border-slate-200 dark:border-white/5 rounded-10 transition-all duration-500">
                <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-10 mb-6 shadow-inner border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                    <Users className="w-20 h-20 opacity-30" strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">Selection Required</h4>
                <p className="text-sm font-bold mt-2">Select an employee to view leave history</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/5 dark:border-white/5 h-[calc(100vh-320px)] overflow-hidden flex flex-col group">
            <div className="p-6 border-b-2 border-slate-900/5 dark:border-white/5 bg-slate-50/50 dark:bg-brand-500/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-500 p-2 rounded-10 text-white shadow-md">
                        <Clock size={18} strokeWidth={3} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight leading-none">History</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Leave applications trail</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchHistory} className="p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-10 text-slate-400 hover:text-brand-500 transition-all shadow-md border border-transparent hover:border-slate-100 dark:hover:border-white/5" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={onClose} className="p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-10 text-slate-400 hover:text-red-500 transition-all shadow-md border border-transparent hover:border-slate-100 dark:hover:border-white/5" title="Close Panel">
                        <XCircle size={18} />
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-slate-50 dark:bg-white/5 rounded-10 animate-pulse"></div>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20">
                        <Calendar size={48} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No history found</p>
                    </div>
                ) : (
                    history.map(leave => (
                        <div key={leave.id} className="relative bg-white dark:bg-white/5 border-2 border-slate-900/5 dark:border-white/5 rounded-10 p-6 hover:border-brand-500/10 ">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{leave.leave_type?.name}</h4>
                                        <div className="h-1 w-1 rounded-10 bg-slate-200 dark:bg-slate-700"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(leave.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Calendar size={12} />
                                        <span>{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</span>
                                        <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-10 text-[10px] uppercase font-black">
                                            {Math.round((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1} Days
                                        </span>
                                    </div>
                                </div>
                                <StatusBadge status={leave.status} />
                            </div>

                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-10 mb-4 italic leading-relaxed">
                                "{leave.reason}"
                            </p>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-900/5 dark:border-white/5">
                                {leave.approver ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-10 bg-brand-500/20 text-brand-600 flex items-center justify-center text-[10px] font-black">
                                            {leave.approver.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Approver</p>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{leave.approver.name}</p>
                                        </div>
                                    </div>
                                ) : <div />}

                                {leave.status === 'Pending' && canApprove && (
                                    <button
                                        onClick={() => onReview(leave)}
                                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest rounded-10 shadow-md active:translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        Review Request
                                        <ChevronRight size={14} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Main Page ---

const LeavesPage = () => {
    // State
    const [leaves, setLeaves] = useState([]);
    const { addToast } = useGlobalUI();
    const [groupedLeaves, setGroupedLeaves] = useState({});
    const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [departments, setDepartments] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [pageInfo, setPageInfo] = useState({ current_page: 1, last_page: 1 });
    const [refreshKey, setRefreshKey] = useState(0); // To force panel refresh

    // Modal State
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [status, setStatus] = useState("");
    const [month, setMonth] = useState("");

    // Initial Load
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        loadLeaves();
        loadSummary();
    }, [pageInfo.current_page]);

    // Reset page when filters change
    useEffect(() => {
        if (pageInfo.current_page !== 1) {
            setPageInfo(prev => ({ ...prev, current_page: 1 }));
        } else {
            loadLeaves();
            loadSummary();
        }
    }, [departmentId, status, month]);

    // Polling for automated updates (e.g. every 15 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            // Only poll if on first page and no active filters (optional constraint)
            if (pageInfo.current_page === 1 && !search && !departmentId && !status && !month) {
                loadLeaves(true); // silent fetch
                loadSummary();
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [pageInfo.current_page, search, departmentId, status, month]);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pageInfo.current_page === 1) loadLeaves();
            else setPageInfo(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadLeaves = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const params = {
                page: pageInfo.current_page,
                search,
                department_id: departmentId,
                status,
                month
            };
            const response = await api.get("/leaves", { params });
            const { data, current_page, last_page } = response.data;

            setLeaves(data);
            groupData(data);
            setPageInfo({ current_page, last_page });

            // Auto-select first employee if none selected and data exists
            if (data.length > 0 && !selectedEmployeeId) {
                // setSelectedEmployeeId(data[0].employee_id);
            }
        } catch (err) {
            console.error(err);
            if (!silent) setError("Failed to load leave applications.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const groupData = (data) => {
        const groups = data.reduce((acc, leave) => {
            const empId = leave.employee_id;
            if (!acc[empId]) {
                acc[empId] = {
                    employee: leave.employee,
                    leaves: []
                };
            }
            acc[empId].leaves.push(leave);
            return acc;
        }, {});
        setGroupedLeaves(groups);
    };

    const loadSummary = async () => {
        try {
            const response = await api.get("/leaves/summary", { params: { month } });
            setSummary(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const forcePanelRefresh = () => setRefreshKey(k => k + 1);

    const handleAction = async (action, dates) => {
        if (!selectedLeave) return;
        const id = selectedLeave.id;

        try {
            if (action === "approve") {
                await api.put(`/leaves/${id}`, { status: 'Approved' });
            } else if (action === "reject") {
                await api.put(`/leaves/${id}`, { status: 'Rejected' });
            } else if (action === "partial") {
                await api.put(`/leaves/${id}/partial-approve`, {
                    approved_start_date: dates.start,
                    approved_end_date: dates.end
                });
            }
            setIsModalOpen(false);
            loadLeaves();
            loadSummary();
            forcePanelRefresh();
        } catch (err) {
            addToast("Failed to update status: " + (err.response?.data?.message || err.message), "error");
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Leave <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage employee leave applications</p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { loadLeaves(); loadSummary(); }}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:-translate-y-1 group"
                    >
                        <RefreshCw size={16} className={`text-orange-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                        <span className="uppercase tracking-widest">Refresh</span>
                    </button>
                    <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out">
                        <Layers size={20} className="text-brand-500" />
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Leaves', val: summary.total, icon: <Calendar size={22} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Pending Request', val: summary.pending, icon: <Clock size={22} />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                    { label: 'Approved', val: summary.approved, icon: <CheckCircle size={22} />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                    { label: 'Rejected', val: summary.rejected, icon: <XCircle size={22} />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' }
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex items-center gap-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out group">
                        <div className={`${s.bg} ${s.color} ${s.border} border-2 p-3.5 rounded-10 shadow-md group-hover:scale-110 transition-transform`}>{s.icon}</div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{s.val}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 flex flex-wrap gap-5 border-2 border-slate-50 dark:border-white/5">
                <div className="relative flex-1 min-w-[240px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all font-paperlogy"
                    />
                </div>
                <div className="flex flex-wrap gap-4 flex-1 justify-end">
                    <div className="relative min-w-[160px]">
                        <select
                            value={departmentId}
                            onChange={e => setDepartmentId(e.target.value)}
                            className="appearance-none pl-5 pr-12 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                    <div className="relative min-w-[160px]">
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="appearance-none pl-5 pr-12 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                        >
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                    <div className="relative min-w-[160px]">
                        <input
                            type="month"
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                            className="pl-5 pr-5 py-3 w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: List */}
                <div className="lg:col-span-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-900">Loading...</div>
                    ) : error ? (
                        <div className="text-red-500 text-center">{error}</div>
                    ) : Object.keys(groupedLeaves).length === 0 ? (
                        <div className="text-center py-8 text-gray-900">No records found.</div>
                    ) : (
                        // Force sort by most recent leave in group
                        Object.values(groupedLeaves)
                            .filter(group => group.employee && group.employee.id) // Filter out null employees
                            .sort((a, b) => {
                                const dateA = new Date(a.leaves[0]?.created_at || 0);
                                const dateB = new Date(b.leaves[0]?.created_at || 0);
                                return dateB - dateA;
                            })
                            .map(group => (
                                <EmployeeSummaryCard
                                    key={group.employee.id}
                                    group={group}
                                    isSelected={selectedEmployeeId === group.employee.id} //
                                    onClick={() => setSelectedEmployeeId(group.employee.id)}
                                />
                            ))
                    )}

                    {/* Pagination for List */}
                    {pageInfo.last_page > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPageInfo(p => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))}
                                disabled={pageInfo.current_page === 1}
                                className="px-3 py-1 text-xs border rounded-10 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
                                {pageInfo.current_page} / {pageInfo.last_page}
                            </span>
                            <button
                                onClick={() => setPageInfo(p => ({ ...p, current_page: Math.min(pageInfo.last_page, p.current_page + 1) }))}
                                disabled={pageInfo.current_page === pageInfo.last_page}
                                className="px-3 py-1 text-xs border rounded-10 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Detail */}
                <div className="lg:col-span-8 sticky top-6">
                    <EmployeeDetailPanel
                        key={`${selectedEmployeeId}-${refreshKey}`}
                        employeeId={selectedEmployeeId}
                        onReview={(leave) => {
                            setSelectedLeave(leave);
                            setIsModalOpen(true);
                        }}
                        onClose={() => setSelectedEmployeeId(null)}
                    />
                </div>
            </div>

            <ApprovalModal
                leave={selectedLeave}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAction={handleAction}
            />
        </div>
    );
};

export default LeavesPage;
