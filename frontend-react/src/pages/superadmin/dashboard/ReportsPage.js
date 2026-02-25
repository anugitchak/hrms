import React, { useState, useEffect } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import api from '../../../api/axios';

// ─── Colour Palette ────────────────────────────────────────────────────────────
const COLORS = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#dc2626', '#059669', '#d97706'];

const STATUS_COLORS = {
    Completed: '#059669',
    Pending: '#d97706',
    'In Progress': '#2563eb',
    'Pending Review': '#7c3aed',
    Rejected: '#dc2626',
};

// ─── Small reusable card ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'blue' }) => {
    const border = {
        blue: 'border-l-blue-500',
        green: 'border-l-green-500',
        orange: 'border-l-orange-500',
        indigo: 'border-l-indigo-500',
        pink: 'border-l-pink-500',
        purple: 'border-l-purple-500',
    }[color] || 'border-l-blue-500';

    return (
        <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${border} hover:shadow-md transition-all`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{value}</div>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
};

// ─── Loading skeleton ───────────────────────────────────────────────────────────
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium text-sm">Loading analytics…</p>
    </div>
);

// ─── Custom Tooltip for charts ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-sm">
            {label && <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: <span className="font-bold">{p.value}</span>
                </p>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [perfData, setPerfData] = useState(null);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingPerf, setLoadingPerf] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // ── Fetch overview analytics on mount ──────────────────────────────────────
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

    // ── Fetch employee-performance when that tab is first opened ───────────────
    useEffect(() => {
        if (activeTab !== 'employee' && activeTab !== 'trends') return;
        if (perfData) return;           // already loaded
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

    // ── Derived data ────────────────────────────────────────────────────────────
    const selectedEmployee = perfData?.employees?.find(e => e.id === parseInt(selectedEmployeeId, 10)) || null;

    const radarData = selectedEmployee ? [
        { subject: 'Completed', value: selectedEmployee.completed },
        { subject: 'In Progress', value: selectedEmployee.in_progress },
        { subject: 'Pending', value: selectedEmployee.pending },
        { subject: 'Review', value: selectedEmployee.pending_review },
        { subject: 'Rejected', value: selectedEmployee.rejected },
    ] : [];

    const topPerformers = perfData?.employees?.slice(0, 8) || [];

    // ── Tabs config ─────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'employee', label: 'Employee Performance' },
        { id: 'trends', label: 'Monthly Trends' },
    ];

    return (
        <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
            {/* ── Page Header ── */}
            <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Workforce Intelligence</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Deep behavioral analytics and performance metrics overview.</p>

                {/* Tab Bar */}
                <div className="flex gap-1 mt-5 border-b border-gray-200 dark:border-gray-700 -mb-[1px]">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TAB 1 — OVERVIEW
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <div className="p-6 space-y-8 overflow-auto">
                    {loadingOverview ? <LoadingSpinner /> : (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <StatCard label="Total Tasks Completed" value={analytics?.total_completed ?? 0} color="green" />
                                <StatCard label="Pending Tasks" value={analytics?.total_pending ?? 0} color="orange" />
                                <StatCard label="Active Departments" value={analytics?.categories?.length ?? 0} color="indigo" />
                                <StatCard
                                    label="Avg Completion Rate"
                                    value={`${analytics?.avg_completion_rate ?? 0}%`}
                                    color="blue"
                                    sub="Based on all tasks"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Donut — Department task completion */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6 text-center">
                                        Task Completion by Department
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={(analytics?.categories || []).map(c => ({
                                                        name: c.department?.name || 'Unknown',
                                                        value: c.total
                                                    }))}
                                                    cx="50%" cy="50%"
                                                    innerRadius={70} outerRadius={110}
                                                    paddingAngle={4} dataKey="value"
                                                >
                                                    {(analytics?.categories || []).map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<ChartTooltip />} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Bar — Task Status Breakdown */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6 text-center">
                                        Overall Task Status Breakdown
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics?.status_breakdown || []} barSize={36} borderRadius={6}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                                                    {(analytics?.status_breakdown || []).map((entry, i) => (
                                                        <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Department Progress List */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6">
                                    Department Progress (Task Completion)
                                </h3>
                                <div className="space-y-4">
                                    {(analytics?.categories || []).map((cat, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                        {cat.department?.name || 'General'}
                                                    </span>
                                                    <span className="text-sm font-bold text-blue-600">{cat.total} tasks done</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full"
                                                        style={{
                                                            width: `${Math.min((cat.total / Math.max(...(analytics?.categories || []).map(c => c.total), 1)) * 100, 100)}%`,
                                                            background: COLORS[idx % COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!analytics?.categories || analytics.categories.length === 0) && (
                                        <p className="text-center text-gray-400 italic text-sm py-8">No completion data available yet.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 2 — EMPLOYEE PERFORMANCE
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'employee' && (
                <div className="p-6 space-y-6 overflow-auto">
                    {loadingPerf ? <LoadingSpinner /> : (
                        <>
                            {/* Employee Selector */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select Employee</p>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={e => setSelectedEmployeeId(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[240px]"
                                    >
                                        <option value="">-- Select an employee --</option>
                                        {(perfData?.employees || []).map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} ({emp.department})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedEmployee && (
                                    <div className="flex items-center gap-3 ml-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {selectedEmployee.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{selectedEmployee.name}</p>
                                            <p className="text-xs text-gray-400">{selectedEmployee.department}</p>
                                        </div>
                                        <span className={`ml-4 px-3 py-1 rounded-full text-xs font-bold ${selectedEmployee.completion_rate >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                selectedEmployee.completion_rate >= 40 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {selectedEmployee.completion_rate}% completion rate
                                        </span>
                                    </div>
                                )}
                            </div>

                            {selectedEmployee ? (
                                <>
                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                        <StatCard label="Total Tasks" value={selectedEmployee.total} color="indigo" />
                                        <StatCard label="Completed" value={selectedEmployee.completed} color="green" />
                                        <StatCard label="In Progress" value={selectedEmployee.in_progress} color="blue" />
                                        <StatCard label="Pending" value={selectedEmployee.pending} color="orange" />
                                        <StatCard label="Rejected" value={selectedEmployee.rejected} color="pink"
                                            sub={selectedEmployee.avg_time_hrs > 0 ? `Avg ${selectedEmployee.avg_time_hrs}h/task` : undefined}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Radar Chart */}
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6 text-center">
                                                Task Performance Profile
                                            </h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                        <PolarGrid stroke="#e5e7eb" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                                        <PolarRadiusAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                                        <Radar
                                                            name={selectedEmployee.name}
                                                            dataKey="value"
                                                            stroke="#2563eb"
                                                            fill="#2563eb"
                                                            fillOpacity={0.35}
                                                        />
                                                        <Tooltip content={<ChartTooltip />} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Horizontal Bar Comparison */}
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6 text-center">
                                                Task Breakdown (Count)
                                            </h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        layout="vertical"
                                                        data={[
                                                            { name: 'Completed', value: selectedEmployee.completed },
                                                            { name: 'In Progress', value: selectedEmployee.in_progress },
                                                            { name: 'Pending', value: selectedEmployee.pending },
                                                            { name: 'Review', value: selectedEmployee.pending_review },
                                                            { name: 'Rejected', value: selectedEmployee.rejected },
                                                        ]}
                                                        margin={{ left: 20 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                                                        <Tooltip content={<ChartTooltip />} />
                                                        <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]} barSize={22}>
                                                            {[
                                                                '#059669', '#2563eb', '#d97706', '#7c3aed', '#dc2626'
                                                            ].map((color, i) => (
                                                                <Cell key={i} fill={color} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance score bar */}
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-4">
                                            Completion Score
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4">
                                                <div
                                                    className={`h-4 rounded-full transition-all duration-700 ${selectedEmployee.completion_rate >= 75 ? 'bg-green-500' :
                                                            selectedEmployee.completion_rate >= 40 ? 'bg-orange-400' :
                                                                'bg-red-500'
                                                        }`}
                                                    style={{ width: `${selectedEmployee.completion_rate}%` }}
                                                />
                                            </div>
                                            <span className="font-black text-gray-800 dark:text-gray-100 text-lg w-14 text-right">
                                                {selectedEmployee.completion_rate}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {selectedEmployee.completed} completed out of {selectedEmployee.total} assigned tasks
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
                                    <p className="text-gray-400 text-lg">Select an employee above to view their performance data.</p>
                                </div>
                            )}

                            {/* ── Top Performers Leaderboard ── */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-5">
                                    🏆 Top Performers (by Completion Rate)
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <th className="px-4 py-3 text-left rounded-l-lg">#</th>
                                                <th className="px-4 py-3 text-left">Employee</th>
                                                <th className="px-4 py-3 text-left">Department</th>
                                                <th className="px-4 py-3 text-center">Total</th>
                                                <th className="px-4 py-3 text-center">Completed</th>
                                                <th className="px-4 py-3 text-center">Pending</th>
                                                <th className="px-4 py-3 text-center rounded-r-lg">Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {topPerformers.map((emp, idx) => (
                                                <tr
                                                    key={emp.id}
                                                    onClick={() => { setSelectedEmployeeId(emp.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-bold text-gray-400">
                                                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                                {emp.name.charAt(0)}
                                                            </div>
                                                            <span className="font-semibold text-gray-800 dark:text-gray-100">{emp.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{emp.department}</td>
                                                    <td className="px-4 py-3 text-center font-medium">{emp.total}</td>
                                                    <td className="px-4 py-3 text-center font-medium text-green-600">{emp.completed}</td>
                                                    <td className="px-4 py-3 text-center font-medium text-orange-500">{emp.pending}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${emp.completion_rate >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                emp.completion_rate >= 40 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {emp.completion_rate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {topPerformers.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-10 text-gray-400 italic">
                                                        No employee performance data available yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 3 — MONTHLY TRENDS
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'trends' && (
                <div className="p-6 space-y-6 overflow-auto">
                    {loadingPerf ? <LoadingSpinner /> : (
                        <>
                            {/* 6-month area chart */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6">
                                    Tasks Completed — Last 6 Months
                                </h3>
                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={perfData?.monthly_trend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <defs>
                                                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="completed"
                                                name="Tasks Completed"
                                                stroke="#2563eb"
                                                strokeWidth={2.5}
                                                fill="url(#gradBlue)"
                                                dot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                                                activeDot={{ r: 7 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Completion Rate distribution — Bar Chart for all employees */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6">
                                    Employee Completion Rate Comparison
                                </h3>
                                <div className="h-[340px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={(perfData?.employees || []).map(e => ({
                                                name: e.name.split(' ')[0],
                                                rate: e.completion_rate,
                                                total: e.total,
                                            }))}
                                            margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Bar dataKey="rate" name="Completion %" radius={[4, 4, 0, 0]} barSize={28}>
                                                {(perfData?.employees || []).map((emp, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={
                                                            emp.completion_rate >= 75 ? '#059669' :
                                                                emp.completion_rate >= 40 ? '#d97706' :
                                                                    '#dc2626'
                                                        }
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center gap-6 mt-3 justify-center text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />≥ 75% (High)</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />40–74% (Medium)</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />&lt; 40% (Low)</span>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <StatCard
                                    label="High Performers (≥75%)"
                                    value={(perfData?.employees || []).filter(e => e.completion_rate >= 75).length}
                                    color="green"
                                    sub="employees above 75% rate"
                                />
                                <StatCard
                                    label="Average Performers"
                                    value={(perfData?.employees || []).filter(e => e.completion_rate >= 40 && e.completion_rate < 75).length}
                                    color="orange"
                                    sub="employees at 40–74% rate"
                                />
                                <StatCard
                                    label="Needs Attention (<40%)"
                                    value={(perfData?.employees || []).filter(e => e.completion_rate < 40).length}
                                    color="pink"
                                    sub="employees below 40% rate"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
