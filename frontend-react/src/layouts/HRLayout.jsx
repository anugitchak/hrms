import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HRSidebar from "../components/HRSidebar";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

const HRLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex h-screen overflow-hidden mesh-bg">
            {/* Sidebar */}
            <div className="hidden md:block">
                <HRSidebar />
            </div>

            {/* Simple responsive: show sidebar always for now, or handle mobile menu later */}
            <div className="md:hidden">
                <HRSidebar />
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-white dark:bg-brand-900 border-b-2 border-black dark:border-white flex items-center justify-between px-6 shadow-sm transition-colors duration-200 sticky top-0 z-50">
                    <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Welcome, </span>
                        <span className="font-bold text-gray-900 dark:text-white">{user?.name || "HR"}</span>
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

                {/* Page content */}
                <main className="flex-1 p-4 overflow-auto">{children}</main>
            </div>
        </div>
    );
};

export default HRLayout;
