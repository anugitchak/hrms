import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { Calendar, Clock, Video, MapPin, Users, Plus, X, Trash2, Edit2, CalendarClock } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const MeetingsPage = () => {
    const [meetings, setMeetings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        start_time: "",
        location: "",
        meeting_link: "",
        department_id: "",
        designation_id: "",
        participants: []
    });

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
            const [deptRes, desigRes] = await Promise.all([
                api.get("/departments"),
                api.get("/designations")
            ]);
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
                alert("Meeting updated successfully!");
            } else {
                await api.post("/meetings", formData);
                alert("Meeting scheduled successfully!");
            }
            setIsModalOpen(false);
            resetForm();
            fetchMeetings();
        } catch (err) {
            console.error("Failed to save meeting", err);
            alert(err.response?.data?.message || "Failed to save meeting");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            start_time: "",
            location: "",
            meeting_link: "",
            department_id: "",
            designation_id: "",
            participants: []
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (meeting) => {
        // Convert start_time to datetime-local format (YYYY-MM-DDTHH:mm)
        const dt = new Date(meeting.start_time);
        const pad = (n) => String(n).padStart(2, '0');
        const localDT = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

        setFormData({
            title: meeting.title || "",
            description: meeting.description || "",
            start_time: localDT,
            location: meeting.location || "",
            meeting_link: meeting.meeting_link || "",
            department_id: meeting.department_id ? String(meeting.department_id) : "",
            designation_id: meeting.designation_id ? String(meeting.designation_id) : "",
            participants: meeting.participants?.map(p => p.id) || []
        });
        setIsEditing(true);
        setEditingId(meeting.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this meeting?")) return;
        try {
            await api.delete(`/meetings/${id}`);
            fetchMeetings();
        } catch (err) {
            console.error("Failed to delete meeting", err);
        }
    };

    const toggleParticipant = (id) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(id)
                ? prev.participants.filter(p => p !== id)
                : [...prev.participants, id]
        }));
    };

    const selectAllFiltered = () => {
        const filteredIds = filteredEmployees.map(e => e.id);
        setFormData(prev => ({
            ...prev,
            participants: [...new Set([...prev.participants, ...filteredIds])]
        }));
    };

    const clearAllFiltered = () => {
        const filteredIds = filteredEmployees.map(e => e.id);
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter(id => !filteredIds.includes(id))
        }));
    };

    // Participant Filtering Logic
    const filteredEmployees = employees.filter(emp => {
        const matchesDept = !formData.department_id || emp.department_id === parseInt(formData.department_id);
        const matchesDesig = !formData.designation_id || emp.designation_id === parseInt(formData.designation_id);
        return matchesDept && matchesDesig;
    });

    // Google Calendar Link Generator (1 hour duration)
    // Uses the LOCAL datetime string to avoid UTC offset shifting
    const generateGCalLink = (meeting) => {
        // meeting.start_time comes as "2026-02-25T17:00:00" (local/server time)
        // Strip separators directly from the string to avoid JS Date UTC conversion
        const raw = meeting.start_time?.replace('T', '').replace(/-|:/g, '').slice(0, 15) + '00'; // YYYYMMDDTHHmmSS format
        const startStr = meeting.start_time?.replace('T', '').replace(/-|:|\..*/g, ''); // YYYYMMDDHHmmSS

        // Build start in YYYYMMDDTHHMMSS format
        const cleanStart = meeting.start_time
            ? meeting.start_time.replace(/-/g, '').replace('T', 'T').replace(/:/g, '').split('.')[0]
            : '';

        // Add 1 hour manually by parsing date parts from the string
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
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarClock className="w-7 h-7 text-blue-600" /> Meeting Scheduler
                    </h1>
                    <p className="text-sm text-gray-500">Organize and manage corporate sessions.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all"
                >
                    <Plus className="w-5 h-5" /> Schedule Meeting
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-gray-400 font-medium italic">Loading session data...</div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {meetings.map((meeting) => (
                        <div key={meeting.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            {/* Priority/Status Indicator */}
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>

                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{meeting.title}</h3>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(meeting)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit Meeting">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(meeting.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete Meeting">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>{new Date(meeting.start_time).toLocaleString()}</span>
                                </div>
                                {(meeting.department || meeting.designation) && (
                                    <div className="flex flex-wrap gap-2">
                                        {meeting.department && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">{meeting.department.name}</span>}
                                        {meeting.designation && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase">{meeting.designation.name}</span>}
                                    </div>
                                )}
                                {meeting.location && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{meeting.location}</span>
                                    </div>
                                )}
                                {meeting.meeting_link && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                        <Video className="w-4 h-4" />
                                        <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="hover:underline truncate">Join Link</a>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span>{meeting.participants?.length || 0} Invited Participants</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Created by {meeting.creator?.name}</span>
                                <a
                                    href={generateGCalLink(meeting)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors flex items-center gap-1.5"
                                >
                                    <Calendar className="w-3.5 h-3.5" /> Google Cal
                                </a>
                            </div>
                        </div>
                    ))}
                    {meetings.length === 0 && (
                        <div className="col-span-full p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No meetings scheduled yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Schedule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                {isEditing ? 'Edit Meeting' : 'Schedule New Meeting'}
                            </h2>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Meeting Title</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Weekly Sync Strategy" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                                    <textarea rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Agenda or notes..."></textarea>
                                </div>
                                <div className="relative group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-blue-500" /> Date & Time
                                    </label>
                                    <input required type="datetime-local" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Location (Physical)</label>
                                    <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Conference Room A" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Virtual Link</label>
                                    <input type="url" value={formData.meeting_link} onChange={e => setFormData({ ...formData, meeting_link: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="https://zoom.us/..." />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t dark:border-gray-700">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Section Name: Department</label>
                                    <select value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value, participants: [] })} className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                        <option value="">All Departments</option>
                                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Section Name: Designation</label>
                                    <select value={formData.designation_id} onChange={e => setFormData({ ...formData, designation_id: e.target.value, participants: [] })} className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                        <option value="">All Designations</option>
                                        {designations.map(desig => <option key={desig.id} value={desig.id}>{desig.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Participants ({formData.participants.length})</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={selectAllFiltered} className="text-[10px] font-bold text-blue-600 hover:underline">Select All</button>
                                        <button type="button" onClick={clearAllFiltered} className="text-[10px] font-bold text-red-600 hover:underline">Clear All</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700">
                                    {filteredEmployees.map(emp => (
                                        <label key={emp.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${formData.participants.includes(emp.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.participants.includes(emp.id)} onChange={() => toggleParticipant(emp.id)} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{emp.user?.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{emp.designation?.name || 'Staff'}</div>
                                            </div>
                                            {formData.participants.includes(emp.id) && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                                        </label>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-gray-400 text-xs italic">No employees found for this selection.</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t dark:border-gray-700 mt-6">
                                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-3 text-sm font-bold text-gray-500 uppercase tracking-widest border rounded-xl hover:bg-gray-50 transition-colors">Discard</button>
                                <button disabled={isSubmitting} type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 transition-all">
                                    {isSubmitting ? (isEditing ? 'Updating...' : 'Syncing...') : (isEditing ? 'Update Meeting' : 'Publish Meeting')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingsPage;
