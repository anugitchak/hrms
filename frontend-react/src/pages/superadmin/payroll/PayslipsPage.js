import React, { useState, useEffect } from 'react'; 
import { Plus, Loader2, Download as DownloadIcon, Settings, FileText, RefreshCw, Users, Wallet, TrendingUp, TrendingDown, History, Search, Filter, Calendar } from 'lucide-react'; 
import axios from '../../../api/axios'; 
import PayslipFilterBar from '../../../components/payslips/PayslipFilterBar'; 
import PayslipTable from '../../../components/payslips/PayslipTable'; 
import GeneratePayslipModal from '../../../components/payslips/GeneratePayslipModal'; 
import ViewPayslipModal from '../../../components/payslips/ViewPayslipModal'; 
import EditPayslipModal from '../../../components/payslips/EditPayslipModal'; 
import DeleteConfirmModal from '../../../components/payslips/DeleteConfirmModal'; 
import DownloadPayslipModal from '../../../components/payslips/DownloadPayslipModal'; 
import ManagePayslipAccessModal from '../../../components/payslips/ManagePayslipAccessModal'; 
import { useAuth } from '../../../context/AuthContext'; 
import { useGlobalUI } from '../../../context/GlobalUIContext'; 

// --- Components ---

const StatCard = ({ label, value, icon: Icon, color, bg, border, loading }) => (
    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-6 flex flex-col items-start gap-4 rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(71,85,105,0.15)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden border border-slate-50 dark:border-white/5">
        <div className={`${bg} ${color} ${border} w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0`}>
            <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2 truncate font-paperlogy tracking-tight" title={value}>
                {loading ? <div className="h-6 w-20 bg-slate-100 dark:bg-white/5 animate-pulse rounded" /> : value}
            </div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase truncate">{label}</div>
        </div>
    </div>
);

