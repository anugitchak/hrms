import React, { useState, useEffect } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../../api/axios';

const ReportsPage = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/tasks-analytics');
                setAnalytics(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const COLORS = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#dc2626'];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Workforce Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
            {/* Standard Header */}
            <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Workforce Intelligence</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Deep behavioral analytics and performance metrics overview.</p>
            </div>

            <div className="p-6 space-y-8 overflow-auto">
                {/* Hero Stat Cards */}
                {/* Hero Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Total Tasks Completed", value: analytics?.total_completed || 0, color: "blue" },
                        { label: "Pending Tasks", value: analytics?.total_pending || 0, color: "orange" },
                        { label: "Active Departments", value: analytics?.categories?.length || 0, color: "indigo" },
                        { label: "Avg. Completion Rate", value: "88%", color: "pink" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</span>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Task Distribution (Pie) */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-8 text-center">Task Completion by Department</h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics?.categories?.map(c => ({
                                            name: c.department?.name || 'Unknown',
                                            value: c.total
                                        })) || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(analytics?.categories || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Department Performance List */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-8">Department Progress (Task Completion)</h3>
                        <div className="flex-1 space-y-6">
                            {(analytics?.categories || []).map((cat, idx) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-gray-100 dark:bg-gray-700 text-gray-500">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                                {cat.department?.name || 'General'}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Department ID: {cat.department_id}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-blue-600">{cat.total}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Tasks Done</div>
                                    </div>
                                </div>
                            ))}
                            {(!analytics?.categories || analytics.categories.length === 0) && (
                                <div className="text-center text-gray-400 italic text-sm mt-10">No completion data available yet...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
