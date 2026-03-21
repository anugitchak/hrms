import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Plus, Trash, Edit, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Upload, X, FileSpreadsheet, RefreshCw, CheckCircle } from "lucide-react";
import { useGlobalUI } from "../../../context/GlobalUIContext";

const HolidayPage = () => {
    const { addToast, confirm } = useGlobalUI();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("calendar");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formData, setFormData] = useState({ name: "", start_date: "", end_date: "" });

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await api.get("/holidays");
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
            addToast("Failed to fetch holidays", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, type: "Global", department_id: null, location: null };
            if (editingHoliday) {
                await api.put(`/holidays/${editingHoliday.id}`, payload);
            } else {
                await api.post("/holidays", payload);
            }
            await fetchHolidays();
            if (!editingHoliday && payload.start_date) {
                const newHolidayDate = new Date(payload.start_date);
                setCurrentMonth(newHolidayDate);
            }
            setShowModal(false);
            resetForm();
            addToast(editingHoliday ? "Holiday updated successfully" : "Holiday created successfully", "success");
        } catch (err) {
            addToast("Failed to save holiday", "error");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "Delete Holiday",
            message: "Are you sure you want to delete this holiday?",
            confirmText: "Delete",
            type: "danger"
        });
        if (confirmed) {
            try {
                await api.delete(`/holidays/${id}`);
                fetchHolidays();
                addToast("Holiday deleted successfully", "success");
            } catch (err) {
                addToast("Failed to delete holiday", "error");
                console.error(err);
            }
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        const file = e.target.file.files[0];
        if (!file) return;
        const formDataImport = new FormData();
        formDataImport.append("file", file);
        try {
            await api.post("/holidays/import", formDataImport, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            await fetchHolidays();
            setShowImportModal(false);
            addToast("Holidays imported successfully!", "success");
        } catch (err) {
            console.error("Import failed", err);
            addToast("Import failed: " + (err.response?.data?.message || err.message), "error");
        }
    };

    const resetForm = () => {
        setEditingHoliday(null);
        setFormData({ name: "", start_date: "", end_date: "" });
    };

    const openEdit = (holiday) => {
        setEditingHoliday(holiday);
        setFormData({
            name: holiday.name,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
        });
        setShowModal(true);
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const renderCalendar = () => {
        const { days, firstDay } = getDaysInMonth(currentMonth);
        const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
        const daysArray = Array.from({ length: totalSlots }, (_, i) => {
            if (i < firstDay || i >= firstDay + days) return null;
            return i - firstDay + 1;
        });

        const getHolidaysForDate = (day) => {
            if (!day) return [];
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return holidays.filter(h => {
                const start = h.start_date;
                const end = h.end_date;
                return dateStr >= start && dateStr <= end;
            });
        };

        const isToday = (day) => {
            if (!day) return false;
            const today = new Date();
            return today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
        };

        return (
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] border-2 border-slate-900/5 dark:border-white/5 overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between p-8 bg-slate-50/50 dark:bg-brand-500/5 border-b-2 border-slate-900/5 dark:border-white/10">
                    <button
                        onClick={prevMonth}
                        className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-brand-500 transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight uppercase">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-brand-500 transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-7 text-center bg-slate-100/30 dark:bg-slate-800/30 border-b border-slate-900/5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr">
                    {daysArray.map((day, idx) => {
                        const dayHolidays = getHolidaysForDate(day);
                        const hasHoliday = dayHolidays.length > 0;
                        return (
                            <div
                                key={idx}
                                className={`min-h-[140px] border-b border-r border-slate-900/5 dark:border-white/5 p-4 transition-all hover:bg-slate-50/50 dark:hover:bg-white/5 relative group ${!day ? 'bg-slate-50/20 dark:bg-slate-800/10 opacity-40' : hasHoliday ? 'bg-brand-500/[0.02] dark:bg-brand-500/[0.05]' : ''
                                    }`}
                            >
                                {day && (
                                    <>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isToday(day)
                                                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                                                : hasHoliday
                                                    ? 'text-brand-500 font-black'
                                                    : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                                }`}>
                                                {day}
                                            </span>
                                            {hasHoliday && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_8px_rgba(0,185,205,1)]"></div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            {dayHolidays.map(h => (
                                                <div
                                                    key={h.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEdit(h);
                                                    }}
                                                    className="group text-[10px] px-3 py-2 rounded-xl border-l-4 cursor-pointer shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white dark:bg-slate-800 border-brand-500 text-slate-700 dark:text-slate-200"
                                                    title={h.name}
                                                >
                                                    <div className="font-black truncate uppercase tracking-tight">{h.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw size={40} className="text-brand-500 animate-spin" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Calendar...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight">
                        <span className="italic">Holiday</span> <span className="text-transparent bg-clip-text bg-[#00b9cd]">Calendar</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                            <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage and visualize company-wide holiday schedules
                            </p>
                        </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-slate-900/60 p-1.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.1)] flex border-2 border-slate-900/5 dark:border-white/5">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            title="List View"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            title="Calendar View"
                        >
                            <CalendarIcon size={20} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                        <Upload size={18} className="text-orange-500" />
                        <span className="uppercase tracking-widest">Import</span>
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span className="uppercase tracking-widest">Add Holiday</span>
                    </button>
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(71,85,105,0.15)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] border-2 border-slate-900/5 dark:border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-brand-500/5 border-b-2 border-slate-900/5">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Holiday Name</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date Range</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {holidays.map((h) => (
                                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 font-black">
                                                    {h.name?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{h.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                <CalendarIcon size={14} className="text-orange-500" />
                                                <span>{h.start_date}</span>
                                                {h.start_date !== h.end_date && (
                                                    <>
                                                        <ChevronRight size={14} className="text-slate-300" />
                                                        <span>{h.end_date}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(h)}
                                                    className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(h.id)}
                                                    className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {holidays.length === 0 && (
                            <div className="p-20 text-center">
                                <CalendarIcon size={48} className="mx-auto text-slate-100 mb-4 opacity-30" />
                                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No holidays found</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                renderCalendar()
            )}

            {showImportModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-lg p-10 shadow-[8px_8px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] border-2 border-slate-900 dark:border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-400 to-red-500"></div>
                        <button
                            onClick={() => setShowImportModal(false)}
                            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        
                        <div className="text-center mb-8">
                            <div className="bg-orange-50 dark:bg-orange-500/10 text-orange-500 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border-2 border-orange-100 dark:border-orange-500/20">
                                <FileSpreadsheet size={32} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Import Holidays</h2>
                            <p className="text-slate-400 font-bold text-sm px-6"> Bulk upload using Excel or CSV file. </p>
                        </div>

                        <div className="bg-blue-50/50 dark:bg-brand-500/5 p-6 rounded-3xl mb-8 border-2 border-brand-500/10 space-y-3">
                            <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Required Headings</h4>
                            <div className="flex flex-wrap gap-4">
                                {['name', 'start_date', 'end_date'].map(h => (
                                    <div key={h} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-brand-500/10 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{h}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleImport} className="space-y-6">
                            <div className="group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Choose File</label>
                                <div className="relative border-2 border-dashed border-slate-900/10 dark:border-white/10 rounded-3xl p-8 text-center hover:border-brand-500/40 transition-all group-focus-within:border-brand-500">
                                    <input
                                        type="file"
                                        name="file"
                                        accept=".csv, .xlsx, .xls"
                                        required
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-10 h-10 text-slate-200 group-hover:text-brand-300 transition-colors mx-auto mb-3" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Select Excel/CSV</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-6 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg active:translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    <Upload size={16} strokeWidth={3} />
                                    Process & Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-md p-10 shadow-[8px_8px_0px_0px_rgba(71,85,105,0.3)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] border-2 border-slate-900 dark:border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-3 bg-brand-500"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">
                            {editingHoliday ? "Edit Holiday" : "New Holiday"}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="group">
                                <label htmlFor="holiday_name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Holiday Title</label>
                                <input
                                    id="holiday_name"
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="e.g. Diwali Festival"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-slate-900 dark:text-white transition-all font-paperlogy"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="group">
                                    <label htmlFor="start_date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Start Date</label>
                                    <div className="relative">
                                        <input
                                            id="start_date"
                                            name="start_date"
                                            type="date"
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-slate-900 dark:text-white transition-all pr-12"
                                            value={formData.start_date}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                        <CalendarIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="group">
                                    <label htmlFor="end_date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">End Date</label>
                                    <div className="relative">
                                        <input
                                            id="end_date"
                                            name="end_date"
                                            type="date"
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-slate-900 dark:text-white transition-all pr-12"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                        <CalendarIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-10">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg active:translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={18} strokeWidth={3} />
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayPage;