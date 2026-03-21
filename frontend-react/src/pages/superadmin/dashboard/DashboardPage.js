import React, { useState, useEffect, useCallback } from 'react'; import { Users, Briefcase, Building2, ShieldCheck, Activity, Server, Database, HardDrive, Cpu, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'; import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend, Sector, ResponsiveContainer, RadialBarChart, RadialBar, LabelList } from 'recharts'; import api from '../../../api/axios'; // --- Components ---
const StatCard = ({ title, value, icon: Icon, color, bg, border, loading }) => (
    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex items-center gap-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-lg transition-all duration-300 group">
        <div className={`${bg || 'bg-slate-50 dark:bg-white/5'} ${color || 'text-slate-600 dark:text-slate-400'} ${border || 'border-slate-100 dark:border-white/10'} border-2 p-3.5 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={24} strokeWidth={2.5} />
        </div>
        <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">
                {loading ? <div className="h-6 w-16 bg-slate-100 dark:bg-white/5 animate-pulse rounded" /> : value}
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-tight uppercase">{title}</div>
        </div>
    </div>
);

const ChartCard = ({ title, children, loading }) => {
    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
    const containerRef = React.useRef(null);

    useEffect(() => {
        if (loading) return;
        const updateSize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                if (offsetWidth > 0 && offsetHeight > 0) {
                    setChartDimensions({ width: offsetWidth, height: offsetHeight });
                }
            }
        };
        updateSize();
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateSize);
        });
        if (containerRef.current) { resizeObserver.observe(containerRef.current); }
        return () => resizeObserver.disconnect();
    }, [loading]);

    return (
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">{title}</h3>
            <div ref={containerRef} className="w-full h-[300px] min-w-0 relative">
                {loading ? (
                    <div className="w-full h-full bg-slate-50 dark:bg-white/5 rounded-2xl animate-pulse flex items-center justify-center text-slate-400">
                        <RefreshCw className="animate-spin mr-2" size={20} /> Loading Chart...
                    </div>
                ) : (
                    chartDimensions.width > 0 && React.Children.map(children, child =>
                        React.isValidElement(child) ? React.cloneElement(child, { width: chartDimensions.width, height: chartDimensions.height }) : child
                    )
                )}
            </div>
        </div>
    );
};

const ActivityItem = ({ message, time, type }) => {
    const icons = {
        info: <Activity size={16} strokeWidth={2.5} className="text-blue-500" />,
        success: <CheckCircle size={16} strokeWidth={2.5} className="text-green-500" />,
        warning: <AlertTriangle size={16} strokeWidth={2.5} className="text-yellow-500" />,
        error: <AlertTriangle size={16} strokeWidth={2.5} className="text-red-500" />
    };
    return (
        <div className="flex gap-4 items-start pb-6 border-l-2 border-slate-100 dark:border-white/5 last:border-0 pl-6 relative group">
            <div className="absolute -left-[11px] top-0 bg-white dark:bg-slate-900 p-1.5 rounded-full border-2 border-slate-100 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform">
                {icons[type] || icons.info}
            </div>
            <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-200 font-bold leading-tight">{message}</p>
                <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mt-1.5 tracking-widest">{time}</p>
            </div>
        </div>
    );
}; // --- Chart Helpers ---
const renderActiveShape = (props) => { const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props; const sin = Math.sin(-RADIAN * midAngle); const cos = Math.cos(-RADIAN * midAngle); const sx = cx + (outerRadius + 10) * cos; const sy = cy + (outerRadius + 10) * sin; const mx = cx + (outerRadius + 30) * cos; const my = cy + (outerRadius + 30) * sin; const ex = mx + (cos >= 0 ? 1 : -1) * 22; const ey = my; const textAnchor = cos >= 0 ? 'start' : 'end'; return (<g> <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xl font-bold"> {payload.name} </text> <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} /> <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12} fill={fill} /> </g>); }; const RADIAN = Math.PI / 180; import { useAuth } from '../../../context/AuthContext'; // Import useAuth
// --- Main Dashboard Page ---
const DashboardPage = () => {
    const { user } = useAuth(); // Get user from context
    const [loading, setLoading] = useState(true); const [lastUpdated, setLastUpdated] = useState(new Date()); const [isDarkMode, setIsDarkMode] = useState(false); // Data States
    const [stats, setStats] = useState({}); const [employeeGrowth, setEmployeeGrowth] = useState([]); const [deptDistribution, setDeptDistribution] = useState([]); const [attendanceTrends, setAttendanceTrends] = useState([]); const [todayAttendance, setTodayAttendance] = useState([]); const [leavesSummary, setLeavesSummary] = useState({}); const [activityLog, setActivityLog] = useState([]); // Interactive Chart States
    const [activeIndexAttendance, setActiveIndexAttendance] = useState(0); const [activeIndexLeaves, setActiveIndexLeaves] = useState(0); const onPieEnterAttendance = (_, index) => { setActiveIndexAttendance(index); }; const onPieEnterLeaves = (_, index) => { setActiveIndexLeaves(index); }; const [mounted, setMounted] = useState(false); useEffect(() => { // Check initial dark mode
        if (document.documentElement.classList.contains('dark')) { setIsDarkMode(true); } // Observer for class changes on html element to detect dark mode toggle
        const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.attributeName === 'class') { setIsDarkMode(document.documentElement.classList.contains('dark')); } }); }); observer.observe(document.documentElement, { attributes: true }); return () => observer.disconnect();
    }, []); const fetchAllData = useCallback(async () => { try { const [statsRes, growthRes, deptRes, attendanceRes, leavesRes, recentActivityRes, todayAttendanceRes] = await Promise.all([api.get('/superadmin/stats'), api.get('/superadmin/employee-growth'), api.get('/superadmin/department-distribution'), api.get('/superadmin/attendance-trends'), api.get('/superadmin/leaves-summary'), api.get('/superadmin/activity-log'), api.get('/superadmin/today-attendance')]); setStats(statsRes.data); setEmployeeGrowth(growthRes.data); setDeptDistribution(deptRes.data); setAttendanceTrends(attendanceRes.data); setLeavesSummary(leavesRes.data); setActivityLog(recentActivityRes.data); setTodayAttendance(todayAttendanceRes.data); setLastUpdated(new Date()); } catch (error) { console.error("Failed to fetch dashboard data", error); } finally { setLoading(false); } }, []); useEffect(() => {
        setMounted(true); fetchAllData(); const interval = setInterval(fetchAllData, 5000); // Auto-refresh every 5s
        return () => clearInterval(interval);
    }, [fetchAllData]); if (!mounted) return null;    // Chart Colors & Styles
    const COLORS = ['#2563eb', '#10b981', '#6366f1', '#f59e0b', '#ef4444'];
    const chartGridColor = isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const chartTextColor = isDarkMode ? "#94a3b8" : "#64748b";
    const tooltipStyle = {
        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
        borderRadius: '16px',
        borderWidth: '2px',
        boxShadow: isDarkMode ? '4px 4px 0px 0px rgba(255,255,255,0.1)' : '4px 4px 0px 0px rgba(71,85,105,0.2)',
        fontSize: '12px',
        fontWeight: 'bold'
    };
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-10 relative overflow-hidden">
            {/* Fluid Background SVGs */}
            {/* <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-400/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-float pointer-events-none z-0"></div> */}
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-float pointer-events-none z-0" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[40%] left-[30%] w-64 h-64 bg-brand-300/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-50 animate-float pointer-events-none z-0" style={{ animationDelay: '4s' }}></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-10">
                <div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        <span className="italic">Dashboard</span> <span className="text-transparent bg-clip-text bg-[#00b9cd]">Overview</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Real-time insights and system monitoring</p>
                        </div>
                </div>
                <div
                    onClick={fetchAllData}
                    className="flex items-center gap-3 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md group"
                >
                    <RefreshCw size={16} className={`text-blue-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} strokeWidth={2.5} />
                    <span className="uppercase tracking-widest">Last Updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <StatCard title="Total Users" value={stats.total_users} icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" border="border-blue-100 dark:border-blue-500/20" loading={loading} />
                <StatCard title="Total Employees" value={stats.total_employees} icon={Briefcase} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-500/10" border="border-green-100 dark:border-green-500/20" loading={loading} />
                <StatCard title="Departments" value={stats.total_departments} icon={Building2} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-500/10" border="border-indigo-100 dark:border-indigo-500/20" loading={loading} />
                <StatCard title="Admins & HR" value={stats.total_admins_and_hr} icon={ShieldCheck} color="text-slate-600 dark:text-slate-400" bg="bg-slate-50 dark:bg-white/10" border="border-slate-100 dark:border-white/20" loading={loading} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

                {/* Left Column - Wide Charts */}
                <div className="lg:col-span-2 space-y-6">
                    <ChartCard title="Employee Growth (12 Months)" loading={loading}>
                        <AreaChart data={employeeGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 600 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 600 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
                        </AreaChart>
                    </ChartCard>

                    <ChartCard title="Attendance Trends (6 Months)" loading={loading}>
                        <BarChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 600 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 600 }} />
                            <Tooltip cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={tooltipStyle} />
                            <Legend iconType="circle" wrapperStyle={{ fontWeight: 'bold' }} />
                            <Bar dataKey="present" name="Present" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
                            <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
                        </BarChart>
                    </ChartCard>

                    <ChartCard title="Today's Attendance Overview" loading={loading}>
                        <BarChart data={todayAttendance} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: chartTextColor, fontSize: 13, fontWeight: 700 }} width={120} />
                            <Tooltip cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={tooltipStyle} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1000}>
                                {todayAttendance.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                                <LabelList dataKey="value" position="right" fill={chartTextColor} fontSize={14} fontWeight="black" />
                            </Bar>
                        </BarChart>
                    </ChartCard>
                </div>

                {/* Right Column - Square Widgets */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] flex flex-col h-[400px] overflow-hidden">
                        <div className="p-5 border-b-2 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Activity size={20} className="text-blue-500" strokeWidth={2.5} /> Recent Activity
                            </h3>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-4 flex-1 custom-scrollbar">
                            {activityLog.length > 0 ? (
                                activityLog.map((log, idx) => (
                                    <ActivityItem key={idx} message={log.message} time={log.timestamp} type={log.type || 'info'} />
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Database size={40} className="mb-2 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <ChartCard title="Department Distribution" loading={loading}>
                        <PieChart>
                            <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="department">
                                {deptDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontWeight: 'bold', paddingTop: '20px' }} />
                        </PieChart>
                    </ChartCard>

                    <ChartCard title="Leaves Status" loading={loading}>
                        <PieChart>
                            <Pie
                                activeIndex={activeIndexLeaves}
                                activeShape={renderActiveShape}
                                data={[
                                    { name: 'Approved', value: leavesSummary.approved || 0 },
                                    { name: 'Pending', value: leavesSummary.pending || 0 },
                                    { name: 'Rejected', value: leavesSummary.rejected || 0 },
                                ]}
                                cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" onMouseEnter={onPieEnterLeaves}
                            >
                                <Cell fill="#2563eb" stroke="transparent" />
                                <Cell fill="#f59e0b" stroke="transparent" />
                                <Cell fill="#f43f5e" stroke="transparent" />
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', paddingTop: '20px' }} />
                        </PieChart>
                    </ChartCard>
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;