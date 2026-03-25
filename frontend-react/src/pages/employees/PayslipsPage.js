import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useGlobalUI } from "../../context/GlobalUIContext";
import { 
    FileText, Download, Eye, ChevronLeft, 
    RefreshCw, CreditCard, Wallet, TrendingUp,
    Calendar, ShieldCheck, CheckCircle2, X
} from "lucide-react";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Icon size={18} /></div>}
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-6 flex-1 flex flex-col">{children}</div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon, type = "button" }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md transform hover:-translate-y-0.5",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
        ghost: "bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
        success: "bg-emerald-500 text-white hover:bg-emerald-600",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

const StatCard = ({ title, value, icon: Icon, color = "teal" }) => (
    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md border-2 border-transparent hover:border-[#00b9cd] transition-all duration-500 group overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-[#00b9cd]/5 rounded-10 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
        <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd] group-hover:bg-[#00b9cd] group-hover:text-white transition-all duration-500">
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{value}</h3>
            </div>
        </div>
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-slate-950/80 flex items-center justify-center z-50 backdrop-blur-xl p-4">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-10 shadow-2xl w-full max-w-2xl transform transition-all overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-10 transition-all"><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">{children}</div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const PayslipsPage = () => {
    const { addToast } = useGlobalUI();
    const navigate = useNavigate();
    const [payslips, setPayslips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    const getMonthName = (monthNumber) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    useEffect(() => {
        fetchPayslips();
    }, []);

    const fetchPayslips = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get("/my-payslips");
            const list = data.data || data;
            setPayslips(Array.isArray(list) ? list : []);
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError("Operational clearance required. Permission for financial audit denied.");
            } else {
                console.error("Fetch payslips error:", err);
                setError("Uplink failure. Could not retrieve financial records.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = async (payslip) => {
        try {
            const response = await api.get('/my-payslips/download', {
                params: { year: payslip.year, start_month: payslip.month, end_month: payslip.month },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PAYSLIP_${getMonthName(payslip.month).toUpperCase()}_${payslip.year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            addToast("FINANCIAL ARCHIVE DOWNLOADED", "success");
        } catch (err) {
            console.error("Download failed", err);
            addToast("ARCHIVE RETRIEVAL FAILURE", "error");
        }
    };

    if (isLoading && !payslips.length) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-16 h-16 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#00b9cd] animate-pulse">Decrypting Assets...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen font-paperlogy mesh-bg">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Finance <span className="text-transparent bg-clip-text bg-[#00b9cd]">Hub</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Operational credit and asset management</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate("/employee/dashboard")} icon={ChevronLeft}>Exit Console</Button>
                </div>
            </div>

            {error ? (
                <div className="bg-rose-500/10 border-2 border-rose-500/20 p-10 rounded-10 text-center mb-12">
                    <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-rose-600 uppercase tracking-[0.2em] mb-2">Access Grid Locked</h3>
                    <p className="text-sm font-bold text-rose-500/80 uppercase tracking-widest max-w-md mx-auto">{error}</p>
                </div>
            ) : (
                <>
                    {/* Stat Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <StatCard title="Total Statements" value={payslips.length} icon={FileText} />
                        <StatCard title="Active Protocol" value="Operational" icon={CheckCircle2} />
                        <StatCard title="Verification" value="Shield Secured" icon={ShieldCheck} />
                    </div>

                    {/* Payslips List */}
                    <Card className="p-0 overflow-hidden" title="Operational Pay Cycles" icon={Wallet}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-white/5">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Accounting Month</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Cycle Year</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Net Allocation</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">Release Date</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 text-right">Operational Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {payslips.length > 0 ? (
                                        payslips.map((payslip) => (
                                            <tr key={payslip.id} className="group hover:bg-[#00b9cd]/5 transition-colors duration-300">
                                                <td className="px-10 py-6 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                    {getMonthName(payslip.month)}
                                                </td>
                                                <td className="px-10 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                    {payslip.year}
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className="text-lg font-black text-[#00b9cd] tracking-tighter">₹{Number(payslip.net_pay).toFixed(2)}</span>
                                                </td>
                                                <td className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {formatDate(payslip.created_at)}
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex justify-end gap-4">
                                                        <Button variant="ghost" className="px-4 py-2 hover:!bg-[#00b9cd] hover:!text-white" onClick={() => setSelectedPayslip(payslip)} icon={Eye}>Inspect</Button>
                                                        <Button variant="primary" className="px-4 py-2" onClick={() => handleDownloadPDF(payslip)} icon={Download}>Export PDF</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-white/10 font-black uppercase tracking-widest text-sm">
                                                    <CreditCard size={48} className="opacity-20" />
                                                    No financial signatures detected.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {/* View Payslip Modal */}
            <Modal 
                isOpen={!!selectedPayslip} 
                onClose={() => setSelectedPayslip(null)} 
                title={`Audit Detail: ${selectedPayslip ? getMonthName(selectedPayslip.month).toUpperCase() + ' ' + selectedPayslip.year : ''}`} 
            >
                {selectedPayslip && (
                    <div className="space-y-10">
                        {/* Summary Box */}
                        <div className="bg-[#00b9cd]/5 border-2 border-[#00b9cd]/10 rounded-10 p-8 flex justify-between items-center group relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-[#00b9cd]/5 rounded-10 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-[#00b9cd] uppercase tracking-[0.2em] mb-2">Net Disbursed Amount</p>
                                <h3 className="text-4xl font-black text-[#00b9cd] tracking-tighter">₹{Number(selectedPayslip.net_pay).toFixed(2)}</h3>
                            </div>
                            <div className="relative z-10 text-right">
                                <span className="px-4 py-1 rounded-10 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">Operational Clear</span>
                                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Digital ID: {selectedPayslip.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Credits */}
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] pb-3 border-b-2 border-[#00b9cd] w-fit">Credit Allocation</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">Base Assignment</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">₹{Number(selectedPayslip.basic).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">Deployment (HRA)</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">₹{Number(selectedPayslip.hra).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Credits</span>
                                        <span className="text-lg font-black text-[#00b9cd] tracking-tighter">₹{Number(selectedPayslip.total_earnings).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Debits */}
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] pb-3 border-b-2 border-rose-500 w-fit">Debit Deductions</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">Protocol (PF)</span>
                                        <span className="text-sm font-black text-rose-500 uppercase tracking-tighter">₹{Number(selectedPayslip.pf).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">Risk (ESIC)</span>
                                        <span className="text-sm font-black text-rose-500 uppercase tracking-tighter">₹{Number(selectedPayslip.esic).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">System (PTAX)</span>
                                        <span className="text-sm font-black text-rose-500 uppercase tracking-tighter">₹{Number(selectedPayslip.ptax).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Debits</span>
                                        <span className="text-lg font-black text-rose-500 tracking-tighter">₹{Number(selectedPayslip.total_deductions).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 flex flex-col md:flex-row gap-4 border-t border-slate-100 dark:border-white/5">
                            <Button variant="ghost" onClick={() => setSelectedPayslip(null)} className="flex-1">Close Terminal</Button>
                            <Button variant="primary" onClick={() => handleDownloadPDF(selectedPayslip)} icon={Download} className="flex-1">Export Full Statement</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PayslipsPage;