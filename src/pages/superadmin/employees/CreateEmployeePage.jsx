import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { ArrowLeft, UserPlus, Save, X, Shield, Mail, Lock, User, Briefcase, FileText } from "lucide-react";

const CreateUserPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSuperAdmin = user?.role_id === 1;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role_id: 4, // Default to Employee
        joining_category: "New Joinee",
        temp_password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [files, setFiles] = useState({ aadhar_file: null, pan_file: null });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleBack = () => {
        const basePath = user?.role_id === 1 ? '/superadmin' : user?.role_id === 2 ? '/admin' : '/hr';
        navigate(`${basePath}/employees`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (files.aadhar_file) data.append('aadhar_file', files.aadhar_file);
        if (files.pan_file) data.append('pan_file', files.pan_file);

        try {
            await api.post("/users", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setSuccess("Agent credentials generated successfully!");
            setTimeout(() => {
                handleBack();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initiate recruitment sequence.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-[1000px] mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <button
                onClick={handleBack}
                className="flex items-center gap-3 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest mb-10 group"
            >
                <div className="p-3 bg-white dark:bg-slate-900 rounded-10 border-2 border-slate-900/5 group-hover:border-slate-900 transition-colors shadow-md">
                    <ArrowLeft size={16} />
                </div>
                Return to Hub
            </button>

            <div className="mb-12">
                <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight lowercase">
                    Initiate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Recruitment</span>
                </h1>
                <div className="flex items-center gap-3 mt-4">
                    <span className="h-1.5 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-10"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol: New Agent Onboarding</p>
                </div>
            </div>

            {/* Notification Bar */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-10 mb-8 flex items-center gap-4 animate-in zoom-in-95">
                    <X className="shrink-0" size={20} />
                    <p className="text-xs font-black uppercase tracking-wider">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-6 rounded-10 mb-8 flex items-center gap-4 animate-in zoom-in-95">
                    <Save className="shrink-0" size={20} />
                    <p className="text-xs font-black uppercase tracking-wider">{success}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-10 rounded-10 border-2 border-slate-900/10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out transition-all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Primary Identity Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-900/5 mb-2">
                            <User className="text-blue-500" size={18} />
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Primary Identity</h2>
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Designation (Name)</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                className="w-full px-6 py-4 rounded-10 border-2 border-slate-900/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all font-bold text-sm" 
                                placeholder="Enter agent name..."
                                required 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comm Link (Email)</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                className="w-full px-6 py-4 rounded-10 border-2 border-slate-900/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all font-bold text-sm" 
                                placeholder="agent@system.hub"
                                required 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Access Level</label>
                            <div className="relative">
                                <select 
                                    name="role_id" 
                                    value={formData.role_id} 
                                    onChange={handleChange} 
                                    className="w-full px-6 py-4 rounded-10 border-2 border-slate-900/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                                >
                                    {isSuperAdmin && <option value={2}>Administrator</option>}
                                    {isSuperAdmin && <option value={3}>HR Agent</option>}
                                    <option value={4}>Standard Personnel</option>
                                </select>
                                <Shield className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Operational Details Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-900/5 mb-2">
                            <Briefcase className="text-indigo-500" size={18} />
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Operational Intel</h2>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Onboarding Category</label>
                            <div className="relative">
                                <select 
                                    name="joining_category" 
                                    value={formData.joining_category} 
                                    onChange={handleChange} 
                                    className="w-full px-6 py-4 rounded-10 border-2 border-slate-900/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                                >
                                    <option value="New Joinee">Initial Activation</option>
                                    <option value="Intern">Probationary Intern</option>
                                    <option value="Permanent">Permanent Deployment</option>
                                </select>
                                <FileText className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Pass (Temp Password)</label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    name="temp_password" 
                                    value={formData.temp_password} 
                                    onChange={handleChange} 
                                    className="w-full px-6 py-4 rounded-10 border-2 border-slate-900/5 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all font-bold text-sm" 
                                    placeholder="Enter initial passkey..."
                                    required 
                                    minLength={4} 
                                />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-center">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Aadhar ID Check</label>
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-900/10 rounded-10 p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                    <FileText size={20} className={files.aadhar_file ? "text-emerald-500" : "text-slate-300"} />
                                    <span className="text-[8px] font-bold mt-2 truncate w-full text-center">{files.aadhar_file ? files.aadhar_file.name : "Upload ID"}</span>
                                    <input type="file" name="aadhar_file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                                </label>
                            </div>
                            <div className="space-y-1.5 text-center">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">PAN ID Check</label>
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-900/10 rounded-10 p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                    <FileText size={20} className={files.pan_file ? "text-emerald-500" : "text-slate-300"} />
                                    <span className="text-[8px] font-bold mt-2 truncate w-full text-center">{files.pan_file ? files.pan_file.name : "Upload ID"}</span>
                                    <input type="file" name="pan_file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 mt-12 pt-10 border-t-2 border-slate-900/5">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white rounded-10 text-sm font-black uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:bg-blue-500 active:translate-y-1 active:shadow-none transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-10 animate-spin"></div> : <><UserPlus size={18} /> Confirm Onboarding</>}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleBack} 
                        className="w-full sm:w-auto px-12 py-5 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-2 border-slate-900/10 rounded-10 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
                    >
                        Abort Sequence
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUserPage;