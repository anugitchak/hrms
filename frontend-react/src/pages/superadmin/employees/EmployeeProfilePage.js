import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { STORAGE_URL } from "../../../api/axios";
import { ArrowLeft, Save, Edit2, X, Phone, Mail, Calendar as CalendarIcon, MapPin, Briefcase, DollarSign, RefreshCw, Hash, User, Shield, Zap } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useGlobalUI } from "../../../context/GlobalUIContext";

const EmployeeProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useGlobalUI();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingSalary, setIsEditingSalary] = useState(false);

    // Permissions
    const isSuperAdmin = user?.role_id === 1;
    const canManageSalary = isSuperAdmin || user?.role_id === 2 || user?.permissions?.includes("can_manage_salaries");

    // Salary Form State
    const [salaryData, setSalaryData] = useState({
        basic: 0,
        hra: 0,
        da: 0,
        allowances: 0,
        deductions: 0,
        gross_salary: 0
    });

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const { data } = await api.get(`/employees/${id}`);
            setEmployee(data);
            if (data.current_salary) {
                setSalaryData({
                    basic: parseFloat(data.current_salary.basic) || 0,
                    hra: parseFloat(data.current_salary.hra) || 0,
                    da: parseFloat(data.current_salary.da) || 0,
                    allowances: parseFloat(data.current_salary.allowances || 0),
                    deductions: parseFloat(data.current_salary.deductions) || 0,
                    gross_salary: parseFloat(data.current_salary.gross_salary) || 0
                });
            }
        } catch (err) {
            setError("Failed to load employee details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSalaryChange = (e) => {
        const { name, value } = e.target;
        setSalaryData(prev => {
            const updated = { ...prev, [name]: value };
            const basic = parseFloat(updated.basic) || 0;
            const hra = parseFloat(updated.hra) || 0;
            const da = parseFloat(updated.da) || 0;
            const allowances = parseFloat(updated.allowances) || 0;
            const deductions = parseFloat(updated.deductions) || 0;
            updated.gross_salary = (basic + hra + da + allowances - deductions).toFixed(2);
            return updated;
        });
    };

    const handleRecalculate = () => {
        const basicVal = parseFloat(salaryData.basic) || 0;
        const hra = (basicVal * 0.40).toFixed(2);
        const da = (basicVal * 0.10).toFixed(2);
        const allowances = (basicVal * 0.05).toFixed(2);
        const deductions = (basicVal * 0.02).toFixed(2);
        const gross = (basicVal + parseFloat(hra) + parseFloat(da) + parseFloat(allowances) - parseFloat(deductions)).toFixed(2);
        setSalaryData(prev => ({
            ...prev,
            hra,
            da,
            allowances,
            deductions,
            gross_salary: gross
        }));
    };

    const formatINR = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const maskAadhar = (aadhar) => {
        if (!aadhar) return "N/A";
        return aadhar.replace(/\d{8}(\d{4})/, "XXXX-XXXX-$1");
    };

    const handleSaveSalary = async () => {
        try {
            await api.put(`/employees/${id}`, { ...salaryData });
            setIsEditingSalary(false);
            fetchEmployee();
            addToast("Salary structure updated successfully", "success");
        } catch (err) {
            addToast("Failed to update salary: " + (err.response?.data?.message || err.message), "error");
        }
    };

    const handleBack = () => {
        if (user?.role_id === 3) navigate("/hr/employees");
        else if (user?.role_id === 2) navigate("/admin/employees");
        else navigate("/superadmin/employees");
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96">
            <RefreshCw size={48} className="animate-spin text-[#00b9cd] mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Bio-Metrics...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-10 border-2 border-red-100 dark:border-red-900/30">
            <Zap size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-xl font-black text-red-600 dark:text-red-400 font-paperlogy">{error}</p>
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
            <button
                onClick={handleBack}
                className="flex items-center gap-3 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest mb-10 group"
            >
                <div className="p-3 bg-white dark:bg-slate-900 rounded-10 border-2 border-slate-900/5 group-hover:border-slate-900 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                Back to Command Hub
            </button>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Side: Identity */}
                <div className="w-full lg:w-1/3 xl:w-1/4 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-10 p-10 border-2 border-slate-900 dark:border-white/10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out relative overflow-hidden group ">
                        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-10 p-0.5 shadow-inner border-2 border-slate-900/5 overflow-hidden mb-6 hover:scale-105 transition-transform duration-500">
                                {employee?.profile_photo ? (
                                    <img
                                        src={employee.profile_photo.startsWith('http') ? employee.profile_photo : `${STORAGE_URL}/${employee.profile_photo}`}
                                        alt={employee.user?.name}
                                        className="w-full h-full object-cover rounded-10"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600">
                                        {employee?.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white font-paperlogy uppercase tracking-tight mb-2 leading-tight">
                                {employee?.user?.name}
                            </h1>
                            <div className="px-5 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-10 text-[10px] font-black uppercase tracking-widest border border-blue-200/50 mb-6">
                                {employee?.designation?.name || "Unassigned Unit"}
                            </div>
                            
                            <div className="w-full space-y-4 pt-8 border-t-2 border-slate-900/5">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-10 text-slate-400"><Hash size={16} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{employee?.employee_code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-left">
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-10 text-slate-400"><Shield size={16} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Clearance</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                            {employee?.user?.role?.name || "Standard Agent"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-10 border-2 border-slate-800 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Status</h3>
                            <div className={`h-2 w-2 rounded-10 ${employee?.user?.is_active ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connectivity</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${employee?.user?.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {employee?.user?.is_active ? 'ONLINE' : 'DEACTIVATED'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comm Link</span>
                                <span className="text-[10px] font-black text-white uppercase">{employee?.phone || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Data Modules */}
                <div className="flex-1 space-y-8 overflow-hidden">
                    {/* Bio-Metrics */}
                    <div className="bg-white dark:bg-slate-900 rounded-10 p-10 border-2 border-slate-900/10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-slate-900/5">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <span className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-10 flex items-center justify-center shrink-0">
                                    <User size={20} />
                                </span>
                                Bio-Metric Intelligence
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-1 group min-w-0">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Link (Email)</label>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10 truncate">
                                    {employee?.user?.email}
                                </div>
                            </div>
                            <div className="space-y-1 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stardate of Birth</label>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10 whitespace-nowrap">
                                    {formatDate(employee?.dob)}
                                </div>
                            </div>
                            <div className="space-y-1 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation Stardate</label>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10 whitespace-nowrap">
                                    {formatDate(employee?.date_of_joining)}
                                </div>
                            </div>
                            <div className="space-y-1 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender Classification</label>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10 uppercase truncate">
                                    {employee?.gender || "Undefined"}
                                </div>
                            </div>
                            <div className="space-y-1 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Civilian Status</label>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10 uppercase truncate">
                                    {employee?.marital_status || "Single"}
                                </div>
                            </div>
                            <div className="space-y-1 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector Origin</label>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10 uppercase truncate">
                                    {employee?.country?.name || "Global HQ"}
                                </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3 space-y-1 group">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Address</label>
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10 leading-relaxed uppercase break-words">
                                    {employee?.address || "Mobile Deployment"}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-10 border-t-2 border-slate-900/5">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Aadhar ID Matrix <span className="px-1.5 py-0.5 bg-slate-200 rounded-10 text-[7px]">ENCRYPTED</span>
                                </label>
                                <div className="p-5 bg-slate-900 text-white rounded-10 font-mono text-xs tracking-[0.2em]">
                                    {maskAadhar(employee?.aadhar_number)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN ID Protocol</label>
                                <div className="p-5 bg-slate-900 text-white rounded-10 font-mono text-xs tracking-[0.2em] uppercase">
                                    {employee?.pan_number || "NOT RECORDED"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salary Algorithm Matrix */}
                    <div className="bg-white dark:bg-slate-900 rounded-10 p-10 border-2 border-slate-900 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out relative overflow-hidden">
                        <div className="absolute top-0 right-10 w-32 h-32 bg-[#00b9cd]/5 rounded-10 -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-slate-900/5">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <span className="w-10 h-10 bg-[#00b9cd]/10 text-[#00b9cd] rounded-10 flex items-center justify-center shrink-0">
                                    <DollarSign size={20} />
                                </span>
                                Salary Algorithm Matrix
                            </h2>
                            {canManageSalary && (
                                <button
                                    onClick={() => setIsEditingSalary(!isEditingSalary)}
                                    className={`px-5 py-2.5 rounded-10 text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 ${
                                        isEditingSalary 
                                        ? 'bg-slate-900 text-white hover:bg-slate-800' 
                                        : 'bg-[#00b9cd] text-white hover:bg-[#00b9cd]/80'
                                    }`}
                                >
                                    {isEditingSalary ? "Exit Simulation" : "Adjust Calibration"}
                                </button>
                            )}
                        </div>

                        {isEditingSalary ? (
                            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSaveSalary(); }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {['basic', 'hra', 'da', 'allowances', 'deductions'].map((field) => (
                                        <div key={field} className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">{field.replace('_', ' ')}</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                                                <input
                                                    type="number"
                                                    name={field}
                                                    value={salaryData[field]}
                                                    onChange={handleSalaryChange}
                                                    className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-[#00b9cd]/30 rounded-10 outline-none font-black text-sm text-indigo-600 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-end pb-1">
                                        <button
                                            type="button"
                                            onClick={handleRecalculate}
                                            className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-10 text-[10px] font-black uppercase tracking-widest border border-indigo-200/50 hover:bg-indigo-100 transition-all active:scale-[0.98]"
                                        >
                                            Auto-Recalculate
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-center p-10 bg-slate-900 dark:bg-white/5 rounded-10 border-2 border-slate-900 shadow-md gap-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">Simulated Gross Payout</p>
                                        <div className="text-5xl font-black text-white font-paperlogy leading-none">
                                            {formatINR(salaryData.gross_salary)}
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full md:w-auto px-12 py-6 bg-[#00b9cd] text-white rounded-10 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:bg-teal-400 hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all active:translate-y-1 flex items-center justify-center gap-3"
                                    >
                                        <Save size={20} />
                                        Commit Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center border-b border-slate-900/5 pb-4 group">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Core Accumulation (Basic)</span>
                                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{formatINR(salaryData.basic)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-900/5 pb-4 group">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Residential Utility (HRA)</span>
                                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{formatINR(salaryData.hra)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-900/5 pb-4 group">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Dearness Allowance (DA)</span>
                                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{formatINR(salaryData.da)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-900/5 pb-4 group">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Additional Incentives</span>
                                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{formatINR(salaryData.allowances)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-900/5 pb-4 group">
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest group-hover:text-red-600 transition-colors">Compulsory Deductions</span>
                                        <span className="text-lg font-black text-red-500">-{formatINR(salaryData.deductions)}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/5 rounded-10 p-12 border-2 border-slate-900/5 flex flex-col justify-center items-center relative overflow-hidden text-center">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-[#00b9cd]"></div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Total Unit Valuation (Gross)</p>
                                    <div className="text-6xl font-black text-slate-900 dark:text-white font-paperlogy leading-none mb-6 tracking-tighter">
                                        {formatINR(salaryData.gross_salary)}
                                    </div>
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <div className="h-2 w-2 rounded-10 bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Active Payroll Node</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfilePage;