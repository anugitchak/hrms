import React from "react";
import { Search, Filter, Calendar } from "lucide-react";

const FilterBar = ({ filters, onFilterChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="bg-brand-50 dark:bg-gray-800 p-6 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] border-4 border-black mb-8 transition-colors duration-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-1/3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-black dark:text-gray-500 font-bold" />
                    </div>
                    <label htmlFor="announcement_search" className="sr-only">Search Announcements</label>
                    <input
                        id="announcement_search"
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleChange}
                        placeholder="SEARCH ANNOUNCEMENTS..."
                        className="pl-10 pr-4 py-2.5 w-full border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-500 font-bold text-sm bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]  tracking-wider"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    {/* Category Filter */}
                    <div className="relative">
                        <label htmlFor="filter_category" className="sr-only">Filter by Category</label>
                        <select
                            id="filter_category"
                            name="category"
                            value={filters.category}
                            onChange={handleChange}
                            className="appearance-none pl-4 pr-10 py-2.5 border-2 border-black rounded-lg bg-white dark:bg-gray-700 text-sm font-bold text-black dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-500 cursor-pointer transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]  tracking-wider"
                        >
                            <option value="">ALL CATEGORIES</option>
                            <option value="General">GENERAL</option>
                            <option value="HR">HR</option>
                            <option value="Payroll">PAYROLL</option>
                            <option value="Events">EVENTS</option>
                            <option value="Urgent">URGENT</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Filter size={16} className="text-black font-bold" />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <label htmlFor="filter_status" className="sr-only">Filter by Status</label>
                    <div className="relative">
                        <select
                            id="filter_status"
                            name="status"
                            value={filters.status}
                            onChange={handleChange}
                            className="appearance-none pl-4 pr-10 py-2.5 border-2 border-black rounded-lg bg-white dark:bg-gray-700 text-sm font-bold text-black dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-500 cursor-pointer transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]  tracking-wider"
                        >
                            <option value="">ALL STATUS</option>
                            <option value="Active">ACTIVE</option>
                            <option value="Inactive">INACTIVE</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Filter size={16} className="text-black font-bold" />
                        </div>
                    </div>

                    {/* Audience Filter */}
                    <label htmlFor="filter_audience" className="sr-only">Filter by Audience</label>
                    <div className="relative">
                        <select
                            id="filter_audience"
                            name="audience"
                            value={filters.audience}
                            onChange={handleChange}
                            className="appearance-none pl-4 pr-10 py-2.5 border-2 border-black rounded-lg bg-white dark:bg-gray-700 text-sm font-bold text-black dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-500 cursor-pointer transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]  tracking-wider"
                        >
                            <option value="">ALL AUDIENCES</option>
                            <option value="Employee">EMPLOYEE</option>
                            <option value="Admin">ADMIN</option>
                            <option value="HR">HR</option>
                            <option value="SuperAdmin">SUPER ADMIN</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Filter size={16} className="text-black font-bold" />
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-lg px-3 py-2 bg-white dark:bg-gray-700 transition-colors">
                        <Calendar size={18} className="text-black font-bold" />
                        <label htmlFor="filter_start_date" className="sr-only">Start Date</label>
                        <input
                            id="filter_start_date"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleChange}
                            className="text-sm font-bold  focus:outline-none text-black dark:text-gray-300 bg-transparent"
                        />
                        <span className="text-black font-black">-</span>
                        <label htmlFor="filter_end_date" className="sr-only">End Date</label>
                        <input
                            id="filter_end_date"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleChange}
                            className="text-sm font-bold  focus:outline-none text-black dark:text-gray-300 bg-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
