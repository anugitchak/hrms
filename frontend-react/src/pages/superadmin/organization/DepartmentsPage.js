import React, { useState, useEffect } from "react";
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
        <div className="p-8">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-black font-paperlogy">Departments Management</h1>
                    <p className="text-sm text-gray-900 mt-1">Manage all departments in the organization</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchDepartments}
                        className="btn-secondary transition-colors text-sm font-medium"
                    >
                        Refresh
                    </button>
                    {canManage && (
                        <button
                            onClick={openAddModal}
                            className="btn-primary text-sm font-medium border-none"
                        >
                            + Add Department
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    id="search_departments"
                    name="search"
                    autoComplete="off"
                    type="text"
                    placeholder="Search by department name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="p-3 border-2 border-black rounded-lg outline-none w-full max-w-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors"
                />
            </div>

            {/* Cards Grid */}
            <div className="">
                {loading ? (
                    <div className="p-8 text-center text-gray-900 font-bold bg-white border-2 border-black hr-shadow rounded-lg w-full max-w-sm mx-auto">Loading departments...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600 font-bold bg-red-50 border-2 border-red-600 hr-shadow rounded-lg w-full max-w-sm mx-auto">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredDepartments.length === 0 ? (
                            <div className="col-span-full p-12 bg-gray-50 border-2 border-black border-dashed flex items-center justify-center rounded-xl">
                                <p className="text-xl font-bold text-gray-500">No departments found.</p>
                            </div>
                        ) : (
                            filteredDepartments.map((dept) => (
                                <div key={dept.id} className="bg-white border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-black text-black tracking-tight mb-4">{dept.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-3 py-1 bg-brand-100 border-2 border-black rounded-lg text-xs font-black text-brand-900 tracking-wider">
                                                CREATED: {formatDate(dept.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {canManage && (
                                        <div className="flex gap-3 mt-auto pt-4 border-t-4 border-gray-100">
                                            <button
                                                onClick={() => openEditModal(dept)}
                                                className="flex-1 py-2.5 bg-teal-400 hover:bg-teal-300 border-2 border-black rounded-lg text-black font-black text-sm tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                                            >
                                                Edit
                                            </button>
                                            {canDelete && (
                                                <button
                                                    onClick={() => openDeleteModal(dept)}
                                                    className="flex-1 py-2.5 bg-red-400 hover:bg-red-300 border-2 border-black rounded-lg text-black font-black text-sm tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                                                >
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
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Department</h2>
                        {formError && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{formError}</div>}
                        <form onSubmit={handleAddSubmit}>
                            <div className="mb-4">
                                <label htmlFor="add_department_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name *</label>
                                <input
                                    id="add_department_name"
                                    name="name"
                                    autoComplete="off"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 border-2 border-black rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="btn-secondary transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Department</h2>
                        {formError && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{formError}</div>}
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label htmlFor="edit_department_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name *</label>
                                <input
                                    id="edit_department_name"
                                    name="name"
                                    autoComplete="off"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 border-2 border-black rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="btn-secondary transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? "Updating..." : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Department</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModals}
                                className="btn-secondary transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={isSubmitting}
                                className={`px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentsPage;
