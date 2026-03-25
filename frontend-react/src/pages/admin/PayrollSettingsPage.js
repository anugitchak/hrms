import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Save, Plus, Trash2, AlertCircle, CheckCircle, ShieldOff, Activity, ShieldCheck, Briefcase, Percent } from 'lucide-react';
import { useGlobalUI } from '../../context/GlobalUIContext';

const PayrollSettingsPage = () => {
    const { user } = useAuth();
    const { addToast } = useGlobalUI();
    // SuperAdmin (1) always has access, others need the specific permission
    const canAccess = user?.role_id === 1 || user?.can_manage_payroll_settings === true;

    const [policies, setPolicies] = useState({
        basic_percentage: 70,
        hra_percentage: 30,
        pf_enabled: true,
        esic_enabled: true,
        ptax_enabled: true,
        ptax_slabs: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await axios.get('/payroll-policy');
            let data = res.data;

            // Parse Slabs
            if (data.ptax_slabs && typeof data.ptax_slabs === 'string') {
                try {
                    data.ptax_slabs = JSON.parse(data.ptax_slabs);
                } catch (e) {
                    data.ptax_slabs = [];
                }
            } else if (!data.ptax_slabs) {
                data.ptax_slabs = [];
            }

            // Normalize Booleans
            const isTrue = (val) => {
                if (val === undefined || val === null) return false;
                const str = String(val).trim().toLowerCase();
                return str === '1' || str === 'true';
            };
            data.pf_enabled = isTrue(data.pf_enabled);
            data.esic_enabled = isTrue(data.esic_enabled);
            data.ptax_enabled = isTrue(data.ptax_enabled);

            setPolicies(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error("Failed to fetch policies", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPolicies(prev => {
            const newVal = type === 'checkbox' ? checked : value;
            // Auto-adjust HRA if Basic changes
            if (name === 'basic_percentage') {
                return { ...prev, [name]: newVal, hra_percentage: 100 - newVal };
            }
            if (name === 'hra_percentage') {
                return { ...prev, [name]: newVal, basic_percentage: 100 - newVal };
            }
            return { ...prev, [name]: newVal };
        });
    };

    const handleSlabChange = (index, field, value) => {
        const newSlabs = [...policies.ptax_slabs];
        newSlabs[index][field] = value;
        setPolicies(prev => ({ ...prev, ptax_slabs: newSlabs }));
    };

    const addSlab = () => {
        setPolicies(prev => ({
            ...prev,
            ptax_slabs: [...prev.ptax_slabs, { min_salary: 0, max_salary: 0, tax_amount: 0 }]
        }));
    };

    const removeSlab = (index) => {
        const newSlabs = policies.ptax_slabs.filter((_, i) => i !== index);
        setPolicies(prev => ({ ...prev, ptax_slabs: newSlabs }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post('/payroll-policy', {
                ...policies,
                ptax_slabs: JSON.stringify(policies.ptax_slabs)
            });
            addToast('Settings updated successfully!', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update settings.', 'error');
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none">
                    Payroll <span className="text-transparent bg-clip-text bg-[#00b9cd] ">Settings</span>
                </h1>
                <div className="flex items-center gap-3 mt-3">
                    <span className="h-1.5 w-12 bg-[#f06464] rounded-10  /20 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Configure salary structure, deductions, and tax slabs.</p>
                </div>
            </div>

            {!canAccess ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900/60 rounded-10 border-2 border-slate-900/10 dark:border-white/10  shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]">
                    <div className="p-6 bg-red-50 dark:bg-red-500/10 rounded-10 border-2 border-red-100 dark:border-red-500/20 mb-6">
                        <ShieldOff className="w-16 h-16 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Access Denied</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">You don't have permission to modify Payroll Settings.</p>
                    <p className="text-slate-400 text-xs mt-4 font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-10">Contact Super Admin for authorization</p>
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#00b9cd] border-t-transparent rounded-10 animate-spin"></div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Policies...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Salary Components */}
                                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/5 dark:border-white/5 ">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-2.5 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 rounded-10 border-2 border-[#00b9cd]/10 dark:border-[#00b9cd]/20 text-[#00b9cd]">
                                            <Briefcase size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Salary Structure</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Earnings distribution</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label htmlFor="basic_percentage" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Basic Salary (%)</label>
                                            <div className="relative group">
                                                <input
                                                    id="basic_percentage" type="number" name="basic_percentage"
                                                    value={policies.basic_percentage} onChange={handleChange}
                                                    className="w-full pl-5 pr-12 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-black text-base text-slate-900 dark:text-white transition-all"
                                                    min="0" max="100" autoComplete="off"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-slate-800 rounded-10 border border-slate-900/10  text-slate-400 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]">
                                                    <Percent size={14} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="hra_percentage" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">HRA (%) — Auto</label>
                                            <div className="relative">
                                                <input
                                                    id="hra_percentage" type="number" name="hra_percentage"
                                                    value={policies.hra_percentage} readOnly
                                                    className="w-full pl-5 pr-12 py-3.5 bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-900/10 dark:border-white/10 rounded-10 font-black text-base text-slate-400 cursor-not-allowed outline-none"
                                                    autoComplete="off"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-10 text-slate-400">
                                                    <Percent size={14} strokeWidth={3} />
                                                </div>
                                            </div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 bg-slate-100 dark:bg-white/5 inline-block px-2 py-0.5 rounded-10">100 − Basic %</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/5 dark:border-white/5 ">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-10 border-2 border-indigo-100 dark:border-indigo-100/20 text-indigo-600">
                                            <ShieldCheck size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Statutory Deductions</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Toggle payroll locks</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'pf_enabled', name: 'pf_enabled', checked: policies.pf_enabled, label: 'Provident Fund', sub: '12% of Basic', icon: <Activity size={14} /> },
                                            { id: 'esic_enabled', name: 'esic_enabled', checked: policies.esic_enabled, label: 'ESIC (Medical)', sub: '0.75% of Gross', icon: <AlertCircle size={14} /> },
                                            { id: 'ptax_enabled', name: 'ptax_enabled', checked: policies.ptax_enabled, label: 'Prof. Tax (PTAX)', sub: 'Slab-based', icon: <Plus size={14} /> },
                                        ].map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-10 border-2 transition-all duration-500 ${ 
                                                item.checked 
                                                ? 'bg-white dark:bg-slate-800 border-slate-900 dark:border-white shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out' 
                                                : 'bg-slate-50 dark:bg-white/5 border-slate-900/5 dark:border-white/5 opacity-60' 
                                            }">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-10 border ${item.checked ? 'bg-brand-500 text-white border-brand-400' : 'bg-slate-100 dark:bg-white/5 border-slate-900/10 text-slate-300'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-800 dark:text-white text-[10px] uppercase tracking-wider leading-none">{item.label}</h3>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">{item.sub}</p>
                                                    </div>
                                                </div>
                                                <label htmlFor={item.id} className="relative inline-flex items-center cursor-pointer">
                                                    <input id={item.id} type="checkbox" name={item.name} checked={item.checked} onChange={handleChange} className="sr-only peer" />
                                                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-10 after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500  shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* PTAX Slabs */}
                            {policies.ptax_enabled && (
                                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/5 dark:border-white/5 ">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-10 border-2 border-orange-100 dark:border-orange-500/20 text-orange-600">
                                                <AlertCircle size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Professional Tax Slabs</h2>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Salary-based monthly tax</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={addSlab} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white rounded-10 text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:scale-95">
                                            <Plus size={14} strokeWidth={4} /> Add Slab
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {policies.ptax_slabs.map((slab, index) => (
                                            <div key={index} className="flex flex-col gap-3 p-4 rounded-10 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/5 dark:border-white/5 group hover:border-orange-500/30 transition-all relative">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 relative group">
                                                        <input
                                                            id={`ptax_min_${index}`} name={`ptax_min_${index}`}
                                                            type="number" placeholder="0" value={slab.min_salary}
                                                            onChange={(e) => handleSlabChange(index, 'min_salary', e.target.value)}
                                                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-900/10 dark:border-white/10 rounded-10 text-[10px] font-black text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                                                        />
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 group-focus-within:text-orange-500">₹</span>
                                                    </div>
                                                    <span className="text-slate-300 text-[10px] font-black">TO</span>
                                                    <div className="flex-1 relative group">
                                                        <input
                                                            id={`ptax_max_${index}`} name={`ptax_max_${index}`}
                                                            type="number" placeholder="0" value={slab.max_salary || ""}
                                                            onChange={(e) => handleSlabChange(index, 'max_salary', e.target.value)}
                                                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-900/10 dark:border-white/10 rounded-10 text-[10px] font-black text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                                                        />
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 group-focus-within:text-orange-500">₹</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="relative group flex-1 mr-2">
                                                        <input
                                                            id={`ptax_amount_${index}`} name={`ptax_amount_${index}`}
                                                            type="number" placeholder="0" value={slab.tax_amount}
                                                            onChange={(e) => handleSlabChange(index, 'tax_amount', e.target.value)}
                                                            className="w-full pl-16 pr-3 py-2 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 border-2 border-[#00b9cd]/20 rounded-10 text-[10px] font-black text-[#00b9cd] dark:text-[#00b9cd] outline-none focus:border-[#00b9cd] transition-all"
                                                        />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#00b9cd] uppercase tracking-tighter">TAX: ₹</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeSlab(index)}
                                                        className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-10 border-2 border-red-100 dark:border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                                        aria-label={`Remove Slab ${index + 1}`}>
                                                        <Trash2 size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {policies.ptax_slabs.length === 0 && (
                                            <div className="py-8 col-span-full flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-dashed border-slate-900/10">
                                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">No tax slabs defined</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button type="submit" className="group flex items-center gap-3 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-black tracking-widest rounded-10  /25 /10 hover:-translate-y-1 active:scale-[0.98] transition-all uppercase text-[10px] shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]">
                                    <Save size={18} className="group-hover:rotate-12 transition-transform" /> Save Settings
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default PayrollSettingsPage;
