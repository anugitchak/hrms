import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/dateUtils";

const TasksPage = () => {
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
                alert("Task updated successfully!");
            } else {
                await api.post("/tasks", formData);
                alert("Task created successfully!");
            }
            setIsModalOpen(false);
            resetForm();
            fetchTasks();
        } catch (error) {
            console.error("Failed to save task", error);
            alert(error.response?.data?.message || "Operation failed");
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
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        try {
            await api.delete(`/tasks/${taskId}`);
            fetchTasks();
            alert("Task deleted successfully");
        } catch (error) {
            console.error("Failed to delete task", error);
            alert("Failed to delete task");
        }
    };

    const handleApprove = async (taskId) => {
        setIsSubmitting(true);
        try {
            await api.post(`/tasks/${taskId}/approve`, { admin_feedback: adminFeedback });
            setShowApprovalModal(false);
            setAdminFeedback("");
            fetchTasks();
            alert("Task approved and marked as completed!");
        } catch (error) {
            console.error("Failed to approve task", error);
            alert("Approval failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (taskId) => {
        if (!adminFeedback.trim()) {
            alert("Please provide feedback for the rejection.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post(`/tasks/${taskId}/reject`, { admin_feedback: adminFeedback });
            setShowApprovalModal(false);
            setAdminFeedback("");
            fetchTasks();
            alert("Task rejected and sent back for revision.");
        } catch (error) {
            console.error("Failed to reject task", error);
            alert("Rejection failed");
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
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            {/* Standard Header */}
            <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Productivity Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Design workflows and verify employee contributions.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm font-semibold text-sm transition-colors"
                >
                    Create New Task
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-8">

                {/* ── Filter Bar ── */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Employee name search */}
                        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee Name</label>
                            <input
                                type="text"
                                placeholder="Search employee…"
                                value={filterEmployee}
                                onChange={e => setFilterEmployee(e.target.value)}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex flex-col gap-1 min-w-[150px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="claimed">Claimed</option>
                                <option value="in_progress">In Progress</option>
                                <option value="on_hold">On Hold</option>
                                <option value="rejected">Rejected</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Necessity / Priority */}
                        <div className="flex flex-col gap-1 min-w-[150px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Necessity</label>
                            <select
                                value={filterPriority}
                                onChange={e => setFilterPriority(e.target.value)}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">All Levels</option>
                                <option value="low">Low (Routine)</option>
                                <option value="medium">Medium (Standard)</option>
                                <option value="high">High (Important)</option>
                                <option value="urgent">Urgent (Immediate)</option>
                            </select>
                        </div>

                        {/* Deadline Date */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</label>
                            <input
                                type="date"
                                value={filterDeadline}
                                onChange={e => setFilterDeadline(e.target.value)}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        {/* Clear button */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors self-end"
                            >
                                ✕ Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Result count */}
                    <div className="mt-3 text-xs text-gray-400 font-medium">
                        Showing <span className="font-bold text-gray-700 dark:text-gray-200">{filteredCount}</span> of <span className="font-bold">{totalCount}</span> tasks
                        {hasActiveFilters && <span className="ml-1 text-blue-500">(filtered)</span>}
                    </div>
                </div>
                {/* Pending Verification Table */}
                {pendingReviewTasks.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Awaiting Verification</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                        <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Task</th>
                                        <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Employee</th>
                                        <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Department</th>
                                        <th className="px-6 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {pendingReviewTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{task.title}</div>
                                                <div className="text-xs text-gray-500 line-clamp-1">{task.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                                                {task.assignee?.user?.name || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                                    {task.department?.name || 'All'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => { setSelectedTask(task); setShowApprovalModal(true); }}
                                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-bold transition-colors"
                                                >
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
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">All Tasks</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                    <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Task Details</th>
                                    <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">Necessity</th>
                                    <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Type</th>
                                    <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Assignee / Worker</th>
                                    <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-300">Deadline</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {allOtherTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{task.title}</div>
                                            <div className="text-xs text-gray-500 font-mono uppercase tracking-tighter">
                                                {task.department?.name || 'All Departments'}
                                                {task.designation && ` • ${task.designation.name}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {task.priority && (
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm
                                                    ${task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200 shadow-red-100' :
                                                        task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                            task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                    {task.priority}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.is_pool_task ?
                                                <span className="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">Pool</span> :
                                                <span className="text-xs font-medium text-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded">Direct</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {task.assignee?.user?.name || (task.is_pool_task ? 'Waiting for claim' : 'Unassigned')}
                                                </span>
                                                {task.is_pool_task && task.assignee && (
                                                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Claimed</span>
                                                )}
                                                {!task.is_pool_task && task.assignee && (
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-center w-fit ${getStatusStyle(task.status)}`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                                {task.status === 'pending' || task.status === 'claimed' ? (
                                                    <span className="text-[9px] text-red-500 font-bold uppercase italic">Awaiting Acceptance</span>
                                                ) : task.status === 'rejected' ? (
                                                    <span className="text-[9px] text-red-600 font-bold uppercase italic flex items-center gap-0.5">
                                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> Revision Required
                                                    </span>
                                                ) : (task.status !== 'completed' && task.status !== 'cancelled' ? (
                                                    <span className="text-[9px] text-emerald-600 font-bold uppercase italic flex items-center gap-0.5">
                                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Accepted
                                                    </span>
                                                ) : null)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.due_date ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{formatDate(task.due_date)}</span>
                                                    {task.due_time && (
                                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 mt-0.5">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {task.due_time}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(task)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                    title="Edit Task"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Delete Task"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {allOtherTasks.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-400 italic">No tasks created yet.</div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{isEditing ? "Edit Task" : "Create New Task"}</h2>
                            <button onClick={resetForm && (() => setIsModalOpen(false))} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Title</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Description</label>
                                    <textarea required rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Department</label>
                                    <select value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm">
                                        <option value="">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Designation</label>
                                    <select value={formData.designation_id} onChange={e => setFormData({ ...formData, designation_id: e.target.value })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm">
                                        <option value="">All Designations</option>
                                        {designations.map(desig => (
                                            <option key={desig.id} value={desig.id}>{desig.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Due Date</label>
                                    <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Deadline Time</label>
                                    <input
                                        type="time"
                                        value={formData.due_time}
                                        onChange={e => setFormData({ ...formData, due_time: e.target.value })}
                                        className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Assignment Type</label>
                                    <select value={formData.is_pool_task} onChange={e => setFormData({ ...formData, is_pool_task: e.target.value === 'true', assigned_to: "" })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm">
                                        <option value="false">Direct Assignment</option>
                                        <option value="true">Post to Pool</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Work Necessity / Priority</label>
                                    <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm">
                                        <option value="low" className="text-gray-500">Low (Routine)</option>
                                        <option value="medium" className="text-blue-600">Medium (Standard)</option>
                                        <option value="high" className="text-orange-600">High (Important)</option>
                                        <option value="urgent" className="text-red-600">Urgent (Immediate Action)</option>
                                    </select>
                                </div>
                                {!formData.is_pool_task && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Assign To</label>
                                        <select required value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 text-sm">
                                            <option value="">Select Employee</option>
                                            {filteredEmployees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.designation?.name || 'N/A'})</option>
                                            ))}
                                            {filteredEmployees.length === 0 && (formData.department_id || formData.designation_id) && (
                                                <option disabled>No employees match these filters</option>
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-semibold text-gray-500 border rounded hover:bg-gray-50">Cancel</button>
                                <button disabled={isSubmitting} type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 shadow-sm disabled:opacity-50">
                                    {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Task" : "Create Task")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedTask && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl p-6 my-8">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Review Task Proof</h2>
                            <button onClick={() => setShowApprovalModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{selectedTask.title}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{selectedTask.description}</p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Submitted Proof</h4>
                                <div className="p-4 bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                    {selectedTask.proof_attachment ? (
                                        <a href={selectedTask.proof_attachment} download={`Proof_${selectedTask.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline font-semibold text-sm">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            View Evidence File
                                        </a>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">No attachment provided</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Employee Notes</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700 font-medium italic">
                                    "{selectedTask.submission_notes || 'No notes provided'}"
                                </p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reviewer Feedback</h4>
                                <textarea
                                    value={adminFeedback}
                                    onChange={(e) => setAdminFeedback(e.target.value)}
                                    placeholder="Provide feedback to the employee (required for rejection)..."
                                    className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-4 pt-6 border-t dark:border-gray-700">
                                <button
                                    onClick={() => handleReject(selectedTask.id)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded shadow-sm transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : "Reject & Revise"}
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedTask.id)}
                                    disabled={isSubmitting}
                                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded shadow transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {isSubmitting ? "Processing..." : "Approve & Complete"}
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