const PayslipsPage = () => { 
    const { addToast } = useGlobalUI(); 
    const [payslips, setPayslips] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(''); 
    const [filters, setFilters] = useState({ search: '', department: '', month: '', year: '' }); 
    const [departments, setDepartments] = useState([]); 
    const [employees, setEmployees] = useState([]); 

    // Modals State
    const [showGenerateModal, setShowGenerateModal] = useState(false); 
    const [showDownloadModal, setShowDownloadModal] = useState(false); 
    const [showAccessModal, setShowAccessModal] = useState(false); 
    
    // Selection States
    const [viewPayslip, setViewPayslip] = useState(null); 
    const [editPayslip, setEditPayslip] = useState(null); 
    const [deletePayslip, setDeletePayslip] = useState(null); 
    
    const { user } = useAuth(); 
    
    const canViewPayslips = user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3 || user?.permissions?.includes("can_manage_payslips") || user?.permissions?.includes("can_view_payslips"); 
    const isSuperAdmin = user?.role_id === 1; 

    useEffect(() => { 
        if (canViewPayslips) { 
            fetchInitialData(); 
            fetchPayslips(); 
        } 
    }, [canViewPayslips]); 

    useEffect(() => { 
        if (canViewPayslips) { 
            fetchPayslips(); 
        } 
    }, [filters, canViewPayslips]); 

    const fetchInitialData = async () => { 
        try { 
            const [deptRes, empRes] = await Promise.all([ 
                axios.get('/departments'), 
                axios.get('/employees') 
            ]); 
            if (Array.isArray(deptRes.data)) { 
                setDepartments(deptRes.data); 
            } else if (deptRes.data?.success && deptRes.data?.data) { 
                setDepartments(deptRes.data.data); 
            } 
            if (Array.isArray(empRes.data)) { 
                setEmployees(empRes.data); 
            } else if (empRes.data?.success && empRes.data?.data) { 
                setEmployees(empRes.data.data); 
            } 
        } catch (err) { 
            console.error("Failed to fetch initial data", err); 
        } 
    }; 

    const fetchPayslips = async () => { 
        setLoading(true); 
        try { 
            const params = new URLSearchParams(); 
            if (filters.search) params.append('search', filters.search); 
            if (filters.department) params.append('department_id', filters.department); 
            if (filters.month) params.append('month', filters.month); 
            if (filters.year) params.append('year', filters.year); 
            const response = await axios.get(`/payslips?${params.toString()}`); 
            if (response.status === 200) { 
                setPayslips(response.data); 
            } else { 
                setError('Failed to fetch payslips.'); 
            } 
        } catch (err) { 
            console.error(err); 
            setError('An error occurred while fetching payslips.'); 
        } finally { 
            setLoading(false); 
        } 
    }; 

    const handleFilterChange = (key, value) => { 
        setFilters(prev => ({ ...prev, [key]: value })); 
    }; 

    const handleDownload = async (payslip) => { 
        try { 
            const response = await axios.get(`/payslips/download`, { 
                params: { 
                    employee_id: payslip.employee_id, 
                    year: payslip.year, 
                    start_month: payslip.month, 
                    end_month: payslip.month 
                }, 
                responseType: 'blob', 
            }); 
            const url = window.URL.createObjectURL(new Blob([response.data])); 
            const link = document.createElement('a'); 
            link.href = url; 
            link.setAttribute('download', `Payslip_${payslip.employee_code}_${payslip.year}_${payslip.month}.pdf`); 
            document.body.appendChild(link); 
            link.click(); 
            link.remove(); 
        } catch (err) { 
            console.error("Download failed", err); 
            addToast("Failed to download PDF. Please try again.","error"); 
        } 
    }; 
    const formatINR = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
        }).format(value);
    };

    const stats = (() => {
        const data = Array.isArray(payslips) ? payslips : [];
        if (!data.length) return { totalGenerated: 0, totalPayout: 0, avgNet: 0, highest: 0, lowest: 0 };
        
        const totalGenerated = data.length;
        const totalPayout = data.reduce((sum, p) => sum + parseFloat(p.net_pay || 0), 0);
        const avgNet = totalPayout / (data.length || 1);
        const netPays = data.map(p => parseFloat(p.net_pay || 0));
        
        return {
            totalGenerated,
            totalPayout,
            avgNet,
            highest: Math.max(...netPays, 0),
            lowest: Math.min(...netPays.filter(p => p > 0), 0)
        };
    })();

    return ( 
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen"> 
            {/* Header */} 
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6"> 
                <div> 
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none mb-3">
                        <span className="italic">Payslip</span> <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Lifecycle monitoring and compliance archives</p>
                    </div>
                </div> 
                <div className="flex items-center gap-4"> 
                    <button 
                        onClick={() => setShowAccessModal(true)} 
                        className="flex items-center gap-3 text-xs font-black text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-6 py-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.15)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md border border-slate-50 dark:border-white/5 uppercase tracking-[0.2em]"
                    > 
                        <Settings size={16} className="text-teal-600" /> 
                        Permissions
                    </button> 
                    <button 
                        onClick={() => setShowDownloadModal(true)} 
                        className="flex items-center gap-3 text-xs font-black text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-6 py-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.15)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md border border-slate-50 dark:border-white/5 uppercase tracking-[0.2em]"
                    > 
                        <DownloadIcon size={16} className="text-emerald-500" /> 
                        Bulk Export
                    </button> 
                    <button 
                        onClick={fetchPayslips}
                        className="flex items-center justify-center h-[52px] w-[52px] bg-teal-600 hover:bg-teal-500 text-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(13,148,136,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div> 
            </div> 

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <StatCard label="Total Issued" value={stats.totalGenerated} icon={FileText} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" loading={loading} />
                <StatCard label="Total Payout" value={formatINR(stats.totalPayout)} icon={Wallet} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" loading={loading} />
                <StatCard label="Avg Net Pay" value={formatINR(stats.avgNet)} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" border="border-purple-100" loading={loading} />
                <StatCard label="Highest" value={formatINR(stats.highest)} icon={TrendingUp} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" loading={loading} />
                <StatCard label="Lowest" value={formatINR(stats.lowest)} icon={TrendingDown} color="text-red-600" bg="bg-red-50" border="border-red-100" loading={loading} />
            </div>

            {/* Content Area */}
            <div className="space-y-10">
                <div className="mb-0">
                    <PayslipFilterBar 
                        filters={filters} 
                        onFilterChange={handleFilterChange} 
                        departments={departments} 
                    /> 
                </div>

                {/* Table Container */} 
                <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(71,85,105,0.2)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] border border-slate-50 dark:border-white/5 overflow-hidden min-h-[400px]"> 
                    {loading ? ( 
                        <div className="flex flex-col justify-center items-center h-96"> 
                            <Loader2 size={48} className="animate-spin text-teal-600 mb-4" /> 
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Payslips...</p>
                        </div> 
                    ) : error ? ( 
                        <div className="p-20 text-center"> 
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-3xl border-2 border-red-100 dark:border-red-800/30 inline-block font-bold"> 
                                {error} 
                            </div> 
                        </div> 
                    ) : ( 
                        <PayslipTable 
                            payslips={payslips} 
                            onView={setViewPayslip} 
                            onEdit={setEditPayslip} 
                            onDelete={setDeletePayslip} 
                            onDownload={handleDownload} 
                        /> 
                    )} 
                </div>
            </div>

            {/* Modals */} 
            {showGenerateModal && ( 
                <GeneratePayslipModal onClose={() => setShowGenerateModal(false)} onSuccess={fetchPayslips} employees={employees} /> 
            )} 
            {showDownloadModal && ( 
                <DownloadPayslipModal onClose={() => setShowDownloadModal(false)} employees={employees} /> 
            )} 
            {showAccessModal && ( 
                <ManagePayslipAccessModal onClose={() => setShowAccessModal(false)} /> 
            )} 
            {viewPayslip && ( 
                <ViewPayslipModal payslip={viewPayslip} onClose={() => setViewPayslip(null)} onDownload={handleDownload} /> 
            )} 
            {editPayslip && ( 
                <EditPayslipModal payslip={editPayslip} onClose={() => setEditPayslip(null)} onSuccess={fetchPayslips} /> 
            )} 
            {deletePayslip && ( 
                <DeleteConfirmModal payslip={deletePayslip} onClose={() => setDeletePayslip(null)} onSuccess={fetchPayslips} /> 
            )} 
        </div> 
    ); 
}; 

export default PayslipsPage; 