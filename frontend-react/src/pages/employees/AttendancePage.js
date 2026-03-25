import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/axios";
import { formatTime, calculateHours, calculateWeeklyStats, calculateMonthlyStats } from "../../utils/dateUtils";
import { reverseGeocode } from "../../utils/locationUtils";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    Clock, Calendar, MapPin, CheckCircle, AlertTriangle, 
    RefreshCw, LogIn, LogOut, Zap, TrendingUp, History,
    ArrowRight, Map as MapIcon, ShieldCheck, ChevronRight,
    Search, Filter, Activity, X, Info
} from 'lucide-react';
import { useGlobalUI } from "../../context/GlobalUIContext";

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Premium UI Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    {Icon && <div className="p-3 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd] group-hover:bg-[#00b9cd] group-hover:text-white transition-all duration-500"><Icon size={20} /></div>}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-8 flex-1 flex flex-col">{children}</div>
    </div>
);

const StatCard = ({ title, value, subValue, icon: Icon, color = "teal" }) => {
    const colors = {
        teal: "text-[#00b9cd] bg-[#00b9cd]/10",
        amber: "text-amber-500 bg-amber-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        rose: "text-rose-500 bg-rose-500/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
    };

    return (
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md border-2 border-transparent hover:border-[#00b9cd] transition-all duration-500 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 ${colors[color]} rounded-10 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {subValue && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00b9cd] bg-[#00b9cd]/5 px-3 py-1 rounded-10">{subValue}</span>}
            </div>
            <div className="relative z-10">
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 uppercase h-[40px] flex items-end">{value || "0H 0M"}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 italic">{title}</div>
            </div>
        </div>
    );
};

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
        destructive: "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-8 py-4 rounded-10 font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3 ${variants[variant]} ${disabled ? 'opacity-30 cursor-not-allowed scale-95' : 'cursor-pointer hover:-translate-y-1'} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

const Badge = ({ children, variant = "default" }) => {
    const styles = {
        default: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200/50",
        Present: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        Absent: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        Late: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        "Half Day": "bg-blue-500/10 text-blue-500 border-blue-500/20"
    };

    const current = styles[variant] || styles.default;

    return (
        <span className={`inline-flex px-4 py-1.5 rounded-10 text-[9px] font-black uppercase tracking-[0.2em] border-2 ${current}`}>
            {children}
        </span>
    );
};

// --- Main Page Component ---

const AttendancePage = () => {
    const { addToast } = useGlobalUI();
    const [attendance, setAttendance] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [currentLocationName, setCurrentLocationName] = useState("");
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); 
    const todayDateObj = new Date();
    const localTodayStr = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(localTodayStr.slice(0, 7)); 
    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;

    const fetchAttendance = async () => {
        try {
            const response = await api.get("/my-attendance");
            setAttendance(Array.isArray(response.data.data) ? response.data.data : response.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
            addToast("Failed to sync attendance ledger.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!isSecureContext) {
                reject(new Error('Terminal requires secure encryption (HTTPS/Localhost).'));
                return;
            }
            if (!navigator.geolocation) {
                reject(new Error("Spatial interface unsupported."));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setCurrentLocation(loc);
                    resolve(loc);
                },
                (err) => {
                    reject(new Error("Global Positioning signal jammed."));
                },
                { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
            );
        });
    };

    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let deviceType = 'Desktop';
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) deviceType = 'Tablet';
        else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) deviceType = 'Mobile';
        
        let browser = 'Common';
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';

        let deviceId = localStorage.getItem('device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('device_id', deviceId);

        return { device_id: deviceId, device_type: deviceType, browser: browser };
    };

    const handleActionRequest = async (type) => {
        try {
            setPendingAction(type);
            const location = await getLocation();
            const locationName = await reverseGeocode(location.latitude, location.longitude);
            setCurrentLocationName(locationName);
            setShowLocationModal(true);
        } catch (err) {
            addToast(err.message, "error");
            setPendingAction(null);
        }
    };

    const proceedWithAction = async () => {
        try {
            setActionLoading(true);
            setShowLocationModal(false);
            const deviceInfo = getDeviceInfo();
            
            if (pendingAction === "check-in") {
                await api.post("/my-attendance/check-in", {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    location: currentLocationName,
                    force_checkin: true,
                    ...deviceInfo
                });
            } else {
                await api.post("/my-attendance/check-out", {
                    check_out_latitude: currentLocation.latitude,
                    check_out_longitude: currentLocation.longitude,
                    check_out_location: currentLocationName,
                });
            }

            addToast(`${pendingAction.toUpperCase()} SUCCESSFUL`, "success");
            await fetchAttendance();
        } catch (err) {
            addToast(err?.response?.data?.message || "TRANSMISSION ERROR", "error");
        } finally {
            setActionLoading(false);
            setPendingAction(null);
        }
    };

    const today = localTodayStr;
    const todayRecord = attendance.find(r => r.date === today);
    const isCheckedInToday = !!todayRecord?.check_in;
    const isCheckedOutToday = !!todayRecord?.check_out;

    const weeklyStats = calculateWeeklyStats(attendance);
    const monthlyStats = calculateMonthlyStats(attendance, selectedMonth);
    const filteredAttendance = attendance.filter(r => r.date.startsWith(selectedMonth));

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00b9cd]">Accessing Attendance Registry...</div>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-[1700px] mx-auto min-h-screen font-paperlogy mesh-bg">

            {/* Tactical Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 relative z-10 px-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Attendance <span className="text-transparent bg-clip-text bg-[#00b9cd]">Management</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic">Operational Presence History</p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <Button
                        onClick={() => handleActionRequest("check-in")}
                        disabled={isCheckedInToday || actionLoading}
                        variant={isCheckedInToday ? "outline" : "success"}
                        icon={isCheckedInToday ? CheckCircle : LogIn}
                    >
                        {isCheckedInToday ? "Uplink Secure" : "Initiate Uplink"}
                    </Button>
                    <Button
                        onClick={() => handleActionRequest("check-out")}
                        disabled={!isCheckedInToday || isCheckedOutToday || actionLoading}
                        variant={(!isCheckedInToday || isCheckedOutToday) ? "outline" : "destructive"}
                        icon={isCheckedOutToday ? CheckCircle : LogOut}
                    >
                        {isCheckedOutToday ? "Downlink Secure" : "Initiate Downlink"}
                    </Button>
                </div>
            </div>

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <StatCard 
                    title="Temporal Week Index" 
                    value={weeklyStats.formatted} 
                    subValue={`${weeklyStats.daysWorked || 0} PHASES`}
                    icon={TrendingUp} 
                    color="teal" 
                />
                <StatCard 
                    title="Monthly Total Accumulation" 
                    value={monthlyStats.formatted} 
                    subValue={`${monthlyStats.daysWorked || 0} PHASES`}
                    icon={Calendar} 
                    color="amber" 
                />
            </div>

            {/* Register Registry */}
            <Card title="Attendance Registry" icon={History} actions={
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-2 rounded-10 border border-slate-100 dark:border-white/5 shadow-inner">
                    <Filter size={14} className="text-slate-400 ml-2" />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-slate-700 dark:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 focus:outline-none cursor-pointer"
                    />
                </div>
            }>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead className="hidden sm:table-header-group">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                                <th className="px-8 pb-4">Temporal Node</th>
                                <th className="px-8 pb-4">Uplink Stat</th>
                                <th className="px-8 pb-4">Downlink Stat</th>
                                <th className="px-8 pb-4 text-center">Uptime</th>
                                <th className="px-8 pb-4 text-center">Verdict</th>
                                <th className="px-8 pb-4 text-right">Geospatial</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAttendance.length > 0 ? (
                                filteredAttendance.map((record) => (
                                    <tr key={record.id} className="group transition-all duration-300">
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 rounded-10-[2rem] border-y-2 border-l-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-10 shadow-sm text-[#00b9cd] group-hover:scale-110 transition-transform">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                        {new Date(record.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">{new Date(record.date).getFullYear()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-10 bg-emerald-500 animate-pulse"></div>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-widest">
                                                    {record.check_in ? formatTime(record.check_in) : "--:--"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-10 bg-rose-500"></div>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-widest">
                                                    {record.check_out ? formatTime(record.check_out) : "--:--"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all text-center shadow-sm">
                                            <div className="inline-block px-4 py-2 bg-white dark:bg-slate-900 rounded-10 shadow-sm">
                                                <span className="text-xs font-black text-[#00b9cd] tracking-tighter uppercase italic">
                                                    {calculateHours(record.check_in, record.check_out)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-y-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all text-center shadow-sm">
                                            <Badge variant={record.status}>{record.status}</Badge>
                                        </td>
                                        <td className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 rounded-10-[2rem] border-y-2 border-r-2 border-transparent group-hover:border-[#00b9cd]/20 transition-all text-right shadow-sm">
                                            <button 
                                                onClick={() => { setCurrentLocation({ latitude: record.check_in_latitude, longitude: record.check_in_longitude }); setCurrentLocationName(record.check_in_location); setShowLocationModal(true); }}
                                                className="p-3 bg-white dark:bg-slate-900 text-slate-400 hover:text-[#00b9cd] hover:shadow-lg rounded-10 transition-all border border-slate-100 dark:border-white/5 shadow-sm"
                                            >
                                                <MapPin size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-20">
                                            <RefreshCw size={64} className="mb-6 animate-spin-slow text-[#00b9cd]" />
                                            <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-400 italic">No Registry Data Scanned</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Location Synchronization Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center z-[100] p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-10 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] border-2 border-[#00b9cd]/30 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center group">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tighter">
                                <MapPin className="text-[#00b9cd] animate-bounce" /> SPATIAL LOCK-ON
                            </h3>
                            <button onClick={() => setShowLocationModal(false)} className="p-3 hover:bg-rose-500 hover:text-white rounded-10 transition-all text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            {currentLocation && currentLocation.latitude && (
                                <div className="space-y-6">
                                    <div className="h-64 rounded-10 overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative">
                                        <MapContainer center={[currentLocation.latitude, currentLocation.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false} dragging={false}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[currentLocation.latitude, currentLocation.longitude]} />
                                        </MapContainer>
                                        <div className="absolute inset-0 pointer-events-none ring-inset ring-8 ring-[#00b9cd]/20"></div>
                                    </div>
                                    <div className="p-8 bg-[#00b9cd]/5 rounded-10 border-2 border-[#00b9cd]/10 flex items-center gap-6 shadow-inner">
                                        <div className="p-4 bg-[#00b9cd] rounded-10 text-white shadow-[0_10px_20px_-5px_rgba(0,185,205,0.5)]">
                                            <MapPin size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-[#00b9cd] uppercase tracking-[0.4em] mb-1 italic">Spatial Signature Identified</p>
                                            <p className="text-lg font-black text-slate-800 dark:text-white truncate uppercase tracking-tighter">{currentLocationName || "Syncing Vector..."}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-blue-500/5 rounded-10 border-2 border-dashed border-[#00b9cd]/20 flex items-start gap-4">
                                <Info className="text-[#00b9cd] mt-1 shrink-0" size={20} />
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Precision metrics and spatial coordinate archiving are required for operational validation. Link encryption is active.
                                </p>
                            </div>
                        </div>

                        {pendingAction && (
                            <div className="p-10 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex gap-6">
                                <Button variant="outline" onClick={() => setShowLocationModal(false)} className="flex-1">ABORT OPS</Button>
                                <Button 
                                    onClick={proceedWithAction} 
                                    disabled={actionLoading}
                                    variant={pendingAction === 'check-in' ? 'success' : 'destructive'}
                                    className="flex-1 shadow-2xl"
                                >
                                    {actionLoading ? 'DOWNLINKING...' : `CONFIRM ${pendingAction === 'check-in' ? 'UPLINK' : 'DOWNLINK'}`}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
