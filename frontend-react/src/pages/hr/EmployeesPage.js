import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { STORAGE_URL } from "../../api/axios";
import { useAuth } from "../../context/AuthContext"; 
import { useGlobalUI } from "../../context/GlobalUIContext";
import FaceEnrollment from "../../components/FaceEnrollment";

import { formatDate } from "../../utils/dateUtils";
import { 
    Users, 
    Activity, 
    Building2, 
    ScanFace, 
    Search, 
    CheckCircle, 
    Briefcase, 
    Mail, 
    ChevronRight, 
    Edit2, 
    Trash2, 
    Filter, 
    Download, 
    Eye, 
    MoreVertical, 
    MapPin, 
    Phone, 
    Calendar,
    ChevronLeft,
    Plus
} from "lucide-react";

const EmployeesPage = () => {
    const { user } = useAuth();
    const { addToast } = useGlobalUI();
    // Unified API Endpoint
    const apiEndpoint = "/employees";

    // User Roles & Permissions
    const isSuperAdmin = user?.role_id === 1;
    const canManage = isSuperAdmin || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_employees");
    const canDelete = isSuperAdmin || user?.permissions?.includes("can_delete_employees"); // Permission-based override
    const canManageSalary = isSuperAdmin || user?.role_id === 2 || user?.permissions?.includes("can_manage_salaries");
    const canViewSalary = isSuperAdmin || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_view_salaries") || canManageSalary;

    // Data States
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [subCompanies, setSubCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Search States
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        department_id: "",
        designation_name: "",
        country_id: "",
        sub_company_id: "",
        date_of_joining: "",
        dob: "",
        aadhar_number: "",
        pan_number: "",
        emergency_contact: "",
        gender: "",
        marital_status: "",
        profile_photo: null,
        basic: "",
        hra: "",
        da: "",
        allowances: "",
        deductions: "",
        gross_salary: "",
        phone: "",
        address: "",
        status: "Active",
        reports_to: "",
        joining_category: "New Joinee",
        pf_opt_out: false,
        esic_opt_out: false,
        ptax_opt_out: false,
        aadhar_file: null,
        pan_file: null
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [payrollConfig, setPayrollConfig] = useState({ basic_percentage: 50 }); // Default 50%

    // Initial Data Fetch
    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchDesignations();
        fetchCountries();
        if (canViewSalary || canManageSalary) {
            fetchPayrollPolicy();
        }
    }, []);

    // Fetch sub-companies when country changes
    useEffect(() => {
        if (formData.country_id) {
            fetchSubCompanies(formData.country_id);
        } else {
            setSubCompanies([]);
            setFormData(prev => ({ ...prev, sub_company_id: "" }));
        }
    }, [formData.country_id]);

    const fetchPayrollPolicy = async () => {
        try {
            const res = await api.get('/payroll-policy');
            if (res.data) {
                const config = { ...res.data };

                // Helper for robust boolean parsing
                const isTrue = (val) => String(val) === '1' || String(val).toLowerCase() === 'true';

                // Parse strings to appropriate types
                config.basic_percentage = parseFloat(config.basic_percentage) || 0;
                config.pf_enabled = isTrue(config.pf_enabled);
                config.esic_enabled = isTrue(config.esic_enabled);
                config.ptax_enabled = isTrue(config.ptax_enabled);

                if (typeof config.ptax_slabs === 'string') {
                    try {
                        config.ptax_slabs = JSON.parse(config.ptax_slabs);
                    } catch (e) {
                        config.ptax_slabs = [];
                        console.error("Failed to parse ptax_slabs", e);
                    }
                }

                // Ensure array
                if (!Array.isArray(config.ptax_slabs)) {
                    config.ptax_slabs = [];
                }
                setPayrollConfig(config);
            }
        } catch (err) {
            console.error("Failed to fetch payroll policy", err);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await api.get(apiEndpoint);
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch employees", err);
            setError("Failed to load employees.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get("/departments");
            setDepartments(response.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const fetchDesignations = async () => {
        try {
            const response = await api.get("/designations");
            setDesignations(response.data);
        } catch (err) {
            console.error("Failed to fetch designations", err);
        }
    };

    const fetchCountries = async () => {
        try {
            const response = await api.get("/countries/active");
            setCountries(response.data);
        } catch (err) {
            console.error("Failed to fetch countries", err);
        }
    };

    const fetchSubCompanies = async (countryId) => {
        if (!countryId) {
            setSubCompanies([]);
            return;
        }
        try {
            const response = await api.get(`/sub-companies/by-country/${countryId}`);
            setSubCompanies(response.data);
        } catch (err) {
            console.error("Failed to fetch sub-companies", err);
            setSubCompanies([]);
        }
    };

    // Filtering & Sorting Logic
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            emp.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            emp.employee_code?.toLowerCase().includes(search.toLowerCase());

        const matchesDept = departmentFilter ? emp.department_id === parseInt(departmentFilter) : true;
        const matchesStatus = statusFilter ? (statusFilter === "Active" ? emp.user?.is_active : !emp.user?.is_active) : true;

        return matchesSearch && matchesDept && matchesStatus;
    }).sort((a, b) => {
        if (sortConfig.key === "name") {
            return sortConfig.direction === "asc"
                ? a.user?.name.localeCompare(b.user?.name)
                : b.user?.name.localeCompare(a.user?.name);
        }
        if (sortConfig.key === "department") {
            return sortConfig.direction === "asc"
                ? (a.department?.name || "").localeCompare(b.department?.name || "")
                : (b.department?.name || "").localeCompare(a.department?.name || "");
        }
        if (sortConfig.key === "date_of_joining") {
            return sortConfig.direction === "asc"
                ? new Date(a.date_of_joining) - new Date(b.date_of_joining)
                : new Date(b.date_of_joining) - new Date(a.date_of_joining);
        }
        return 0;
    });

    // Stats Calculation
    const stats = [
        { 
            label: 'Total Personnel', 
            val: employees.length, 
            icon: <Users size={22} strokeWidth={2.5} />, 
            color: 'text-blue-600 dark:text-blue-400', 
            bg: 'bg-blue-50 dark:bg-blue-500/10', 
            border: 'border-blue-100 dark:border-blue-500/20' 
        },
        { 
            label: 'Active Agents', 
            val: employees.filter(e => e.user?.is_active).length, 
            icon: <Activity size={22} strokeWidth={2.5} />, 
            color: 'text-emerald-600 dark:text-emerald-400', 
            bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
            border: 'border-emerald-100 dark:border-emerald-500/20' 
        },
        { 
            label: 'Divisions', 
            val: departments.length, 
            icon: <Building2 size={22} strokeWidth={2.5} />, 
            color: 'text-indigo-600 dark:text-indigo-400', 
            bg: 'bg-indigo-50 dark:bg-indigo-500/10', 
            border: 'border-indigo-100 dark:border-indigo-500/20' 
        },
        { 
            label: 'Face Enrolled', 
            val: employees.filter(e => {
                const hasFaceData = e.face_descriptor || e.user?.face_descriptor;
                return hasFaceData && hasFaceData !== 'null' && hasFaceData.trim() !== '';
            }).length, 
            icon: <ScanFace size={22} strokeWidth={2.5} />, 
            color: 'text-orange-600 dark:text-orange-400', 
            bg: 'bg-orange-50 dark:bg-orange-500/10', 
            border: 'border-orange-100 dark:border-orange-500/20' 
        }
    ];

    // Pagination Logic
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    // Modal Handlers
    const openAddModal = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            department_id: "",
            designation_name: "",
            country_id: "",
            sub_company_id: "",
            date_of_joining: "",
            dob: "",
            aadhar_number: "",
            pan_number: "",
            emergency_contact: "",
            gender: "",
            marital_status: "",
            profile_photo: null,
            basic: "",
            hra: "",
            da: "",
            allowances: "",
            deductions: "",
            gross_salary: "",
            phone: "",
            address: "",
            status: "Active",
            reports_to: "",
            joining_category: "New Joinee",
            pf_opt_out: false,
            esic_opt_out: false,
            ptax_opt_out: false,
            aadhar_file: null,
            pan_file: null
        });
        setFormErrors({});
        setEnrollFace(false);
        setIsAddModalOpen(true);
    };

    const openEditModal = (emp) => {
        setSelectedEmployee(emp);
        setFormData({
            name: emp.user?.name || "",
            email: emp.user?.email || "",
            department_id: emp.department_id || "",
            designation_name: emp.designation?.name || "",
            country_id: emp.country_id || "",
            sub_company_id: emp.sub_company_id || "",
            date_of_joining: emp.date_of_joining || "",
            dob: emp.dob || "",
            aadhar_number: emp.aadhar_number || "",
            pan_number: emp.pan_number || "",
            emergency_contact: emp.emergency_contact || "",
            gender: emp.gender || "",
            marital_status: emp.marital_status || "",
            profile_photo: null, // Don't pre-fill file input
            basic: emp.current_salary?.basic || "",
            hra: emp.current_salary?.hra || "",
            da: emp.current_salary?.da || "",
            allowances: emp.current_salary?.allowances || "",
            deductions: emp.current_salary?.deductions || "",
            gross_salary: emp.current_salary?.gross_salary || "",
            phone: emp.phone || "",
            address: emp.address || "",
            status: emp.user?.is_active ? "Active" : "Inactive",
            reports_to: emp.reports_to || "",
            joining_category: emp.joining_category || "New Joinee",
            pf_opt_out: Boolean(emp.pf_opt_out),
            esic_opt_out: Boolean(emp.esic_opt_out),
            ptax_opt_out: Boolean(emp.ptax_opt_out)
        });
        // Fetch sub-companies for the employee's country
        if (emp.country_id) {
            fetchSubCompanies(emp.country_id);
        }
        setFormErrors({});
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (emp) => {
        setSelectedEmployee(emp);
        setIsDeleteModalOpen(true);
    };

    const openViewModal = (emp) => {
        setSelectedEmployee(emp);
        setIsViewModalOpen(true);
    };

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedEmployee(null);
    };

    // Salary Calculation Logic
    const handleBasicChange = (e) => {
        const basic = parseFloat(e.target.value) || 0;
        const hra = basic * 0.40; // 40% of Basic
        const da = basic * 0.10;  // 10% of Basic
        const allowances = basic * 0.05; // 5% of Basic
        const deductions = basic * 0.02; // 2% of Basic
        const gross = basic + hra + da + allowances - deductions;

        setFormData(prev => ({
            ...prev,
            basic: e.target.value,
            hra: hra.toFixed(2),
            da: da.toFixed(2),
            allowances: allowances.toFixed(2),
            deductions: deductions.toFixed(2),
            gross_salary: gross.toFixed(2)
        }));
    };

    const recalculateSalary = () => {
        const basic = parseFloat(formData.basic) || 0;
        const hra = basic * 0.40;
        const da = basic * 0.10;
        const allowances = basic * 0.05;
        const deductions = basic * 0.02;
        const gross = basic + hra + da + allowances - deductions;

        setFormData(prev => ({
            ...prev,
            hra: hra.toFixed(2),
            da: da.toFixed(2),
            allowances: allowances.toFixed(2),
            deductions: deductions.toFixed(2),
            gross_salary: gross.toFixed(2)
        }));
    };

    const handleSalaryComponentChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            const basic = parseFloat(updated.basic) || 0;
            const hra = parseFloat(updated.hra) || 0;
            const da = parseFloat(updated.da) || 0;
            const allowances = parseFloat(updated.allowances) || 0;
            const deductions = parseFloat(updated.deductions) || 0;
            const gross = basic + hra + da + allowances - deductions;
            return { ...updated, gross_salary: gross.toFixed(2) };
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData({ ...formData, [name]: files[0] });
        }
    };

    // Password Modal State
    const [createdPassword, setCreatedPassword] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Face Enrollment States
    const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [faceImage, setFaceImage] = useState(null);
    const [pendingEmployeeData, setPendingEmployeeData] = useState(null);
    const [enrollFace, setEnrollFace] = useState(false);

    // Form Submission
    const validateForm = () => {
        const errors = {};
        if (!formData.name) errors.name = "Name is required";
        if (!formData.email) errors.email = "Email is required";
        if (!formData.country_id) errors.country_id = "Country is required";
        if (!formData.sub_company_id) errors.sub_company_id = "Sub-company is required";
        // if (!formData.password && isAddModalOpen) errors.password = "Password is required"; // Auto-generated now
        // Department is optional in some logic, but usually required
        // if (!formData.department_id) errors.department_id = "Department is required";

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Invalid email format";
        }

        if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan_number)) {
            errors.pan_number = "Invalid PAN format";
        }

        if (formData.aadhar_number && !/^\d{12}$/.test(formData.aadhar_number)) {
            errors.aadhar_number = "Aadhar must be 12 digits";
        }

        if (!formData.phone) {
            // errors.phone = "Phone is required"; 
        } else if (!/^\d{10}$/.test(formData.phone)) {
            errors.phone = "Phone number must be exactly 10 digits";
        }

        return errors;
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        // Check if face enrollment is requested
        if (enrollFace) {
            // Store form data and open face enrollment
            setPendingEmployeeData(formData);
            setShowFaceEnrollment(true);
        } else {
            // Submit without face enrollment
            await submitEmployeeWithoutFace();
        }
    };

    const submitEmployeeWithoutFace = async () => {
        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    if (key === 'pf_opt_out' || key === 'esic_opt_out' || key === 'ptax_opt_out') {
                        data.append(key, formData[key] ? '1' : '0');
                    } else {
                        data.append(key, formData[key]);
                    }
                }
            });

            const response = await api.post(apiEndpoint, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            fetchEmployees();
            closeModals();

            // Show password modal if plain_password or user.temp_password is returned
            if (response.data.plain_password || response.data.user?.temp_password) {
                setCreatedPassword(response.data.plain_password || response.data.user?.temp_password);
                setIsPasswordModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to create employee", err);
            if (err.response && err.response.status === 422 && err.response.data.errors) {
                const apiErrors = {};
                Object.keys(err.response.data.errors).forEach(key => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setFormErrors(apiErrors);
            } else {
                setFormErrors({ api: err.response?.data?.message || "Failed to create employee" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFaceEnrolled = async (descriptor, imageBlob) => {
        setFaceDescriptor(descriptor);
        setFaceImage(imageBlob);
        setShowFaceEnrollment(false);

        // Now create the employee with face data
        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(pendingEmployeeData).forEach(key => {
                if (pendingEmployeeData[key] !== null && pendingEmployeeData[key] !== undefined) {
                    if (key === 'pf_opt_out' || key === 'esic_opt_out' || key === 'ptax_opt_out') {
                        data.append(key, pendingEmployeeData[key] ? '1' : '0');
                    } else {
                        data.append(key, pendingEmployeeData[key]);
                    }
                }
            });
            // Append password as temp_password for backend
            if (pendingEmployeeData.password) {
                data.append('temp_password', pendingEmployeeData.password);
            }

            // Add face data
            data.append('face_descriptor', JSON.stringify(descriptor));
            data.append('face_image', imageBlob, 'face.jpg');

            const response = await api.post(apiEndpoint, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            fetchEmployees();
            closeModals();
            setPendingEmployeeData(null);

            // Show password modal if plain_password or user.temp_password is returned
            if (response.data.plain_password || response.data.user?.temp_password) {
                setCreatedPassword(response.data.plain_password || response.data.user?.temp_password);
                setIsPasswordModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to create employee", err);
            if (err.response && err.response.status === 422 && err.response.data.errors) {
                // Map backend validation errors to form errors
                const apiErrors = {};
                Object.keys(err.response.data.errors).forEach(key => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setFormErrors(apiErrors);
            } else {
                setFormErrors({ api: err.response?.data?.message || "Failed to create employee" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!selectedEmployee?.id) {
            setFormErrors({ api: "Invalid employee selected." });
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                // Ensure booleans are sent as 1/0
                if (key === 'pf_opt_out' || key === 'esic_opt_out' || key === 'ptax_opt_out') {
                    data.append(key, formData[key] ? '1' : '0');
                } else if (formData[key] !== null && formData[key] !== undefined) {
                    // Skip profile_photo if it's not a File (e.g., existing URL string)
                    if (key === 'profile_photo' && !(formData[key] instanceof File)) {
                        return;
                    }
                    data.append(key, formData[key]);
                }
            });
            // Laravel requires POST with _method=PUT for multipart/form-data updates
            data.append("_method", "PUT");

            await api.post(`${apiEndpoint}/${selectedEmployee.id}`, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await fetchEmployees();
            closeModals();
        } catch (err) {
            console.error("Failed to update employee", err);
            if (err.response && err.response.status === 422 && err.response.data.errors) {
                const apiErrors = {};
                Object.keys(err.response.data.errors).forEach(key => {
                    apiErrors[key] = err.response.data.errors[key][0];
                });
                setFormErrors(apiErrors);
            } else {
                const errorMessage = err.response?.data?.message || err.message || "Failed to update employee";
                setFormErrors({ api: errorMessage });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`${apiEndpoint}/${selectedEmployee.id}`);
            fetchEmployees();
            closeModals();
            addToast("Employee deleted successfully", "success");
        } catch (err) {
            console.error("Failed to delete employee", err);
            const errorMessage = err.response?.data?.message || "Failed to delete employee. Please try again.";
            addToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <>
            <div className="p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Standardized Neobrutalist Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-[#00b9cd]/5 rounded-10 blur-2xl group-hover:bg-[#00b9cd]/80/10 transition-all duration-500"></div>
                    <div className="relative">
                        <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight">
                            Employees <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Workforce Intelligence Hub</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={openAddModal} 
                        className="group relative px-6 py-3 bg-slate-900 dark:bg-[#00b9cd] hover:bg-[#00b9cd] dark:hover:bg-[#00b9cd]/80 text-white rounded-10 text-xs font-black uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:translate-y-1 active:shadow-none flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative flex items-center justify-center w-6 h-6 rounded-10 bg-white/20 group-hover:rotate-180 transition-transform duration-500">+</span>
                        <span className="relative">Recruit Agent</span>
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex items-center gap-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out ">
                        <div className={`${s.bg} ${s.color} ${s.border} border-2 p-3.5 rounded-10 shadow-md`}>{s.icon}</div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{s.val}</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Neobrutalist Filter Bar */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 flex flex-col lg:flex-row gap-5">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b9cd] transition-colors" size={18} />
                    <input
                        type="text"
                        id="search_employees"
                        placeholder="Search by name, email or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                    />
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <div className="relative">
                        <select
                            id="filter_department"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white cursor-pointer min-w-[180px] transition-all"
                        >
                            <option value="">All Divisions</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>

                    <div className="relative">
                        <select
                            id="filter_status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white cursor-pointer min-w-[150px] transition-all"
                        >
                            <option value="">Any Status</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Offline Only</option>
                        </select>
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                </div>
            </div>

                {loading ? (
                    <div className="text-center p-8 text-gray-900">Loading employees...</div>
                ) : error ? (
                    <div className="text-center p-8 text-red-500 dark:text-red-400">{error}</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                            {paginatedEmployees.length === 0 ? (
                                <div className="col-span-full bg-white dark:bg-slate-900/60 p-20 rounded-10 border-2 border-slate-900/5 text-center shadow-inner">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-10 flex items-center justify-center text-slate-300 mx-auto mb-6">
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Personnel Vacancy</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Zero matching entities detected in current sector</p>
                                </div>
                            ) : paginatedEmployees.map((emp) => {
                                const hasFaceData = emp.face_descriptor || emp.user?.face_descriptor;
                                const isEnrolled = hasFaceData && hasFaceData !== 'null' && hasFaceData.trim() !== '';
                                const avatarColors = [
                                    'from-[#00b9cd]/20 to-[#00b9cd]/20 text-[#00b9cd]', 
                                    'from-orange-500/20 to-orange-600/20 text-orange-600', 
                                    'from-blue-500/20 to-blue-600/20 text-blue-600', 
                                    'from-purple-500/20 to-purple-600/20 text-purple-600'
                                ];
                                const avatarColor = avatarColors[(emp.user?.name?.charCodeAt(0) || 0) % avatarColors.length];
                                
                                return (
                                    <div key={emp.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col gap-6 group">
                                        {/* Top: Avatar + Status */}
                                        <div className="flex items-start justify-between">
                                            <div className="relative group/avatar">
                                                <div className={`w-14 h-14 rounded-10 flex items-center justify-center text-xl font-bold bg-gradient-to-br ${avatarColor} border border-white dark:border-slate-800 shadow-md group-hover/avatar:scale-110 transition-transform duration-500 overflow-hidden`}>
                                                    {emp.profile_photo ? (
                                                        <img
                                                            src={emp.profile_photo.startsWith('http') ? emp.profile_photo : `${STORAGE_URL}/${emp.profile_photo}`}
                                                            alt={emp.user?.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        emp.user?.name?.charAt(0).toUpperCase() || '?'
                                                    )}
                                                </div>
                                                {isEnrolled && (
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-slate-800 rounded-10 flex items-center justify-center text-[#00b9cd] shadow-md border border-slate-100 dark:border-slate-700">
                                                        <CheckCircle size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2.5">
                                                <span className="px-3 py-1.5 text-[10px] font-bold rounded-10 bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-900/10 dark:border-white/10 shadow-md uppercase tracking-widest">
                                                    {emp.employee_code}
                                                </span>
                                                <span className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold rounded-10 ${
                                                    emp.user?.is_active
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                                                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                                                } shadow-md transition-all`}>
                                                    <span className={`w-2 h-2 rounded-10 ${ emp.user?.is_active ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-400'}`}></span>
                                                    {emp.user?.is_active ? 'Active' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Name + Title */}
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight tracking-tight uppercase group-hover:text-[#00b9cd] transition-colors">{emp.user?.name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                <Briefcase size={12} className="text-[#00b9cd]" />
                                                {emp.designation?.name || 'Unassigned'}
                                            </div>
                                        </div>

                                        {/* Division + Email */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 rounded-10">
                                                <Building2 size={14} className="text-blue-500" />
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{emp.department?.name || 'No Division'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 rounded-10 overflow-hidden">
                                                <Mail size={14} className="text-purple-500" />
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate lowercase">{emp.user?.email}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2.5 pt-2 mt-auto">
                                            <Link to={`/${user?.role_id === 1 ? 'superadmin' : user?.role_id === 2 ? 'admin' : 'hr'}/employees/${emp.id}`}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest border-2 border-slate-900 dark:border-[#00b9cd] bg-slate-900 dark:bg-[#00b9cd] text-white rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:bg-[#00b9cd] dark:hover:bg-[#00b9cd]/80 transition-all active:translate-y-0.5 active:shadow-none">
                                                Profile
                                                <ChevronRight size={14} />
                                            </Link>
                                            <button onClick={() => openEditModal(emp)}
                                                className="flex items-center justify-center p-3 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-white/10 rounded-10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-md transition-all active:scale-95">
                                                <Edit2 size={16} />
                                            </button>
                                            {canDelete && (
                                                <button onClick={() => openDeleteModal(emp)}
                                                    className="flex items-center justify-center p-3 text-red-600 dark:text-red-400 border-2 border-red-50 dark:border-red-900/20 rounded-10 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 shadow-md transition-all active:scale-95">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8 flex justify-between items-center bg-white dark:bg-white/5 p-6 rounded-10 border-2 border-slate-900/10 shadow-md">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span className="text-slate-900 dark:text-white">{filteredEmployees.length}</span> Agents
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-6 py-3 border-2 border-slate-900/10 rounded-10 text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-white/5 hover:bg-brand-50 hover:shadow-button disabled:opacity-30 disabled:cursor-not-allowed">Previous</button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-6 py-3 border-2 border-slate-900/10 rounded-10 text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-white/5 hover:bg-brand-50 hover:shadow-button disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-10 w-full max-w-4xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/10 relative mx-auto flex flex-col max-h-[92vh] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00b9cd] via-emerald-500 to-[#00b9cd]"></div>
                        <div className="px-10 py-10 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-paperlogy uppercase tracking-tight">Initiate Recruitment</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">New Division Agent Onboarding</p>
                            </div>
                            <button onClick={closeModals} className="p-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-[#00b9cd] transition-colors rounded-10 group">
                                <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {formErrors.api && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-10 text-sm">{formErrors.api}</div>}

                            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                                    <input id="add_name" name="name" type="text" autoComplete="name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" />
                                    {formErrors.name && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                                    <input id="add_email" name="email" type="email" autoComplete="off" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" />
                                    {formErrors.email && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.email}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                                    <select id="add_department" name="department_id" autoComplete="off" value={formData.department_id || ""} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm">
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    {formErrors.department_id && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.department_id}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_country" className="text-sm font-medium text-gray-700 dark:text-gray-300">Country *</label>
                                    <select
                                        id="add_country"
                                        name="country_id"
                                        autoComplete="off"
                                        value={formData.country_id || ""}
                                        onChange={(e) => setFormData({ ...formData, country_id: e.target.value, sub_company_id: "" })}
                                        className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm"
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {formErrors.country_id && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.country_id}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_sub_company" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sub-Company *</label>
                                    <select
                                        id="add_sub_company"
                                        name="sub_company_id"
                                        autoComplete="off"
                                        value={formData.sub_company_id || ""}
                                        onChange={(e) => setFormData({ ...formData, sub_company_id: e.target.value })}
                                        disabled={!formData.country_id || subCompanies.length === 0}
                                        className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Sub-Company</option>
                                        {subCompanies.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                    </select>
                                    {formErrors.sub_company_id && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.sub_company_id}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_joining_category" className="text-sm font-medium text-gray-700 dark:text-gray-300">Joining Category *</label>
                                    <select id="add_joining_category" name="joining_category" autoComplete="off" value={formData.joining_category || ""} onChange={(e) => setFormData({ ...formData, joining_category: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm">
                                        <option value="New Joinee">New Joinee</option>
                                        <option value="Intern">Intern</option>
                                        <option value="Permanent">Permanent</option>
                                    </select>
                                </div>
                                {formData.joining_category === "New Joinee" && (
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="add_probation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Probation Period (Months)</label>
                                        <select
                                            id="add_probation"
                                            name="probation_months"
                                            autoComplete="off"
                                            value={formData.probation_months || ""}
                                            onChange={(e) => setFormData({ ...formData, probation_months: e.target.value })}
                                            className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm"
                                        >
                                            <option value="">Select Duration</option>
                                            <option value="3">3 Months</option>
                                            <option value="6">6 Months</option>
                                        </select>
                                    </div>
                                )}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_designation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation *</label>
                                    <input
                                        id="add_designation"
                                        name="designation_name"
                                        list="designation_options"
                                        autoComplete="off"
                                        placeholder="Select or Type Designation"
                                        value={formData.designation_name || ""}
                                        onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })}
                                        className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm"
                                    />
                                    <datalist id="designation_options">
                                        {designations.map(d => (
                                            <option key={d.id} value={d.name} />
                                        ))}
                                    </datalist>
                                    {formErrors.designation_name && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.designation_name}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_reports_to" className="text-sm font-medium text-gray-700 dark:text-gray-300">Reports To (Manager)</label>
                                    <select id="add_reports_to" name="reports_to" autoComplete="off" value={formData.reports_to || ""} onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm">
                                        <option value="">No Manager (Top Hierarchy)</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.user?.name} ({e.designation?.name || 'N/A'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_date_of_joining" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Joining *</label>
                                    <input id="add_date_of_joining" name="date_of_joining" type="date" autoComplete="off" value={formData.date_of_joining || ""} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" />
                                    {formErrors.date_of_joining && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.date_of_joining}</p>}
                                </div>



                                <div className="col-span-1 md:col-span-2 border border-gray-200 dark:border-gray-700 rounded-10 p-4 mt-2 bg-gray-50 dark:bg-gray-800/50">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payroll Configuration</h3>

                                    <div className="flex flex-col gap-1 mb-4">
                                        <label htmlFor="add_gross_salary" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gross Salary (Monthly) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-900">₹</span>
                                            <input
                                                id="add_gross_salary"
                                                name="gross_salary"
                                                type="number"
                                                autoComplete="off"
                                                value={formData.gross_salary || ""}
                                                onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                                                className="h-9 pl-7 pr-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm font-medium"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-900 mt-1">Basic, HRA, and other components will be auto-calculated based on Payroll Policy.</p>

                                        {/* Salary Preview Component */}
                                        {(() => {
                                            const gross = parseFloat(formData.gross_salary) || 0;
                                            const basicPercent = payrollConfig.basic_percentage || 70;
                                            const basic = Math.round((gross * basicPercent) / 100);
                                            const hra = gross - basic;

                                            // Deductions
                                            let pf = 0;
                                            let pfText = "0.00";
                                            if (!payrollConfig.pf_enabled) {
                                                pfText = "Disabled";
                                            } else if (formData.pf_opt_out) {
                                                pfText = "Opted Out";
                                            } else {
                                                pf = Math.round(basic * 0.12);
                                                pfText = `-₹${pf.toFixed(2)}`;
                                            }

                                            let esic = 0;
                                            let esicText = "0.00";
                                            if (!payrollConfig.esic_enabled) {
                                                esicText = "Disabled";
                                            } else if (formData.esic_opt_out) {
                                                esicText = "Opted Out";
                                            } else {
                                                esic = Math.ceil(gross * 0.0075);
                                                esicText = `-₹${esic.toFixed(2)}`;
                                            }

                                            let ptax = 0;
                                            let ptaxText = "0.00";
                                            if (!payrollConfig.ptax_enabled) {
                                                ptaxText = "Disabled";
                                            } else if (formData.ptax_opt_out) {
                                                ptaxText = "Opted Out";
                                            } else {
                                                if (Array.isArray(payrollConfig.ptax_slabs)) {
                                                    const slab = payrollConfig.ptax_slabs.find(s => {
                                                        const min = parseFloat(s.min_salary || 0);
                                                        const max = s.max_salary === null || s.max_salary === "" ? Infinity : parseFloat(s.max_salary);
                                                        return gross >= min && gross <= max;
                                                    });
                                                    if (slab) {
                                                        ptax = parseFloat(slab.tax_amount || 0);
                                                        ptaxText = `-₹${ptax.toFixed(2)}`;
                                                    }
                                                }
                                            }

                                            const totalDeductions = pf + esic + ptax;
                                            const netPay = gross - totalDeductions;

                                            return (
                                                <div className="mt-3 bg-white dark:bg-gray-700/50 p-3 rounded-10 border border-gray-100 dark:border-gray-600 space-y-2">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-900">Basic Salary ({basicPercent}%)</p>
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹{basic.toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-900">HRA ({100 - basicPercent}%)</p>
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹{hra.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 grid grid-cols-3 gap-2">
                                                        <div>
                                                            <p className="text-xs text-gray-900">PF (12%)</p>
                                                            <p className={`text-sm font-medium ${pf > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                {pfText}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-900">ESIC (0.75%)</p>
                                                            <p className={`text-sm font-medium ${esic > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                {esicText}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-900">PTAX</p>
                                                            <p className={`text-sm font-medium ${ptax > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                                {ptaxText}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Estimated Net Pay</p>
                                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{netPay.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}


                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <label htmlFor="add_pf_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded-10 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                            <input
                                                id="add_pf_opt_out"
                                                name="pf_opt_out"
                                                type="checkbox"
                                                checked={formData.pf_opt_out}
                                                onChange={(e) => setFormData({ ...formData, pf_opt_out: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded-10 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out PF</span>
                                        </label>

                                        <label htmlFor="add_esic_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded-10 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                            <input
                                                id="add_esic_opt_out"
                                                name="esic_opt_out"
                                                type="checkbox"
                                                checked={formData.esic_opt_out}
                                                onChange={(e) => setFormData({ ...formData, esic_opt_out: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded-10 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out ESIC</span>
                                        </label>

                                        <label htmlFor="add_ptax_opt_out" className="flex items-center space-x-2 cursor-pointer p-2 rounded-10 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                            <input
                                                id="add_ptax_opt_out"
                                                name="ptax_opt_out"
                                                type="checkbox"
                                                checked={formData.ptax_opt_out}
                                                onChange={(e) => setFormData({ ...formData, ptax_opt_out: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded-10 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 select-none">Opt-out PTAX</span>
                                        </label>

                                        {/* Payslip Access - Permission Control */}
                                        <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-10 bg-blue-50 dark:bg-blue-900/20 col-span-2 md:col-span-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">Payslip Access</span>
                                                <span className="text-xs text-gray-900">Allow employee to download payslips?</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    id="add_payslip_access"
                                                    name="payslip_access"
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.payslip_access || false}
                                                    onChange={(e) => setFormData({ ...formData, payslip_access: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-10 peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-10 after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_dob" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth *</label>
                                    <input id="add_dob" name="dob" type="date" autoComplete="off" value={formData.dob || ""} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" />
                                    {formErrors.dob && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.dob}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_aadhar" className="text-sm font-medium text-gray-700 dark:text-gray-300">Aadhar Number</label>
                                    <input id="add_aadhar" name="aadhar_number" type="text" autoComplete="off" value={formData.aadhar_number || ""} onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" maxLength={12} />
                                    {formErrors.aadhar_number && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.aadhar_number}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_aadhar_file" className="text-sm font-medium text-gray-700 dark:text-gray-300">Aadhar File</label>
                                    <input id="add_aadhar_file" name="aadhar_file" type="file" onChange={handleFileChange} className="border border-gray-300 dark:border-gray-600 rounded-10 p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-full" accept=".pdf,.jpg,.jpeg,.png" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_pan" className="text-sm font-medium text-gray-700 dark:text-gray-300">PAN Number</label>
                                    <input id="add_pan" name="pan_number" type="text" autoComplete="off" value={formData.pan_number || ""} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" maxLength={10} />
                                    {formErrors.pan_number && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.pan_number}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_pan_file" className="text-sm font-medium text-gray-700 dark:text-gray-300">PAN File</label>
                                    <input id="add_pan_file" name="pan_file" type="file" onChange={handleFileChange} className="border border-gray-300 dark:border-gray-600 rounded-10 p-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-full" accept=".pdf,.jpg,.jpeg,.png" />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</label>
                                    <input id="add_phone" name="phone" type="text" autoComplete="tel" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" maxLength={10} />
                                    {formErrors.phone && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.phone}</p>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_emergency" className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact</label>
                                    <input id="add_emergency" name="emergency_contact" type="text" autoComplete="tel" value={formData.emergency_contact || ""} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" maxLength={10} />
                                    {formErrors.emergency_contact && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.emergency_contact}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                    <select id="add_gender" name="gender" autoComplete="off" value={formData.gender || ""} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="add_marital" className="text-sm font-medium text-gray-700 dark:text-gray-300">Marital Status</label>
                                    <select id="add_marital" name="marital_status" autoComplete="off" value={formData.marital_status || ""} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} className="h-9 px-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm">
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label htmlFor="add_address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <textarea id="add_address" name="address" autoComplete="street-address" value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="p-3 border-2 border-black rounded-10 outline-none w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-brand-500 font-medium transition-colors text-sm" rows="2"></textarea>
                                </div>

                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label htmlFor="add_profile_photo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                                    <input id="add_profile_photo" name="profile_photo" type="file" onChange={(e) => setFormData({ ...formData, profile_photo: e.target.files[0] })} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-10 cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" accept="image/*" />
                                </div>

                                <div className="col-span-1 md:col-span-2 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-10">
                                    <input
                                        type="checkbox"
                                        id="add_enroll_face"
                                        checked={enrollFace}
                                        onChange={(e) => setEnrollFace(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-10 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label htmlFor="add_enroll_face" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                        Enroll Face Recognition (optional)
                                    </label>
                                </div>

                                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button type="button" onClick={closeModals} className="px-4 py-2 rounded-10 text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className={`px-4 py-2 rounded-10 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {isSubmitting ? "Creating..." : "Create Employee"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-10 w-full max-w-4xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/10 relative mx-auto flex flex-col max-h-[92vh] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>
                        <div className="px-10 py-10 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-paperlogy uppercase tracking-tight">Modify Parameters</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Updating Agent: {selectedEmployee?.user?.name}</p>
                            </div>
                            <button onClick={closeModals} className="p-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-orange-500 transition-colors rounded-10 group">
                                <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                            {formErrors.api && <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-100 dark:border-red-900/30 rounded-10 text-xs font-black uppercase tracking-wider">{formErrors.api}</div>}

                            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Tag</label>
                                    <input id="edit_name" name="name" type="text" autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" />
                                    {formErrors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comm Channel</label>
                                    <input id="edit_email" name="email" type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" />
                                    {formErrors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department *</label>
                                    <select id="edit_department" name="department_id" autoComplete="off" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all">
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    {formErrors.department_id && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.department_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country *</label>
                                    <select
                                        id="edit_country"
                                        name="country_id"
                                        autoComplete="off"
                                        value={formData.country_id || ""}
                                        onChange={(e) => setFormData({ ...formData, country_id: e.target.value, sub_company_id: "" })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all"
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {formErrors.country_id && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.country_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub-Company *</label>
                                    <select
                                        id="edit_sub_company"
                                        name="sub_company_id"
                                        autoComplete="off"
                                        value={formData.sub_company_id || ""}
                                        onChange={(e) => setFormData({ ...formData, sub_company_id: e.target.value })}
                                        disabled={!formData.country_id || subCompanies.length === 0}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Sub-Company</option>
                                        {subCompanies.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                    </select>
                                    {formErrors.sub_company_id && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.sub_company_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation *</label>
                                    <input
                                        id="edit_designation"
                                        name="designation_name"
                                        list="designation_options_edit"
                                        autoComplete="off"
                                        placeholder="Select or Type Designation"
                                        value={formData.designation_name}
                                        onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all"
                                    />
                                    <datalist id="designation_options_edit">
                                        {designations.map(d => (
                                            <option key={d.id} value={d.name} />
                                        ))}
                                    </datalist>
                                    {formErrors.designation_name && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.designation_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reports To (Manager)</label>
                                    <select id="edit_reports_to" name="reports_to" autoComplete="off" value={formData.reports_to} onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all">
                                        <option value="">No Manager (Top Hierarchy)</option>
                                        {employees.filter(e => {
                                            if (e.id === selectedEmployee?.id) return false;
                                            return true; // Show all employees
                                        }).map(e => (
                                            <option key={e.id} value={e.id}>{e.user?.name} ({e.designation?.name || 'N/A'})</option>
                                        ))}
                                    </select>
                                    {formErrors.reports_to && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.reports_to}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Category *</label>
                                    <select id="edit_joining_category" name="joining_category" autoComplete="off" value={formData.joining_category || ""} onChange={(e) => setFormData({ ...formData, joining_category: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all">
                                        <option value="New Joinee">New Joinee</option>
                                        <option value="Intern">Intern</option>
                                        <option value="Permanent">Permanent</option>
                                    </select>
                                </div>
                                {formData.joining_category === "New Joinee" && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Probation Period (Months)</label>
                                        <select
                                            id="edit_probation"
                                            name="probation_months"
                                            autoComplete="off"
                                            value={formData.probation_months || ""}
                                            onChange={(e) => setFormData({ ...formData, probation_months: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all"
                                        >
                                            <option value="">Select Duration</option>
                                            <option value="3">3 Months</option>
                                            <option value="6">6 Months</option>
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Joining *</label>
                                    <input id="edit_date_of_joining" name="date_of_joining" type="date" autoComplete="off" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" />
                                    {formErrors.date_of_joining && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.date_of_joining}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth *</label>
                                    <input id="edit_dob" name="dob" type="date" autoComplete="off" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" />
                                    {formErrors.dob && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.dob}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhar Number</label>
                                    <input id="edit_aadhar" name="aadhar_number" type="text" autoComplete="off" value={formData.aadhar_number} onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" maxLength={12} />
                                    {formErrors.aadhar_number && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.aadhar_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Number</label>
                                    <input id="edit_pan" name="pan_number" type="text" autoComplete="off" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" maxLength={10} />
                                    {formErrors.pan_number && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.pan_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone *</label>
                                    <input id="edit_phone" name="phone" type="text" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" maxLength={10} />
                                    {formErrors.phone && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.phone}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Contact</label>
                                    <input id="edit_emergency" name="emergency_contact" type="text" autoComplete="tel" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" maxLength={10} />
                                    {formErrors.emergency_contact && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.emergency_contact}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                    <select id="edit_gender" name="gender" autoComplete="off" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {formErrors.gender && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.gender}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marital Status</label>
                                    <select id="edit_marital" name="marital_status" autoComplete="off" value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all">
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {formErrors.marital_status && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.marital_status}</p>}
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                    <textarea id="edit_address" name="address" autoComplete="street-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all" rows="2"></textarea>
                                    {formErrors.address && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.address}</p>}
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Photo</label>
                                    <input id="edit_profile_photo" name="profile_photo" type="file" onChange={(e) => setFormData({ ...formData, profile_photo: e.target.files[0] })} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-10 cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" accept="image/*" />
                                    {formErrors.profile_photo && <p className="text-[10px] font-bold text-red-500 ml-1">{formErrors.profile_photo}</p>}
                                </div>

                                {canManageSalary && (
                                    <div className="col-span-1 md:col-span-2 border-2 border-slate-900/10 rounded-10 p-8 mt-2 bg-slate-50 dark:bg-slate-900/50 shadow-inner">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 border-b border-slate-900/10 pb-4">Payroll Configuration</h3>

                                        <div className="space-y-2 mb-6">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gross Salary (Monthly) *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white font-bold">₹</span>
                                                <input
                                                    id="edit_gross_salary"
                                                    name="gross_salary"
                                                    type="number"
                                                    autoComplete="off"
                                                    value={formData.gross_salary}
                                                    onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                                                    className="w-full pl-10 pr-6 py-4 bg-white dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {formErrors.gross_salary && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{formErrors.gross_salary}</p>}
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 ml-1 mt-1">Basic, HRA, and other components will be auto-calculated based on Payroll Policy.</p>

                                            {/* Salary Preview Component */}
                                            {(() => {
                                                const gross = parseFloat(formData.gross_salary) || 0;
                                                const basicPercent = payrollConfig.basic_percentage || 70;
                                                const basic = Math.round((gross * basicPercent) / 100);
                                                const hra = gross - basic;

                                                // Deductions
                                                let pf = 0;
                                                let pfText = "0.00";
                                                if (!payrollConfig.pf_enabled) {
                                                    pfText = "Disabled";
                                                } else if (formData.pf_opt_out) {
                                                    pfText = "Opted Out";
                                                } else {
                                                    pf = Math.round(basic * 0.12);
                                                    pfText = `-₹${pf.toFixed(2)}`;
                                                }

                                                let esic = 0;
                                                let esicText = "0.00";
                                                if (!payrollConfig.esic_enabled) {
                                                    esicText = "Disabled";
                                                } else if (formData.esic_opt_out) {
                                                    esicText = "Opted Out";
                                                } else {
                                                    esic = Math.ceil(gross * 0.0075);
                                                    esicText = `-₹${esic.toFixed(2)}`;
                                                }

                                                let ptax = 0;
                                                let ptaxText = "0.00";
                                                if (!payrollConfig.ptax_enabled) {
                                                    ptaxText = "Disabled";
                                                } else if (formData.ptax_opt_out) {
                                                    ptaxText = "Opted Out";
                                                } else {
                                                    if (Array.isArray(payrollConfig.ptax_slabs)) {
                                                        const slab = payrollConfig.ptax_slabs.find(s => {
                                                            const min = parseFloat(s.min_salary || 0);
                                                            const max = s.max_salary === null || s.max_salary === "" ? Infinity : parseFloat(s.max_salary);
                                                            return gross >= min && gross <= max;
                                                        });
                                                        if (slab) {
                                                            ptax = parseFloat(slab.tax_amount || 0);
                                                            ptaxText = `-₹${ptax.toFixed(2)}`;
                                                        }
                                                    }
                                                }

                                                const totalDeductions = pf + esic + ptax;
                                                const netPay = gross - totalDeductions;

                                                return (
                                                    <div className="mt-6 bg-white dark:bg-slate-800/50 p-6 rounded-10 border-2 border-slate-900/10 space-y-4 shadow-inner">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Salary ({basicPercent}%)</p>
                                                                <p className="text-lg font-bold text-slate-900 dark:text-white">₹{basic.toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HRA ({100 - basicPercent}%)</p>
                                                                <p className="text-lg font-bold text-slate-900 dark:text-white">₹{hra.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-slate-900/10 pt-4 grid grid-cols-3 gap-4">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PF (12%)</p>
                                                                <p className={`text-lg font-bold ${pf > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>
                                                                    {pfText}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESIC (0.75%)</p>
                                                                <p className={`text-lg font-bold ${esic > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>
                                                                    {esicText}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PTAX</p>
                                                                <p className={`text-lg font-bold ${ptax > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>
                                                                    {ptaxText}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-slate-900/10 pt-4 flex justify-between items-center">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Net Pay</p>
                                                            <p className="text-2xl font-black text-green-500 dark:text-green-400">₹{netPay.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}


                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <label htmlFor="edit_pf_opt_out" className="flex items-center space-x-2 cursor-pointer p-4 rounded-10 hover:bg-slate-50 dark:hover:bg-white/5 border-2 border-transparent hover:border-slate-900/10 transition-all">
                                                <input
                                                    id="edit_pf_opt_out"
                                                    name="pf_opt_out"
                                                    type="checkbox"
                                                    checked={formData.pf_opt_out}
                                                    onChange={(e) => setFormData({ ...formData, pf_opt_out: e.target.checked })}
                                                    className="w-5 h-5 text-orange-500 rounded-10 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                                                />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none">Opt-out PF</span>
                                            </label>

                                            <label htmlFor="edit_esic_opt_out" className="flex items-center space-x-2 cursor-pointer p-4 rounded-10 hover:bg-slate-50 dark:hover:bg-white/5 border-2 border-transparent hover:border-slate-900/10 transition-all">
                                                <input
                                                    id="edit_esic_opt_out"
                                                    name="esic_opt_out"
                                                    type="checkbox"
                                                    checked={formData.esic_opt_out}
                                                    onChange={(e) => setFormData({ ...formData, esic_opt_out: e.target.checked })}
                                                    className="w-5 h-5 text-orange-500 rounded-10 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                                                />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none">Opt-out ESIC</span>
                                            </label>

                                            <label htmlFor="edit_ptax_opt_out" className="flex items-center space-x-2 cursor-pointer p-4 rounded-10 hover:bg-slate-50 dark:hover:bg-white/5 border-2 border-transparent hover:border-slate-900/10 transition-all">
                                                <input
                                                    id="edit_ptax_opt_out"
                                                    name="ptax_opt_out"
                                                    type="checkbox"
                                                    checked={formData.ptax_opt_out}
                                                    onChange={(e) => setFormData({ ...formData, ptax_opt_out: e.target.checked })}
                                                    className="w-5 h-5 text-orange-500 rounded-10 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                                                />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none">Opt-out PTAX</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select id="edit_status" name="status" autoComplete="off" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-orange-500/30 rounded-10 outline-none font-bold text-sm transition-all">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    <div className="md:col-span-2 flex justify-end gap-4 mt-8">
                                        <button type="button" onClick={closeModals} className="px-8 py-4 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-10 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-900/5">Abort</button>
                                        <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-slate-900 dark:bg-orange-600 text-white rounded-10 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50">
                                            {isSubmitting ? "COMMITING..." : "COMMIT UPDATES"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-in zoom-in duration-300">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-10 max-w-md w-full border-2 border-slate-900/10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-red-500"></div>
                        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-10 flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Terminate Agent?</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-10 leading-relaxed pr-2 pl-2">
                            "Confirm permanent deletion of <span className="text-red-500 font-black">{selectedEmployee?.user?.name}</span> from organization intelligence. This action is irreversible."
                        </p>
                        <div className="flex gap-4">
                            <button onClick={closeModals} className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-10 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-900/5">Abort</button>
                            <button onClick={handleDeleteSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-red-600 text-white rounded-10 text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50">
                                {isSubmitting ? "WIPING..." : "CONFIRM WIPE"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {isViewModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-10 w-full max-w-4xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/10 relative mx-auto flex flex-col max-h-[92vh] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
                        <div className="px-10 py-10 flex justify-between items-center bg-slate-50 dark:bg-white/5 border-b-2 border-slate-900/5">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-10 p-1 shadow-inner border-2 border-slate-900/5 overflow-hidden group">
                                    {selectedEmployee.profile_photo ? (
                                        <img
                                            src={selectedEmployee.profile_photo.startsWith('http') ? selectedEmployee.profile_photo : `${STORAGE_URL}/${selectedEmployee.profile_photo}`}
                                            alt={selectedEmployee.user?.name}
                                            className="w-full h-full object-cover rounded-10 transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600">
                                            {selectedEmployee.user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white font-paperlogy uppercase tracking-tight">{selectedEmployee.user?.name}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-10 text-[9px] font-black uppercase tracking-widest border border-blue-200/50">
                                            {selectedEmployee.designation?.name || "Tier: Unassigned"}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400">ID: {selectedEmployee.employee_code}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={closeModals} className="p-4 bg-white dark:bg-white/5 text-slate-400 hover:text-blue-500 transition-colors rounded-10 group border-2 border-slate-900/5 shadow-md">
                                <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8 text-slate-500">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <span className="w-8 h-[2px] bg-blue-500"></span>
                                        Bio-Metrics & Personal
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Link</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white lowercase">{selectedEmployee.user?.email}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Comm Frequency</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedEmployee.phone || "N/A"}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Emergency Frequency</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedEmployee.emergency_contact || "N/A"}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stardate of Birth</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{formatDate(selectedEmployee.dob)}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gender Class</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedEmployee.gender || "UNIDENTIFIED"}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Civil Status</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedEmployee.marital_status || "SINGLE"}</span>
                                        </div>
                                        <div className="sm:col-span-2 p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Terminal Address</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-relaxed">{selectedEmployee.address || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <span className="w-8 h-[2px] bg-indigo-500"></span>
                                        Operational Intelligence
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assigned Division</span>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">{selectedEmployee.department?.name}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sector Origin</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedEmployee.country?.name || "N/A"}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sub-Unit</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedEmployee.sub_company?.name || "INTEGRATED"}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Activation Stardate</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{formatDate(selectedEmployee.date_of_joining)}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Aadhar Identification</span>
                                            <span className="text-xs font-black font-mono text-slate-600 dark:text-slate-300">
                                                {selectedEmployee.aadhar_number ? selectedEmployee.aadhar_number.replace(/\d{8}(\d{4})/, "XXXX-XXXX-$1") : "N/A"}
                                            </span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-900/5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">PAN Identification</span>
                                            <span className="text-xs font-black font-mono text-slate-600 dark:text-slate-300">{selectedEmployee.pan_number || "N/A"}</span>
                                        </div>
                                        <div className="sm:col-span-2 p-6 bg-slate-900 dark:bg-white/5 rounded-10 border-2 border-slate-900 shadow-lg">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Salary Algorithm Matrix</h4>
                                                <div className={`px-3 py-1 rounded-10 text-[8px] font-black uppercase tracking-widest ${selectedEmployee.user?.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {selectedEmployee.user?.is_active ? 'Online' : 'Terminated'}
                                                </div>
                                            </div>
                                            {canViewSalary ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                        <div>
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Base Accumulation</span>
                                                            <span className="text-xl font-black text-white">₹{selectedEmployee.current_salary?.gross_salary || "0.00"}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Net Allocation</span>
                                                            <span className="text-2xl font-black text-[#00b9cd]">₹{((selectedEmployee.current_salary?.gross_salary || 0) - (selectedEmployee.current_salary?.pf || 0) - (selectedEmployee.current_salary?.esic || 0) - (selectedEmployee.current_salary?.ptax || 0)).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center text-slate-500">Salary Restricted Segment</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 pt-10 border-t-2 border-slate-900/5 flex justify-end">
                                <button onClick={closeModals} className="px-12 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-10 text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-blue-500/20 active:translate-y-1 transition-all">Terminate View</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[2000] p-4 animate-in zoom-in duration-300">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-10 max-w-md w-full border-2 border-slate-900/10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-[#00b9cd]"></div>
                        <div className="w-24 h-24 bg-[#00b9cd]/10 dark:bg-teal-900/20 rounded-10 flex items-center justify-center text-[#00b9cd] mx-auto mb-8 shadow-inner">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Access Credentials Generated</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Temporary Authentication Token</p>

                        <div className="bg-slate-50 dark:bg-white/5 border-2 border-dashed border-[#00b9cd]/30 p-8 rounded-10 mb-8 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-[#00b9cd]/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <p className="text-4xl font-black text-[#00b9cd] dark:text-[#00b9cd] font-mono tracking-[0.2em] relative">
                                {createdPassword}
                            </p>
                            <p className="text-[9px] font-black text-slate-400 mt-4 uppercase tracking-[0.1em]">Secure Copy Required Immediately</p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200/50 text-amber-700 dark:text-amber-400 p-6 rounded-10 text-[10px] font-bold text-left mb-10 leading-relaxed">
                            <span className="font-black decoration-amber-500 decoration-2 underline mr-2">PROTOCOL:</span>
                            This credential will be purged from volatile memory upon termination of this session. Ensure agent receipt immediately.
                        </div>

                        <button
                            onClick={() => { setIsPasswordModalOpen(false); setCreatedPassword(null); }}
                            className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-10 text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-[#f06464]/20 active:translate-y-1 transition-all"
                        >
                            Decommission Modal
                        </button>
                    </div>
                </div>
            )}

            {/* Face Enrollment Modal */}
            {showFaceEnrollment && pendingEmployeeData && (
                <FaceEnrollment
                    email={pendingEmployeeData.email}
                    onFaceEnrolled={handleFaceEnrolled}
                    onClose={() => {
                        setShowFaceEnrollment(false);
                        setPendingEmployeeData(null);
                    }}
                />
            )}
        </>
    );
};

export default EmployeesPage;
