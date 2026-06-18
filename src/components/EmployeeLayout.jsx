import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmployeeSidebar from "./EmployeeSidebar";
import NotificationBell from "./NotificationBell"; // NEW
import ThemeToggle from "./ThemeToggle"; // NEW
import { useEffect } from "react";

const EmployeeLayout = ({ children }) => {
  const { user, logout, refreshUser, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Refresh user data on route change (navigation)
  useEffect(() => {
    if (token) {
      refreshUser(token);
    }
  }, [location.pathname, refreshUser, token]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (token) {
        refreshUser(token);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [refreshUser, token]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <EmployeeSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900 transition-colors duration-200 shadow-sm">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Welcome, </span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {user?.name || "Employee"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/30 rounded-10 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;

