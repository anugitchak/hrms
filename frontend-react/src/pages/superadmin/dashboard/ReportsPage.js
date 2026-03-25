import React, { useState, useEffect } from 'react'; 
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'; 
import { Trophy, Activity, Database, TrendingUp, Users, Target, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import api from '../../../api/axios'; 

const COLORS = ['#0d9488', '#10b981', '#14b8a6', '#059669', '#34d399', '#0f766e', '#064e3b']; 
const STATUS_COLORS = { Completed: '#059669', Pending: '#d97706', 'In Progress': '#2563eb', 'Pending Review': '#7c3aed', Rejected: '#dc2626', }; 

const StatCard = ({ label, value, sub, color = 'teal', icon: Icon }) => { 
    return ( 
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:-translate-y-1 border-2 border-slate-50 dark:border-white/5 relative overflow-hidden group">
            {Icon && <Icon className="absolute top-4 right-4 text-[#00b9cd]/10 group-hover:scale-110 transition-transform" size={64} />}
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3">{label}</p> 
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none mb-2">{value}</div> 
                {sub && <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">{sub}</p>} 
            </div>
        </div> 
    ); 
}; 

const LoadingSpinner = () => ( 
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]"> 
        <Activity size={48} className="text-[#00b9cd] animate-spin mb-4" /> 
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Compiling workforce intelligence...</p> 
    </div> 
); 

const ChartTooltip = ({ active, payload, label }) => { 
    if (!active || !payload?.length) return null; 
    return ( 
        <div className="bg-white dark:bg-slate-900/90 dark:backdrop-blur-md border-2 border-slate-900/5 dark:border-white/10 rounded-10 p-5 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out"> 
            {label && <p className="font-paperlogy font-black text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-widest">{label}</p>} 
            {payload.map((p, i) => ( 
                <p key={i} style={{ color: p.color }} className="font-bold text-xs flex items-center justify-between gap-4"> 
                    <span>{p.name}:</span> <span className="text-slate-900 dark:text-white">{p.value}</span> 
                </p> 
            ))} 
        </div> 
    ); 
}; 

const ReportsPage = () => { 
    const [activeTab, setActiveTab] = useState('overview'); 
    const [analytics, setAnalytics] = useState(null); 
    const [perfData, setPerfData] = useState(null); 
    const [loadingOverview, setLoadingOverview] = useState(true); 
    const [loadingPerf, setLoadingPerf] = useState(false); 
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(''); 

    useEffect(() => { 
        const fetch = async () => { 
            try { 
                const res = await api.get('/tasks-analytics'); 
                setAnalytics(res.data); 
            } catch (e) { 
                console.error('Failed to fetch analytics', e); 
            } finally { 
                setLoadingOverview(false); 
            } 
        }; 
        fetch(); 
    }, []); 

    useEffect(() => { 
        if (activeTab !== 'employee' && activeTab !== 'trends') return; 
        if (perfData) return; 
        const fetch = async () => { 
            setLoadingPerf(true); 
            try { 
                const res = await api.get('/employee-performance'); 
                setPerfData(res.data); 
                if (res.data?.employees?.length > 0) { 
                    setSelectedEmployeeId(res.data.employees[0].id); 
                } 
            } catch (e) { 
                console.error('Failed to fetch employee performance', e); 
            } finally { 
                setLoadingPerf(false); 
            } 
        }; 
        fetch(); 
    }, [activeTab]); 

    const selectedEmployee = perfData?.employees?.find(e => e.id === parseInt(selectedEmployeeId, 10)) || null; 
    const radarData = selectedEmployee ? [ 
        { subject: 'Completed', value: selectedEmployee.completed }, 
        { subject: 'In Progress', value: selectedEmployee.in_progress }, 
        { subject: 'Pending', value: selectedEmployee.pending }, 
        { subject: 'Review', value: selectedEmployee.pending_review }, 
        { subject: 'Rejected', value: selectedEmployee.rejected }, 
    ] : []; 
    const topPerformers = perfData?.employees?.slice(0, 8) || []; 

    const tabs = [ 
        { id: 'overview', label: 'Overview', icon: TrendingUp }, 
        { id: 'employee', label: 'Employee Performance', icon: Target }, 
        { id: 'trends', label: 'Monthly Trends', icon: Activity }, 
    ]; 

    const chartGridColor = "rgba(0,0,0,0.05)"; 
    const chartTextColor = "#94a3b8"; 

    return ( 
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen"> 
            {/* Header */} 
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6"> 
                <div> 
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Workforce <span className="text-transparent bg-clip-text bg-[#00b9cd]">Analytics</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Deep behavioral analytics and performance metrics overview.</p>
                        </div>
                </div> 
            </div> 

            {/* Tab Bar */}
            <div className="flex flex-wrap gap-3 mb-10 p-2 bg-slate-900/5 dark:bg-white/5 rounded-10 w-fit border-2 border-slate-50 dark:border-white/5 backdrop-blur-md">
                {tabs.map(tab => ( 
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`px-8 py-3.5 text-xs font-black uppercase tracking-widest rounded-10 flex items-center gap-2 ${
                            activeTab === tab.id 
                                ? 'bg-[#00b9cd] text-white shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:-translate-y-1' 
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/5'
                        }`} 
                    > 
                        <tab.icon size={16} />
                        {tab.label} 
                    </button> 
                ))} 
            </div>

            {/* Main Content Area */}
            {activeTab === 'overview' && ( 
                <div className="space-y-10"> 
                    {loadingOverview ? <LoadingSpinner /> : ( 
                        <> 
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> 
                                <StatCard label="Total Tasks Completed" value={analytics?.total_completed ?? 0} icon={CheckCircle2} /> 
                                <StatCard label="Pending Tasks" value={analytics?.total_pending ?? 0} icon={Clock} /> 
                                <StatCard label="Active Departments" value={analytics?.categories?.length ?? 0} icon={Database} /> 
                                <StatCard label="Avg Completion Rate" value={`${analytics?.avg_completion_rate ?? 0}%`} icon={TrendingUp} sub="Overall Progress" /> 
                            </div> 
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10"> 
                                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5"> 
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-2"> 
                                        <TrendingUp size={18} className="text-[#00b9cd]" /> Completion by Department 
                                    </h3> 
                                    <div className="h-[350px]"> 
                                        <ResponsiveContainer width="100%" height="100%"> 
                                            <PieChart> 
                                                <Pie data={(analytics?.categories || []).map(c => ({ name: c.department?.name || 'Unknown', value: c.total }))} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={6} dataKey="value" > 
                                                    {(analytics?.categories || []).map((_, i) => ( <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" /> ))} 
                                                </Pie> 
                                                <Tooltip content={<ChartTooltip />} /> 
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '9px', paddingTop: '30px' }} /> 
                                            </PieChart> 
                                        </ResponsiveContainer> 
                                    </div> 
                                </div> 
                                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5"> 
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-2"> 
                                        <Activity size={18} className="text-[#00b9cd]" /> Status Breakdown 
                                    </h3> 
                                    <div className="h-[350px]"> 
                                        <ResponsiveContainer width="100%" height="100%"> 
                                            <BarChart data={analytics?.status_breakdown || []} barSize={36}> 
                                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} /> 
                                                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: chartTextColor }} /> 
                                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: chartTextColor }} /> 
                                                <Tooltip content={<ChartTooltip />} /> 
                                                <Bar dataKey="count" name="Tasks" radius={[8, 8, 0, 0]}> 
                                                    {(analytics?.status_breakdown || []).map((entry, i) => ( <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]} /> ))} 
                                                </Bar> 
                                            </BarChart> 
                                        </ResponsiveContainer> 
                                    </div> 
                                </div> 
                            </div> 
                            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5"> 
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8"> Workforce Progress Overview </h3> 
                                <div className="space-y-6"> 
                                    {(analytics?.categories || []).map((cat, idx) => ( 
                                        <div key={idx} className="group"> 
                                            <div className="flex justify-between items-end mb-3"> 
                                                <div>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{cat.department?.name || 'General'}</span>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Industrial Output: {cat.total} Tasks</p>
                                                </div>
                                                <span className="text-xs font-black text-[#00b9cd] uppercase tracking-widest">
                                                    {Math.round((cat.total / Math.max(...(analytics?.categories || []).map(c => c.total), 1)) * 100)}% Performance
                                                </span> 
                                            </div> 
                                            <div className="w-full bg-slate-100 dark:bg-white/5 rounded-10 h-4 p-1 border border-slate-200 dark:border-white/10"> 
                                                <div className="h-full rounded-10 transition-all duration-1000 group-hover:shadow-[0_0_15px_rgba(13,148,136,0.3)] shadow-inner" style={{ width: `${Math.min((cat.total / Math.max(...(analytics?.categories || []).map(c => c.total), 1)) * 100, 100)}%`, background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}, #10b981)` }} /> 
                                            </div> 
                                        </div> 
                                    ))} 
                                    {(!analytics?.categories || analytics.categories.length === 0) && ( 
                                        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                            <Database size={40} className="mb-2 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No data streams detected...</p> 
                                        </div>
                                    )} 
                                </div> 
                            </div> 
                        </> 
                    )} 
                </div> 
            )} 

            {activeTab === 'employee' && ( 
                <div className="space-y-8"> 
                    {loadingPerf ? <LoadingSpinner /> : ( 
                        <> 
                            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5 flex flex-wrap items-center justify-between gap-8"> 
                                <div className="flex-1 min-w-[300px]"> 
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Select Operative</p> 
                                    <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-10 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest outline-none focus:border-[#00b9cd] transition-colors cursor-pointer appearance-none shadow-inner" > 
                                        <option value="">-- SYSTEM MANIFEST --</option> 
                                        {(perfData?.employees || []).map(emp => ( 
                                            <option key={emp.id} value={emp.id} className="dark:bg-slate-900"> {emp.name} | {emp.department} </option> 
                                        ))} 
                                    </select> 
                                </div> 
                                {selectedEmployee && ( 
                                    <div className="flex items-center gap-6 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 p-6 rounded-10 border-2 border-[#00b9cd]/10 dark:border-[#00b9cd]/20 shadow-md"> 
                                        <div className="w-14 h-14 rounded-10 bg-[#00b9cd] shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out flex items-center justify-center text-white font-black text-xl font-paperlogy"> {selectedEmployee.name.charAt(0).toUpperCase()} </div> 
                                        <div> 
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{selectedEmployee.name}</p> 
                                            <p className="text-[10px] text-[#00b9cd] font-bold uppercase tracking-widest mt-1">{selectedEmployee.department}</p> 
                                        </div> 
                                        <div className="ml-8 text-center px-6 py-3 bg-white dark:bg-slate-900/80 rounded-10 shadow-inner border border-[#00b9cd]/10/50">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency Ratio</p>
                                            <span className="text-xl font-black text-[#00b9cd]">{selectedEmployee.completion_rate}%</span> 
                                        </div>
                                    </div> 
                                )} 
                            </div> 
                            {selectedEmployee ? ( 
                                <> 
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6"> 
                                        <StatCard label="Total Tasks" value={selectedEmployee.total} icon={Database} /> 
                                        <StatCard label="Completed" value={selectedEmployee.completed} icon={CheckCircle2} /> 
                                        <StatCard label="In Progress" value={selectedEmployee.in_progress} icon={Clock} /> 
                                        <StatCard label="Pending" value={selectedEmployee.pending} icon={AlertCircle} /> 
                                        <StatCard label="Rejected" value={selectedEmployee.rejected} icon={AlertCircle} sub={selectedEmployee.avg_time_hrs > 0 ? `${selectedEmployee.avg_time_hrs}h avg` : 'Operational'} /> 
                                    </div> 
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10"> 
                                        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5"> 
                                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 text-center"> Operative Performance Profile </h3> 
                                            <div className="h-[350px]"> 
                                                <ResponsiveContainer width="100%" height="100%"> 
                                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}> 
                                                        <PolarGrid stroke="#e2e8f0" /> 
                                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: chartTextColor }} /> 
                                                        <PolarRadiusAxis allowDecimals={false} tick={{ fontSize: 10, fill: chartTextColor }} /> 
                                                        <Radar name={selectedEmployee.name} dataKey="value" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.4} /> 
                                                        <Tooltip content={<ChartTooltip />} /> 
                                                    </RadarChart> 
                                                </ResponsiveContainer> 
                                            </div> 
                                        </div> 
                                        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5"> 
                                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 text-center"> Output Breakdown </h3> 
                                            <div className="h-[350px]"> 
                                                <ResponsiveContainer width="100%" height="100%"> 
                                                    <BarChart layout="vertical" data={[ { name: 'Completed', value: selectedEmployee.completed }, { name: 'In Progress', value: selectedEmployee.in_progress }, { name: 'Pending', value: selectedEmployee.pending }, { name: 'Review', value: selectedEmployee.pending_review }, { name: 'Rejected', value: selectedEmployee.rejected }, ]} margin={{ left: 40 }} > 
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} /> 
                                                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: chartTextColor }} /> 
                                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: chartTextColor, textTransform: 'uppercase' }} width={100} /> 
                                                        <Tooltip content={<ChartTooltip />} /> 
                                                        <Bar dataKey="value" name="Tasks" radius={[0, 8, 8, 0]} barSize={26}> {[ '#059669', '#0d9488', '#d97706', '#7c3aed', '#dc2626' ].map((color, i) => ( <Cell key={i} fill={color} /> ))} </Bar> 
                                                    </BarChart> 
                                                </ResponsiveContainer> 
                                            </div> 
                                        </div> 
                                    </div> 
                                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5 group"> 
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6"> Performance Matrix Score </h3> 
                                        <div className="flex items-center gap-6"> 
                                            <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-10 h-8 p-1.5 border border-slate-200 dark:border-white/10"> 
                                                <div className="h-full rounded-10 transition-all duration-1000 group-hover:shadow-[0_0_20px_rgba(13,148,136,0.3)] shadow-inner" style={{ width: `${selectedEmployee.completion_rate}%`, background: `linear-gradient(90deg, #0d9488, #10b981)` }} /> 
                                            </div> 
                                            <span className="font-paperlogy font-black text-[#00b9cd] text-3xl w-24 text-right"> {selectedEmployee.completion_rate}% </span> 
                                        </div> 
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3"> Assigned Output: {selectedEmployee.completed} / {selectedEmployee.total} Modules </p> 
                                    </div> 
                                </> 
                            ) : ( 
                                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-20 rounded-10 shadow-lg border-2 border-dashed border-slate-200 dark:border-white/10 text-center"> 
                                    <Users size={64} className="mx-auto text-slate-200 dark:text-white/10 mb-4" />
                                    <p className="text-slate-400 font-black uppercase tracking-widest">Awaiting operative selection...</p> 
                                </div> 
                            )} 
                            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-900/5 dark:border-white/5 overflow-hidden"> 
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2"> 
                                    <Trophy size={18} className="text-amber-500" /> Executive Performer Leaderboard 
                                </h3> 
                                <div className="overflow-x-auto custom-scrollbar"> 
                                    <table className="w-full"> 
                                        <thead> 
                                            <tr className="bg-slate-900 text-[10px] text-white font-black uppercase tracking-[0.2em]"> 
                                                <th className="px-6 py-5 text-left rounded-10-[1.5rem]">Rank</th> 
                                                <th className="px-6 py-5 text-left">Operative</th> 
                                                <th className="px-6 py-5 text-left">Department</th> 
                                                <th className="px-6 py-5 text-center">Quota</th> 
                                                <th className="px-6 py-5 text-center">Alpha</th> 
                                                <th className="px-6 py-5 text-center">Delta</th> 
                                                <th className="px-6 py-5 text-center rounded-10-[1.5rem]">Ratio</th> 
                                            </tr> 
                                        </thead> 
                                        <tbody className="divide-y divide-slate-50 dark:divide-white/5"> 
                                            {topPerformers.map((emp, idx) => ( 
                                                <tr key={emp.id} onClick={() => { setSelectedEmployeeId(emp.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:bg-[#00b9cd]/10/50 dark:hover:bg-[#00b9cd]/80/5 cursor-pointer transition-colors group" > 
                                                    <td className="px-6 py-5 font-black text-slate-900 dark:text-white text-xs"> 
                                                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`} 
                                                    </td> 
                                                    <td className="px-6 py-5"> 
                                                        <div className="flex items-center gap-3"> 
                                                            <div className="w-9 h-9 rounded-10 bg-[#00b9cd] flex items-center justify-center text-white text-xs font-black shadow-md"> {emp.name.charAt(0)} </div> 
                                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-[#00b9cd] transition-colors">{emp.name}</span> 
                                                        </div> 
                                                    </td> 
                                                    <td className="px-6 py-5 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{emp.department}</td> 
                                                    <td className="px-6 py-5 text-center font-bold text-slate-900 dark:text-white text-xs">{emp.total}</td> 
                                                    <td className="px-6 py-5 text-center font-bold text-[#00b9cd] text-xs">{emp.completed}</td> 
                                                    <td className="px-6 py-5 text-center font-bold text-slate-400 text-xs">{emp.pending}</td> 
                                                    <td className="px-6 py-5 text-center"> 
                                                        <span className={`px-4 py-2 rounded-10 text-[10px] font-black uppercase tracking-widest ${emp.completion_rate >= 75 ? 'bg-emerald-500 text-white' : emp.completion_rate >= 40 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white' } shadow-md`}> {emp.completion_rate}% </span> 
                                                    </td> 
                                                </tr> 
                                            ))} 
                                            {topPerformers.length === 0 && ( 
                                                <tr> <td colSpan={7} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest"> Systems isolated... No performance streams. </td> </tr> 
                                            )} 
                                        </tbody> 
                                    </table> 
                                </div> 
                            </div> 
                        </> 
                    )} 
                </div> 
            )} 

            {activeTab === 'trends' && ( 
                <div className="space-y-10"> 
                    {loadingPerf ? <LoadingSpinner /> : ( 
                        <> 
                            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5"> 
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-2"> 
                                    <Activity size={18} className="text-[#00b9cd]" /> Industrial Output — 6-Month Trajectory 
                                </h3> 
                                <div className="h-[400px]"> 
                                    <ResponsiveContainer width="100%" height="100%"> 
                                        <AreaChart data={perfData?.monthly_trend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}> 
                                            <defs> 
                                                <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1"> 
                                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} /> 
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} /> 
                                                </linearGradient> 
                                            </defs> 
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} /> 
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: chartTextColor, textTransform: 'uppercase' }} /> 
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTextColor, fontWeight: 900 }} /> 
                                            <Tooltip content={<ChartTooltip />} /> 
                                            <Area type="monotone" dataKey="completed" name="Quota Met" stroke="#0d9488" strokeWidth={5} fill="url(#gradTeal)" dot={{ r: 6, fill: '#0d9488', stroke: '#fff', strokeWidth: 3 }} activeDot={{ r: 10, shadow: '0 0 15px rgba(13,148,136,0.5)' }} /> 
                                        </AreaChart> 
                                    </ResponsiveContainer> 
                                </div> 
                            </div> 
                            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50 dark:border-white/5"> 
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-12 text-center"> Workforce Efficiency Distribution </h3> 
                                <div className="h-[400px]"> 
                                    <ResponsiveContainer width="100%" height="100%"> 
                                        <BarChart data={(perfData?.employees || []).map(e => ({ name: e.name.split(' ')[0], rate: e.completion_rate, total: e.total, }))} margin={{ top: 5, right: 10, left: 0, bottom: 40 }} > 
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} /> 
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: chartTextColor, angle: -35, textAnchor: 'end' }} interval={0} /> 
                                            <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTextColor, fontWeight: 900 }} /> 
                                            <Tooltip content={<ChartTooltip />} /> 
                                            <Bar dataKey="rate" name="Efficiency Rank" radius={[8, 8, 0, 0]} barSize={32}> 
                                                {(perfData?.employees || []).map((emp, i) => ( <Cell key={i} fill={ emp.completion_rate >= 75 ? '#059669' : emp.completion_rate >= 40 ? '#d97706' : '#dc2626' } /> ))} 
                                            </Bar> 
                                        </BarChart> 
                                    </ResponsiveContainer> 
                                </div> 
                                <div className="flex flex-wrap items-center gap-8 mt-10 justify-center"> 
                                    <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500"><span className="w-4 h-4 rounded-10 bg-emerald-500 shadow-md shadow-emerald-500/30" />Optimal Output (≥ 75%)</span> 
                                    <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500"><span className="w-4 h-4 rounded-10 bg-amber-500 shadow-md shadow-amber-500/30" />Sustained Output (40–74%)</span> 
                                    <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500"><span className="w-4 h-4 rounded-10 bg-rose-500 shadow-md shadow-rose-500/30" />Sub-nominal Output (&lt; 40%)</span> 
                                </div> 
                            </div> 
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8"> 
                                <StatCard label="High Yield Performers" value={(perfData?.employees || []).filter(e => e.completion_rate >= 75).length} icon={Trophy} sub="Elite Efficiency (>75%)" /> 
                                <StatCard label="Nominal Performers" value={(perfData?.employees || []).filter(e => e.completion_rate >= 40 && e.completion_rate < 75).length} icon={Activity} sub="Stable Output (40-74%)" /> 
                                <StatCard label="Maintenance Required" value={(perfData?.employees || []).filter(e => e.completion_rate < 40).length} icon={AlertCircle} sub="Critical Delta (<40%)" /> 
                            </div> 
                        </> 
                    )} 
                </div> 
            )} 
        </div> 
    ); 
}; 

export default ReportsPage;