import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/dateUtils";
import { useGlobalUI } from "../../context/GlobalUIContext";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Eye, 
    X, 
    CheckCircle, 
    AlertCircle, 
    Activity, 
    Clock, 
    ShieldCheck, 
    Briefcase, 
    Filter,
    ChevronRight,
    Layout,
    CheckSquare,
    AlertTriangle,
    Zap
} from "lucide-react";

const TasksPage = () => {
    const { addToast, confirm } = useGlobalUI();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
        due_time: "",
        priority: "medium",
        department_id: "",
        designation_id: "",
        is_pool_task: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTaskId, setEditTaskId] = useState(null);
    const [adminFeedback, setAdminFeedback] = useState("");

    // ── Filter state ──────────────────────────────────────────────────────────
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDeadline, setFilterDeadline] = useState("");
    const [filterPriority, setFilterPriority] = useState("");

    const clearFilters = () => {
        setFilterEmployee("");
        setFilterStatus("");
        setFilterDeadline("");
        setFilterPriority("");
    };

    const hasActiveFilters = filterEmployee || filterStatus || filterDeadline || filterPriority;

    useEffect(() => {
        fetchTasks();
        fetchEmployees();
        fetchDepartments();
        fetchDesignations();
    }, []);

    // Reset assignment if it no longer matches the department/designation filters
    useEffect(() => {
        if (formData.assigned_to) {
            const isEmployeeStillValid = filteredEmployees.some(emp => Number(emp.id) === Number(formData.assigned_to));
            if (!isEmployeeStillValid) {
                setFormData(prev => ({ ...prev, assigned_to: "" }));
            }
        }
    }, [formData.department_id, formData.designation_id, employees]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await api.get("/tasks");
            setTasks(response.data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchDesignations = async () => {
        try {
            const response = await api.get("/designations");
            setDesignations(response.data);
        } catch (error) {
            console.error("Failed to fetch designations", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/tasks/${editTaskId}`, formData);
                addToast("Task updated successfully!", "success");
            } else {
                await api.post("/tasks", formData);
                addToast("Task created successfully!", "success");
            }
            setIsModalOpen(false);
            resetForm();
            fetchTasks();
        } catch (error) {
            console.error("Failed to save task", error);
            addToast(error.response?.data?.message || "Operation failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            assigned_to: "",
            due_date: "",
            due_time: "",
            priority: "medium",
            department_id: "",
            designation_id: "",
            is_pool_task: false
        });
        setIsEditing(false);
        setEditTaskId(null);
    };

    const handleEdit = (task) => {
        setIsEditing(true);
        setEditTaskId(task.id);
        setFormData({
            title: task.title || "",
            description: task.description || "",
            assigned_to: task.assigned_to || "",
            due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
            due_time: task.due_time || "",
            priority: task.priority || "medium",
            department_id: task.department_id || "",
            designation_id: task.designation_id || "",
            is_pool_task: !!task.is_pool_task
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (taskId) => {
        if (!await confirm("Delete Task", "Are you sure you want to delete this task?", "Delete")) return;

        try {
            await api.delete(`/tasks/${taskId}`);
            fetchTasks();
            addToast("Task deleted successfully", "success");
        } catch (error) {
            console.error("Failed to delete task", error);
            addToast("Failed to delete task", "error");
        }
    };

    const handleApprove = async (taskId) => {
        setIsSubmitting(true);
        try {
            await api.post(`/tasks/${taskId}/approve`, { admin_feedback: adminFeedback });
            setShowApprovalModal(false);
            setAdminFeedback("");
            fetchTasks();
            addToast("Task approved and marked as completed!", "success");
        } catch (error) {
            console.error("Failed to approve task", error);
            addToast("Approval failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (taskId) => {
        if (!adminFeedback.trim()) {
            addToast("Please provide feedback for the rejection.", "warning");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post(`/tasks/${taskId}/reject`, { admin_feedback: adminFeedback });
            setShowApprovalModal(false);
            setAdminFeedback("");
            fetchTasks();
            addToast("Task rejected and sent back for revision.", "success");
        } catch (error) {
            console.error("Failed to reject task", error);
            addToast("Rejection failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-800 border border-gray-200';
            case 'accepted': return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
            case 'claimed': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'in_progress': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
            case 'pending_review': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
            case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const pendingReviewTasks = tasks.filter(t => t.status === 'pending_review');

    // ── Apply filters to all-other-tasks ──────────────────────────────────────
    const allOtherTasks = tasks.filter(t => t.status !== 'pending_review').filter(t => {
        const name = t.assignee?.user?.name?.toLowerCase() || '';
        if (filterEmployee && !name.includes(filterEmployee.toLowerCase())) return false;
        if (filterStatus && t.status !== filterStatus) return false;
        if (filterPriority && t.priority !== filterPriority) return false;
        if (filterDeadline) {
            if (!t.due_date) return false;
            const taskDay = new Date(t.due_date).toISOString().split('T')[0];
            if (taskDay !== filterDeadline) return false;
        }
        return true;
    });

    const filteredCount = allOtherTasks.length;
    const totalCount = tasks.filter(t => t.status !== 'pending_review').length;

    const filteredEmployees = employees.filter(emp => {
        const matchesDept = !formData.department_id || Number(emp.department_id) === Number(formData.department_id);
        const matchesDesig = !formData.designation_id || Number(emp.designation_id) === Number(formData.designation_id);
        return matchesDept && matchesDesig;
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                <div>
                    <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none">
                        <span className="italic">Productivity</span> <span className="text-transparent bg-clip-text bg-[#00b9cd] ">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Design workflows and verify employee contributions.</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span className="uppercase tracking-widest">Create New Task</span>
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Pending Review', val: pendingReviewTasks.length, icon: <Layout size={22} strokeWidth={2.5} />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
                    { label: 'Active Tasks', val: tasks.filter(t => t.status === 'in_progress').length, icon: <Activity size={22} strokeWidth={2.5} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
                    { label: 'Urgent Tasks', val: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length, icon: <AlertTriangle size={22} strokeWidth={2.5} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-100 dark:border-red-500/20' },
                    { label: 'Completed', val: tasks.filter(t => t.status === 'completed').length, icon: <CheckSquare size={22} strokeWidth={2.5} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-100 dark:border-green-500/20' }
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

            <div className="flex-1 space-y-8">
                {/* ── Filter Bar ── */}
                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] mb-10 flex flex-col lg:flex-row gap-5">
                    <div className="flex flex-wrap gap-4 w-full">
                        {/* Employee name search */}
                        <div className="relative flex-1 group min-w-[250px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search employee…"
                                value={filterEmployee}
                                onChange={e => setFilterEmployee(e.target.value)}
                                className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                            />
                        </div>

                        {/* Status */}
                        <div className="relative min-w-[180px]">
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer w-full transition-all"
                            >
                                <option value="" className="dark:bg-slate-900">All Statuses</option>
                                <option value="pending" className="dark:bg-slate-900">Pending</option>
                                <option value="accepted" className="dark:bg-slate-900">Accepted</option>
                                <option value="claimed" className="dark:bg-slate-900">Claimed</option>
                                <option value="in_progress" className="dark:bg-slate-900">In Progress</option>
                                <option value="rejected" className="dark:bg-slate-900">Rejected</option>
                                <option value="completed" className="dark:bg-slate-900">Completed</option>
                            </select>
                            <Activity className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                        </div>

                        {/* Priority */}
                        <div className="relative min-w-[180px]">
                            <select
                                value={filterPriority}
                                onChange={e => setFilterPriority(e.target.value)}
                                className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer w-full transition-all"
                            >
                                <option value="" className="dark:bg-slate-900">All Priorities</option>
                                <option value="low" className="dark:bg-slate-900">Low (Routine)</option>
                                <option value="medium" className="dark:bg-slate-900">Medium (Standard)</option>
                                <option value="high" className="dark:bg-slate-900">High (Important)</option>
                                <option value="urgent" className="dark:bg-slate-900">Urgent (Immediate)</option>
                            </select>
                            <Zap className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                        </div>

                        {/* Deadline Date */}
                        <div className="relative min-w-[180px]">
                            <input
                                type="date"
                                value={filterDeadline}
                                onChange={e => setFilterDeadline(e.target.value)}
                                className="pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white w-full transition-all"
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                        </div>

                        {/* Clear button */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-5 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-900/30 rounded-xl transition-all flex items-center gap-2"
                            >
                                <X size={16} strokeWidth={2.5} />
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Result count */}
                    <div className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="h-1 w-1 bg-slate-400 rounded-full"></span>
                        Showing <span className="text-slate-900 dark:text-white">{filteredCount}</span> of <span className="text-slate-900 dark:text-white">{totalCount}</span> tasks
                    </div>
                </div>
                {/* Pending Verification Table */}
                {pendingReviewTasks.length > 0 && (
                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 rounded-xl">
                                <ShieldCheck size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Awaiting Verification</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Review and approve submitted task proofs</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border-2 border-slate-900/10 dark:border-white/10">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-white/5 border-b-2 border-slate-900/10 dark:border-white/10">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Task Details</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Department</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
                                    {pendingReviewTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-300 group">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-900 dark:text-white leading-tight">{task.title}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">"{task.description}"</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-200 dark:border-teal-500/30">
                                                        {task.assignee?.user?.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                                        {task.assignee?.user?.name || 'Unassigned'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 text-[10px] font-bold rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm">
                                                    {task.department?.name || 'Central'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => { setSelectedTask(task); setShowApprovalModal(true); }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border-2 border-brand-200 dark:border-brand-500/20 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 shadow-sm transition-all focus:ring-2 focus:ring-brand-500/10 active:scale-95"
                                                >
                                                    <Eye size={14} strokeWidth={2.5} />
                                                    Review Proof
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All Tasks Table */}
                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 rounded-xl">
                                <Briefcase size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Active Workflows</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Complete overview of all current productivity tasks</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto rounded-2xl border-2 border-slate-900/10 dark:border-white/10">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5 border-b-2 border-slate-900/10 dark:border-white/10">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Task Info</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Urgency</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned To</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deadline</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
                                {allOtherTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-300 group">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900 dark:text-white leading-tight">{task.title}</div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-tighter">
                                                    {task.department?.name || 'General'}
                                                </span>
                                                {task.designation && (
                                                    <>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {task.designation.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {task.priority && (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl border shadow-sm
                                                    ${task.priority === 'urgent' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                                                        task.priority === 'high' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20' :
                                                            task.priority === 'medium' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' :
                                                                'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'urgent' ? 'bg-red-500 animate-pulse outline outline-offset-2 outline-red-500/20' : task.priority === 'high' ? 'bg-orange-500' : 'bg-slate-400'}`}></span>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            {task.is_pool_task ?
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 shadow-sm">
                                                    <Layout size={12} strokeWidth={2.5} />
                                                    POOL
                                                </span> :
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 shadow-sm">
                                                    <CheckCircle size={12} strokeWidth={2.5} />
                                                    DIRECT
                                                </span>
                                            }
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white leading-none">
                                                    {task.assignee?.user?.name || (task.is_pool_task ? 'Pending Claim' : 'Unassigned')}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                    {task.is_pool_task && task.assignee ? 'Claimed' : task.assignee ? 'Assigned' : 'Open'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm ${getStatusStyle(task.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${task.status === 'in_progress' ? 'animate-pulse' : ''}`}></span>
                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                {task.status === 'pending' || task.status === 'claimed' ? (
                                                    <span className="text-[9px] text-orange-500 font-black uppercase italic animate-pulse">Awaiting Accept</span>
                                                ) : task.status === 'rejected' ? (
                                                    <span className="text-[9px] text-red-600 font-black uppercase italic flex items-center gap-1">
                                                        <AlertTriangle size={8} /> Revision Required
                                                    </span>
                                                ) : (task.status !== 'completed' && task.status !== 'cancelled' && task.status !== 'pending_review' ? (
                                                    <span className="text-[9px] text-emerald-600 font-black uppercase italic flex items-center gap-1">
                                                        <CheckCircle size={8} /> Accepted
                                                    </span>
                                                ) : null)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {task.due_date ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">{formatDate(task.due_date)}</span>
                                                    {task.due_time && (
                                                        <span className="text-[10px] text-brand-600 dark:text-brand-400 font-black flex items-center gap-1 mt-1 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-lg w-fit">
                                                            <Clock size={10} strokeWidth={3} />
                                                            {task.due_time}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2.5">
                                                <button
                                                    onClick={() => handleEdit(task)}
                                                    className="p-2.5 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all shadow-sm active:scale-95"
                                                    title="Edit Task"
                                                >
                                                    <Edit2 size={15} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="p-2.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 hover:border-red-300 transition-all shadow-sm active:scale-95"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={15} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {allOtherTasks.length === 0 && !loading && (
                        <div className="p-16 text-center flex flex-col items-center gap-4 bg-slate-50 dark:bg-white/5 rounded-2xl mt-4 border-2 border-dashed border-slate-200 dark:border-white/10">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border dark:border-white/10">
                                <Activity className="text-slate-400" size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Clear!</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">No tasks match your current workflow filters.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.35)] w-full max-w-lg overflow-hidden transform transition-all duration-300 rounded-3xl">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {isEditing ? "Update Task Details" : "Create New Task"}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure workflow details and assignment.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Task Title</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="e.g. Design System Implementation" 
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Task Description</label>
                                    <textarea required rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="Describe the workflow and requirements..."
                                    ></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Department</label>
                                    <div className="relative">
                                        <select value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} 
                                            className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                        >
                                            <option value="" className="dark:bg-slate-900">All Departments</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id} className="dark:bg-slate-900">{dept.name}</option>
                                            ))}
                                        </select>
                                        <Layout className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Designation</label>
                                    <div className="relative">
                                        <select value={formData.designation_id} onChange={e => setFormData({ ...formData, designation_id: e.target.value })} 
                                            className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                        >
                                            <option value="" className="dark:bg-slate-900">All Levels</option>
                                            {designations.map(desig => (
                                                <option key={desig.id} value={desig.id} className="dark:bg-slate-900">{desig.name}</option>
                                            ))}
                                        </select>
                                        <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
                                    <div className="relative">
                                        <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} 
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all"
                                        />
                                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Deadline Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={formData.due_time}
                                            onChange={e => setFormData({ ...formData, due_time: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all"
                                        />
                                        <Zap className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Assignment Type</label>
                                    <div className="relative">
                                        <select value={formData.is_pool_task} onChange={e => setFormData({ ...formData, is_pool_task: e.target.value === 'true', assigned_to: "" })} 
                                            className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                        >
                                            <option value="false" className="dark:bg-slate-900">Direct Assignment</option>
                                            <option value="true" className="dark:bg-slate-900">Post to Pool</option>
                                        </select>
                                        <Users className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Work Urgency</label>
                                    <div className="relative">
                                        <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} 
                                            className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                        >
                                            <option value="low" className="dark:bg-slate-900 text-slate-400">Low (Routine)</option>
                                            <option value="medium" className="dark:bg-slate-900 text-blue-500">Medium (Standard)</option>
                                            <option value="high" className="dark:bg-slate-900 text-orange-500">High (Important)</option>
                                            <option value="urgent" className="dark:bg-slate-900 text-red-500">Urgent (Immediate)</option>
                                        </select>
                                        <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                    </div>
                                </div>
                                {!formData.is_pool_task && (
                                    <div className="col-span-2 space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Assign To Employee</label>
                                        <div className="relative">
                                            <select required value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} 
                                                className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                            >
                                                <option value="" className="dark:bg-slate-900">Select Member</option>
                                                {filteredEmployees.map(emp => (
                                                    <option key={emp.id} value={emp.id} className="dark:bg-slate-900">{emp.user?.name} ({emp.designation?.name || 'Staff'})</option>
                                                ))}
                                            </select>
                                            <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="pt-6 flex flex-col sm:flex-row gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} 
                                    className="flex-1 px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button disabled={isSubmitting} type="submit" 
                                    className={`flex-[2] px-5 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-lg shadow-brand-500/20 transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Task" : "Create Task")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedTask && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.35)] w-full max-w-xl overflow-hidden transform transition-all duration-300 rounded-3xl">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                    Review Proof
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verify evidence and provide feedback.</p>
                            </div>
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border-2 border-slate-900/5 dark:border-white/5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{selectedTask.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">"{selectedTask.description}"</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Layout size={12} /> Evidence File
                                    </h4>
                                    <div className="p-4 bg-white dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-brand-400 transition-all cursor-pointer">
                                        {selectedTask.proof_attachment ? (
                                            <a href={selectedTask.proof_attachment} download={`Proof_${selectedTask.id}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-tight">
                                                <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                                    <Layout size={24} strokeWidth={2.5} />
                                                </div>
                                                Download Evidence
                                            </a>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                                <X size={24} />
                                                <span className="text-[10px] font-bold uppercase">No file</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Activity size={12} /> Employee Notes
                                    </h4>
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-slate-900/5 dark:border-white/5 min-h-[100px] flex items-center justify-center text-center">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold italic leading-relaxed">
                                            {selectedTask.submission_notes ? `"${selectedTask.submission_notes}"` : 'No additional notes provided by worker.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Edit2 size={12} /> Reviewer Feedback
                                </h4>
                                <textarea
                                    value={adminFeedback}
                                    onChange={(e) => setAdminFeedback(e.target.value)}
                                    placeholder="Provide detailed feedback (required for rejection)..."
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/5 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all min-h-[120px]"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                <button
                                    onClick={() => handleReject(selectedTask.id)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 rounded-2xl shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : "Reject Details"}
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedTask.id)}
                                    disabled={isSubmitting}
                                    className="flex-[2] bg-brand-500 hover:bg-brand-600 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-brand-500/20 transition-all uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? "Processing..." : (
                                        <>
                                            <CheckCircle size={16} strokeWidth={2.5} />
                                            Approve & Finalize
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksPage;
