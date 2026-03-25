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
                            className="inline-flex items-center justify-center px-4 py-2 font-bold bg-accent-500 text-white rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
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
