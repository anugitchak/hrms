import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ToggleSidebar from "./ui/ToggleSidebar";

const SuperAdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { key: "dashboard", label: "Dashboard", to: "/superadmin/dashboard" },
        { key: "employees", label: "Employees", to: "/superadmin/employees" },
        { key: "departments", label: "Departments", to: "/superadmin/departments" },
        { key: "designations", label: "Designations", to: "/superadmin/designations" },
        { key: "countries", label: "Countries", to: "/superadmin/countries" },
        { key: "sub-companies", label: "Sub-Companies", to: "/superadmin/sub-companies" },
        { key: "attendance", label: "Attendance", to: "/superadmin/attendance" },
        { key: "leaves", label: "Leaves (Approvals)", to: "/superadmin/leaves" },
        { key: "holidays", label: "Holiday Calendar", to: "/superadmin/holidays" },
        { key: "leave-policies", label: "Leave Policies", to: "/superadmin/leave-policies" },
        { key: "tasks", label: "Tasks / Productivity", to: "/superadmin/tasks" },

        { key: "salaries", label: "Salaries", to: "/superadmin/salaries" },
        { key: "payslips", label: "Payslips", to: "/superadmin/payslips" },
        { key: "payslip-designer", label: "Payslip Designer", to: "/superadmin/payslip-designer" },
        { key: "payroll-settings", label: "Payroll Settings", to: "/superadmin/payroll-settings" },
        { key: "documents", label: "Documents", to: "/superadmin/documents" },

        { key: "announcements", label: "Announcements", to: "/superadmin/announcements" },
        { key: "meetings", label: "Meetings", to: "/superadmin/meetings" },
        { key: "settings", label: "System Settings", to: "/superadmin/settings" },
        { key: "mail-settings", label: "Mail Settings", to: "/superadmin/mail-settings" },
        { key: "users", label: "User Management", to: "/superadmin/users" },
        { key: "reports", label: "Workforce Intelligence", to: "/superadmin/reports" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <ToggleSidebar
            title="HRMS"
            subtitle="Super Admin Portal"
            menuItems={menuItems}
            onLogout={handleLogout}
        />
    );
};

export default SuperAdminSidebar;
