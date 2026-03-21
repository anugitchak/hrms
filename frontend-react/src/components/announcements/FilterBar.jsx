import React from "react";
import { Search, Tag, Filter, CheckCircle } from "lucide-react";

const FilterBar = ({ filters, onFilterChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] mb-10 flex flex-col lg:flex-row gap-5 relative z-10">
            {/* Search */}
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                <input
                    type="text"
                    name="search"
                    autoComplete="off"
                    placeholder="Search by title or category..."
                    className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                    value={filters.search}
                    onChange={handleChange}
                />
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap gap-4">
                {/* Category Filter */}
                <div className="relative">
                    <select
                        name="category"
                        className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer min-w-[170px] transition-all"
                        value={filters.category}
                        onChange={handleChange}
                    >
                        <option value="All" className="dark:bg-slate-900">All Categories</option>
                        <option value="General" className="dark:bg-slate-900">General Notice</option>
                        <option value="HR" className="dark:bg-slate-900">Human Resources</option>
                        <option value="Payroll" className="dark:bg-slate-900">Finance & Payroll</option>
                        <option value="Events" className="dark:bg-slate-900">Corporate Events</option>
                        <option value="Urgent" className="dark:bg-slate-900">Urgent Priority</option>
                    </select>
                    <Tag className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <select
                        name="status"
                        className="appearance-none pl-5 pr-12 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-900 dark:text-white cursor-pointer min-w-[150px] transition-all"
                        value={filters.status}
                        onChange={handleChange}
                    >
                        <option value="All" className="dark:bg-slate-900">All Status</option>
                        <option value="Active" className="dark:bg-slate-900">Live Broadcast</option>
                        <option value="Inactive" className="dark:bg-slate-900">Archived</option>
                    </select>
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>

                {/* Reset Button */}
                <button
                    onClick={() => onFilterChange({ search: "", category: "All", status: "All" })}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-all active:scale-[0.98]"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
