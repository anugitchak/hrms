import React, { useState, useEffect } from "react";
import api from "../../api/axios";

import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/dateUtils";
import {
    CheckCircle,
    PlayCircle,
    Clock,
    AlertCircle,
    Layout,
    Inbox,
    FileText,
    ArrowRight,
    Search,
    Filter,
    PauseCircle,
} from "lucide-react";

const MyTasksPage = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("my-tasks");
    const [isActionLoading, setIsActionLoading] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissionData, setSubmissionData] = useState({ notes: "", file: null });

    // ── Hold modal state ──────────────────────────────────────────────────────
    const [showHoldModal, setShowHoldModal] = useState(false);
    const [holdTask, setHoldTask] = useState(null);
    const [holdReason, setHoldReason] = useState("");

    useEffect(() => {
        fetchTasks();
    }, []);

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

    const handleAccept = async (taskId) => {
        setIsActionLoading(taskId);
        try {
            await api.post(`/tasks/${taskId}/accept`);
            fetchTasks();
        } catch (error) {
            console.error("Failed to accept task", error);
            alert(error.response?.data?.message || "Failed to accept task");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleClaim = async (taskId) => {
        setIsActionLoading(taskId);
        try {
            await api.post(`/tasks/${taskId}/claim`);
            fetchTasks();
            alert("Task claimed successfully!");
        } catch (error) {
            console.error("Failed to claim task", error);
            alert(error.response?.data?.message || "Failed to claim task.");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleStart = async (taskId) => {
        setIsActionLoading(taskId);
        try {
            await api.post(`/tasks/${taskId}/start`);
            fetchTasks();
        } catch (error) {
            console.error("Failed to start task", error);
            alert(error.response?.data?.message || "Failed to start task");
        } finally {
            setIsActionLoading(null);
        }
    };

    // ── Hold handlers ─────────────────────────────────────────────────────────
    const openHoldModal = (task) => {
        setHoldTask(task);
        setHoldReason("");
        setShowHoldModal(true);
    };

    const handleHoldSubmit = async (e) => {
        e.preventDefault();
        if (!holdTask) return;
        setIsActionLoading(holdTask.id);
        try {
            await api.post(`/tasks/${holdTask.id}/hold`, { hold_reason: holdReason });
            setShowHoldModal(false);
            setHoldReason("");
            setHoldTask(null);
            fetchTasks();
        } catch (error) {
            console.error("Failed to hold task", error);
            alert(error.response?.data?.message || "Failed to put task on hold.");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleResume = async (taskId) => {
        setIsActionLoading(taskId);
        try {
            await api.post(`/tasks/${taskId}/resume`);
            fetchTasks();
        } catch (error) {
            console.error("Failed to resume task", error);
            alert(error.response?.data?.message || "Failed to resume task.");
        } finally {
            setIsActionLoading(null);
        }
    };

    // ── Submit handlers ───────────────────────────────────────────────────────
    const openSubmitModal = (task) => {
        setSelectedTask(task);
        setShowSubmitModal(true);
    };

    const handleSubmitForReview = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;

        setIsActionLoading(selectedTask.id);
        const formData = new FormData();
        formData.append("submission_notes", submissionData.notes);
        if (submissionData.file) {
            formData.append("proof_attachment", submissionData.file);
        }

        try {
            await api.post(`/tasks/${selectedTask.id}/submit`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setShowSubmitModal(false);
            setSubmissionData({ notes: "", file: null });
            fetchTasks();
            alert("Task submitted for review!");
        } catch (error) {
            console.error("Failed to submit task", error);
            alert("Failed to submit task.");
        } finally {
            setIsActionLoading(null);
        }
    };

    // ── Status badge ──────────────────────────────────────────────────────────
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200"><Clock className="w-3 h-3" /> Assigned</span>;
            case 'claimed': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100"><Inbox className="w-3 h-3" /> Claimed</span>;
            case 'accepted': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-100"><CheckCircle className="w-3 h-3" /> Accepted</span>;
            case 'in_progress': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100"><PlayCircle className="w-3 h-3" /> Active</span>;
            case 'on_hold': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100"><PauseCircle className="w-3 h-3" /> On Hold</span>;
            case 'pending_review': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100"><AlertCircle className="w-3 h-3" /> In Review</span>;
            case 'rejected': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100"><AlertCircle className="w-3 h-3" /> Revision Required</span>;
            case 'completed': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3 h-3" /> Completed</span>;
            default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">{status}</span>;
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (activeTab === "pool") {
            return task.is_pool_task && !task.assigned_to;
        }
        return task.assigned_to === user?.employee?.id;
    });

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">My Productivity</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Track assignments, claim pool tasks and manage your workspace.
            </p>

            {/* Tab Navigation */}
            <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700 mb-8">
                <button
                    onClick={() => setActiveTab("my-tasks")}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "my-tasks" ? "text-blue-600" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                >
                    Assignments
                    {activeTab === "my-tasks" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab("pool")}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "pool" ? "text-blue-600" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                >
                    Task Pool
                    {activeTab === "pool" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>}
                </button>
            </div>

            <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Workspace...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                            <div key={task.id} className={`bg-white dark:bg-gray-800 rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${task.status === 'on_hold' ? 'border-amber-200 dark:border-amber-700/50 bg-amber-50/30 dark:bg-amber-900/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                                {task.department?.name || 'General'}
                                            </span>
                                            {task.priority && (
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md 
                                                    ${task.priority === 'urgent' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                                        task.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                            task.priority === 'low' ? 'bg-gray-100 text-gray-400 dark:bg-gray-700' :
                                                                'bg-blue-50 text-blue-500 font-medium'}`}>
                                                    {task.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2">{task.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 font-medium leading-relaxed">{task.description}</p>

                                    {/* Hold reason banner */}
                                    {task.status === 'on_hold' && task.hold_reason && (
                                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                                            <h4 className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <PauseCircle className="w-3 h-3" /> Hold Reason
                                            </h4>
                                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium italic">
                                                "{task.hold_reason}"
                                            </p>
                                        </div>
                                    )}

                                    {task.status === 'rejected' && task.admin_feedback && (
                                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                                            <h4 className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Reviewer Feedback
                                            </h4>
                                            <p className="text-xs text-red-800 dark:text-red-300 font-medium italic">
                                                "{task.admin_feedback}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-400 font-bold uppercase tracking-tighter">Status</span>
                                            {getStatusBadge(task.status)}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-gray-400 font-bold uppercase tracking-tighter">Deadline</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{task.due_date ? formatDate(task.due_date) : 'Flexible'}</span>
                                            {task.due_time && (
                                                <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5" /> {task.due_time}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        {activeTab === 'pool' ? (
                                            <button
                                                onClick={() => handleClaim(task.id)}
                                                disabled={isActionLoading === task.id}
                                                className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isActionLoading === task.id ? <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div> : <><Inbox className="w-4 h-4" /> Claim Task</>}
                                            </button>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {(task.status === 'pending' || task.status === 'claimed') && (
                                                    <button
                                                        onClick={() => handleAccept(task.id)}
                                                        disabled={isActionLoading === task.id}
                                                        className="w-full py-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {isActionLoading === task.id ? <div className="w-4 h-4 border-2 border-cyan-600/30 border-t-cyan-600 rounded-full animate-spin"></div> : <><CheckCircle className="w-4 h-4" /> Accept Task</>}
                                                    </button>
                                                )}
                                                {task.status === 'accepted' && (
                                                    <button
                                                        onClick={() => handleStart(task.id)}
                                                        disabled={isActionLoading === task.id}
                                                        className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <PlayCircle className="w-4 h-4" /> Start Work
                                                    </button>
                                                )}
                                                {task.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleStart(task.id)}
                                                        disabled={isActionLoading === task.id}
                                                        className="w-full py-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30 shadow-sm"
                                                    >
                                                        <PlayCircle className="w-4 h-4" /> Restart & Fix Issues
                                                    </button>
                                                )}

                                                {/* ── in_progress: Hold + Complete ── */}
                                                {task.status === 'in_progress' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openHoldModal(task)}
                                                            disabled={isActionLoading === task.id}
                                                            className="flex-1 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-800/40"
                                                        >
                                                            <PauseCircle className="w-4 h-4" /> Hold
                                                        </button>
                                                        <button
                                                            onClick={() => openSubmitModal(task)}
                                                            className="flex-[2] py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <ArrowRight className="w-4 h-4" /> Complete & Submit
                                                        </button>
                                                    </div>
                                                )}

                                                {/* ── on_hold: Resume ── */}
                                                {task.status === 'on_hold' && (
                                                    <button
                                                        onClick={() => handleResume(task.id)}
                                                        disabled={isActionLoading === task.id}
                                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        {isActionLoading === task.id
                                                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            : <><PlayCircle className="w-4 h-4" /> Start Again</>
                                                        }
                                                    </button>
                                                )}

                                                {task.status === 'pending_review' && (
                                                    <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30 text-xs font-bold uppercase tracking-tight italic">
                                                        <Clock className="w-4 h-4" /> Awaiting Verification
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Workspace Clear</h3>
                                <p className="text-sm text-gray-400">No tasks found matching your current view.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                HOLD MODAL
            ═══════════════════════════════════════════════════════════ */}
            {showHoldModal && holdTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <PauseCircle className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Put Task On Hold</h2>
                            </div>
                            <button onClick={() => setShowHoldModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>

                        <form onSubmit={handleHoldSubmit} className="p-6 space-y-5">
                            {/* Task name */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Task</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{holdTask.title}</p>
                            </div>

                            {/* Reason textarea */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    Reason for Hold <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={holdReason}
                                    onChange={(e) => setHoldReason(e.target.value)}
                                    placeholder="Explain why you're pausing this task (e.g., waiting for the design assets to be ready, blocked by another task, etc.)..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none font-medium"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">{holdReason.length}/500 characters</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowHoldModal(false)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isActionLoading === holdTask.id || !holdReason.trim()}
                                    className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    {isActionLoading === holdTask.id
                                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        : <><PauseCircle className="w-4 h-4" /> Confirm Hold</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                SUBMIT MODAL
            ═══════════════════════════════════════════════════════════ */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 transition-all">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Submit Evidence</h2>
                            <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="submissionForm" onSubmit={handleSubmitForReview} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Completion Narrative</label>
                                    <textarea
                                        required
                                        rows="6"
                                        value={submissionData.notes}
                                        onChange={(e) => setSubmissionData({ ...submissionData, notes: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        placeholder="Describe your process and deliverables in detail..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Deliverables (PDF, Images)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setSubmissionData({ ...submissionData, file: e.target.files[0] })}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                                    />
                                    {submissionData.file && <div className="mt-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle className="w-3 h-3" /> File Selected</div>}
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="submissionForm"
                                disabled={isActionLoading === selectedTask?.id}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm uppercase tracking-wide disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {isActionLoading === selectedTask?.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Finalize Submission"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTasksPage;
