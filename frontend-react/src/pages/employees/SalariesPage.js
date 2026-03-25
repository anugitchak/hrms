import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
    CreditCard, Wallet, TrendingUp, ShieldCheck, 
    ArrowLeft, ChevronLeft, RefreshCw, Briefcase,
    PieChart, Activity, DollarSign
} from "lucide-react";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Icon size={20} /></div>}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-8 flex-1 flex flex-col">{children}</div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon, type = "button" }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md transform hover:-translate-y-0.5",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
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

const StatCard = ({ title, value, icon: Icon, subtitle }) => (
    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-10 rounded-10 shadow-xl border-2 border-transparent hover:border-[#00b9cd] transition-all duration-500 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00b9cd]/5 rounded-10 -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex flex-col gap-6 relative z-10">
            <div className="w-16 h-16 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] group-hover:bg-[#00b9cd] group-hover:text-white transition-all duration-500">
                <Icon size={32} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-2">{title}</p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">{value}</h3>
                {subtitle && <p className="text-[10px] font-bold text-[#00b9cd] uppercase tracking-widest">{subtitle}</p>}
            </div>
        </div>
    </div>
);

// --- Main Page Component ---

const SalariesPage = () => {
    const navigate = useNavigate();
    const [salary, setSalary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSalary();
    }, []);

    const fetchSalary = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get("/my-salary");
            if (data && data.id) {
                setSalary(data);
            } else if (Array.isArray(data) && data.length > 0) {
                setSalary(data[0]);
            } else {
                setSalary(data?.salary === null ? null : data);
            }
        } catch (err) {
            console.error("Salary fetch error:", err);
            if (err.response && err.response.status === 404) {
                setSalary(null);
            } else {
                setError("Operational signal lost. Could not retrieve compensation archive.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !salary) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-16 h-16 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#00b9cd] animate-pulse">Syncing Treasury Nodes...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen font-paperlogy mesh-bg">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Salary <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Structured compensation and credit matrix</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate("/employee/dashboard")} icon={ChevronLeft}>Exit Console</Button>
                </div>
            </div>

            {error ? (
                <div className="bg-rose-500/10 border-2 border-rose-500/20 p-10 rounded-10 text-center mb-12">
                    <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-rose-600 uppercase tracking-[0.2em] mb-2">Sync Point Error</h3>
                    <p className="text-sm font-bold text-rose-500/80 uppercase tracking-widest max-w-md mx-auto">{error}</p>
                </div>
            ) : !salary ? (
                <div className="bg-[#00b9cd]/5 border-2 border-[#00b9cd]/10 p-16 rounded-10 text-center max-w-2xl mx-auto shadow-xl">
                    <Briefcase className="w-20 h-20 text-[#00b9cd]/20 mx-auto mb-8 animate-bounce" />
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-4">No Asset Structure</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed mb-8">Your compensation matrix has not been operationalized. Contact Command or HR for deployment.</p>
                    <Button variant="primary" onClick={() => navigate("/employee/dashboard")}>Return to Ops</Button>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <StatCard title="Annual Gross" value={`₹${(Number(salary.gross_salary) * 12).toLocaleString()}`} icon={TrendingUp} subtitle="Projected Archive" />
                        <StatCard title="Monthly Allocation" value={`₹${Number(salary.gross_salary).toLocaleString()}`} icon={Wallet} subtitle="Operational Credit" />
                        <StatCard title="Net Liquid" value={`₹${Number(salary.gross_salary - (salary.deductions || 0)).toLocaleString()}`} icon={CreditCard} subtitle="Cleared Assets" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                        {/* Earnings Section */}
                        <Card title="Credit Input Layers" icon={Activity}>
                            <div className="space-y-8 flex-1 flex flex-col justify-center">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center group/row">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-8 bg-[#00b9cd] rounded-10"></div>
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/row:text-[#00b9cd] transition-colors">Core Assignment (Basic)</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">₹{Number(salary.basic).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/row">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-8 bg-[#00b9cd]/40 rounded-10"></div>
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/row:text-[#00b9cd] transition-colors">Tactical Support (HRA)</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">₹{Number(salary.hra).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="pt-10 mt-auto border-t-2 border-slate-50 dark:border-white/5 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Operational Input</span>
                                    <span className="text-3xl font-black text-[#00b9cd] tracking-tighter">₹{Number(salary.gross_salary).toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Deductions Section */}
                        <Card title="Debit Guardrails" icon={ShieldCheck}>
                             <div className="space-y-8 flex-1 flex flex-col justify-center">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/row:text-rose-500 transition-colors">Archive Reserve (PF)</span>
                                        <span className="text-lg font-black text-rose-500 tracking-tighter">₹{Number(salary.pf).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/row:text-rose-500 transition-colors">Health Uplink (ESIC)</span>
                                        <span className="text-lg font-black text-rose-500 tracking-tighter">₹{Number(salary.esic).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/row:text-rose-500 transition-colors">State Compliance (PTAX)</span>
                                        <span className="text-lg font-black text-rose-500 tracking-tighter">₹{Number(salary.ptax).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="pt-10 mt-auto border-t-2 border-slate-50 dark:border-white/5 flex justify-between items-center text-rose-500">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Debit Load</span>
                                    <span className="text-3xl font-black tracking-tighter">-₹{Number(salary.deductions || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Final Net Pay Card (Full Width) */}
                    <div className="bg-[#00b9cd] p-16 rounded-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-10 -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-10 -ml-32 -mb-32 group-hover:scale-110 transition-transform duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div>
                                <h3 className="text-[14px] font-black text-white/60 uppercase tracking-[0.5em] mb-4">Verified Liquidity (Net Pay)</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black text-white tracking-tighter">₹{Number(salary.gross_salary - (salary.deductions || 0)).toFixed(2)}</span>
                                    <span className="text-xl font-black text-white/40 uppercase tracking-widest">/ Month</span>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="!border-white !text-white hover:!bg-white hover:!text-[#00b9cd] !py-6 !px-12 !text-[12px] !rounded-10 shadow-2xl"
                                onClick={() => navigate("/employee/payslips")}
                                icon={PieChart}
                            >
                                Track Pay History
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalariesPage;
