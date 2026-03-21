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
    const canDelete = user?.role_id === 1 || user?.permissions?.includes("can_delete_departments"); // Permission-based override

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
                        <span className="italic">Departments</span> <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage organizational structure and departmental units</p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchDepartments}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md group"
                    >
                        <RefreshCw size={16} className={`text-teal-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                        <span className="uppercase tracking-widest">Refresh</span>
                    </button>
                    {canManage && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
                        >
                            <Plus size={16} strokeWidth={3} />
                            <span className="uppercase tracking-widest">Add Department</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] mb-10 flex flex-col md:flex-row gap-5">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input
                        type="text" id="department_search" name="search" aria-label="Search departments" autoComplete="off"
                        placeholder="Search by department name..."
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                        value={searchQuery} onChange={handleSearch}
                    />
                </div>
                <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest ml-auto">
                    Total Departments: <span className="ml-2 text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg">{departments.length}</span>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="relative">
                {loading ? (
                    <div className="p-20 text-center bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] border-2 border-dashed border-teal-500/30">
                        <RefreshCw className="animate-spin mx-auto text-teal-500 mb-4" size={40} />
                        <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Loading Departments...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600 font-bold bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-3xl shadow-lg w-full max-w-md mx-auto">
                        <AlertTriangle className="mx-auto mb-2" size={32} />
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredDepartments.length === 0 ? (
                            <div className="col-span-full p-20 bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center rounded-[3rem]">
                                <Building2 size={64} className="text-slate-300 mb-4 opacity-50" />
                                <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No departments found.</p>
                            </div>
                        ) : (
                            filteredDepartments.map((dept) => (
                                <div key={dept.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group">
                                    <div className="mb-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 border border-teal-100 dark:border-teal-500/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                <Building2 size={24} strokeWidth={2.5} />
                                            </div>
                                            <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                                                ID: #{dept.id}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-teal-600 transition-colors duration-300">{dept.name}</h3>
                                        <div className="mt-4 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                            <Clock size={14} strokeWidth={2.5} />
                                            <span className="text-xs font-bold font-mono tracking-tight uppercase">Created: {formatDate(dept.created_at)}</span>
                                        </div>
                                    </div>

                                    {canManage && (
                                        <div className="flex gap-4 pt-6 border-t-2 border-slate-50 dark:border-white/5">
                                            <button
                                                onClick={() => openEditModal(dept)}
                                                className="flex-1 py-3 px-4 bg-slate-50 dark:bg-white/5 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all hover:border-teal-600 hover:shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group/btn"
                                            >
                                                <Edit2 size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                                Edit
                                            </button>
                                            {canDelete && (
                                                <button
                                                    onClick={() => openDeleteModal(dept)}
                                                    className="flex-1 py-3 px-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border-2 border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest transition-all hover:border-red-600 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group/btn"
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
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 border-none backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-lg overflow-hidden transform transition-all duration-300 rounded-3xl">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Add Department</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Create a new organizational unit</p>
                            </div>
                            <button onClick={closeModals} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="p-8">
                            {formError && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                                    <AlertTriangle size={18} /> {formError}
                                </div>
                            )}
                            <div className="mb-8">
                                <label htmlFor="add_department_name" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Department Name *</label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-teal-500 transition-colors" size={18} />
                                    <input
                                        id="add_department_name" name="name" autoComplete="off" type="text"
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="e.g. Engineering, HR, Marketing" autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button" onClick={closeModals}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-1 py-4 bg-teal-600 hover:bg-teal-500 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'}`}
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
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 border-none backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-lg overflow-hidden transform transition-all duration-300 rounded-3xl">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Edit Department</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Update organizational unit details</p>
                            </div>
                            <button onClick={closeModals} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-8">
                            {formError && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
                                    <AlertTriangle size={18} /> {formError}
                                </div>
                            )}
                            <div className="mb-8">
                                <label htmlFor="edit_department_name" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Department Name *</label>
                                <div className="relative group/input">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-teal-500 transition-colors" size={18} />
                                    <input
                                        id="edit_department_name" name="name" autoComplete="off" type="text"
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="Enter department name" autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button" onClick={closeModals}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-1 py-4 bg-teal-600 hover:bg-teal-500 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'}`}
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
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)] w-full max-w-sm p-10 text-center transform transition-all duration-300 rounded-[2.5rem]">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 mb-8 border-2 border-red-100 dark:border-red-500/20 shadow-sm group">
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

export default DepartmentsPage;
