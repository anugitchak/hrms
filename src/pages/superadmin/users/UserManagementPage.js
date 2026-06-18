import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Eye, UserX, X, CheckCircle, AlertCircle, Crown, Shield, Users, User, Activity, Clock,ShieldCheck,Briefcase,ScanFace } from "lucide-react";
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
    const [statusFilter, setStatusFilter] = useState("active");

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
            const response = await api.delete(`/users/${userId}`);
            fetchUsers();
            setSuccessModal({
                show: true,
                message: response?.data?.message || "User action completed successfully"
            });
        } catch (err) {
            console.error("Failed to delete user", err);
            addToast(err.response?.data?.message || "Failed to delete user", "error");
        }
    };

    const handleToggleActive = async (user) => {
        const nextActive = !user.is_active;
        const confirmed = await confirm({
            title: nextActive ? "Activate User" : "Deactivate User",
            message: nextActive
                ? `Activate ${user.name}'s account?`
                : `Deactivate ${user.name}'s account? They won't be able to log in until re-activated.`,
            confirmText: nextActive ? "Activate" : "Deactivate",
            type: nextActive ? "info" : "warning"
        });

        if (!confirmed) return;

        try {
            const response = await api.put(`/users/${user.id}`, { is_active: nextActive });
            await fetchUsers();
            setSuccessModal({
                show: true,
                message: response?.data?.message || (nextActive ? "User activated successfully" : "User deactivated successfully")
            });
        } catch (err) {
            console.error("Failed to update active status", err);
            addToast(err.response?.data?.message || "Failed to update user status", "error");
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
            case 1: return "bg-purple-400 text-black";
            case 2: return "bg-blue-400 text-black";
            case 3: return "bg-pink-400 text-black";
            case 4: return "bg-brand-400 text-black";
            default: return "bg-gray-400 text-black";
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                <div>
                    <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight">
                        User <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage users and their permissions with ease.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold tracking-wide rounded-10 shadow-lg shadow-brand-500/25 dark:shadow-brand-500/10 hover:-translate-y-0.5 transition-all group"
                >
                    <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                    Create User
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-10 p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    {label:'Total Users', val:users.length, icon:<Users size={22} strokeWidth={2.5} />, color:'text-blue-600 dark:text-blue-400', bg:'bg-blue-50 dark:bg-blue-500/10', border:'border-blue-100 dark:border-blue-500/20'},
                    {label:'Active Now', val:users.filter(u=>u.is_active).length, icon:<Activity size={22} strokeWidth={2.5} />, color:'text-green-600 dark:text-green-400', bg:'bg-green-50 dark:bg-green-500/10', border:'border-green-100 dark:border-green-500/20'},
                    {label:'System Admins', val:users.filter(u=>u.role_id<=2).length, icon:<ShieldCheck size={22} strokeWidth={2.5} />, color:'text-indigo-600 dark:text-indigo-400', bg:'bg-indigo-50 dark:bg-indigo-500/10', border:'border-indigo-100 dark:border-indigo-500/20'},
                    {label:'Staff Members', val:users.filter(u=>u.role_id===4).length, icon:<Briefcase size={22} strokeWidth={2.5} />, color:'text-orange-600 dark:text-orange-400', bg:'bg-orange-50 dark:bg-orange-500/10', border:'border-orange-100 dark:border-orange-500/20'}
                ].map((s,i)=>(
                    <div key={i} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex items-center gap-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out ">
                        <div className={`${s.bg} ${s.color} ${s.border} border-2 p-3.5 rounded-10 shadow-md`}>{s.icon}</div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{s.val}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 flex flex-col lg:flex-row gap-5">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input
                        type="text" id="user_search" name="search" aria-label="Search users" autoComplete="off"
                        placeholder="Search by name or email..."
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="relative">
                        <select id="role_filter" name="role" aria-label="Filter by Role"
                            className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer min-w-[160px] transition-all"
                            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="" className="dark:bg-slate-900">All Roles</option>
                            <option value="1" className="dark:bg-slate-900">Super Admin</option>
                            <option value="2" className="dark:bg-slate-900">Admin</option>
                            <option value="3" className="dark:bg-slate-900">HR</option>
                            <option value="4" className="dark:bg-slate-900">Employee</option>
                        </select>
                        <Shield className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                    <div className="relative">
                        <select id="status_filter" name="status" aria-label="Filter by Status"
                            className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer min-w-[160px] transition-all"
                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="" className="dark:bg-slate-900">All Status</option>
                            <option value="active" className="dark:bg-slate-900">Active Only</option>
                            <option value="inactive" className="dark:bg-slate-900">Inactive Only</option>
                        </select>
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                </div>
            </div>

            {/* User Card Grid */}
            {loading ? (
                <div className="p-16 text-center font-bold text-gray-600">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
                <div className="card p-16 text-center flex flex-col items-center gap-4">
                    <div className="bg-gray-100 p-5 rounded-10">
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
                            <div key={user.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col gap-6 group">
                                {/* Top: Avatar + Role */}
                                <div className="flex items-start justify-between">
                                    <div className={`w-14 h-14 rounded-10 flex items-center justify-center text-xl font-bold ${getRoleAvatarColor(user.role_id)} border border-white dark:border-slate-800 shadow-md group-hover:scale-110 transition-transform duration-500`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-end gap-2.5">
                                        <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-10 tracking-wide ${getRoleBadgeColor(user.role_id)} border border-white/30 dark:border-white/10 shadow-md`}>
                                            <div className="bg-white/20 dark:bg-black/20 p-1 rounded-10">{getRoleIcon(user.role_id)}</div>
                                            {user.role?.name || getRoleName(user.role_id)}
                                        </span>
                                        <span className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold rounded-10 ${
                                            user.is_active
                                            ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20'
                                            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                                        } shadow-md transition-all`}>
                                            <span className={`w-2 h-2 rounded-10 ${ user.is_active ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-400'}`}></span>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Name + Email */}
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight tracking-tight">{user.name}</h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 break-all bg-slate-50 dark:bg-brand-800/30 border border-slate-900/10 dark:border-white/5 p-2 rounded-10">{user.email}</p>
                                </div>

                                {/* Face Enrollment Status */}
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-10 text-xs font-semibold tracking-tight border ${
                                    isEnrolled ? 'bg-brand-50/30 dark:bg-brand-500/10 border-brand-100 dark:border-brand-500/20 text-slate-700 dark:text-slate-300' : 'bg-orange-50/30 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-700 dark:text-orange-400'
                                } shadow-md group-hover:shadow-lg transition-all`}>
                                    <div className={`p-1.5 rounded-10 ${isEnrolled ? 'bg-brand-500/10 dark:bg-brand-500/20' : 'bg-orange-500/10 dark:bg-orange-500/20'}`}>
                                        <ScanFace size={16} strokeWidth={2.5} className={isEnrolled ? 'text-brand-600 dark:text-brand-400' : 'text-orange-600 dark:text-orange-400'} />
                                    </div>
                                    {isEnrolled ? 'Face Enrolled' : 'Face Enrollment Pending'}
                                </div>

                                {/* Created */}
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 tracking-wide">
                                    <Clock size={12} />
                                    Joined {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : 'N/A'}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 mt-auto">
                                    <button
                                        onClick={() => handleToggleActive(user)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border rounded-10 shadow-md transition-all focus:ring-2 active:scale-[0.98] ${
                                            user.is_active
                                                ? "border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 focus:ring-amber-500/10"
                                                : "border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 focus:ring-green-500/10"
                                        }`}
                                    >
                                        {user.is_active ? "Deactivate" : "Activate"}
                                    </button>
                                    <button onClick={() => handleEdit(user)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-2 border-slate-200 dark:border-white/10 rounded-10 bg-white dark:bg-brand-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-brand-800/60 hover:border-slate-300 dark:hover:border-white/20 shadow-md transition-all focus:ring-2 focus:ring-brand-500/10 active:scale-[0.98]">
                                        <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-10 group-hover:bg-[#00b9cd]/30 dark:group-hover:bg-[#00b9cd]/80/50 transition-colors duration-300">
                                            <Edit2 size={13} strokeWidth={2.5} />
                                        </div>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(user.id)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-10 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 shadow-md transition-all focus:ring-2 focus:ring-red-500/10 active:scale-[0.98]">
                                        <Trash2 size={13} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Crud Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-lg overflow-hidden transform rounded-10">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {isEditing ? "Update User Profile" : "Create New User"}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure system access and user details.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 p-2 rounded-10 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="user_name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                <input
                                    type="text" id="user_name" name="name" autoComplete="name" value={formData.name} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder="e.g. John Doe" required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="user_email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                                <input
                                    type="email" id="user_email" name="email" autoComplete="email" value={formData.email} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder="john@example.com" required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="user_role" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">System Role</label>
                                <div className="relative">
                                    <select
                                        id="user_role" name="role_id" autoComplete="off" value={formData.role_id} onChange={handleInputChange}
                                        className="appearance-none w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer transition-all"
                                    >
                                        <option value={1} className="dark:bg-slate-900">Super Admin</option>
                                        <option value={2} className="dark:bg-slate-900">Admin</option>
                                        <option value={3} className="dark:bg-slate-900">HR Manager</option>
                                        <option value={4} className="dark:bg-slate-900">Employee</option>
                                    </select>
                                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="user_password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Security Code <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                                </label>
                                <input
                                    type="password" id="user_password" name="temp_password" autoComplete="new-password" value={formData.temp_password} onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-brand-800/20 border border-slate-200 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                    placeholder={isEditing ? "Leave blank to keep current" : "Auto-generated if blank"}
                                />
                            </div>

                            <div className="pt-6 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`flex-[2] px-5 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-10 shadow-lg shadow-brand-500/20 transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal.show && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-xl">
                    <div className="bg-white dark:bg-slate-900/90 dark:backdrop-blur-2xl shadow-2xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-sm p-8 text-center transform scale-100 rounded-10">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-10 bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 mb-6 border border-green-100 dark:border-green-500/30 shadow-md">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Success!</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 bg-slate-50 dark:bg-white/5 p-4 rounded-10 break-all">
                            {successModal.message}
                        </p>
                        <button
                            onClick={() => setSuccessModal({ show: false, message: "" })}
                            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-10 shadow-lg shadow-brand-500/20 transition-all font-paperlogy"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
