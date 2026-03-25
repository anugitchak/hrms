import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Building2, BadgeCheck, Clock, Calendar,
  Banknote, FileText, File, UserPlus, Star, Megaphone, Settings,
  Sliders, Bell, Activity, UserCog, BarChart, User, LogOut,
  Menu, ChevronLeft, ChevronRight, Briefcase, CalendarDays,
  ShieldCheck, CheckSquare, PenTool, Settings2, Presentation, MapIcon
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
      countries: MapIcon,
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
    open: { width: "260px", transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { width: "84px", transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <motion.aside
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl h-screen sticky top-0 flex flex-col shadow-xl z-20 transition-colors duration-300 border-r border-slate-200 dark:border-slate-800 overflow-x-hidden"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <img src="/logo-light.png" alt="HRMS Logo" className="h-8 object-contain dark:hidden" />
              <img src="/logo-dark.png" alt="HRMS Logo" className="h-8 object-contain hidden dark:block" />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-10 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-400 dark:text-slate-500 ml-auto"
        >
          {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-6 space-y-3 custom-scrollbar ${isOpen ? 'px-4' : 'px-3'}`}>
        {menuItems.map((item) => {
          const Icon = getIcon(item.key);
          const isActive = location.pathname.startsWith(item.to);

          const LinkContent = (
            <NavLink
              to={item.to}
              className={({ isActive }) => `
                relative flex items-center rounded-10 group
                border border-slate-200 dark:border-slate-800
                ${isOpen ? 'gap-4 px-4 py-3 w-full' : 'justify-center p-3.5 w-full mx-auto'}
                ${isActive
                  ? "bg-[#00b9cd]/15 dark:bg-[#00b9cd]/20 text-black dark:text-white translate-x-[1px] translate-y-[1px] shadow-none border-[#00b9cd] dark:border-[#00b9cd]"
                  : "text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] font-bold"}
              `}
            >
              <div className={`
                flex-shrink-0 transition-all duration-200 
                ${isActive ? "scale-110 text-black dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white"}
              `}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              <AnimatePresence mode="wait">
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden font-black text-[11px] tracking-[0.1em] uppercase"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active Indicator (Right Border) */}
              {isActive && isOpen && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1.5 h-6 bg-[#f06464] dark:bg-white rounded-10"
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
      <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800/50">
        {isOpen ? (
          <button
            onClick={onLogout}
            className="w-full py-4 rounded-10 flex items-center justify-center gap-3 bg-accent-500 text-white font-black tracking-widest text-xs shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
          >
            <LogOut size={20} strokeWidth={3} />
            <span className="">Logout</span>
          </button>
        ) : (
          <Tooltip text="Logout">
            <button
              onClick={onLogout}
              className="w-full p-4 rounded-10 flex items-center justify-center bg-accent-500 text-white shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
            >
              <LogOut size={22} strokeWidth={3} />
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
