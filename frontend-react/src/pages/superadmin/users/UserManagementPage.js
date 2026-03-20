import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Eye, UserX, X, CheckCircle, AlertCircle, Crown, Shield, Users, User, ScanFace, Clock } from "lucide-react";
import api from "../../../api/axios";
import { useGlobalUI } from "../../../context/GlobalUIContext";

const UserManagementPage = () => {
    const { addToast, confirm } = useGlobalUI();
    // State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role_id: 4, // Default to Employee
        temp_password: "", // Optional
    });

    // Fetch Users (Real Data Only)
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Create a timeout promise that rejects after 15 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out - Server took too long')), 15000)
            );

            // Attempt to fetch from API with race against timeout
            const response = await Promise.race([
                api.get("/users"),
                timeoutPromise
            ]);

            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                throw new Error("Invalid response format: Expected array of users");
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
            setError(err.message || "Failed to load users from server");
            // Do NOT set dummy users.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const [isEditing, setIsEditing] = useState(false);

    // Success Modal State
    const [successModal, setSuccessModal] = useState({ show: false, message: "" });

    // ... (fetchUsers remains same) ...

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEdit = (user) => {
        setIsEditing(true);
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            temp_password: "", // Leave blank if not changing
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (userId) => {
        const confirmed = await confirm({
            title: "Delete User",
            message: "Are you sure you want to delete this user? This action cannot be undone.",
            confirmText: "Yes, Delete",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
            setSuccessModal({ show: true, message: "User deleted successfully" });
        } catch (err) {
            console.error("Failed to delete user", err);
            addToast("Failed to delete user", "error");
        }
    };


    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing && selectedUser) {
                // Update
                const payload = { ...formData };
                if (!payload.temp_password) delete payload.temp_password; // Don't send empty password on update
                await api.put(`/users/${selectedUser.id}`, payload);
                setSuccessModal({ show: true, message: "User updated successfully" });
            } else {
                // Create
                const payload = { ...formData };
                if (!payload.temp_password) {
                    payload.temp_password = generatePassword(); // Auto-generate if blank
                }
                await api.post("/users", payload);
                setSuccessModal({ show: true, message: "User created successfully. Password: " + payload.temp_password });
            }
            fetchUsers();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error("Failed to save user", err);
            addToast("Failed to save user: " + (err.response?.data?.message || err.message), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", email: "", role_id: 4, temp_password: "" });
        setIsEditing(false);
        setSelectedUser(null);
    };

    const getRoleName = (roleId) => {
        switch (roleId) {
            case 1: return "Super Admin";
            case 2: return "Admin";
            case 3: return "HR";
            case 4: return "Employee";
            default: return "Unknown";
        }
    };

    const getRoleBadgeColor = (roleId) => {
        switch (roleId) {
            case 1: return "bg-purple-100 text-purple-800 border-purple-300";
            case 2: return "bg-blue-100 text-blue-800 border-blue-300";
            case 3: return "bg-pink-100 text-pink-800 border-pink-300";
            case 4: return "bg-green-100 text-green-800 border-green-300";
            default: return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const getRoleAvatarColor = (roleId) => {
        switch (roleId) {
            case 1: return "bg-gradient-to-br from-purple-500 to-purple-700 text-white";
            case 2: return "bg-gradient-to-br from-blue-500 to-blue-700 text-white";
            case 3: return "bg-gradient-to-br from-pink-500 to-pink-700 text-white";
            case 4: return "bg-gradient-to-br from-teal-500 to-teal-700 text-white";
            default: return "bg-gradient-to-br from-gray-500 to-gray-700 text-white";
        }
    };

    const getRoleIcon = (roleId) => {
        switch (roleId) {
            case 1: return <Crown size={12} />;
            case 2: return <Shield size={12} />;
            case 3: return <Users size={12} />;
            case 4: return <User size={12} />;
            default: return <User size={12} />;
        }
    };

    // Derived State
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? user.role_id === parseInt(roleFilter) : true;

        let matchesStatus = true;
        if (statusFilter === "active") matchesStatus = user.is_active;
        if (statusFilter === "inactive") matchesStatus = !user.is_active;

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-black font-paperlogy">User Management</h1>
                    <p className="text-sm font-medium text-gray-900 mt-1">Manage system users, roles, and permissions.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} />
                    + Create User
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[{label:'Total Users',val:users.length,icon:<Users size={20}/>,color:'bg-brand-500'},{label:'Active',val:users.filter(u=>u.is_active).length,icon:<CheckCircle size={20}/>,color:'bg-green-500'},{label:'Admins',val:users.filter(u=>u.role_id<=2).length,icon:<Shield size={20}/>,color:'bg-blue-500'},{label:'Employees',val:users.filter(u=>u.role_id===4).length,icon:<User size={20}/>,color:'bg-teal-500'}].map((s,i)=>(
                    <div key={i} className="card p-4 flex items-center gap-3">
                        <div className={`${s.color} text-white p-2.5 rounded-xl`}>{s.icon}</div>
                        <div>
                            <div className="text-2xl font-black text-black font-paperlogy">{s.val}</div>
                            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text" id="user_search" name="search" aria-label="Search users" autoComplete="off"
                        placeholder="Search by name or email..."
                        className="pl-9 w-full px-4 py-2 border-2 border-black rounded-lg outline-none focus:ring-4 focus:ring-brand-500 font-medium bg-white text-gray-900"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select id="role_filter" name="role" aria-label="Filter by Role"
                    className="px-4 py-2 border-2 border-black rounded-lg outline-none focus:ring-4 focus:ring-brand-500 font-bold bg-white text-gray-900"
                    value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="1">Super Admin</option>
                    <option value="2">Admin</option>
                    <option value="3">HR</option>
                    <option value="4">Employee</option>
                </select>
                <select id="status_filter" name="status" aria-label="Filter by Status"
                    className="px-4 py-2 border-2 border-black rounded-lg outline-none focus:ring-4 focus:ring-brand-500 font-bold bg-white text-gray-900"
                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* User Card Grid */}
            {loading ? (
                <div className="p-16 text-center font-bold text-gray-600">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
                <div className="card p-16 text-center flex flex-col items-center gap-4">
                    <div className="bg-gray-100 p-5 rounded-full">
                        <UserX size={48} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-black">No users found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredUsers.map((user) => {
                        const hasFaceData = user.face_descriptor || user.employee?.face_descriptor;
                        const isEnrolled = hasFaceData && hasFaceData !== 'null' && hasFaceData.trim() !== '';
                        return (
                            <div key={user.id} className="card p-5 hover:-translate-y-1 transition-all duration-200 hover:shadow-lg flex flex-col gap-4">
                                {/* Top: Avatar + Role */}
                                <div className="flex items-start justify-between">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${getRoleAvatarColor(user.role_id)} border-2 border-black shadow-[2px_2px_0px_black]`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold border rounded-full ${getRoleBadgeColor(user.role_id)}`}>
                                            {getRoleIcon(user.role_id)}
                                            {user.role?.name || getRoleName(user.role_id)}
                                        </span>
                                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                            user.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${ user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Name + Email */}
                                <div>
                                    <h3 className="font-extrabold text-black text-base leading-tight">{user.name}</h3>
                                    <p className="text-xs text-gray-600 mt-0.5 truncate">{user.email}</p>
                                </div>

                                {/* Face Enrollment Status */}
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                                    isEnrolled ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                                }`}>
                                    <ScanFace size={14} />
                                    {isEnrolled ? 'Face Enrolled' : 'Enrollment Pending'}
                                </div>

                                {/* Created */}
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock size={12} />
                                    Joined {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : 'N/A'}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1 border-t-2 border-black/5">
                                    <button onClick={() => handleEdit(user)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold border-2 border-black rounded-lg bg-white hover:bg-brand-50 hover:shadow-button transition-all">
                                        <Edit2 size={13} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(user.id)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border-2 border-red-300 text-red-600 rounded-lg bg-red-50 hover:bg-red-100 transition-all">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Crud Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-black">
                                {isEditing ? "Edit User" : "Create New User"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    id="user_name"
                                    name="name"
                                    autoComplete="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border-2 border-black rounded-lg outline-none focus:outline-none focus:ring-4 focus:ring-brand-500 font-medium focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    id="user_email"
                                    name="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border-2 border-black rounded-lg outline-none focus:outline-none focus:ring-4 focus:ring-brand-500 font-medium focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="user_role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    id="user_role"
                                    name="role_id"
                                    autoComplete="off"
                                    value={formData.role_id}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border-2 border-black rounded-lg outline-none focus:outline-none focus:ring-4 focus:ring-brand-500 font-medium focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value={1}>Super Admin</option>
                                    <option value={2}>Admin</option>
                                    <option value={3}>HR</option>
                                    <option value={4}>Employee</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="user_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password <span className="text-gray-400 dark:text-gray-900 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="password"
                                    id="user_password"
                                    name="temp_password"
                                    autoComplete="new-password"
                                    value={formData.temp_password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border-2 border-black rounded-lg outline-none focus:outline-none focus:ring-4 focus:ring-brand-500 font-medium focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder={isEditing ? "Leave blank to keep current" : "Auto-generated if blank"}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal.show && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 z-[60] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center transform transition-all duration-200 scale-100">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Success!</h3>
                        <p className="text-sm text-gray-900 mb-6 font-mono select-all bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">{successModal.message}</p>
                        <button
                            onClick={() => setSuccessModal({ show: false, message: "" })}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
