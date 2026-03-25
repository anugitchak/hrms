import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { ShieldCheck, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Check, X, AlertTriangle, List, ArrowRight, Users, RefreshCw, Layers, Calendar, Settings } from "lucide-react";
import { useGlobalUI } from "../../../context/GlobalUIContext";

const LeavePoliciesPage = () => {
    const { addToast, confirm } = useGlobalUI();
    const [policies, setPolicies] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPolicyId, setExpandedPolicyId] = useState(null);
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        joining_category: "Permanent",
        effective_from: "",
        status: "Active",
        rules: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carry Forward State
    const [isCFModalOpen, setIsCFModalOpen] = useState(false);
    const [cfPolicy, setCfPolicy] = useState(null);
    const [cfLeaveTypeId, setCfLeaveTypeId] = useState("");
    const [cfCandidates, setCfCandidates] = useState([]);
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [cfMaxLimit, setCfMaxLimit] = useState(5);
    const [cfLoading, setCfLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [policiesRes, typesRes] = await Promise.all([
                api.get("/leave-policies"),
                api.get("/leave-types")
            ]);
            setPolicies(policiesRes.data);
            setLeaveTypes(typesRes.data);
        } catch (err) {
            console.error("Failed to load data", err);
            addToast("Failed to load policies", "error");
        } finally {
            setLoading(false);
        }
    };

    const groupedPolicies = {
        "New Joinee": policies.filter(p => p.joining_category === "New Joinee"),
        "Intern": policies.filter(p => p.joining_category === "Intern"),
        "Permanent": policies.filter(p => p.joining_category === "Permanent"),
    };

    const handleOpenModal = (policy = null) => {
        if (policy) {
            setEditingPolicy(policy);
            const rules = leaveTypes.map(lt => {
                const existingRule = policy.rules.find(r => r.leave_type_id === lt.id);
                return existingRule || {
                    leave_type_id: lt.id,
                    total_leaves_per_year: 0,
                    accrual_frequency: "Yearly",
                    carry_forward_allowed: false,
                    max_carry_forward: 0,
                    requires_approval: true,
                    auto_approve: false,
                    allow_partial_leave: true,
                    probation_restriction: false,
                    available_during_probation: true
                };
            });
            setFormData({
                name: policy.name,
                joining_category: policy.joining_category,
                effective_from: policy.effective_from,
                status: policy.status,
                rules: rules
            });
        } else {
            setEditingPolicy(null);
            const initialRules = leaveTypes.map(lt => ({
                leave_type_id: lt.id,
                total_leaves_per_year: 0,
                accrual_frequency: "Yearly",
                carry_forward_allowed: false,
                max_carry_forward: 0,
                requires_approval: true,
                auto_approve: false,
                allow_partial_leave: true,
                probation_restriction: false,
                available_during_probation: true
            }));
            setFormData({
                name: "",
                joining_category: "Permanent",
                effective_from: new Date().toISOString().split('T')[0],
                status: "Active",
                rules: initialRules
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingPolicy) {
                await api.put(`/leave-policies/${editingPolicy.id}`, formData);
                addToast("Policy updated successfully", "success");
            } else {
                await api.post("/leave-policies", formData);
                addToast("Policy created successfully", "success");
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save policy", err);
            addToast(err.response?.data?.message || "Failed to save policy", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "Delete Policy",
            message: "Are you sure? This action cannot be undone.",
            confirmText: "Yes, Delete",
            type: "danger"
        });
        if (!confirmed) return;
        try {
            await api.delete(`/leave-policies/${id}`);
            fetchData();
            addToast("Policy deleted successfully", "success");
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to delete", "error");
        }
    };

    const handleRecalculate = async (id) => {
        const confirmed = await confirm({
            title: "Recalculate Balances",
            message: "This will update leave balances for all assigned employees. Continue?",
            confirmText: "Recalculate",
            type: "warning"
        });
        if (!confirmed) return;
        try {
            const res = await api.post(`/leave-policies/${id}/recalculate`);
            addToast(res.data.message, "success");
        } catch (err) {
            addToast("Failed to recalculate", "error");
        }
    };

    const handleRuleChange = (index, field, value) => {
        const newRules = [...formData.rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setFormData({ ...formData, rules: newRules });
    };

    const handleOpenCFModal = (policy) => {
        setCfPolicy(policy);
        setCfLeaveTypeId("");
        setCfCandidates([]);
        setSelectedCandidates([]);
        setIsCFModalOpen(true);
    };

    useEffect(() => {
        if (cfPolicy && cfLeaveTypeId) {
            const fetchCandidates = async () => {
                setCfLoading(true);
                try {
                    const res = await api.get(`/leave-policies/${cfPolicy.id}/carry-forward-candidates?leave_type_id=${cfLeaveTypeId}&max_limit=${cfMaxLimit}`);
                    setCfCandidates(res.data);
                } catch (err) {
                    setCfCandidates([]);
                } finally {
                    setCfLoading(false);
                }
            };
            const debounce = setTimeout(fetchCandidates, 500);
            return () => clearTimeout(debounce);
        }
    }, [cfLeaveTypeId, cfPolicy, cfMaxLimit]);

    const handleProcessCF = async () => {
        if (selectedCandidates.length === 0) {
            addToast("Select at least one employee", "warning");
            return;
        }
        const confirmed = await confirm({
            title: "Process Carry Forward",
            message: `Process carry forward for ${selectedCandidates.length} employees? This will add days to their balance.`,
            confirmText: "Process",
            type: "warning"
        });
        if (!confirmed) return;
        const candidatesPayload = cfCandidates
            .filter(c => selectedCandidates.includes(c.employee_id))
            .map(c => ({ employee_id: c.employee_id, amount: c.proposed_carry_forward }));
        try {
            const res = await api.post(`/leave-policies/${cfPolicy.id}/process-carry-forward`, {
                leave_type_id: cfLeaveTypeId,
                candidates: candidatesPayload
            });
            addToast(res.data.message, "success");
            setIsCFModalOpen(false);
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to process", "error");
        }
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw size={40} className="text-brand-500 animate-spin" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Policies...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight">
                        Leave Policy <span className="text-transparent bg-clip-text bg-[#00b9cd]">Master</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Configure dynamic leave rules per joining category</p>
                        </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span className="uppercase tracking-widest">Create Policy</span>
                </button>
            </div>

            <div className="space-y-16">
                {Object.entries(groupedPolicies).map(([category, categoryPolicies]) => (
                    <div key={category} className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-2.5 h-10 rounded-10 ${category === 'Permanent' ? 'bg-brand-500' : category === 'Intern' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight uppercase">
                                {category} Group
                            </h2>
                            <div className="h-px flex-1 bg-slate-900/5 dark:bg-white/5 ml-4"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900/60 px-4 py-2 rounded-10 border border-slate-900/5 shadow-md">
                                {categoryPolicies.length} Active
                            </span>
                        </div>

                        {categoryPolicies.length === 0 ? (
                            <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-10 border-2 border-dashed border-slate-900/10 dark:border-white/10 p-12 text-center">
                                <Layers className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-50" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No policies configured for {category}</p>
                                <button onClick={() => handleOpenModal()} className="text-brand-500 text-xs font-black uppercase tracking-widest mt-4 hover:underline">
                                    + Add New Policy
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {categoryPolicies.map(policy => (
                                    <div key={policy.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/5 dark:border-white/5 overflow-hidden hover:-translate-y-1 group">
                                        <div 
                                            className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer"
                                            onClick={() => setExpandedPolicyId(expandedPolicyId === policy.id ? null : policy.id)}
                                        >
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-brand-500 transition-colors">
                                                        {policy.name}
                                                    </h3>
                                                    <span className={`px-4 py-1.5 rounded-10 text-[10px] font-black uppercase tracking-widest border-2 ${policy.status === 'Active' ? 'bg-brand-50 text-brand-600 border-brand-200 shadow-md' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                        {policy.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-orange-500" />
                                                        Effective: {new Date(policy.effective_from).toLocaleDateString()}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-10 bg-slate-300"></span>
                                                    <span className="flex items-center gap-2">
                                                        <Layers className="w-4 h-4 text-brand-500" />
                                                        {policy.rules?.length || 0} Rule Sets
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 ">
                                                    <button 
                                                        onClick={() => handleRecalculate(policy.id)}
                                                        className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-white rounded-10 shadow-md border border-transparent hover:border-blue-100 transition-all"
                                                        title="Sync Balances"
                                                    >
                                                        Recalculate
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenCFModal(policy)}
                                                        className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 hover:bg-white rounded-10 shadow-md border border-transparent hover:border-purple-100 transition-all"
                                                    >
                                                        Carry Over
                                                    </button>
                                                    <div className="h-8 w-px bg-slate-100 dark:bg-white/10 mx-2"></div>
                                                    <button 
                                                        onClick={() => handleOpenModal(policy)}
                                                        className="p-3 text-slate-400 hover:text-brand-500 hover:bg-white dark:hover:bg-slate-800 rounded-10 transition-all"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(policy.id)}
                                                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-10 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="p-2 text-slate-300 group-hover:text-brand-500 transition-colors ml-4">
                                                    {expandedPolicyId === policy.id ? <ChevronUp className="w-6 h-6 stroke-[3]" /> : <ChevronDown className="w-6 h-6 stroke-[3]" />}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedPolicyId === policy.id && (
                                            <div className="px-8 pb-10 pt-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-900/5 dark:border-white/5 animate-in slide-in-from-top-4 duration-300">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {policy.rules.map(rule => (
                                                        <div key={rule.id} className="bg-white dark:bg-slate-800 p-6 rounded-10 border border-slate-900/5 shadow-md relative overflow-hidden group/rule">
                                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500"></div>
                                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                <List className="w-3.5 h-3.5 text-brand-500" />
                                                                {rule.leave_type?.name}
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-end border-b-2 border-slate-50 dark:border-white/5 pb-2">
                                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Yearly Quota</span>
                                                                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                                                                        {rule.total_leaves_per_year} <span className="text-[10px] text-slate-400 ml-1 uppercase font-black">Days</span>
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center pt-1">
                                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Approval</span>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-10 ${rule.auto_approve ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                        {rule.auto_approve ? 'Instant' : 'Manual'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Config Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-10 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-3 bg-brand-500"></div>
                        
                        <div className="px-10 py-8 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {editingPolicy ? 'Refine Policy' : 'Draft New Policy'}
                                </h2>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure rule sets for joining categories</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-300 hover:text-brand-500 transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-auto px-10 pb-10 flex-1 space-y-10 scrollbar-hide">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="md:col-span-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Policy Title</label>
                                    <input 
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-slate-900 dark:text-white transition-all font-paperlogy"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Standard Permanent 2024"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Category</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-slate-900 dark:text-white transition-all appearance-none"
                                        value={formData.joining_category}
                                        onChange={e => setFormData({ ...formData, joining_category: e.target.value })}
                                    >
                                        <option value="New Joinee">New Joinee</option>
                                        <option value="Intern">Intern</option>
                                        <option value="Permanent">Permanent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Initial Status</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-slate-900 dark:text-white transition-all appearance-none"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-orange-50/80 dark:bg-orange-500/10 p-6 rounded-10 border-2 border-orange-100 dark:border-orange-500/20 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-10 shadow-md flex items-center justify-center text-orange-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <p className="text-xs font-black text-orange-700 dark:text-orange-300 uppercase tracking-widest leading-relaxed">
                                    Heads up! Updating these rules will trigger a systemic re-calculation for all associated employees.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-brand-500" />
                                    Dynamic Rule Set Configuration
                                </h3>
                                
                                <div className="bg-white dark:bg-slate-900/40 rounded-10 border-2 border-slate-900/5 dark:border-white/5 overflow-hidden shadow-md">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-brand-500/5 border-b-2 border-slate-900/5">
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-64">Leave Framework</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Yearly Quota</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Accrual Cycle</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Eligibility Constraints</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {leaveTypes.map((lt, idx) => {
                                                const rule = formData.rules.find(r => r.leave_type_id === lt.id) || {};
                                                return (
                                                    <tr key={lt.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-10 bg-brand-500/10 flex items-center justify-center text-brand-600 font-black">
                                                                    {lt.name?.charAt(0)}
                                                                </div>
                                                                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{lt.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <input 
                                                                type="number" step="0.5" min="0" 
                                                                className="w-24 mx-auto px-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:border-brand-500 text-center font-black text-slate-900 dark:text-white tabular-nums"
                                                                value={rule.total_leaves_per_year ?? 0}
                                                                onChange={e => handleRuleChange(idx, 'total_leaves_per_year', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <select 
                                                                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:border-brand-500 font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 appearance-none text-center min-w-[120px]"
                                                                value={rule.accrual_frequency ?? 'Yearly'}
                                                                onChange={e => handleRuleChange(idx, 'accrual_frequency', e.target.value)}
                                                            >
                                                                <option value="Yearly">Yearly</option>
                                                                <option value="Monthly">Monthly</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <label className="inline-flex items-center gap-3 cursor-pointer group/toggle">
                                                                <div className="relative w-12 h-6 bg-slate-100 dark:bg-slate-800 rounded-10 border border-slate-900/5 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-white/10 peer-checked:bg-orange-500">
                                                                    <input 
                                                                        type="checkbox" className="sr-only peer"
                                                                        checked={rule.probation_restriction ?? false}
                                                                        onChange={e => handleRuleChange(idx, 'probation_restriction', e.target.checked)}
                                                                    />
                                                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-10 shadow-md transition-transform duration-200 ${rule.probation_restriction ? 'translate-x-6' : ''}`}></div>
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/toggle:text-slate-600">Probation Restriction</span>
                                                            </label>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </form>
                        
                        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/50 border-t-2 border-slate-900/5 dark:border-white/10 flex justify-end gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
                                Discard
                            </button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                                className="px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-widest rounded-10 shadow-lg active:translate-y-0.5 transition-all flex items-center gap-4 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-10 animate-spin"></div>
                                        <span>Saving Changes...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} strokeWidth={3} />
                                        <span>Finalize Policy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Carry Forward Modal */}
            {isCFModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-400 to-brand-500"></div>
                        
                        <div className="px-10 py-8 flex justify-between items-center bg-purple-50/30 dark:bg-purple-900/5">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <ArrowRight className="w-8 h-8 text-purple-600" />
                                Carry Over Process
                            </h2>
                            <button onClick={() => setIsCFModalOpen(false)} className="p-3 text-slate-300 hover:text-purple-600 transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-10 flex-1 overflow-auto space-y-8 scrollbar-hide">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-white/5 p-8 rounded-10 border-2 border-slate-900/5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Source Leave Framework</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:border-purple-500 font-bold text-slate-900 dark:text-white transition-all appearance-none"
                                        value={cfLeaveTypeId}
                                        onChange={e => setCfLeaveTypeId(e.target.value)}
                                    >
                                        <option value="">-- Framework Type --</option>
                                        {leaveTypes.map(lt => (
                                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Maximum Balance Ceiling</label>
                                    <input 
                                        type="number" min="0" step="0.5" 
                                        className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:border-purple-500 font-bold text-slate-900 dark:text-white transition-all tabular-nums"
                                        value={cfMaxLimit}
                                        onChange={e => setCfMaxLimit(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            {cfLoading ? (
                                <div className="text-center py-20 flex flex-col items-center gap-4">
                                    <RefreshCw size={40} className="text-purple-500 animate-spin" />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Auditing eligibility cycles...</p>
                                </div>
                            ) : cfCandidates.length > 0 ? (
                                <div className="bg-white dark:bg-slate-900/40 rounded-10 border-2 border-slate-900/5 dark:border-white/5 overflow-hidden shadow-md">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-purple-500/5 border-b-2 border-slate-900/5">
                                                <th className="p-6 w-20">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-6 h-6 rounded-10 border-2 border-slate-900/10 text-purple-600 focus:ring-purple-500"
                                                        checked={selectedCandidates.length === cfCandidates.length}
                                                        onChange={e => setSelectedCandidates(e.target.checked ? cfCandidates.map(c => c.employee_id) : [])}
                                                    />
                                                </th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Current</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ceiling</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-purple-400 text-center">Proposed Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {cfCandidates.map(c => (
                                                <tr key={c.employee_id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="p-6">
                                                        <input 
                                                            type="checkbox"
                                                            className="w-6 h-6 rounded-10 border-2 border-slate-900/10 text-purple-600 focus:ring-purple-500"
                                                            checked={selectedCandidates.includes(c.employee_id)}
                                                            onChange={e => {
                                                                if(e.target.checked) setSelectedCandidates([...selectedCandidates, c.employee_id]);
                                                                else setSelectedCandidates(selectedCandidates.filter(id => id !== c.employee_id));
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-10 bg-purple-500/10 flex items-center justify-center text-purple-600 font-black">
                                                                {c.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{c.name}</div>
                                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.employee_code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-center font-bold text-slate-700 dark:text-slate-300 tabular-nums">{c.remaining}</td>
                                                    <td className="p-6 text-center text-slate-400 font-bold tabular-nums">{c.max_allowed}</td>
                                                    <td className="p-6 text-center font-black text-purple-600 bg-purple-50/50 dark:bg-purple-900/10 tabular-nums text-lg">
                                                        +{c.proposed_carry_forward}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : cfLeaveTypeId && (
                                <div className="text-center py-20 bg-slate-50/50 dark:bg-white/5 rounded-10 border-2 border-dashed border-slate-900/10 dark:border-white/10">
                                    <Users className="w-16 h-16 mx-auto text-slate-200 mb-6 opacity-50" />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Target framework search yielded no credits.<br />
                                        Verify "Carry Forward" eligibility in policy settings.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/50 border-t-2 border-slate-900/5 dark:border-white/10 flex justify-end gap-4">
                            <button onClick={() => setIsCFModalOpen(false)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
                                Dissolve
                            </button>
                            <button 
                                onClick={handleProcessCF} 
                                disabled={selectedCandidates.length === 0}
                                className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-widest rounded-10 shadow-lg shadow-purple-200 dark:shadow-none active:translate-y-0.5 transition-all flex items-center gap-4 disabled:opacity-50"
                            >
                                <ArrowRight size={18} strokeWidth={3} />
                                <span>Commit Credits</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeavePoliciesPage;