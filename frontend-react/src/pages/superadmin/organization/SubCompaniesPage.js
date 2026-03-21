import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Building2, Globe, RefreshCw, AlertTriangle } from "lucide-react";
import api from "../../../api/axios";

const SubCompaniesPage = () => {
    const [subCompanies, setSubCompanies] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubCompany, setSelectedSubCompany] = useState(null);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: "", code: "", country_id: "", is_active: true });
    const [formError, setFormError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subCompaniesRes, countriesRes] = await Promise.all([
                api.get("/sub-companies"),
                api.get("/countries")
            ]);
            setSubCompanies(subCompaniesRes.data);
            setCountries(countriesRes.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setError("Failed to load sub-companies.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const openAddModal = () => {
        setFormData({ name: "", code: "", country_id: "", is_active: true });
        setFormError(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (subCompany) => {
        setSelectedSubCompany(subCompany);
        setFormData({
            name: subCompany.name,
            code: subCompany.code,
            country_id: subCompany.country_id,
            is_active: subCompany.is_active
        });
        setFormError(null);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (subCompany) => {
        setSelectedSubCompany(subCompany);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedSubCompany(null);
        setFormError(null);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim() || !formData.country_id) {
            setFormError("All fields are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await api.post("/sub-companies", formData);
            setSubCompanies([...subCompanies, response.data.sub_company].sort((a, b) => a.name.localeCompare(b.name)));
            setSuccessMessage("Sub-company created successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            closeModals();
        } catch (err) {
            console.error("Failed to create sub-company", err);
            setFormError(err.response?.data?.message || "Failed to create sub-company.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim() || !formData.country_id) {
            setFormError("All fields are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await api.put(`/sub-companies/${selectedSubCompany.id}`, formData);
            setSubCompanies(subCompanies.map(sc => sc.id === selectedSubCompany.id ? response.data.sub_company : sc)
                .sort((a, b) => a.name.localeCompare(b.name)));
            setSuccessMessage("Sub-company updated successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            closeModals();
        } catch (err) {
            console.error("Failed to update sub-company", err);
            setFormError(err.response?.data?.message || "Failed to update sub-company.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`/sub-companies/${selectedSubCompany.id}`);
            setSubCompanies(subCompanies.filter(sc => sc.id !== selectedSubCompany.id));
            setSuccessMessage("Sub-company deleted successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            closeModals();
        } catch (err) {
            console.error("Failed to delete sub-company", err);
            setFormError(err.response?.data?.message || "Failed to delete sub-company.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSubCompanies = subCompanies.filter(sc =>
        sc && sc.name && sc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen relative">
            {successMessage && (
                <div className="fixed top-8 right-8 bg-white dark:bg-slate-900 border-2 border-teal-500 text-teal-600 p-4 rounded-2xl shadow-2xl z-[100] font-black uppercase tracking-widest text-xs flex items-center gap-3 animate-slide-in">
                    <div className="w-8 h-8 bg-teal-50 dark:bg-teal-500/10 rounded-xl flex items-center justify-center">
                        <Plus className="rotate-0" size={16} />
                    </div>
                    {successMessage}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        <span className="italic">Sub-Company</span> <span className="text-transparent bg-clip-text bg-[#00b9cd] font-paperlogy">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage branch locations and organizational entities</p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md group"
                    >
                        <RefreshCw size={16} className={`text-purple-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                        <span className="uppercase tracking-widest">Refresh</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span className="uppercase tracking-widest">Add Sub-Company</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] mb-10 flex flex-col md:flex-row gap-5">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                    <input
                        type="text" id="subcompany-search" name="search" autoComplete="off"
                        placeholder="Search by sub-company name..."
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all font-paperlogy"
                        value={searchQuery} onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Cards Grid */}
            <div className="relative">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl shadow-sm animate-pulse border-2 border-slate-100 dark:border-white/5">
                                <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-2xl w-3/4 mb-4" />
                                <div className="h-4 bg-slate-50 dark:bg-white/5 rounded-lg w-full mb-3" />
                                <div className="h-10 bg-slate-50 dark:bg-white/5 rounded-2xl w-full mt-4" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600 font-bold bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-3xl shadow-lg w-full max-w-md mx-auto flex flex-col items-center gap-3">
                        <AlertTriangle size={32} />
                        {error}
                    </div>
                ) : filteredSubCompanies.length === 0 ? (
                    <div className="p-20 bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center rounded-[3rem] text-center">
                        <Building2 size={64} className="text-slate-300 mb-4 opacity-50" />
                        <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No sub-companies found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredSubCompanies.map(subCompany => {
                            const palette = ["from-purple-500 to-purple-700", "from-blue-500 to-blue-700", "from-teal-500 to-teal-700", "from-pink-500 to-pink-700", "from-orange-500 to-orange-700", "from-indigo-500 to-indigo-700"];
                            const bg = palette[(subCompany.name?.charCodeAt(0) || 0) % palette.length];
                            return (
                                <div key={subCompany.id} className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group ${subCompany.is_active ? "" : "grayscale opacity-70"}`}>
                                    <div className="mb-8">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bg} text-white flex items-center justify-center text-xl font-black border border-white/20 shadow-md group-hover:scale-110 transition-transform duration-500`}>
                                                    {subCompany.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-purple-600 transition-colors duration-300">{subCompany.name}</h3>
                                                    <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1">{subCompany.code}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 rounded-full shrink-0 ${subCompany.is_active ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"}`}>
                                                {subCompany.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 group-hover:bg-purple-50 dark:group-hover:bg-purple-500/5 transition-colors duration-300">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-purple-500 transition-colors">
                                                <Globe size={16} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country</span>
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{subCompany.country?.name || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 pt-6 border-t-2 border-slate-50 dark:border-white/5">
                                        <button onClick={() => openEditModal(subCompany)}
                                            className="flex-1 py-3 px-4 bg-slate-50 dark:bg-white/5 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all hover:border-teal-600 hover:shadow-[4px_4px_0px_0px_rgba(20,184,166,0.3)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group/btn"
                                        >
                                            <Edit2 size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                            Edit
                                        </button>
                                        <button onClick={() => openDeleteModal(subCompany)}
                                            className="flex-1 py-3 px-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border-2 border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest transition-all hover:border-red-600 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group/btn"
                                        >
                                            <Trash2 size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[100] p-4 border-none backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-lg overflow-hidden transform transition-all duration-300 rounded-3xl">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Add Sub-Company</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Create a new branch location</p>
                            </div>
                            <button onClick={closeModals} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                            {formError && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                                    <AlertTriangle size={18} /> {formError}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Sub-Company Name *</label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                                    <input
                                        type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all font-paperlogy"
                                        placeholder="e.g. Acme Corp India" required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Sub-Company Code *</label>
                                <div className="relative group/input">
                                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                                    <input
                                        type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all font-paperlogy uppercase"
                                        placeholder="e.g. ACME-IN" maxLength="20" required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Country *</label>
                                <div className="relative group/input">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                                    <select
                                        value={formData.country_id} onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(country => (
                                            <option key={country.id} value={country.id}> {country.name} </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border-2 border-slate-900/5 dark:border-white/5 group">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 rounded-full shadow-inner" />
                                </label>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Active Status</span>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button" onClick={closeModals}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-1 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(126,34,206,0.3)] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'}`}
                                >
                                    {isSubmitting ? "Creating..." : (<><Plus size={16} strokeWidth={3} /> Create</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[100] p-4 border-none backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-lg overflow-hidden transform transition-all duration-300 rounded-3xl">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Edit Sub-Company</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Update branch details</p>
                            </div>
                            <button onClick={closeModals} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                            {formError && (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                                    <AlertTriangle size={18} /> {formError}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Sub-Company Name *</label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                                    <input
                                        type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all font-paperlogy"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Sub-Company Code *</label>
                                <div className="relative group/input">
                                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                                    <input
                                        type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-slate-900 dark:text-white transition-all font-paperlogy uppercase"
                                        maxLength="20" required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Country *</label>
                                <div className="relative group/input">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                                    <select
                                        value={formData.country_id} onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-bold text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(country => (
                                            <option key={country.id} value={country.id}> {country.name} </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border-2 border-slate-900/5 dark:border-white/5 group">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 rounded-full shadow-inner" />
                                </label>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Active Status</span>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button" onClick={closeModals}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-1 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(126,34,206,0.3)] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'}`}
                                >
                                    {isSubmitting ? "Updating..." : (<><Edit2 size={16} strokeWidth={3} /> Update</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)] w-full max-w-sm p-10 text-center transform transition-all duration-300 rounded-[2.5rem]">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 mb-8 border-2 border-red-100 dark:border-red-500/20 shadow-sm group">
                            <Trash2 className="h-10 w-10 group-hover:scale-110 transition-transform duration-500 shadow-red-500/50" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4">Confirm Delete</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-10">
                            Are you sure you want to delete <span className="text-slate-900 dark:text-white">"{selectedSubCompany?.name}"</span>? 
                            This action cannot be undone.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={closeModals}
                                className="py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit} disabled={isSubmitting}
                                className={`py-4 bg-red-600 hover:bg-red-700 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'}`}
                            >
                                {isSubmitting ? "Deleting..." : "Delete Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubCompaniesPage;