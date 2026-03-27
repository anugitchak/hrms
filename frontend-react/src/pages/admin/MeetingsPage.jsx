import React, { useState, useEffect } from"react"; import api from"../../api/axios"; import { Calendar, Clock, Video, MapPin, Users, Plus, X, Trash2, Edit2, CalendarClock, Search } from"lucide-react"; import { formatDate } from"../../utils/dateUtils"; import { useGlobalUI } from"../../context/GlobalUIContext"; const MeetingsPage = () => {
    const { addToast, confirm } = useGlobalUI();
    const [meetings, setMeetings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: "", description: "", start_time: "", location: "", meeting_link: "", department_id: "", designation_id: "", participants: [] });

    useEffect(() => {
        fetchMeetings();
        fetchEmployees();
        fetchOrgData();
    }, []);

    const fetchMeetings = async () => {
        try {
            const res = await api.get("/meetings");
            setMeetings(res.data);
        } catch (err) {
            console.error("Failed to fetch meetings", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get("/employees");
            setEmployees(res.data);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    const fetchOrgData = async () => {
        try {
            const [deptRes, desigRes] = await Promise.all([api.get("/departments"), api.get("/designations")]);
            setDepartments(deptRes.data);
            setDesignations(desigRes.data);
        } catch (err) {
            console.error("Failed to fetch organization data", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing && editingId) {
                await api.put(`/meetings/${editingId}`, formData);
                addToast("Meeting updated successfully!", "success");
            } else {
                await api.post("/meetings", formData);
                addToast("Meeting scheduled successfully!", "success");
            }
            setIsModalOpen(false);
            resetForm();
            fetchMeetings();
        } catch (err) {
            console.error("Failed to save meeting", err);
            addToast(err.response?.data?.message || "Failed to save meeting", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: "", description: "", start_time: "", location: "", meeting_link: "", department_id: "", designation_id: "", participants: [] });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (meeting) => {
        const dt = new Date(meeting.start_time);
        const pad = (n) => String(n).padStart(2, '0');
        const localDT = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        setFormData({ title: meeting.title || "", description: meeting.description || "", start_time: localDT, location: meeting.location || "", meeting_link: meeting.meeting_link || "", department_id: meeting.department_id ? String(meeting.department_id) : "", designation_id: meeting.designation_id ? String(meeting.designation_id) : "", participants: meeting.participants?.map(p => p.id) || [] });
        setIsEditing(true);
        setEditingId(meeting.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!await confirm("Delete Meeting", "Are you sure you want to delete this meeting?", "Delete")) return;
        try {
            await api.delete(`/meetings/${id}`);
            fetchMeetings();
        } catch (err) {
            console.error("Failed to delete meeting", err);
        }
    };

    const filteredMeetings = meetings.filter(m => 
        m.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredEmployees = employees.filter(emp => {
        if (formData.department_id && emp.department_id != formData.department_id) return false;
        if (formData.designation_id && emp.designation_id != formData.designation_id) return false;
        return true;
    });

    const toggleParticipant = (id) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(id) 
                ? prev.participants.filter(p => p !== id)
                : [...prev.participants, id]
        }));
    };

    const selectAllFiltered = () => {
        setFormData(prev => ({ ...prev, participants: filteredEmployees.map(e => e.id) }));
    };

    const clearAllFiltered = () => {
        setFormData(prev => ({ ...prev, participants: [] }));
    };

    const generateGCalLink = (meeting) => {
        const dt = new Date(meeting.start_time);
        const endDt = new Date(dt.getTime() + 60 * 60 * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        const start = fmt(dt);
        const end = fmt(endDt);
        const details = encodeURIComponent(meeting.description || '');
        const location = encodeURIComponent(meeting.location || meeting.meeting_link || '');
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=${start}/${end}&details=${details}&location=${location}`;
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none mb-3">
                        Meeting <span className="text-transparent bg-clip-text bg-[#00b9cd]">Scheduler</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10  /20 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Organize and manage corporate sessions</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:-md"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    <span className="uppercase tracking-widest">Schedule Meeting</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out mb-10 flex flex-col md:flex-row gap-5">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b9cd] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or location..."
                        className="pl-12 pr-6 w-full py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest ml-auto">
                    Total Sessions: <span className="ml-2 text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-10">{meetings.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-dashed border-[#00b9cd]/30">
                    <CalendarClock className="animate-spin mx-auto text-[#00b9cd] mb-4" size={40} />
                    <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Syncing session data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredMeetings.map((meeting) => (
                        <div key={meeting.id} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group">
                            <div className="mb-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] border border-[#00b9cd]/10 dark:border-[#00b9cd]/20  group-hover:scale-110 transition-transform duration-500 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]">
                                        <CalendarClock size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-10 text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                                        ID: #{meeting.id}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-[#00b9cd] transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">{meeting.title}</h3>
                                
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                        <Clock size={16} className="text-[#00b9cd]" strokeWidth={2.5} />
                                        <span className="text-xs font-bold font-mono uppercase truncate">{new Date(meeting.start_time).toLocaleString()}</span>
                                    </div>
                                    {meeting.location && (
                                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                            <MapPin size={16} className="text-[#00b9cd]" strokeWidth={2.5} />
                                            <span className="text-xs font-bold uppercase truncate">{meeting.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                        <Users size={16} className="text-[#00b9cd]" strokeWidth={2.5} />
                                        <span className="text-xs font-bold uppercase">{meeting.participants?.length || 0} Participants</span>
                                    </div>
                                </div>

                                {meeting.meeting_link && (
                                    <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 py-3 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 border border-[#00b9cd]/10 dark:border-[#00b9cd]/20 rounded-10 text-[#00b9cd] font-black text-[10px] uppercase tracking-widest hover:bg-[#00b9cd] hover:text-white transition-all  shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]">
                                        <Video size={14} strokeWidth={3} />
                                        Access Virtual Link
                                    </a>
                                )}
                            </div>

                            <div className="flex gap-4 pt-6 border-t-2 border-slate-50 dark:border-white/5">
                                <a
                                    href={generateGCalLink(meeting)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 py-3 px-4 bg-slate-50 dark:bg-white/5 hover:bg-[#00b9cd] hover:text-white dark:hover:bg-[#00b9cd] border-2 border-slate-100 dark:border-white/5 rounded-10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all hover:border-[#00b9cd] hover:shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:translate-y-1 active:-none flex items-center justify-center gap-2 group/btn"
                                >
                                    <Calendar size={14} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                    Sync
                                </a>
                                <button
                                    onClick={() => handleEdit(meeting)}
                                    className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-[#00b9cd] hover:text-white dark:hover:bg-[#00b9cd] border-2 border-slate-100 dark:border-white/5 rounded-10 text-slate-600 dark:text-slate-300 transition-all hover:border-[#00b9cd] hover:shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:scale-95 flex items-center justify-center group/edit"
                                >
                                    <Edit2 size={16} strokeWidth={3} className="group-hover/edit:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleDelete(meeting.id)}
                                    className="p-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border-2 border-red-100 dark:border-red-500/20 rounded-10 text-red-600 dark:text-red-400 transition-all hover:border-red-600 hover:shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:scale-95 flex items-center justify-center group/del"
                                >
                                    <Trash2 size={16} strokeWidth={3} className="group-hover/del:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredMeetings.length === 0 && (
                        <div className="col-span-full p-20 bg-slate-50 dark:bg-white/5 border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center rounded-10">
                            <CalendarClock size={64} className="text-slate-300 mb-4 opacity-50" />
                            <p className="text-2xl font-black text-slate-400 uppercase tracking-widest">No sessions scheduled.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Schedule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 border-none backdrop-blur-md ">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl -2xl shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-2xl overflow-hidden transform rounded-10 flex flex-col max-h-[95vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                    {isEditing ? 'Edit Session' : 'Schedule Meeting'}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Configure corporate session details and participants</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-10 transition-colors text-slate-400 dark:text-slate-500">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Meeting Title *</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white transition-all" placeholder="e.g. Weekly Sync Strategy" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Description / Agenda</label>
                                    <textarea rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white transition-all resize-none" placeholder="Details or agenda..."></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-[#00b9cd]" /> Date & Time *
                                    </label>
                                    <input required type="datetime-local" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Location (Physical)</label>
                                    <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white transition-all" placeholder="e.g. Conference Room A" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Virtual Link</label>
                                    <input type="url" value={formData.meeting_link} onChange={e => setFormData({ ...formData, meeting_link: e.target.value })} className="w-full px-5 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white transition-all" placeholder="https://zoom.us/..." />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t dark:border-white/5">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Filter Department</label>
                                    <select value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value, participants: [] })} className="appearance-none w-full px-5 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white cursor-pointer transition-all">
                                        <option value="" className="dark:bg-slate-900">All Departments</option>
                                        {departments.map(dept => <option key={dept.id} value={dept.id} className="dark:bg-slate-900">{dept.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-1">Filter Designation</label>
                                    <select value={formData.designation_id} onChange={e => setFormData({ ...formData, designation_id: e.target.value, participants: [] })} className="appearance-none w-full px-5 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white cursor-pointer transition-all">
                                        <option value="" className="dark:bg-slate-900">All Designations</option>
                                        {designations.map(desig => <option key={desig.id} value={desig.id} className="dark:bg-slate-900">{desig.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Attendees ({formData.participants.length})</label>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={selectAllFiltered} className="text-[10px] font-black text-[#00b9cd] hover:underline uppercase tracking-widest">Select All</button>
                                        <button type="button" onClick={clearAllFiltered} className="text-[10px] font-black text-red-600 hover:underline uppercase tracking-widest">Clear All</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-slate-900/5 dark:border-white/10 scrollbar-hide">
                                    {filteredEmployees.map(emp => (
                                        <label key={emp.id} className={`flex items-center gap-4 p-3 rounded-10 border-2 transition-all cursor-pointer ${formData.participants.includes(emp.id) ? 'bg-[#00b9cd]/10 border-[#00b9cd]/30 dark:bg-[#00b9cd]/10 dark:border-[#00b9cd]/30' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-[#00b9cd]/30'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.participants.includes(emp.id)} onChange={() => toggleParticipant(emp.id)} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{emp.user?.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{emp.designation?.name || 'Staff'}</div>
                                            </div>
                                            {formData.participants.includes(emp.id) && <div className="w-2 h-2 bg-[#00b9cd] rounded-10  /50 animate-pulse shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent transition-all duration-500 ease-out hover:border-[#00b9cd] dark:hover:border-[#00b9cd]"></div>}
                                        </label>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No matching personnel found</div>
                                    )}
                                </div>
                            </div>
                        </form>

                        <div className="p-8 bg-slate-50 dark:bg-transparent border-t border-slate-100 dark:border-white/5 flex gap-4">
                            <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all">
                                Discard
                            </button>
                            <button disabled={isSubmitting} type="submit" onClick={handleSubmit} className="flex-[2] py-4 bg-[#00b9cd] hover:bg-[#00b9cd]/80 rounded-10 text-white font-black text-xs uppercase tracking-widest shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:-2xl dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 animate-pulse' : 'hover:-translate-y-1 active:translate-y-0 active:-md'}">
                                {isSubmitting ? (isEditing ? 'Updating...' : 'Syncing...') : (isEditing ? 'Apply Changes' : 'Engage Schedule')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingsPage;