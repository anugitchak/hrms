import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

const PayslipFilterBar = ({ filters, onFilterChange, departments = [] }) => {
    const months = [
        { value: '1', label: 'January' }, { value: '2', label: 'February' },
        { value: '3', label: 'March' }, { value: '4', label: 'April' },
        { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' },
        { value: '9', label: 'September' }, { value: '10', label: 'October' },
        { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const selectClass = "w-full pl-9 pr-3 py-2.5 border-2 border-black rounded-xl font-bold text-sm bg-white text-gray-900 outline-none focus:ring-4 focus:ring-brand-500 appearance-none";

    return (
        <div className="bg-white dark:bg-white/5 p-4 rounded-[2rem] border-2 border-slate-900/5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <label htmlFor="search_payslips" className="sr-only">Search Payslips</label>
                    <input
                        id="search_payslips"
                        type="text"
                        placeholder="Search employee or code..."
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-teal-500/30 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white transition-all shadow-inner"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
                    {/* Department */}
                    <div className="relative min-w-[160px] flex-1 md:flex-none group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 pointer-events-none z-10 transition-colors" size={16} />
                        <label htmlFor="filter_department_ps" className="sr-only">Filter by Department</label>
                        <select
                            id="filter_department_ps"
                            value={filters.department}
                            onChange={(e) => onFilterChange('department', e.target.value)}
                            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-teal-500/30 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white appearance-none cursor-pointer transition-all shadow-inner"
                        >
                            <option value="">All Depts</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month */}
                    <div className="relative min-w-[150px] flex-1 md:flex-none group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 pointer-events-none z-10 transition-colors" size={16} />
                        <label htmlFor="filter_month_ps" className="sr-only">Filter by Month</label>
                        <select
                            id="filter_month_ps"
                            value={filters.month}
                            onChange={(e) => onFilterChange('month', e.target.value)}
                            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-teal-500/30 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white appearance-none cursor-pointer transition-all shadow-inner"
                        >
                            <option value="">All Months</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year */}
                    <div className="relative min-w-[110px] flex-1 md:flex-none">
                        <label htmlFor="filter_year_ps" className="sr-only">Filter by Year</label>
                        <select
                            id="filter_year_ps"
                            value={filters.year}
                            onChange={(e) => onFilterChange('year', e.target.value)}
                            className="w-full px-6 py-3.5 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-teal-500/30 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white appearance-none cursor-pointer transition-all shadow-inner"
                        >
                            <option value="">Year</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayslipFilterBar;
