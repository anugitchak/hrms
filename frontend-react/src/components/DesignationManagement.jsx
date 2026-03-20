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
        <div className="p-8">
            {/* Header matches AdminEmployeesPage */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-black font-paperlogy">Designations</h1>
                    <p className="text-sm font-medium text-gray-900">Define hierarchy and organizational titles</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenModal("create")}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Designation
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1">

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="card p-4 flex flex-wrap gap-4 items-center">
                        <div className="relative w-full max-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <label htmlFor="search-designations" className="sr-only">Search Designations</label>
                            <input
                                type="text"
                                id="search-designations"
                                name="search"
                                autoComplete="off"
                                placeholder="Search designations..."
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-black rounded-lg outline-none bg-white text-black focus:ring-4 focus:ring-brand-500 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Card Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="card p-5 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                                <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredDesignations.length === 0 ? (
                    <div className="card p-16 text-center flex flex-col items-center gap-4 mt-4">
                        <div className="bg-gray-100 p-5 rounded-2xl">
                            <AlertCircle size={40} className="text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-500">No designations found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {filteredDesignations.map((designation) => (
                            <div key={designation.id} className={`card p-5 flex flex-col gap-3 border-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ${designation.is_active ? 'border-black/10' : 'border-red-200 bg-red-50/30'}`}>
                                {/* Top row: icon + badge */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-lg font-black border-2 border-black shadow-[2px_2px_0px_black] shrink-0">
                                            {designation.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-black text-sm leading-tight">{designation.name}</h3>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full ${designation.is_active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                                        {designation.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-gray-500 font-medium min-h-[2rem]">{designation.description || '—'}</p>

                                {/* Actions */}
                                {canManage && (
                                    <div className="flex items-center gap-2 pt-2 border-t-2 border-black/5">
                                        <button onClick={() => handleToggleStatus(designation.id, designation.is_active)}
                                            className={`flex-1 text-xs font-bold py-1.5 rounded-lg border-2 transition-all ${designation.is_active ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100' : 'border-green-300 text-green-600 bg-green-50 hover:bg-green-100'}`}>
                                            {designation.is_active ? 'Disable' : 'Enable'}
                                        </button>
                                        <button onClick={() => handleOpenModal('edit', designation)}
                                            className="flex-1 text-xs font-bold py-1.5 rounded-lg border-2 border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(designation.id)}
                                            className="flex-1 text-xs font-bold py-1.5 rounded-lg border-2 border-black text-black bg-white hover:bg-gray-100 transition-all shadow-[2px_2px_0px_black]">
                                            Delete
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b-2 border-black">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {modalMode === "create" ? "Add Designation" : "Edit Designation"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="designation_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Designation Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="designation_name"
                                    name="name"
                                    autoComplete="off"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black focus:ring-4 focus:ring-brand-500 outline-none font-medium"
                                    placeholder="e.g. Senior Developer"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                            </div>

                            <div>
                                <label htmlFor="designation_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="designation_description"
                                    name="description"
                                    autoComplete="off"
                                    className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black focus:ring-4 focus:ring-brand-500 outline-none font-medium resize-none h-24"
                                    placeholder="Optional description..."
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Active Status
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 btn-primary flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Designation"
                                    )}
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
