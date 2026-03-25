import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useGlobalUI } from "../../../context/GlobalUIContext";
import {
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadFile,
    trackView
} from "../../../api/announcements";
import FilterBar from "../../../components/announcements/FilterBar";
import AnnouncementTable from "../../../components/announcements/AnnouncementTable";
import AnnouncementFormModal from "../../../components/announcements/AnnouncementFormModal";
import AnnouncementViewer from "../../../components/announcements/AnnouncementViewer";

const AnnouncementsPage = () => {
    // State
    const { addToast, confirm } = useGlobalUI();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        status: "",
        audience: "",
        startDate: "",
        endDate: "",
    });

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        loadAnnouncements();
    }, [pagination.current_page, filters]);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                ...filters
            };
            const response = await fetchAnnouncements(params);
            setAnnouncements(response.data.data || []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
            });
        } catch (error) {
            console.error("Failed to load announcements", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to page 1
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const handleCreate = () => {
        setSelectedAnnouncement(null);
        setIsFormOpen(true);
    };

    const handleEdit = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "Delete Announcement",
            message: "Are you sure you want to delete this announcement?",
            confirmText: "Delete",
            type: "danger"
        });
        if (!confirmed) return;
        try {
            await deleteAnnouncement(id);
            addToast("Announcement deleted successfully", "success");
            loadAnnouncements();
        } catch (error) {
            console.error("Failed to delete announcement", error);
            addToast("Failed to delete announcement.", "error");
        }
    };

    const handleView = async (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsViewerOpen(true);
        try {
            await trackView(announcement.id);
            // Update local view count to reflect immediate change
            setAnnouncements(prev => prev.map(a =>
                a.id === announcement.id ? { ...a, views_count: (a.views_count || 0) + 1 } : a
            ));
        } catch (error) {
            console.error("Failed to track view", error);
        }
    };

    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true);

        try {
            let attachmentUrl = selectedAnnouncement?.attachment_url;

            // Upload file if present
            if (formData.file) {

                const uploadResponse = await uploadFile(formData.file);

                attachmentUrl = uploadResponse.data.url;
            }

            const payload = {
                ...formData,
                attachment_url: attachmentUrl,
            };



            if (selectedAnnouncement) {
                await updateAnnouncement(selectedAnnouncement.id, payload);
            } else {
                await createAnnouncement(payload);
            }

            addToast(selectedAnnouncement ? "Announcement updated successfully" : "Announcement created successfully", "success");
            setIsFormOpen(false);
            loadAnnouncements();
        } catch (error) {
            console.error("Failed to save announcement", error);
            console.error("Error response:", error.response?.data);
            addToast(`Failed to save announcement: ${error.response?.data?.message || error.message}`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate Stats
    const stats = [
        { label: "Total Dispatch", value: pagination.total, icon: <Plus className="text-[#00b9cd]" />, color: "teal" },
        { label: "Live Units", value: announcements.filter(a => a.status === 'Active').length, icon: <Plus className="text-emerald-500" />, color: "emerald" },
        { label: "Critical", value: announcements.filter(a => a.category === 'Urgent').length, icon: <Plus className="text-rose-500" />, color: "rose" },
        { label: "Intelligence Views", value: announcements.reduce((acc, curr) => acc + (curr.views_count || 0), 0), icon: <Plus className="text-blue-500" />, color: "blue" },
    ];

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none mb-2">
                        System <span className="text-transparent bg-clip-text bg-[#00b9cd]">Announcements</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Broadcast Intelligence Management Hub</p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                >
                    <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                    Create Dispatch
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex items-center gap-5 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out group">
                        <div className={`w-14 h-14 rounded-10 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 border-2 border-${stat.color}-100 dark:border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform duration-500 shadow-md`}>
                            {React.cloneElement(stat.icon, { size: 24, strokeWidth: 2.5 })}
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{stat.value.toLocaleString()}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#00b9cd] transition-colors">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />

            {/* Table */}
            <AnnouncementTable
                announcements={announcements}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modals */}
            <AnnouncementFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedAnnouncement}
                isSubmitting={isSubmitting}
            />

            <AnnouncementViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                announcement={selectedAnnouncement}
            />
        </div>
    );
};

export default AnnouncementsPage;
