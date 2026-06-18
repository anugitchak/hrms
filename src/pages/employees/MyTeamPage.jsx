import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { 
    Users, Calendar, Clock, ArrowLeft, RefreshCw, 
    Search, Filter, ExternalLink, ShieldCheck, 
    UserCheck, UserX, Briefcase, Mail, Phone,
    FileText, CheckCircle, ChevronRight, X
} from "lucide-react";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out ${className}`}>
        {(title || Icon) && (
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Icon size={18} /></div>}
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon, type = "button" }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

const MyTeamPage = () => {
    const [activeTab, setActiveTab] = useState("members");
    const [loading, setLoading] = useState(false);

    // Data States
    const [members, setMembers] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);

    // Filters
    const [search, setSearch] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
    const [attendanceFilterEmployeeId, setAttendanceFilterEmployeeId] = useState(""); // For Attendance Tab
    const [leaveFilterEmployeeId, setLeaveFilterEmployeeId] = useState(""); // For Leaves Tab

    // Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchData();
        if (activeTab === "attendance" && attendanceFilterEmployeeId) {
            fetchHistory(attendanceFilterEmployeeId, historyMonth);
        }
    }, [activeTab, attendanceDate, attendanceFilterEmployeeId, leaveFilterEmployeeId, historyMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "members") {
                const response = await axios.get("/my-team");
                setMembers(response.data);
            } else if (activeTab === "attendance") {
                // Only fetch daily team data if NO filter is selected
                if (!attendanceFilterEmployeeId) {
                    const response = await axios.get(`/my-team/attendance?date=${attendanceDate}`);
                    setAttendance(response.data.data || []);
                } else {
                    // Start Loading for history if filter is selected (handled by fetchHistory but let's clear main table)
                    setAttendance([]);
                }
            } else if (activeTab === "leaves") {
                let url = "/my-team/leaves";
                if (leaveFilterEmployeeId) {
                    url += `?employee_id=${leaveFilterEmployeeId}`;
                }
                const response = await axios.get(url);
                setLeaves(response.data.data || []); // Paginated, safeguard with empty array
            }
        } catch (error) {
            console.error("Error fetching team data", error);
        } finally {
            setLoading(false);
        }
    };

    // Action Handlers
    const handleViewAttendanceHistory = async (employee) => {
        setSelectedEmployee(employee);
        setShowHistoryModal(true);
        fetchHistory(employee.id, historyMonth);
    };

    const fetchHistory = async (empId, month) => {
        setHistoryLoading(true);
        try {
            const response = await axios.get(`/attendance/employee/${empId}?month=${month}`);
            setHistoryData(response.data);
        } catch (error) {
            console.error("Error fetching history", error);
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewLeaveHistory = (employeeId) => {
        setLeaveFilterEmployeeId(employeeId);
        setActiveTab("leaves");
    };

    if (loading && !members.length && !attendance.length && !leaves.length) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-16 h-16 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#00b9cd] animate-pulse">Scanning Personnel...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen font-paperlogy mesh-bg">
            {/* Tactical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 relative z-10 px-4">
                <div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Squad <span className="text-transparent bg-clip-text bg-[#00b9cd]">Command</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Operational overview of your direct reports</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        onClick={fetchData} 
                        icon={RefreshCw}
                        disabled={loading}
                        className={loading ? "animate-spin" : ""}
                    >
                        Sync Feed
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-10 border-b border-slate-100 dark:border-white/5 mb-10 overflow-x-auto no-scrollbar">
                {["members", "attendance", "leaves"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab 
                            ? "text-[#00b9cd]" 
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                    >
                        {tab === 'members' ? 'Personnel' : tab === 'attendance' ? 'Presence' : 'Deployments'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00b9cd] rounded-10"></div>}
                    </button>
                ))}
            </div>

            {/* Content Container */}
            <Card className="p-0 overflow-hidden border-none shadow-none bg-transparent dark:bg-transparent">
                
                {/* Personnel Tab */}
                {activeTab === "members" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {members.length > 0 ? members.map((emp) => (
                            <div key={emp.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)] border-2 border-transparent hover:border-[#00b9cd] transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00b9cd]/5 rounded-10 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                
                                <div className="flex items-start gap-6 mb-8 relative z-10">
                                    <div className="w-20 h-20 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] text-3xl font-black group-hover:bg-[#00b9cd] group-hover:text-white transition-all duration-500 border-2 border-[#00b9cd]/20">
                                        {emp.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight mb-1 truncate">{emp.user?.name}</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-[#00b9cd] uppercase tracking-widest bg-[#00b9cd]/5 px-3 py-1 rounded-10 w-fit border border-[#00b9cd]/10 mb-3">
                                            <ShieldCheck size={12} />
                                            {emp.department?.name || 'GEN-OPS'}
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase size={12} />
                                            {emp.designation?.name || emp.designation || 'Active Duty'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
                                    <div className="flex items-center gap-4 group/item">
                                        <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-10 text-slate-400 group-hover/item:text-[#00b9cd] transition-colors">
                                            <Mail size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate uppercase tracking-tighter">{emp.user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-4 group/item">
                                        <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-10 text-slate-400 group-hover/item:text-[#00b9cd] transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{emp.phone || 'COMMS-NA'}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-slate-900/40 rounded-10 border-2 border-dashed border-slate-100 dark:border-white/5">
                                <Users size={64} className="text-slate-100 dark:text-white/5 mb-6" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-2">Radio Silence</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No squad members detected in this sector.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Presence Tab */}
                {activeTab === "attendance" && (
                    <div className="space-y-8">
                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sticky top-0 z-20 pb-4 bg-transparent backdrop-blur-sm">
                            <Card className="p-4" title="Operational Filter" icon={Filter}>
                                <div className="flex flex-col gap-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Personnel</label>
                                    <select
                                        value={attendanceFilterEmployeeId}
                                        onChange={(e) => setAttendanceFilterEmployeeId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-10 px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:border-[#00b9cd] transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Full Squad (Daily Scan)</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.user?.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </Card>

                            <Card className="p-4" title="Time Vector" icon={Calendar}>
                                <div className="flex flex-col gap-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {!attendanceFilterEmployeeId ? 'Select Date' : 'Select Deployment Month'}
                                    </label>
                                    <input
                                        type={!attendanceFilterEmployeeId ? "date" : "month"}
                                        value={!attendanceFilterEmployeeId ? attendanceDate : historyMonth}
                                        onChange={(e) => !attendanceFilterEmployeeId ? setAttendanceDate(e.target.value) : setHistoryMonth(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-10 px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:border-[#00b9cd] transition-all outline-none cursor-pointer"
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Presence Table */}
                        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-xl border-2 border-slate-50 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5">
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                                                {!attendanceFilterEmployeeId ? 'Personnel' : 'Timeline'}
                                            </th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Check In</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Check Out</th>
                                            {attendanceFilterEmployeeId && (
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Duration</th>
                                            )}
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Operational Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {!attendanceFilterEmployeeId ? (
                                            attendance && attendance.length > 0 ? attendance.map((record) => (
                                                <tr key={record.id} className="group hover:bg-[#00b9cd]/5 transition-colors">
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] font-black text-xs">
                                                                {record.employee?.user?.name?.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{record.employee?.user?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">{record.check_in || 'N/A'}</td>
                                                    <td className="px-10 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">{record.check_out || 'N/A'}</td>
                                                    <td className="px-10 py-6">
                                                        <span className={`px-4 py-1 rounded-10 text-[9px] font-black uppercase tracking-widest border ${
                                                            record.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                                                            record.status === 'Absent' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20' :
                                                            'bg-slate-50 text-slate-400 border-slate-100 dark:bg-white/5 dark:border-white/10'
                                                        }`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="4" className="px-10 py-16 text-center text-xs font-black text-slate-400 uppercase tracking-widest">No sector scan data for this date.</td></tr>
                                            )
                                        ) : (
                                            historyLoading ? (
                                                <tr><td colSpan="5" className="px-10 py-16 text-center animate-pulse text-xs font-black text-[#00b9cd] uppercase tracking-[0.4em]">Synchronizing Archive...</td></tr>
                                            ) : historyData && historyData.length > 0 ? historyData.map((record) => (
                                                <tr key={record.id} className="group hover:bg-[#00b9cd]/5 transition-colors">
                                                    <td className="px-10 py-6 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{record.date}</td>
                                                    <td className="px-10 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">{record.check_in || '-'}</td>
                                                    <td className="px-10 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">{record.check_out || '-'}</td>
                                                    <td className="px-10 py-6 text-sm font-black text-[#00b9cd] tracking-widest">{record.total_hours}h</td>
                                                    <td className="px-10 py-6">
                                                        <span className={`px-4 py-1 rounded-10 text-[9px] font-black uppercase tracking-widest border ${
                                                            record.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            record.status === 'Weekend' ? 'bg-slate-50 text-slate-400 border-slate-100' :
                                                            'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" className="px-10 py-16 text-center text-xs font-black text-slate-400 uppercase tracking-widest">No archival data for this parameter.</td></tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deployments Tab */}
                {activeTab === "leaves" && (
                    <div className="space-y-8">
                        {/* Filter Bar */}
                        <div className="flex justify-start">
                            <Card className="p-4 w-full md:w-1/3" title="Deployment Filter" icon={Filter}>
                                <div className="flex flex-col gap-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Squad Selection</label>
                                    <select
                                        value={leaveFilterEmployeeId}
                                        onChange={(e) => setLeaveFilterEmployeeId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-10 px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:border-[#00b9cd] transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Full Operational View</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.user?.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </Card>
                        </div>

                        {/* Leaves Table */}
                        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-xl border-2 border-slate-50 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5">
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Personnel</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Objective Type</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Deployment Window</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Mission Rationale</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Command Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {leaves && leaves.length > 0 ? leaves.map((leave) => (
                                            <tr key={leave.id} className="group hover:bg-[#00b9cd]/5 transition-colors">
                                                <td className="px-10 py-6 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{leave.employee?.user?.name}</td>
                                                <td className="px-10 py-6">
                                                    <span className="text-[10px] font-black text-[#00b9cd] uppercase tracking-widest bg-[#00b9cd]/5 px-3 py-1 rounded-10 border border-[#00b9cd]/10">
                                                        {leave.leave_type?.name}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        {leave.start_date} <ArrowLeft size={12} className="rotate-180 text-slate-300" /> {leave.end_date}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-xs font-bold text-slate-500 max-w-xs truncate" title={leave.reason}>
                                                    {leave.reason || "CLASSIFIED"}
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1 rounded-10 text-[9px] font-black uppercase tracking-widest border ${
                                                        leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        leave.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="px-10 py-16 text-center text-xs font-black text-slate-400 uppercase tracking-widest">No deployment profiles found for this squad.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal for Attendance History could be added here, but the redesign above incorporates history into the Presence tab for a cleaner SPA feel. If required, we can keep the modal logic but use the tab instead. */}
        </div>
    );
};
export default MyTeamPage;
