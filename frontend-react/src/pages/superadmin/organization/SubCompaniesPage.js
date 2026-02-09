import React, { useState, useEffect } from "react";
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
            setFormError(err.response?.data?.message || "Failed to delete sub-company. It may have associated employees.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSubCompanies = subCompanies.filter(sc =>
        sc && sc.name && sc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50">
                    {successMessage}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sub-Companies Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage sub-companies across countries</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        + Add Sub-Company
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by sub-company name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none w-full max-w-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading sub-companies...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 dark:text-red-400">{error}</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Code</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Country</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No sub-companies found
                                    </td>
                                </tr>
                            ) : (
                                filteredSubCompanies.map(subCompany => (
                                    <tr key={subCompany.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="p-3 text-gray-900 dark:text-white">{subCompany.name}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">{subCompany.code}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            {subCompany.country?.name || 'N/A'}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                subCompany.is_active 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {subCompany.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(subCompany)}
                                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(subCompany)}
                                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Sub-Company</h2>
                        {formError && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">{formError}</div>}
                        <form onSubmit={handleAddSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sub-Company Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sub-Company Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., WOWL-IN"
                                    maxLength="20"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Country</label>
                                <select
                                    value={formData.country_id}
                                    onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                        <option key={country.id} value={country.id}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Sub-Company</h2>
                        {formError && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">{formError}</div>}
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sub-Company Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sub-Company Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    maxLength="20"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Country</label>
                                <select
                                    value={formData.country_id}
                                    onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                        <option key={country.id} value={country.id}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Updating..." : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Sub-Company</h2>
                        {formError && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">{formError}</div>}
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete <strong>{selectedSubCompany?.name}</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                disabled={isSubmitting}
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

export default SubCompaniesPage;
