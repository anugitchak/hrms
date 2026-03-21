import React, { useState, useEffect } from "react";
import {
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Search,
    AlertCircle,
    X,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useGlobalUI } from "../context/GlobalUIContext";

const DesignationManagement = () => {
    const { user } = useAuth();
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
    const [currentDesignation, setCurrentDesignation] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        // level: "",
        description: "",
        is_active: true,
    });
    const [errors, setErrors] = useState({});
    const [submitLoading, setSubmitLoading] = useState(false);
    const { addToast, confirm } = useGlobalUI();

    // Permission check
    // user.role_id: 1=SuperAdmin, 2=Admin, 3=HR
    const canManage = user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_designations") || user?.can_manage_designations;

    const fetchDesignations = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/designations");
            setDesignations(response.data);
        } catch (error) {
            console.error("Error fetching designations:", error);
            showNotification("error", "Failed to fetch designations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesignations();
    }, []);

    useEffect(() => {
        fetchDesignations();
    }, []);

    const showNotification = (type, message) => {
        addToast(message, type);
    };

    const handleOpenModal = (mode, designation = null) => {
        setModalMode(mode);
        setCurrentDesignation(designation);
        setFormData({
            name: designation ? designation.name : "",
            // level: designation ? designation.level : "", 
            description: designation?.description || "",
            is_active: designation ? designation.is_active : true,
        });
        setErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentDesignation(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setErrors({});

        try {
            if (modalMode === "create") {
                await axios.post("/designations", formData);
                showNotification("success", "Designation created successfully!");
            } else {
                await axios.put(`/designations/${currentDesignation.id}`, formData);
                showNotification("success", "Designation updated successfully!");
            }
            fetchDesignations();
            handleCloseModal();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                showNotification("error", error.response?.data?.message || "Operation failed.");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "Delete Designation",
            message: "Are you sure you want to delete this designation?",
            confirmText: "Delete",
            type: "danger"
        });
        
        if (!confirmed) return;

        try {
            await axios.delete(`/designations/${id}`);
            showNotification("success", "Designation deleted successfully!");
            fetchDesignations();
        } catch (error) {
            showNotification("error", error.response?.data?.message || "Failed to delete.");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        // Optimistic update
        const updatedList = designations.map(d =>
            d.id === id ? { ...d, is_active: !currentStatus } : d
        );
        setDesignations(updatedList);

        try {
            await axios.put(`/designations/${id}`, { ...designations.find(d => d.id === id), is_active: !currentStatus });
            showNotification("success", "Status updated.");
            fetchDesignations(); // Refresh to be sure
        } catch (error) {
            showNotification("error", "Failed to update status.");
            fetchDesignations(); // Revert
        }
    };

    const filteredDesignations = designations.filter((designation) =>
        designation.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        <span className="italic">Designation</span> <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Define hierarchy and organizational titles</p>
                        </div>
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenModal("create")}
                        className="flex items-center gap-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span className="uppercase tracking-widest">Add Designation</span>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1">

                {/* Search Bar */}
                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] mb-10 flex flex-col md:flex-row gap-5">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text" id="designation-search" name="search" autoComplete="off"
                            placeholder="Search designations..."
                            className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Card Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl shadow-sm animate-pulse border-2 border-slate-100 dark:border-white/5">
                                <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-2xl w-3/4 mb-4" />
                                <div className="h-4 bg-slate-50 dark:bg-white/5 rounded-lg w-full mb-3" />
                                <div className="h-10 bg-slate-50 dark:bg-white/5 rounded-2xl w-full mt-4" />
                            </div>
                        ))}
                    </div>
                ) : filteredDesignations.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-20 text-center flex flex-col items-center gap-6 mt-4 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] border-4 border-dashed border-slate-200 dark:border-white/10">
                        <AlertCircle size={64} className="text-slate-300 opacity-50" />
                        <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No designations found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                        {filteredDesignations.map((designation) => (
                            <div key={designation.id} className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group ${designation.is_active ? '' : 'grayscale opacity-70'}`}>
                                <div className="mb-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black border border-white/20 shadow-md group-hover:scale-110 transition-transform duration-500">
                                                {designation.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors duration-300">{designation.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`w-2 h-2 rounded-full ${designation.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{designation.is_active ? 'Active' : 'Inactive'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed min-h-[3rem] px-1">{designation.description || 'No description provided.'}</p>
                                </div>

                                {canManage && (
                                    <div className="flex items-center gap-3 pt-6 border-t-2 border-slate-50 dark:border-white/5">
                                        <button onClick={() => handleToggleStatus(designation.id, designation.is_active)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all group/btn ${designation.is_active ? 'border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-600 hover:text-white hover:border-red-600' : 'border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-600 hover:text-white hover:border-green-600'}`}
                                            title={designation.is_active ? 'Disable' : 'Enable'}>
                                            {designation.is_active ? <XCircle size={18} strokeWidth={2.5} /> : <CheckCircle size={18} strokeWidth={2.5} />}
                                        </button>
                                        <button onClick={() => handleOpenModal('edit', designation)}
                                            className="flex-1 py-2.5 px-4 bg-slate-50 dark:bg-white/5 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all hover:border-teal-600 hover:shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group/btn"
                                        >
                                            <Edit2 size={12} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(designation.id)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-900/10 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all group/btn"
                                            title="Delete">
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 border-none backdrop-blur-md transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-lg overflow-hidden transform transition-all duration-300 rounded-3xl">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                    {modalMode === "create" ? "Add Designation" : "Edit Designation"}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                    {modalMode === "create" ? "Create a new organizational title" : "Update designation details"}
                                </p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 dark:text-slate-500">
                                <X size={24} strokeWidth={2.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div>
                                <label htmlFor="designation_name" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                    Designation Name *
                                </label>
                                <div className="relative group/input">
                                    <Edit2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="text" id="designation_name" name="name" autoComplete="off" required
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all font-paperlogy"
                                        placeholder="e.g. Senior Software Engineer"
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1 tracking-wider">{errors.name[0]}</p>}
                            </div>

                            <div>
                                <label htmlFor="designation_description" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                    Description
                                </label>
                                <textarea
                                    id="designation_description" name="description" autoComplete="off"
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none h-32"
                                    placeholder="Optional description of roles and responsibilities..."
                                    value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                {errors.description && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1 tracking-wider">{errors.description[0]}</p>}
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border-2 border-slate-900/5 dark:border-white/5 group">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        name="is_active"
                                        className="sr-only peer"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 rounded-full shadow-inner" />
                                </label>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Active Status</span>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button" onClick={handleCloseModal}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={submitLoading}
                                    className={`flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 ${submitLoading ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md'}`}
                                >
                                    {submitLoading ? "Saving..." : (<><CheckCircle size={16} strokeWidth={3} /> Save Designation</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignationManagement;
