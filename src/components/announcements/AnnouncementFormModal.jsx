import React, { useState, useEffect } from "react";
import { X, Type, Megaphone, Target, Briefcase, Upload, Check, AlertCircle, ShieldCheck } from "lucide-react";

const AnnouncementFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        title: "",
        category: "General",
        message: "",
        target_audience: [],
        status: "Active",
        file: null,
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                target_audience: Array.isArray(initialData.target_audience)
                    ? initialData.target_audience
                    : initialData.target_audience ? JSON.parse(initialData.target_audience) : [],
                file: null,
            });
        } else {
            setFormData({
                title: "",
                category: "General",
                message: "",
                target_audience: [],
                status: "Active",
                file: null,
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: "" });
    };

    const handleAudienceChange = (role) => {
        const newAudience = formData.target_audience.includes(role)
            ? formData.target_audience.filter((r) => r !== role)
            : [...formData.target_audience, role];
        setFormData({ ...formData, target_audience: newAudience });
        if (errors.target_audience) setErrors({ ...errors, target_audience: "" });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            setErrors({ ...errors, file: "File size must be less than 5MB" });
            return;
        }
        setFormData({ ...formData, file });
        if (errors.file) setErrors({ ...errors, file: "" });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.message.trim()) newErrors.message = "Message is required";
        if (formData.target_audience.length === 0) newErrors.target_audience = "Select at least one audience";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-lg overflow-hidden transform rounded-10 flex flex-col max-h-[95vh]">
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {initialData ? "Refine Bulletin" : "Create New Dispatch"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure system access and intelligence details.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 rounded-10 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Subject Heading</label>
                        <div className="relative group">
                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-brand-800/20 border ${errors.title ? "border-red-500" : "border-slate-200 dark:border-white/10"} rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all`}
                                placeholder="e.g. Annual Policy Update"
                            />
                        </div>
                        {errors.title && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 px-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                >
                                    <option value="General" className="dark:bg-slate-900">General Notice</option>
                                    <option value="HR" className="dark:bg-slate-900">Human Resources</option>
                                    <option value="Payroll" className="dark:bg-slate-900">Finance & Payroll</option>
                                    <option value="Events" className="dark:bg-slate-900">Corporate Events</option>
                                    <option value="Urgent" className="dark:bg-slate-900">Urgent Priority</option>
                                </select>
                                <Megaphone className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={18} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                            <div className="relative">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                >
                                    <option value="Active" className="dark:bg-slate-900">Active / Live</option>
                                    <option value="Inactive" className="dark:bg-slate-900">Inactive / Draft</option>
                                </select>
                                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Target size={16} className="text-brand-500" /> Target Audience
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {["Employee", "Admin", "HR", "SuperAdmin"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleAudienceChange(role)}
                                    className={`px-4 py-2.5 rounded-10 text-xs font-bold transition-all border ${formData.target_audience.includes(role)
                                            ? "bg-brand-500 text-white border-brand-600 shadow-md shadow-brand-500/20"
                                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50"
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        {errors.target_audience && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 px-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.target_audience}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Intelligence Report</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border ${errors.message ? "border-red-500" : "border-slate-200 dark:border-white/10"} rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white transition-all resize-none`}
                            placeholder="Detail the intelligence report here..."
                        />
                        {errors.message && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 px-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Attachments</label>
                        <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-10 p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group">
                            <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="text-slate-400 group-hover:text-brand-500 transition-colors" size={24} />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                                    {formData.file ? formData.file.name : "Transmit Document"}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">PDF, IMAGE (MAX 5MB)</span>
                            </div>
                        </div>
                        {errors.file && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 px-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.file}</p>}
                    </div>
                </form>

                {/* Modal Actions */}
                <div className="p-8 space-y-3 bg-slate-50 dark:bg-transparent border-t border-slate-100 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-10 transition-all"
                        >
                            Abort
                        </button>
                        <button
                            onClick={handleSubmit} disabled={isSubmitting}
                            className="flex-[2] flex items-center justify-center gap-3 px-5 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-10 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-10 animate-spin"></div>
                            ) : (
                                <>
                                    <Check size={18} strokeWidth={3} />
                                    <span>{initialData ? "Apply Refinements" : "Engage Broadcast"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementFormModal;
