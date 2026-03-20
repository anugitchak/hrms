import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Save, Plus, Trash, AlertCircle, CheckCircle, ShieldOff } from 'lucide-react';

const PayrollSettingsPage = () => {
    const { user } = useAuth();
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
    const [message, setMessage] = useState(null);

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
        setMessage(null);

        try {
            await axios.post('/payroll-policy', {
                ...policies,
                ptax_slabs: JSON.stringify(policies.ptax_slabs)
            });
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings.' });
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-black font-paperlogy">Payroll Settings</h1>
                <p className="text-sm font-medium text-gray-600 mt-1">Configure salary structure, deductions, and tax slabs.</p>
            </div>

            {!canAccess ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <ShieldOff className="w-16 h-16 text-red-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
                    <p className="text-gray-900">You don't have permission to access Payroll Settings.</p>
                    <p className="text-gray-400 dark:text-gray-900 text-sm mt-2">Contact your Super Admin to request access.</p>
                </div>
            ) : (
                <>
                    {message && (
                        <div className={`mb-4 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                            {message.text}
                        </div>
                    )}

                    {loading ? <p className="font-medium text-gray-500">Loading...</p> : (
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                            {/* Salary Components */}
                            <div className="card p-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-black/10">
                                    <h2 className="text-lg font-extrabold text-black">Salary Structure Breakdown</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="basic_percentage" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Basic Salary (%)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="basic_percentage" type="number" name="basic_percentage"
                                                value={policies.basic_percentage} onChange={handleChange}
                                                className="w-full border-2 border-black rounded-xl px-4 py-2.5 font-bold text-black bg-white outline-none focus:ring-4 focus:ring-brand-500"
                                                min="0" max="100" autoComplete="off"
                                            />
                                            <span className="font-extrabold text-gray-700 text-lg">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="hra_percentage" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">HRA (%) — Auto</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="hra_percentage" type="number" name="hra_percentage"
                                                value={policies.hra_percentage} readOnly
                                                className="w-full border-2 border-black rounded-xl px-4 py-2.5 font-bold bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                                                autoComplete="off"
                                            />
                                            <span className="font-extrabold text-gray-700 text-lg">%</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 mt-1.5">Automatically set to (100 − Basic).</p>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="card p-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-black/10">
                                    <h2 className="text-lg font-extrabold text-black">Statutory Deductions (Global)</h2>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { id: 'pf_enabled', name: 'pf_enabled', checked: policies.pf_enabled, label: 'Provident Fund (PF)', sub: '12% of Basic Salary', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                                        { id: 'esic_enabled', name: 'esic_enabled', checked: policies.esic_enabled, label: 'ESIC', sub: '0.75% of Gross Salary', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                                        { id: 'ptax_enabled', name: 'ptax_enabled', checked: policies.ptax_enabled, label: 'Professional Tax (PTAX)', sub: 'Slab-based deduction', color: 'text-orange-600 bg-orange-50 border-orange-200' },
                                    ].map(item => (
                                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border-2 border-black transition-all ${ item.checked ? item.color : 'bg-white border-black/20' }`}>
                                            <div>
                                                <h3 className="font-extrabold text-black text-sm">{item.label}</h3>
                                                <p className="text-xs font-medium text-gray-600 mt-0.5">{item.sub}</p>
                                            </div>
                                            <label htmlFor={item.id} className="relative inline-flex items-center cursor-pointer">
                                                <input id={item.id} type="checkbox" name={item.name} checked={item.checked} onChange={handleChange} className="sr-only peer" aria-label={`Enable ${item.label}`} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PTAX Slabs */}
                            {policies.ptax_enabled && (
                                <div className="card p-6">
                                    <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-black/10">
                                        <h2 className="text-lg font-extrabold text-black">Professional Tax Slabs</h2>
                                        <button type="button" onClick={addSlab} className="btn-secondary flex items-center gap-1.5 text-sm">
                                            <Plus className="w-4 h-4" /> + Add Slab
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {policies.ptax_slabs.map((slab, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border-2 border-black/10">
                                                <div className="flex-1">
                                                    <label htmlFor={`ptax_min_${index}`} className="sr-only">Min Salary</label>
                                                    <input
                                                        id={`ptax_min_${index}`} name={`ptax_min_${index}`}
                                                        type="number" placeholder="Min Salary" value={slab.min_salary}
                                                        onChange={(e) => handleSlabChange(index, 'min_salary', e.target.value)}
                                                        className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-4 focus:ring-brand-500"
                                                        aria-label={`Minimum Salary for Slab ${index + 1}`} autoComplete="off"
                                                    />
                                                </div>
                                                <span className="font-black text-gray-400">—</span>
                                                <div className="flex-1">
                                                    <label htmlFor={`ptax_max_${index}`} className="sr-only">Max Salary</label>
                                                    <input
                                                        id={`ptax_max_${index}`} name={`ptax_max_${index}`}
                                                        type="number" placeholder="Max Salary" value={slab.max_salary || ""}
                                                        onChange={(e) => handleSlabChange(index, 'max_salary', e.target.value)}
                                                        className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-4 focus:ring-brand-500"
                                                        aria-label={`Maximum Salary for Slab ${index + 1}`} autoComplete="off"
                                                    />
                                                </div>
                                                <span className="font-black text-gray-400">→</span>
                                                <div className="w-32">
                                                    <label htmlFor={`ptax_amount_${index}`} className="sr-only">Tax Amount</label>
                                                    <input
                                                        id={`ptax_amount_${index}`} name={`ptax_amount_${index}`}
                                                        type="number" placeholder="₹ Tax" value={slab.tax_amount}
                                                        onChange={(e) => handleSlabChange(index, 'tax_amount', e.target.value)}
                                                        className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-4 focus:ring-brand-500"
                                                        aria-label={`Tax Amount for Slab ${index + 1}`} autoComplete="off"
                                                    />
                                                </div>
                                                <button type="button" onClick={() => removeSlab(index)}
                                                    className="p-2 border-2 border-red-300 text-red-500 rounded-lg bg-red-50 hover:bg-red-100 transition-all"
                                                    aria-label={`Remove Slab ${index + 1}`}>
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {policies.ptax_slabs.length === 0 && <p className="text-gray-400 text-sm font-medium py-4 text-center">No slabs defined. Click "+ Add Slab" to get started.</p>}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <Save className="w-5 h-5" /> Save Settings
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
