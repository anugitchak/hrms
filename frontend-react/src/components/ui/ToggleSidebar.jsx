import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Building2, BadgeCheck, Clock, Calendar,
  Banknote, FileText, File, UserPlus, Star, Megaphone, Settings,
  Sliders, Bell, Activity, UserCog, BarChart, User, LogOut,
  Menu, ChevronLeft, ChevronRight, Briefcase, CalendarDays,
  ShieldCheck, CheckSquare, PenTool, Settings2, Presentation
} from "lucide-react";
import Tooltip from "./Tooltip";

const ToggleSidebar = ({ title, subtitle, menuItems, onLogout }) => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
  }, [isOpen]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Icon mapping
  const getIcon = (key) => {
    const icons = {
      dashboard: LayoutDashboard,
      employees: Users,
      departments: Building2,
      designations: BadgeCheck,
      "sub-companies": Briefcase,
      attendance: Clock,
      leaves: Calendar,
      holidays: CalendarDays,
      "leave-policies": ShieldCheck,
      tasks: CheckSquare,
      salaries: Banknote,
      salary: Banknote,
      payslips: FileText,
      "payslip-designer": PenTool,
      "payroll-settings": Settings2,
      documents: File,
      recruitment: UserPlus,
      "performance-reviews": Star,
      announcements: Megaphone,
      meetings: Presentation,
      settings: Settings,
      "system-controls": Sliders,
      notifications: Bell,
      "activity-log": Activity,
      users: UserCog,
      reports: BarChart,
      profile: User,
    };
    return icons[key] || LayoutDashboard;
  };

  const sidebarVariants = {
    open: { width: "250px", transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { width: "70px", transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <motion.aside
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="bg-white dark:bg-brand-900 border-r-2 border-black dark:border-white h-screen sticky top-0 flex flex-col shadow-sm z-20"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b-2 border-black dark:border-white">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <img src="/logo-light.png" alt="HRMS Logo" className="h-8 object-contain dark:hidden" />
              <img src="/logo-dark.png" alt="HRMS Logo" className="h-8 object-contain hidden dark:block" />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = getIcon(item.key);
          const isActive = location.pathname.startsWith(item.to);

          const LinkContent = (
            <NavLink
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group border-2
                ${isActive
                  ? "bg-brand-500 text-black border-black shadow-button translate-x-1"
                  : "border-transparent text-black dark:text-white hover:border-black dark:hover:border-white hover:bg-brand-50 dark:hover:bg-brand-800 hover:shadow-button hover:translate-x-1"}
              `}
            >
              <div className={`
                flex-shrink-0 transition-colors duration-200 text-black dark:text-white
              `}>
                <Icon size={20} />
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active Indicator (Right Border) */}
              {isActive && isOpen && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-0 w-1.5 h-8 bg-black dark:bg-white rounded-l-full"
                />
              )}
            </NavLink>
          );

          return isOpen ? (
            <div key={item.key} className="relative">
              {LinkContent}
            </div>
          ) : (
            <Tooltip key={item.key} text={item.label}>
              {LinkContent}
            </Tooltip>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t-2 border-black dark:border-white">
        {isOpen ? (
          <button
            onClick={onLogout}
            className="w-full btn-accent flex items-center justify-center gap-3"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        ) : (
          <Tooltip text="Logout">
            <button
              onClick={onLogout}
              className="w-full btn-accent flex items-center justify-center p-2.5"
            >
              <LogOut size={20} />
            </button>
          </Tooltip>
        )}
      </div>
      <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
    </motion.aside>
  );
};

export default ToggleSidebar;
