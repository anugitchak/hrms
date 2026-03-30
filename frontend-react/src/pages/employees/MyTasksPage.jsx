import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/dateUtils";
import { 
    CheckCircle, PlayCircle, Clock, AlertCircle, 
    Layout, Inbox, FileText, ArrowRight, Search, 
    Filter, PauseCircle, RefreshCw, Zap, TrendingUp,
    ShieldCheck, X, Check, Paperclip, MessageSquare,Calendar
} from "lucide-react";
import { useGlobalUI } from "../../context/GlobalUIContext";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out ${className}`}>
        {(title || Icon) && (
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Icon size={18} /></div>}
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
);

const StatCard = ({ title, value, subValue, icon: Icon, color, bg }) => (
    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md border-2 border-transparent hover:border-[#00b9cd] transition-all duration-500 group">
        <div className="flex justify-between items-start mb-4">
            <div className={`${bg || 'bg-[#00b9cd]/10'} ${color || 'text-[#00b9cd]'} p-3 rounded-10 group-hover:scale-110 transition-transform`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {subValue && <span className="text-[10px] font-black uppercase tracking-widest text-[#00b9cd]">{subValue}</span>}
        </div>
        <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{value || "0"}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{title}</div>
        </div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon, type = "button", form }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md",
        success: "bg-white dark:bg-slate-800 text-emerald-600 border-2 border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 shadow-sm",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
        destructive: "bg-white dark:bg-slate-800 text-rose-600 border-2 border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-sm"
    };

    return (
        <button
            type={type}
            form={form}
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

const getStatusBadge = (status) => {
    const styles = {
        pending: { label: "Assigned", class: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-slate-200/50", icon: Clock },
        claimed: { label: "Claimed", class: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/20", icon: Inbox },
        accepted: { label: "Accepted", class: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-500/20", icon: CheckCircle },
        in_progress: { label: "Active", class: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-500/20", icon: PlayCircle },
        on_hold: { label: "On Hold", class: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/20", icon: PauseCircle },
        pending_review: { label: "In Review", class: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/20", icon: AlertCircle },
        rejected: { label: "Revision", class: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/20", icon: AlertCircle },
        completed: { label: "Completed", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle },
    };

    const config = styles[status] || styles.pending;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-10 text-[10px] font-black uppercase tracking-widest border ${config.class}`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

