import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Clock, Building2, AlertTriangle, RefreshCw } from "lucide-react";
import api from "../../../api/axios";
import { formatDate } from "../../../utils/dateUtils";
import { useAuth } from "../../../context/AuthContext";
import { useGlobalUI } from "../../../context/GlobalUIContext";

const DepartmentsPage = () => {
    const { user } = useAuth();
    const { addToast } = useGlobalUI();
    const canManage = user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_departments");
    const canDelete = user?.role_id === 1 || user?.permissions?.includes("can_manage_departments") || user?.can_manage_departments;

    // State
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: "" });
    const [formError, setFormError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch departments", err);
            setError("Failed to load departments.");
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const openAddModal = () => {
        setFormData({ name: "" });
        setFormError(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (dept) => {
        setSelectedDepartment(dept);
        setFormData({ name: dept.name });
        setFormError(null);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (dept) => {
        setSelectedDepartment(dept);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedDepartment(null);
        setFormError(null);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError("Department name is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post("/departments", formData);
            setDepartments([...departments, response.data.department].sort((a, b) => a.name.localeCompare(b.name)));
            addToast("Department created successfully!", "success");
            closeModals();
        } catch (err) {
            console.error("Failed to create department", err);
            setFormError(err.response?.data?.message || "Failed to create department.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError("Department name is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.put(`/departments/${selectedDepartment.id}`, formData);
            setDepartments(departments.map(d => d.id === selectedDepartment.id ? response.data.department : d).sort((a, b) => a.name.localeCompare(b.name)));
            addToast("Department updated successfully!", "success");
            closeModals();
        } catch (err) {
            console.error("Failed to update department", err);
            setFormError(err.response?.data?.message || "Failed to update department.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`/departments/${selectedDepartment.id}`);
            setDepartments(departments.filter(d => d.id !== selectedDepartment.id));
            addToast("Department deleted successfully!", "success");
            closeModals();
        } catch (err) {
            console.error("Failed to delete department", err);
            addToast("Failed to delete department.", "error"); // Fallback if modal closed
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtered Departments
    const filteredDepartments = departments.filter(dept =>
        dept && dept.name && dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Departments <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage organizational structure and departmental units</p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchDepartments}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out cursor-pointer hover:-translate-y-1 active:translate-y-0 active:shadow-md group"
                    >
                        <RefreshCw size={16} className={`text-[#00b9cd] ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                        <span className="uppercase tracking-widest">Refresh</span>
                    </button>
                    {canManage && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                        >
                            <Plus size={16} strokeWidth={3} />
                            <span className="uppercase tracking-widest">Add Department</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 flex flex-col md:flex-row gap-5">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b9cd] transition-colors" size={18} />
                    <input
                        type="text" id="department_search" name="search" aria-label="Search departments" autoComplete="off"
                        placeholder="Search by department name..."
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                        value={searchQuery} onChange={handleSearch}
                    />
                </div>
                <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest ml-auto">
                    Total Departments: <span className="ml-2 text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-10">{departments.length}</span>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="relative">
                {loading ? (
                    <div className="p-20 text-center bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-dashed border-[#00b9cd]/30">
                        <RefreshCw className="animate-spin mx-auto text-[#00b9cd] mb-4" size={40} />
                        <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Loading Departments...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600 font-bold bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-10 shadow-lg w-full max-w-md mx-auto">
                        <AlertTriangle className="mx-auto mb-2" size={32} />
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredDepartments.length === 0 ? (
                            <div className="col-span-full p-20 bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center rounded-10">
                                <Building2 size={64} className="text-slate-300 mb-4 opacity-50" />
                                <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No departments found.</p>
                            </div>
                        ) : (
                            filteredDepartments.map((dept) => (
                                <div key={dept.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group">
                                    <div className="mb-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] border border-[#00b9cd]/10 dark:border-[#00b9cd]/20 shadow-md group-hover:scale-110 transition-transform duration-500">
                                                <Building2 size={24} strokeWidth={2.5} />
                                            </div>
                                            <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-10 text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                                                ID: #{dept.id}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-[#00b9cd] transition-colors duration-300">{dept.name}</h3>
                                        <div className="mt-4 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                            <Clock size={14} strokeWidth={2.5} />
                                            <span className="text-xs font-bold font-mono tracking-tight uppercase">Created: {formatDate(dept.created_at)}</span>
                                        </div>
                                    </div>

                                    {canManage && (
                                        <div className="flex gap-4 pt-6 border-t-2 border-slate-50 dark:border-white/5">
                                            <button
                                                onClick={() => openEditModal(dept)}
                                                className="flex-1 py-3 px-4 bg-slate-50 dark:bg-white/5 hover:bg-[#00b9cd] hover:text-white dark:hover:bg-[#00b9cd] border-2 border-slate-100 dark:border-white/5 rounded-10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all hover:border-[#00b9cd] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group/btn"
                                            >
                                                <Edit2 size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                                Edit
                                            </button>
                                            {canDelete && (
                                                <button
                                                    onClick={() => openDeleteModal(dept)}
                                                    className="flex-1 py-3 px-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border-2 border-red-100 dark:border-red-500/20 rounded-10 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest transition-all hover:border-red-600 dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-red-200 dark:hover:border-red-700 transition-all duration-500 ease-out active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <Trash2 size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 border-none backdrop-blur-md ">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-lg overflow-hidden transform rounded-10">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Add Department</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Create a new organizational unit</p>
                            </div>
                            <button onClick={closeModals} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-10 transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="p-8">
                            {formError && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 rounded-10 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                                    <AlertTriangle size={18} /> {formError}
                                </div>
                            )}
                            <div className="mb-8">
                                <label htmlFor="add_department_name" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Department Name *</label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#00b9cd] transition-colors" size={18} />
                                    <input
                                        id="add_department_name" name="name" autoComplete="off" type="text"
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="e.g. Engineering, HR, Marketing" autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button" onClick={closeModals}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-1 py-4 bg-[#00b9cd] hover:bg-[#00b9cd]/80 rounded-10 text-white font-black text-xs uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 active:translate-y-0 active:shadow-md'}`}
                                >
                                    {isSubmitting ? "Creating..." : (<><Plus size={16} strokeWidth={3} /> Create Department</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 border-none backdrop-blur-md ">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-lg overflow-hidden transform rounded-10">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Edit Department</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Update organizational unit details</p>
                            </div>
                            <button onClick={closeModals} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-10 transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-8">
                            {formError && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 rounded-10 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                                    <AlertTriangle size={18} /> {formError}
                                </div>
                            )}
                            <div className="mb-8">
                                <label htmlFor="edit_department_name" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Department Name *</label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#00b9cd] transition-colors" size={18} />
                                    <input
                                        id="edit_department_name" name="name" autoComplete="off" type="text"
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="Enter department name" autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button" onClick={closeModals}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-1 py-4 bg-[#00b9cd] hover:bg-[#00b9cd]/80 rounded-10 text-white font-black text-xs uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 active:translate-y-0 active:shadow-md'}`}
                                >
                                    {isSubmitting ? "Updating..." : (<><Edit2 size={16} strokeWidth={3} /> Update Department</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-md ">
                    <div className="bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl shadow-2xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-sm p-10 text-center transform rounded-10">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-10 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 mb-8 border-2 border-red-100 dark:border-red-500/20 shadow-md group">
                            <Trash2 className="h-10 w-10 group-hover:scale-110 transition-transform duration-500 shadow-red-500/50" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4">Confirm Delete</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-10">
                            Are you sure you want to delete <span className="text-slate-900 dark:text-white">"{selectedDepartment?.name}"</span>?
                            This action is permanent and cannot be undone.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={closeModals}
                                className="py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit} disabled={isSubmitting}
                                className={`py-4 bg-red-600 hover:bg-red-700 rounded-10 text-white font-black text-xs uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-red-200 dark:hover:border-red-700 transition-all duration-500 ease-out transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 active:translate-y-0 active:shadow-md'}`}
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

export default DepartmentsPage;
