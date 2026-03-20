import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const ProtectedLayout = ({ children }) => {
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
        <Sidebar />
      </div>

      {/* Simple responsive: show sidebar always for now */}
      <div className="md:hidden">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-brand-900 border-b-2 border-black dark:border-white flex items-center justify-between px-6 shadow-sm transition-colors duration-200 sticky top-0 z-10">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Welcome, </span>
            <span className="font-bold text-gray-900 dark:text-white">{user?.name || "User"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn-accent"
          >
            Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default ProtectedLayout;