const MyTasksPage = () => {
    const { addToast } = useGlobalUI();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("my-tasks");
    const [isActionLoading, setIsActionLoading] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissionData, setSubmissionData] = useState({ notes: "", file: null });
    
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
            addToast("Task accepted!", "success");
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to accept task", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleClaim = async (taskId) => {
        setIsActionLoading(taskId);
        try {
            await api.post(`/tasks/${taskId}/claim`);
            fetchTasks();
            addToast("Task claimed successfully!", "success");
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to claim task.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleStart = async (taskId) => {
        setIsActionLoading(taskId);
        try {
            await api.post(`/tasks/${taskId}/start`);
            fetchTasks();
            addToast("Mission started!", "success");
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to start task", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

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
            addToast("Mission paused.", "success");
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to put task on hold.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleResume = async (taskId) => {
        setIsActionLoading(taskId);
        try {
            await api.post(`/tasks/${taskId}/resume`);
            fetchTasks();
            addToast("Mission resumed!", "success");
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to resume task.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

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
            addToast("Mission submitted for review!", "success");
        } catch (error) {
            addToast("Failed to submit task.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (activeTab === "pool") {
            return task.is_pool_task && !task.assigned_to;
        }
        return task.assigned_to === user?.employee?.id;
    });

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-16 h-16 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#00b9cd] animate-pulse">Syncing Mission Data...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen font-paperlogy mesh-bg">
            {/* Tactical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Productivity <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Track assignments & claim objectives</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        onClick={fetchTasks} 
                        icon={RefreshCw}
                        disabled={loading}
                        className={loading ? "animate-spin" : ""}
                    >
                        Refresh Ops
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-10 border-b border-slate-100 dark:border-white/5 mb-10 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab("my-tasks")} 
                    className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === "my-tasks" ? "text-[#00b9cd]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                >
                    Assigned Missions
                    {activeTab === "my-tasks" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00b9cd] rounded-10"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab("pool")} 
                    className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === "pool" ? "text-[#00b9cd]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                >
                    Objective Pool
                    {activeTab === "pool" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00b9cd] rounded-10"></div>}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                    <Card key={task.id} className="group relative overflow-hidden flex flex-col justify-between h-full">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00b9cd]/10 group-hover:bg-[#00b9cd] transition-all"></div>
                        
                        <div>
                            <div className="flex justify-between items-start mb-6 pt-2">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[9px] font-black text-[#00b9cd] uppercase tracking-widest bg-[#00b9cd]/5 px-2 py-1 rounded-10 border border-[#00b9cd]/10">
                                        {task.department?.name || 'GEN-OPS'}
                                    </span>
                                    {task.priority && (
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-10 border ${
                                            task.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20' : 
                                            task.priority === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                            'bg-slate-50 text-slate-400 border-slate-100 dark:bg-white/5 dark:border-white/10'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    )}
                                </div>
                                {getStatusBadge(task.status)}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-[#00b9cd] transition-colors">{task.title}</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed uppercase tracking-tighter">{task.description}</p>

                            {/* Alert banners */}
                            {task.status === 'on_hold' && task.hold_reason && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-10">
                                    <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <PauseCircle size={14} /> Hold Reason
                                    </h4>
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">"{task.hold_reason}"</p>
                                </div>
                            )}

                            {task.status === 'rejected' && task.admin_feedback && (
                                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-10">
                                    <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <AlertCircle size={14} /> Rejection Core
                                    </h4>
                                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300">"{task.admin_feedback}"</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <div className="flex flex-col gap-1">
                                    <span className="text-slate-300 dark:text-slate-600">Timeline</span>
                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                        <Calendar size={12} className="text-[#00b9cd]" />
                                        {task.due_date ? formatDate(task.due_date) : 'Infinite'}
                                    </span>
                                </div>
                                {task.due_time && (
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-slate-300 dark:text-slate-600">Cutoff</span>
                                        <span className="text-[#00b9cd] flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {task.due_time}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {activeTab === 'pool' ? (
                                    <Button 
                                        variant="primary" 
                                        onClick={() => handleClaim(task.id)} 
                                        disabled={isActionLoading === task.id}
                                        icon={Inbox}
                                        className="w-full"
                                    >
                                        {isActionLoading === task.id ? "Syncing..." : "Claim Objective"}
                                    </Button>
                                ) : (
                                    <>
                                        {(task.status === 'pending' || task.status === 'claimed') && (
                                            <Button 
                                                variant="primary" 
                                                onClick={() => handleAccept(task.id)} 
                                                disabled={isActionLoading === task.id}
                                                icon={CheckCircle}
                                                className="w-full"
                                            >
                                                {isActionLoading === task.id ? "Syncing..." : "Acknowledge"}
                                            </Button>
                                        )}
                                        {task.status === 'accepted' && (
                                            <Button 
                                                variant="primary" 
                                                onClick={() => handleStart(task.id)} 
                                                disabled={isActionLoading === task.id}
                                                icon={PlayCircle}
                                                className="w-full"
                                            >
                                                Initiate Mission
                                            </Button>
                                        )}
                                        {task.status === 'rejected' && (
                                            <Button 
                                                variant="destructive" 
                                                onClick={() => handleStart(task.id)} 
                                                disabled={isActionLoading === task.id}
                                                icon={RefreshCw}
                                                className="w-full"
                                            >
                                                Restart Ops
                                            </Button>
                                        )}
                                        {task.status === 'in_progress' && (
                                            <div className="flex gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => openHoldModal(task)} 
                                                    disabled={isActionLoading === task.id}
                                                    icon={PauseCircle}
                                                    className="flex-1"
                                                >
                                                    Pause
                                                </Button>
                                                <Button 
                                                    variant="primary" 
                                                    onClick={() => openSubmitModal(task)}
                                                    icon={Check}
                                                    className="flex-[2]"
                                                >
                                                    Complete
                                                </Button>
                                            </div>
                                        )}
                                        {task.status === 'on_hold' && (
                                            <Button 
                                                variant="primary" 
                                                onClick={() => handleResume(task.id)} 
                                                disabled={isActionLoading === task.id}
                                                icon={PlayCircle}
                                                className="w-full"
                                            >
                                                {isActionLoading === task.id ? "Syncing..." : "Resume Ops"}
                                            </Button>
                                        )}
                                        {task.status === 'pending_review' && (
                                            <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-10 border border-amber-100 dark:border-amber-500/20 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                <ShieldCheck size={16} /> Awaiting Intel Verification
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-slate-900/40 rounded-10 border-2 border-dashed border-slate-100 dark:border-white/5">
                        <Inbox size={64} className="text-slate-100 dark:text-white/5 mb-6" />
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-2">Workspace Zero</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active mission profiles detected.</p>
                    </div>
                )}
            </div>

            {/* Hold Modal */}
            {showHoldModal && holdTask && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-10 shadow-2xl border-2 border-amber-500/30 max-w-md w-full overflow-hidden">
                        <div className="p-6 bg-amber-50 dark:bg-amber-500/5 border-b border-amber-100 dark:border-amber-500/20 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <PauseCircle className="text-amber-500" /> Pause Mission
                            </h2>
                            <button onClick={() => setShowHoldModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleHoldSubmit} className="p-8 space-y-6">
                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-100 dark:border-white/5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Mission</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{holdTask.title}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rationale for Hold</label>
                                <textarea 
                                    required 
                                    rows={4} 
                                    value={holdReason} 
                                    onChange={(e) => setHoldReason(e.target.value)}
                                    placeholder="Explain the mission delay parameters..." 
                                    className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-10 p-4 text-sm font-bold text-slate-700 dark:text-white focus:border-amber-500 transition-all outline-none resize-none h-32" 
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setShowHoldModal(false)} className="flex-1">Abort</Button>
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={isActionLoading === holdTask.id || !holdReason.trim()}
                                    className="flex-[2] bg-amber-500 hover:bg-amber-600"
                                    icon={PauseCircle}
                                >
                                    {isActionLoading === holdTask.id ? "Syncing..." : "Confirm Pause"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Submit Modal */}
            {showSubmitModal && selectedTask && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-10 shadow-2xl border-2 border-[#00b9cd]/30 w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-6 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <ShieldCheck className="text-[#00b9cd]" /> Mission Debrief
                            </h2>
                            <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form id="submissionForm" onSubmit={handleSubmitForReview} className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Completion Narrative</label>
                                    <textarea 
                                        required 
                                        rows="6" 
                                        value={submissionData.notes} 
                                        onChange={(e) => setSubmissionData({ ...submissionData, notes: e.target.value })} 
                                        className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-10 p-5 text-sm font-bold text-slate-700 dark:text-white focus:border-[#00b9cd] transition-all outline-none resize-none h-48"
                                        placeholder="Detail the mission deliverables and completion steps..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mission Proof (Assets)</label>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            onChange={(e) => setSubmissionData({ ...submissionData, file: e.target.files[0] })} 
                                            className="w-full text-xs font-black text-slate-400 file:mr-6 file:py-3 file:px-6 file:rounded-10 file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#00b9cd] file:text-white hover:file:bg-blue-600 file:transition-all cursor-pointer bg-slate-50 dark:bg-white/5 p-4 rounded-10 border-2 border-dashed border-slate-200 dark:border-white/10 group-hover:border-[#00b9cd] transition-all" 
                                        />
                                    </div>
                                    {submissionData.file && (
                                        <div className="mt-3 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle size={14} /> {submissionData.file.name} (Assets Locked)
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex justify-end gap-4">
                            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>Abort</Button>
                            <Button 
                                type="submit" 
                                form="submissionForm" 
                                variant="primary" 
                                disabled={isActionLoading === selectedTask.id}
                                icon={Check}
                                className="px-10"
                            >
                                {isActionLoading === selectedTask.id ? "Transmitting..." : "Finalize Mission"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTasksPage;