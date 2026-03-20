import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmployeeSidebar from "../components/EmployeeSidebar";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";
import { useEffect } from "react";

const EmployeeLayout = ({ children }) => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Refresh user data on route change to keep UI in sync (e.g. status changes, name changes)
    useEffect(() => {
        refreshUser();
    }, [location.pathname, refreshUser]);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex h-screen overflow-hidden mesh-bg">
            {/* Sidebar */}
            <div className="hidden md:block">
                <EmployeeSidebar />
            </div>

            {/* Simple responsive: show sidebar always for now, or handle mobile menu later */}
            <div className="md:hidden">
                <EmployeeSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-brand-900 border-b-2 border-black dark:border-white flex items-center justify-between px-6 shadow-sm transition-colors duration-200 sticky top-0 z-50">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Welcome, </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {user?.name || "Employee"}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            className="btn-accent"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default EmployeeLayout;
