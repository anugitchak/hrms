import React, { useState, useEffect, useCallback } from 'react'; import { Users, Briefcase, Building2, ShieldCheck, Activity, Server, Database, HardDrive, Cpu, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'; import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend, Sector, ResponsiveContainer, RadialBarChart, RadialBar, LabelList } from 'recharts'; import api from '../../../api/axios'; // --- Components ---
const StatCard = ({ title, value, icon: Icon, color, loading }) => ( <div className="card p-6"> <div className="flex justify-between items-start"> <div> <p className="text-sm font-medium text-gray-900 mb-1">{title}</p> {loading ? ( <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> ) : ( <h3 className="text-4xl font-extrabold text-black dark:text-white">{value}</h3> )} </div> <div className={`p-3 rounded-lg border-2 border-black ${color}`}> <Icon className="w-6 h-6 text-white" /> </div> </div> </div> ); const ChartCard = ({ title, children, loading }) => { const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 }); const containerRef = React.useRef(null); useEffect(() => { if (loading) return; const updateSize = () => { if (containerRef.current) { const { offsetWidth, offsetHeight } = containerRef.current; if (offsetWidth > 0 && offsetHeight > 0) { setChartDimensions({ width: offsetWidth, height: offsetHeight }); } } }; // Initial check
updateSize(); // Observer for resizing
const resizeObserver = new ResizeObserver(() => { // Debounce slightly to avoid thrashing
requestAnimationFrame(updateSize); }); if (containerRef.current) { resizeObserver.observe(containerRef.current); } return () => resizeObserver.disconnect(); }, [loading]); return ( <div className="card p-6 min-w-0"> <h3 className="text-xl font-bold text-black mb-6">{title}</h3> <div ref={containerRef} className="w-full h-[300px] min-w-0 relative" style={{ width: '100%', height: 300 }} > {loading ? ( <div className="w-full h-full bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse flex items-center justify-center text-gray-400 dark:text-gray-900"> Loading Chart... </div> ) : ( chartDimensions.width > 0 && React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { width: chartDimensions.width, height: chartDimensions.height }) : child ) )} </div> </div> ); }; const ActivityItem = ({ message, time, type }) => { const icons = { info: <Activity size={16} className="text-blue-500" />, success: <CheckCircle size={16} className="text-green-500" />, warning: <AlertTriangle size={16} className="text-yellow-500" />, error: <AlertTriangle size={16} className="text-red-500" /> }; return ( <div className="flex gap-4 items-start pb-6 border-l-2 border-gray-100 dark:border-gray-700 last:border-0 pl-4 relative transition-colors duration-200"> <div className="absolute -left-[9px] top-0 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-100 dark:border-gray-700 transition-colors duration-200"> {icons[type] || icons.info} </div> <div> <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{message}</p> <p className="text-xs text-gray-900 mt-1">{time}</p> </div> </div> ); }; // --- Chart Helpers ---
const renderActiveShape = (props) => { const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props; const sin = Math.sin(-RADIAN * midAngle); const cos = Math.cos(-RADIAN * midAngle); const sx = cx + (outerRadius + 10) * cos; const sy = cy + (outerRadius + 10) * sin; const mx = cx + (outerRadius + 30) * cos; const my = cy + (outerRadius + 30) * sin; const ex = mx + (cos >= 0 ? 1 : -1) * 22; const ey = my; const textAnchor = cos >= 0 ? 'start' : 'end'; return ( <g> <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xl font-bold"> {payload.name} </text> <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} /> <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12} fill={fill} /> </g> ); }; const RADIAN = Math.PI / 180; import { useAuth } from '../../../context/AuthContext'; // Import useAuth
// --- Main Dashboard Page ---
const DashboardPage = () => { const { user } = useAuth(); // Get user from context
const [loading, setLoading] = useState(true); const [lastUpdated, setLastUpdated] = useState(new Date()); const [isDarkMode, setIsDarkMode] = useState(false); // Data States
const [stats, setStats] = useState({}); const [employeeGrowth, setEmployeeGrowth] = useState([]); const [deptDistribution, setDeptDistribution] = useState([]); const [attendanceTrends, setAttendanceTrends] = useState([]); const [todayAttendance, setTodayAttendance] = useState([]); const [leavesSummary, setLeavesSummary] = useState({}); const [activityLog, setActivityLog] = useState([]); // Interactive Chart States
const [activeIndexAttendance, setActiveIndexAttendance] = useState(0); const [activeIndexLeaves, setActiveIndexLeaves] = useState(0); const onPieEnterAttendance = (_, index) => { setActiveIndexAttendance(index); }; const onPieEnterLeaves = (_, index) => { setActiveIndexLeaves(index); }; const [mounted, setMounted] = useState(false); useEffect(() => { // Check initial dark mode
if (document.documentElement.classList.contains('dark')) { setIsDarkMode(true); } // Observer for class changes on html element to detect dark mode toggle
const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.attributeName === 'class') { setIsDarkMode(document.documentElement.classList.contains('dark')); } }); }); observer.observe(document.documentElement, { attributes: true }); return () => observer.disconnect(); }, []); const fetchAllData = useCallback(async () => { try { const [ statsRes, growthRes, deptRes, attendanceRes, leavesRes, recentActivityRes, todayAttendanceRes ] = await Promise.all([ api.get('/superadmin/stats'), api.get('/superadmin/employee-growth'), api.get('/superadmin/department-distribution'), api.get('/superadmin/attendance-trends'), api.get('/superadmin/leaves-summary'), api.get('/superadmin/activity-log'), api.get('/superadmin/today-attendance') ]); setStats(statsRes.data); setEmployeeGrowth(growthRes.data); setDeptDistribution(deptRes.data); setAttendanceTrends(attendanceRes.data); setLeavesSummary(leavesRes.data); setActivityLog(recentActivityRes.data); setTodayAttendance(todayAttendanceRes.data); setLastUpdated(new Date()); } catch (error) { console.error("Failed to fetch dashboard data", error); } finally { setLoading(false); } }, []); useEffect(() => { setMounted(true); fetchAllData(); const interval = setInterval(fetchAllData, 5000); // Auto-refresh every 5s
return () => clearInterval(interval); }, [fetchAllData]); if (!mounted) return null; // Chart Colors & Styles
const COLORS = ['#14b8a6', '#f43f5e', '#2dd4bf', '#fb7185', '#0f766e']; const chartGridColor = isDarkMode ?"#042f2e" :"#ccfbf1"; const chartTextColor = isDarkMode ?"#99f6e4" :"#115e59"; const tooltipStyle = { backgroundColor: isDarkMode ? '#134e4a' : '#ffffff', borderColor: isDarkMode ? '#0f766e' : '#ccfbf1', color: isDarkMode ? '#f0fdfa' : '#134e4a', borderRadius: '8px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }; return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 relative overflow-hidden rounded-xl">
            {/* Fluid Background SVGs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-400/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-float pointer-events-none z-0"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-float pointer-events-none z-0" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[40%] left-[30%] w-64 h-64 bg-brand-300/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-50 animate-float pointer-events-none z-0" style={{ animationDelay: '4s' }}></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-6xl font-extrabold font-paperlogy text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-900 dark:text-gray-300 mt-1 font-medium">Real-time insights and system monitoring.</p>
                </div>
                <div 
                    onClick={fetchAllData}
                    className="flex items-center gap-3 text-sm font-bold text-black bg-white px-4 py-2 rounded-lg border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                    title="Click to refresh data"
                >
                    <RefreshCw size={16} className={`text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                    <span className="uppercase uppercase tracking-wide">Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <StatCard title="Total Users" value={stats.total_users} icon={Users} color="bg-blue-500" loading={loading} />
                <StatCard title="Total Employees" value={stats.total_employees} icon={Briefcase} color="bg-brand-500" loading={loading} />
                <StatCard title="Departments" value={stats.total_departments} icon={Building2} color="bg-accent-500" loading={loading} />
                <StatCard title="Admins & HR" value={stats.total_admins_and_hr} icon={ShieldCheck} color="bg-black" loading={loading} />
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
                    <div className="card p-0 flex flex-col h-[400px] overflow-hidden">
                        <div className="p-5 border-b-4 border-black bg-brand-200">
                            <h3 className="text-xl font-black text-black m-0 flex items-center gap-2 uppercase tracking-tight">
                                <Activity size={24} className="text-black" /> Recent Activity
                            </h3>
                        </div>
                        <div className="overflow-y-auto p-5 space-y-4 flex-1 custom-scrollbar bg-white dark:bg-gray-800">
                            {activityLog.length > 0 ? (
                                activityLog.map((log, idx) => (
                                    <ActivityItem key={idx} message={log.message} time={log.timestamp} type={log.type || 'info'} />
                                ))
                            ) : (
                                <p className="text-gray-500 font-bold text-center py-10">No recent activity</p>
                            )}
                        </div>
                    </div>

                    <ChartCard title="Department Distribution" loading={loading}>
                        <PieChart>
                            <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="department">
                                {deptDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend iconType="circle" wrapperStyle={{ fontWeight: 'bold' }} />
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
                                <Cell fill="#2563eb" stroke="#000" strokeWidth={2} />
                                <Cell fill="#f59e0b" stroke="#000" strokeWidth={2} />
                                <Cell fill="#f43f5e" stroke="#000" strokeWidth={2} />
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold' }} />
                        </PieChart>
                    </ChartCard>
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;