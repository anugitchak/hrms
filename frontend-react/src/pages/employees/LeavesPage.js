import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
    Calendar, Clock, CheckCircle, AlertTriangle,
    Plus, Search, RefreshCw, FileText, Briefcase,
    ShieldCheck, TrendingUp, History, Info, X, Check,
    Filter, Send, Activity, Trash2, ArrowRight, ChevronRight
} from 'lucide-react';
import { useGlobalUI } from "../../context/GlobalUIContext";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    {Icon && <div className="p-3 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd] group-hover:bg-[#00b9cd] group-hover:text-white transition-all duration-500"><Icon size={20} /></div>}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-8 flex-1 flex flex-col">{children}</div>
    </div>
);

const StatCard = ({ title, value, subValue, icon: Icon, color = "teal" }) => {
    const colors = {
        teal: "text-[#00b9cd] bg-[#00b9cd]/10",
        amber: "text-amber-500 bg-amber-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        rose: "text-rose-500 bg-rose-500/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
    };

    return (
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md border-2 border-transparent hover:border-[#00b9cd] transition-all duration-500 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 ${colors[color]} rounded-10 group-hover:rotate-12 transition-transform duration-500`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {subValue && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00b9cd] underline decoration-2 underline-offset-4">{subValue}</span>}
            </div>
            <div className="relative z-10">
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 uppercase">{value || "0"}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">{title}</div>
            </div>
        </div>
    );
};

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon, type = "button" }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md",
        success: "bg-emerald-500 text-white hover:bg-emerald-600",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
        destructive: "bg-rose-500 text-white hover:bg-rose-600"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-8 py-4 rounded-10 font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3 ${variants[variant]} ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-1 shadow-lg'} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

const Badge = ({ children, variant = "default" }) => {
    const styles = {
        default: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200/50",
        Approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        Rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse",
        "On Leave": "bg-blue-500/10 text-blue-500 border-blue-500/20"
    };

    const current = styles[variant] || styles.default;

    return (
        <span className={`inline-flex px-4 py-1.5 rounded-10 text-[9px] font-black uppercase tracking-[0.2em] border-2 ${current}`}>
            {children}
        </span>
    );
};

// --- Main Page Component ---

