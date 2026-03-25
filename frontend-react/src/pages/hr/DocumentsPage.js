import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { FileText, Download, Trash2, Upload, Search, Filter, X, Eye, FileUp, CheckCircle, AlertTriangle, Plus,ChevronRight, Globe, User } from "lucide-react";
import { useGlobalUI } from "../../context/GlobalUIContext";

const DocumentsPage = () => {
    const { user } = useAuth();
    const { addToast, confirm } = useGlobalUI();
    const [documents, setDocuments] = useState([]);
    const [employees, setEmployees] = useState([]); // For Admin/HR filter
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ employee_id: "", document_type: "" });

    // Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({
        employee_id: "",
        document_type: "",
        document_title: "",
        file: null
    });
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    // Constants
    const isEmployee = user?.role_id === 4;
    const docTypes = ["Resume", "Offer Letter", "Aadhar", "PAN", "Experience Letter", "Payslip", "Voter ID", "Passport", "Other"];

    useEffect(() => {
        fetchDocuments();
        if (!isEmployee) {
            fetchEmployees();
        }
    }, [filters]); // Re-fetch when filters change

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            let params = {};
            if (filters.employee_id) params.employee_id = filters.employee_id;
            if (filters.document_type) params.document_type = filters.document_type;

            if (filters.document_type) params.document_type = filters.document_type;

            // Refactored to use api instance (baseURL is already set)
            // No need to pass token manually as interceptor handles it
            const response = await api.get("/employee-documents", {
                params: params
            });
            setDocuments(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching documents:", err);
            setError("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("document_type", uploadData.document_type);
            formData.append("document_title", uploadData.document_title);
            formData.append("file", uploadData.file);

            if (!isEmployee) {
                if (!uploadData.employee_id) {
                    addToast("Please select an employee.", "warning");
                    setUploading(false);
                    return;
                }
                formData.append("employee_id", uploadData.employee_id);
            }

            await api.post("/employee-documents", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            setIsUploadModalOpen(false);
            setUploadData({ employee_id: "", document_type: "", document_title: "", file: null });
            fetchDocuments(); // Refresh list
            addToast("Document uploaded successfully", "success");
        } catch (err) {
            console.error("Upload failed", err);
            addToast("Upload failed. Ensure file is within limits (2MB).", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "Delete Document",
            message: "Are you sure you want to delete this document?",
            confirmText: "Yes, Delete",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            await api.delete(`/employee-documents/${id}`);
            setDocuments(documents.filter(doc => doc.id !== id));
            addToast("Document deleted successfully", "success");
        } catch (err) {
            console.error("Delete failed", err);
            addToast("Failed to delete document.", "error");
        }
    };

    const handleView = async (doc) => {
        try {
            const response = await api.get(`/employee-documents/${doc.id}/download`, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error("View failed", err);
            addToast("Failed to view document.", "error");
        }
    };

    const handleDownload = async (doc) => {
        try {
            const response = await api.get(`/employee-documents/${doc.id}/download`, {
                responseType: 'blob', // Important
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const ext = doc.file_path.split('.').pop();
            link.setAttribute('download', `${doc.document_title}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            addToast("Download started", "info");
        } catch (err) {
            console.error("Download failed", err);
            addToast("Failed to download document.", "error");
        }
    }

    const filteredDocuments = documents; // Backend handles filtering via params

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Employee <span className="text-transparent bg-clip-text bg-[#00b9cd]">Documents</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Secure Management of Personal Files</p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                    >
                        <FileUp size={16} strokeWidth={3} />
                        <span className="uppercase tracking-widest text-nowrap">Upload Document</span>
                    </button>
                </div>
            </div>

            {/* Filters Section (Admin/HR Only) */}
            {!isEmployee && (
                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 border-2 border-slate-50 dark:border-white/5">
                    <div className="flex flex-col lg:flex-row items-end gap-6">
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Filter by Employee</label>
                            <div className="relative group/select">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:text-blue-500 transition-colors" size={18} />
                                <select
                                    id="filter_employee"
                                    name="filter_employee"
                                    className="pl-12 pr-10 w-full py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
                                    value={filters.employee_id}
                                    onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                                >
                                    <option value="">All Employees</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.employee_code})</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:text-blue-500 transition-transform group-focus-within/select:rotate-90" size={18} />
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Document Type</label>
                            <div className="relative group/select">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:text-blue-500 transition-colors" size={18} />
                                <select
                                    id="filter_document_type"
                                    name="filter_document_type"
                                    className="pl-12 pr-10 w-full py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
                                    value={filters.document_type}
                                    onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}
                                >
                                    <option value="">All Types</option>
                                    {docTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:rotate-90 transition-transform" size={18} />
                            </div>
                        </div>

                        {(filters.employee_id || filters.document_type) && (
                            <button
                                onClick={() => setFilters({ employee_id: "", document_type: "" })}
                                className="flex items-center gap-2 text-xs font-black text-red-600 bg-red-50 dark:bg-red-500/10 px-6 py-4 rounded-10 border-2 border-red-100 dark:border-red-500/20 hover:bg-red-600 hover:text-white uppercase tracking-widest"
                            >
                                <X size={16} strokeWidth={3} /> Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Document List Section */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out overflow-hidden border-2 border-slate-50 dark:border-white/5">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-10 animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing documents...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="p-32 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-10 flex items-center justify-center text-slate-300 mb-6 border-2 border-dashed border-slate-200 dark:border-white/10">
                            <FileText size={48} className="opacity-50" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Archive Empty</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-bold max-w-xs">Start building your secure digital repository by uploading your first document.</p>
                        <button onClick={() => setIsUploadModalOpen(true)} className="mt-8 text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-8 py-3 rounded-10 border-2 border-blue-100 dark:border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">
                            Initialize Upload
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b-2 border-slate-100 dark:border-white/10">
                                    {!isEmployee && <th className="p-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Employee</th>}
                                    <th className="p-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Document Title</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Registry Info</th>
                                    {!isEmployee && <th className="p-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Uploader</th>}
                                    <th className="p-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors group">
                                        {!isEmployee && (
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 font-black text-sm border border-white/20">
                                                        {doc.employee?.user?.name?.charAt(0).toUpperCase() || "?"}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">{doc.employee?.user?.name || "Unknown"}</div>
                                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{doc.employee?.employee_code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-6">
                                            <span className="px-3 py-1 rounded-10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">
                                                {doc.document_type}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-10 bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                    <FileText size={16} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{doc.document_title}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{doc.file_size ? `${doc.file_size} KB` : "N/A"}</div>
                                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{new Date(doc.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                        </td>
                                        {!isEmployee && (
                                            <td className="p-6">
                                                {doc.uploader ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-10 bg-blue-500" />
                                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{doc.uploader.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">System</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleView(doc)}
                                                    className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-10 transition-all active:scale-95"
                                                    title="Quick View"
                                                >
                                                    <Eye size={18} strokeWidth={2.5} />
                                                </button>
                                                <button onClick={() => handleDownload(doc)}
                                                    className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-[#00b9cd] dark:hover:text-[#00b9cd] hover:bg-[#00b9cd]/10 dark:hover:bg-[#00b9cd]/80/10 rounded-10 transition-all active:scale-95"
                                                    title="Download"
                                                >
                                                    <Download size={18} strokeWidth={2.5} />
                                                </button>
                                                {!isEmployee && (
                                                    <button onClick={() => handleDelete(doc.id)}
                                                        className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-10 transition-all active:scale-95"
                                                        title="Revoke Permission"
                                                    >
                                                        <Trash2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal Section */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[100] p-4 border-none backdrop-blur-md ">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-2xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-lg overflow-hidden transform rounded-10">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Upload Document</h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Add new verified registry entry</p>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-10 transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="p-8 space-y-6">
                            {!isEmployee && (
                                <div>
                                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Select Employee *</label>
                                    <div className="relative group/select">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:text-blue-500 transition-colors" size={18} />
                                        <select
                                            className="pl-12 pr-10 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
                                            value={uploadData.employee_id}
                                            onChange={(e) => setUploadData({ ...uploadData, employee_id: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Select Employee --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.employee_code})</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:rotate-90 transition-transform" size={18} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Document Category *</label>
                                <div className="relative group/select">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:text-blue-500 transition-colors" size={18} />
                                    <select
                                        className="pl-12 pr-10 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
                                        value={uploadData.document_type}
                                        onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Select Category --</option>
                                        {docTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/select:rotate-90 transition-transform" size={18} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Archive Title *</label>
                                <div className="relative group/input">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        className="pl-12 pr-6 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all font-paperlogy"
                                        placeholder="e.g. Q4 Performance Assessment"
                                        value={uploadData.document_title}
                                        onChange={(e) => setUploadData({ ...uploadData, document_title: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Payload Upload *</label>
                                <div className="border-4 border-dashed border-slate-100 dark:border-white/5 rounded-10 p-8 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all group/file relative">
                                    <div className="absolute inset-0 z-0">
                                        <input
                                            type="file"
                                            className="w-full h-full opacity-0 cursor-pointer"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                            required
                                        />
                                    </div>
                                    <div className="relative z-10 pointer-events-none">
                                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-10 flex items-center justify-center text-blue-600 mx-auto mb-4 group-hover/file:scale-110 transition-transform">
                                            <Upload size={32} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">
                                            {uploadData.file ? uploadData.file.name : "Drop File or Click"}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF, IMAGE (MAX 2MB)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-10 text-white font-black text-xs uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-500 ease-out transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 active:translate-y-0 active:shadow-md'}`}
                                >
                                    {uploading ? "Uploading..." : (<><FileUp size={16} strokeWidth={3} /> Commit Archive</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;