const LeavesPage = () => {
    const { addToast } = useGlobalUI();
    const navigate = useNavigate();
    const [leaves, setLeaves] = useState([]);
    const [balances, setBalances] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });

    const abortRef = useRef(null);

    const fetchLeavesData = async () => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            if (controller.signal.aborted) return;
            const results = await Promise.allSettled([
                api.get("/my-leaves", { signal: controller.signal }),
                api.get("/my-leaves/balances", { signal: controller.signal }),
                api.get("/my-leaves/types", { signal: controller.signal })
            ]);
            if (controller.signal.aborted) return;
            if (results[0].status === 'fulfilled') {
                const d = results[0].value.data;
                setLeaves(Array.isArray(d.data) ? d.data : d || []);
            }
            if (results[1].status === 'fulfilled') setBalances(results[1].value.data || []);
            if (results[2].status === 'fulfilled') setLeaveTypes(results[2].value.data || []);

            const nonCancelRejects = results.filter(r => r.status === 'rejected' && r.reason?.code !== 'ERR_CANCELED');
            if (nonCancelRejects.length > 0) addToast("Some data failed to load. Please retry.", "error");
        } catch (err) {
            if (err.code === 'ERR_CANCELED' || controller.signal.aborted) return;
            console.error("Fetch leaves error:", err);
            addToast("Failed to sync mission archives.", "error");
        } finally {
            if (!controller.signal.aborted) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeavesData();
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWithdraw = async (id) => {
        if (!window.confirm("Abort this mission request?")) return;
        try {
            await api.put(`/leaves/${id}/withdraw`);
            addToast("Mission request aborted.", "success");
            fetchLeavesData();
        } catch (err) {
            addToast("Failed to abort request.", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/leaves", formData);
            addToast("Mission request transmitted to command.", "success");
            setIsModalOpen(false);
            setFormData({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
            fetchLeavesData();
        } catch (err) {
            addToast(err?.response?.data?.message || "Transmission failure.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-12 h-12 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00b9cd]">Decrypting Leave Ledger...</div>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-[1700px] mx-auto min-h-screen font-paperlogy mesh-bg">

            {/* Tactical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Leave <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Operational Withdrawal Scheduling</p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <Button variant="outline" onClick={() => navigate("/employee/dashboard")} icon={History}>Archive Ops</Button>
                    <Button onClick={() => setIsModalOpen(true)} icon={Plus}>Request Withdrawal</Button>
                </div>
            </div>

            {/* Quota Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {balances.map((balance) => (
                    <StatCard 
                        key={balance.id}
                        title={`${balance.leave_type?.name || "LEAVE"} QUOTA`}
                        value={balance.remaining_days}
                        subValue={`USED: ${balance.used_days}`}
                        icon={Briefcase}
                        color={balance.remaining_days > 0 ? "teal" : "rose"}
                    />
                ))}
            </div>

            {/* Requests Ledger */}
            <Card title="Operational Registry" icon={History}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead className="hidden sm:table-header-group">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                <th className="px-8 pb-4">Nature of Leave</th>
                                <th className="px-8 pb-4">Temporal Range</th>
                                <th className="px-8 pb-4">Operational Reason</th>
                                <th className="px-8 pb-4">Protocol Status</th>
                                <th className="px-8 pb-4 text-right">Command Intel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length > 0 ? (
                                leaves.map((leave) => (
                                    <tr key={leave.id} className="group transition-all duration-300">
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 rounded-10-[2rem] border-y-2 border-l-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-10 shadow-sm text-[#00b9cd]">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                    {leave.leave_type?.name || "GENERAL"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase">
                                                    {new Date(leave.start_date).toLocaleDateString()}
                                                </span>
                                                <div className="flex items-center gap-2 text-[8px] font-black text-[#00b9cd] uppercase tracking-widest">
                                                    <ArrowRight size={10} /> {leave.days || "X"} DAYS UPTIME
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 max-w-xs truncate uppercase tracking-widest">
                                                {leave.reason || "REDACTED"}
                                            </p>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <Badge variant={leave.status}>{leave.status}</Badge>
                                                {(leave.status === 'Pending' || leave.status === 'Pending_Email_Failed') && (
                                                    <button onClick={() => handleWithdraw(leave.id)} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-10 transition-all border border-transparent hover:border-rose-500/20 shadow-sm" title="Abort Protocol">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 rounded-10-[2rem] border-y-2 border-r-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all text-right shadow-sm">
                                            {leave.approver ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                                        <ShieldCheck size={12} className="text-emerald-500" /> {leave.approver.name}
                                                    </div>
                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{leave.approver.role?.name || "COMMAND"}</div>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Awaiting Intel</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-20">
                                            <RefreshCw size={64} className="mb-6 animate-spin-slow text-[#00b9cd]" />
                                            <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-400">No Operational Disruptions Logged</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 font-paperlogy">
                    <div className="bg-white dark:bg-slate-900 rounded-10 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] border-2 border-[#00b9cd]/30 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center group">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tighter uppercase">
                                <Send className="text-[#00b9cd] -rotate-12" /> Mission Withdrawal Request
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-500 hover:text-white rounded-10 transition-all text-slate-400"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 italic">Withdrawal Nature</label>
                                <select 
                                    name="leave_type_id" 
                                    value={formData.leave_type_id} 
                                    onChange={handleInputChange} 
                                    required
                                    className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-10 text-sm font-black text-slate-700 dark:text-white focus:outline-none focus:border-[#00b9cd]/50 transition-all uppercase tracking-widest cursor-pointer"
                                >
                                    <option value="">Select Operational Type</option>
                                    {leaveTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 italic">Temporal Start</label>
                                    <input 
                                        type="date" 
                                        name="start_date" 
                                        value={formData.start_date} 
                                        onChange={handleInputChange} 
                                        required
                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-10 text-sm font-black text-slate-700 dark:text-white focus:outline-none focus:border-[#00b9cd]/50 transition-all uppercase tracking-widest"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 italic">Temporal End</label>
                                    <input 
                                        type="date" 
                                        name="end_date" 
                                        value={formData.end_date} 
                                        onChange={handleInputChange} 
                                        required
                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-10 text-sm font-black text-slate-700 dark:text-white focus:outline-none focus:border-[#00b9cd]/50 transition-all uppercase tracking-widest"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 italic">Mission Context / Reason</label>
                                <textarea 
                                    name="reason" 
                                    value={formData.reason} 
                                    onChange={handleInputChange} 
                                    rows="4" 
                                    required
                                    placeholder="PROVIDE TACTICAL CONTEXT FOR THIS WITHDRAWAL..."
                                    className="w-full px-8 py-6 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-10 text-sm font-black text-slate-700 dark:text-white focus:outline-none focus:border-[#00b9cd]/50 transition-all uppercase tracking-widest resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                ></textarea>
                            </div>

                            <div className="flex gap-6 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Abort Input</Button>
                                <Button type="submit" disabled={isSubmitting} variant="primary" className="flex-1 shadow-[0_20px_40px_-10px_rgba(0,185,205,0.4)]" icon={Send}>
                                    {isSubmitting ? "TRANSMITTING..." : "LOG REQUEST"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeavesPage;
