import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { STORAGE_URL } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatTime, calculateHours, calculateWeeklyStats, calculateMonthlyStats } from "../../utils/dateUtils";
import { reverseGeocode } from "../../utils/locationUtils";
import FaceEnrollment from "../../components/FaceEnrollment";
import { useGlobalUI } from "../../context/GlobalUIContext";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    Users, Briefcase, Building2, ShieldCheck, Activity, 
    Server, Database, HardDrive, Cpu, RefreshCw, 
    AlertTriangle, CheckCircle, Clock, Calendar, 
    MapPin, User, LogIn, LogOut, FileText, Bell, CheckSquare,
    TrendingUp, Award, Zap, ChevronRight, ExternalLink,
    PieChart, Fingerprint, X
} from 'lucide-react';

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Icon size={20} /></div>}
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
                {actions}
            </div>
        )}
        <div className="p-8 flex-1 flex flex-col">{children}</div>
    </div>
);

const StatCard = ({ title, value, icon: Icon, color = "teal", loading }) => {
    const colors = {
        teal: "text-[#00b9cd] bg-[#00b9cd]/10",
        amber: "text-amber-500 bg-amber-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        rose: "text-rose-500 bg-rose-500/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
    };

    return (
        <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md border-2 border-transparent hover:border-[#00b9cd] transition-all duration-500 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${colors[color].split(' ')[1]} rounded-10 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex items-center gap-6 relative z-10">
                <div className={`p-4 ${colors[color]} rounded-10 group-hover:bg-opacity-100 group-hover:text-white transition-all duration-500`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                    <div className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {loading ? <div className="h-8 w-20 bg-slate-100 dark:bg-white/5 animate-pulse rounded-10" /> : value}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Button = ({ children, onClick, disabled, variant = "primary", className, icon: Icon, type = "button" }) => {
    const variants = {
        primary: "bg-[#00b9cd] text-white hover:bg-blue-600 shadow-md transform hover:-translate-y-0.5",
        outline: "bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]",
        ghost: "bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
        danger: "bg-rose-500 text-white hover:bg-rose-600",
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

// --- Dashboard Sub-Components ---

const DashboardHeader = ({ profile }) => {
    const today = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10 px-4">
            <div className="flex items-center gap-8">
                <div className="relative">
                    <div className="h-24 w-24 rounded-10 bg-gradient-to-br from-[#00b9cd] to-blue-600 p-1 shadow-2xl transform hover:rotate-0 transition-transform duration-500">
                        <div className="h-full w-full rounded-10 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                            {profile?.employee?.profile_photo ? (
                                <img src={profile.employee.profile_photo.startsWith('http') ? profile.employee.profile_photo : `${STORAGE_URL}/${profile.employee.profile_photo}`} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User size={48} className="text-[#00b9cd]" />
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white dark:border-slate-900 w-8 h-8 rounded-10 shadow-lg flex items-center justify-center text-white">
                        <ShieldCheck size={14} />
                    </div>
                </div>
                <div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
                        Dashboard <span className="text-transparent bg-clip-text bg-[#00b9cd]">Overview</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 italic">
                            <span>{profile?.name || "OPERATIVE"}</span>
                            <span>•</span>
                            <span>{profile?.employee?.designation?.name || "REDACTED"}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="hidden xl:flex items-center gap-4 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-8 py-5 rounded-10 shadow-lg border border-slate-100 dark:border-white/5">
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-[#00b9cd] tracking-[0.4em] mb-1">Temporal Sync</div>
                    <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter italic">
                        <Calendar size={18} className="text-[#00b9cd]" /> {today}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AttendanceActionCard = ({ attendance, onCheckIn, onCheckOut, loading }) => {
    const isCheckedIn = !!attendance?.check_in;
    const isCheckedOut = !!attendance?.check_out;
    const status = attendance?.status || "STANDBY";

    return (
        <Card className="h-full" title="Mission Session" icon={Clock} actions={
            <span className={`px-5 py-2 rounded-10 text-[9px] font-black uppercase tracking-[0.3em] border-2 transition-all duration-500 ${status === "Present"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                }`}>
                {status}
            </span>
        }>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-2">
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-transparent hover:border-emerald-500/20 transition-all group">
                    <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-2 flex items-center gap-2">
                        <LogIn size={14} className="text-emerald-500" /> Uplink
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">
                        {attendance?.check_in ? formatTime(attendance.check_in) : "--:--"}
                    </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-transparent hover:border-rose-500/20 transition-all group">
                    <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-2 flex items-center gap-2">
                        <LogOut size={14} className="text-rose-500" /> Downlink
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">
                        {attendance?.check_out ? formatTime(attendance.check_out) : "--:--"}
                    </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-transparent hover:border-[#00b9cd]/20 transition-all group">
                    <div className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Activity size={14} className="text-[#00b9cd]" /> Uptime
                    </div>
                    <div className="text-2xl font-black text-[#00b9cd] tracking-widest">
                        {calculateHours(attendance?.check_in, attendance?.check_out)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-auto">
                <Button
                    onClick={onCheckIn}
                    disabled={loading || isCheckedIn}
                    variant={isCheckedIn ? "ghost" : "success"}
                    className="py-6 !rounded-10"
                    icon={isCheckedIn ? CheckCircle : LogIn}
                >
                    {isCheckedIn ? "Protocols Online" : "Initiate Uplink"}
                </Button>
                <Button
                    onClick={onCheckOut}
                    disabled={loading || !isCheckedIn || isCheckedOut}
                    variant={(!isCheckedIn || isCheckedOut) ? "ghost" : "danger"}
                    className="py-6 !rounded-10"
                    icon={isCheckedOut ? CheckCircle : LogOut}
                >
                    {isCheckedOut ? "Terminal Safe" : "Terminate Session"}
                </Button>
            </div>
        </Card>
    );
};

// --- Main Page Component ---

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useGlobalUI();

    const [data, setData] = useState({
        profile: null,
        attendance: null,
        announcements: [],
        leaves: [],
        payslips: [],
        tasks: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [currentLocationName, setCurrentLocationName] = useState("");
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); 

    const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
    const [faceEnrollmentSuccess, setFaceEnrollmentSuccess] = useState(false);

    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;

    const fetchDashboardData = async () => {
        try {
            let profileData = null;
            try { const profileRes = await api.get("/user"); profileData = profileRes.data; } catch (e) { console.error("Profile fetch error", e); }

            let announcementsData = [];
            try { const announcementsRes = await api.get("/announcements"); announcementsData = announcementsRes.data.data || announcementsRes.data; } catch (e) { console.error("Announcements fetch error", e); }

            let leavesData = [];
            try { const leavesRes = await api.get("/my-leaves"); leavesData = leavesRes.data; } catch (e) { console.error("Leaves fetch error", e); }
            
            let payslipsData = [];
            try { const payslipsRes = await api.get("/my-payslips"); payslipsData = payslipsRes.data; } catch (e) { console.error("Payslips fetch error", e); }

            let tasksData = [];
            try { const tasksRes = await api.get("/tasks"); tasksData = tasksRes.data; } catch (e) { console.error("Tasks fetch error", e); }

            let attendanceData = null;
            try { 
                const attendanceRes = await api.get("/my-attendance");
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                const attendanceList = attendanceRes.data.data || attendanceRes.data;
                attendanceData = Array.isArray(attendanceList) ? attendanceList.find(a => a.date === todayStr) : null;
            } catch (e) { console.error("Attendance fetch error", e); }

            setData({
                profile: profileData,
                attendance: attendanceData,
                announcements: Array.isArray(announcementsData) ? announcementsData.slice(0, 3) : [],
                leaves: Array.isArray(leavesData) ? leavesData.slice(0, 5) : [],
                payslips: Array.isArray(payslipsData) ? payslipsData.slice(0, 3) : [],
                tasks: Array.isArray(tasksData) ? tasksData : []
            });
            setError(null);
        } catch (err) {
            console.error("Dashboard error:", err);
            setError("Tactical link failed. Please re-authenticate.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        document.body.style.overflow = showLocationModal ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [showLocationModal]);

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!isSecureContext) {
                reject(new Error('Location requires a secure context (HTTPS/Localhost).'));
                return;
            }
            if (!navigator.geolocation) {
                reject(new Error("Uplink unsupported by client browser."));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setCurrentLocation(loc);
                    resolve(loc);
                },
                (err) => {
                    reject(new Error("Location signal jammed. Please authorize terminal GPS."));
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
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';

        let deviceId = localStorage.getItem('device_id') || ('dev_' + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('device_id', deviceId);

        return { device_id: deviceId, device_type: deviceType, browser: browser };
    };

    const handleAttendanceAction = async (type) => {
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
            let payload, endpoint;

            if (pendingAction === "check-in") {
                payload = { latitude: currentLocation.latitude, longitude: currentLocation.longitude, location: currentLocationName, force_checkin: true, ...deviceInfo };
                endpoint = "/my-attendance/check-in";
            } else {
                payload = { check_out_latitude: currentLocation.latitude, check_out_longitude: currentLocation.longitude, check_out_location: currentLocationName };
                endpoint = "/my-attendance/check-out";
            }

            await api.post(endpoint, payload);
            await fetchDashboardData();
            addToast(`${pendingAction.toUpperCase()} SEQUENCE COMPLETE`, "success");
        } catch (err) {
            addToast(err?.response?.data?.message || "TRANSMISSION ERROR", "error");
        } finally {
            setActionLoading(false);
            setPendingAction(null);
        }
    };

    const handleFaceEnrolled = async () => {
        try {
            setFaceEnrollmentSuccess(true);
            setShowFaceEnrollment(false);
            addToast("IDENTITY SIGNATURE ARCHIVED", "success");
            await fetchDashboardData();
        } catch (err) {
            addToast("BIOMETRIC CAPTURE ERROR", "error");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-slate-950 font-paperlogy">
                <div className="w-16 h-16 border-4 border-[#00b9cd]/20 border-t-[#00b9cd] rounded-10 animate-spin mb-4"></div>
                <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00b9cd] animate-pulse">Establishing Tactical Link...</div>
            </div>
        );
    }

    const totalPoints = data.tasks.reduce((acc, t) => acc + (t.status === 'completed' ? (t.points || 0) : 0), 0);

    return (
        <div className="p-10 max-w-[1700px] mx-auto min-h-screen font-paperlogy mesh-bg">
            <DashboardHeader profile={data.profile} />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 mb-10">
                <StatCard title="Operative Rank" value={data.profile?.employee?.designation?.name || "—"} icon={Award} color="amber" />
                <StatCard title="Tactical EXP" value={totalPoints.toLocaleString()} icon={Zap} color="teal" />
                <StatCard title="Active Missions" value={data.tasks.filter(t => t.status !== 'completed').length} icon={TrendingUp} color="blue" />
                <StatCard title="Comms Node" value={data.announcements.length} icon={Bell} color="rose" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-10">
                <div className="xl:col-span-2">
                    <AttendanceActionCard
                        attendance={data.attendance}
                        onCheckIn={() => handleAttendanceAction("check-in")}
                        onCheckOut={() => handleAttendanceAction("check-out")}
                        loading={actionLoading}
                    />
                </div>
                
                <Card title="Identification" icon={Fingerprint}>
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-4">
                        {data.profile?.face_descriptor && !faceEnrollmentSuccess ? (
                            <>
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-10 flex items-center justify-center text-emerald-500 mb-6 border-2 border-emerald-500/20 shadow-lg">
                                    <ShieldCheck size={48} />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Signature Verified</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Biometric identity link is active and secure.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] mb-6 border-2 border-[#00b9cd]/20 animate-pulse">
                                    <Fingerprint size={48} />
                                </div>
                                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">Enroll Identity</h4>
                                <Button variant="primary" onClick={() => setShowFaceEnrollment(true)} icon={Zap}>Start Capture</Button>
                            </>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                {/* Missions */}
                <Card title="Active Assignments" icon={CheckSquare} actions={<Button variant="ghost" className="!px-3 !py-2" onClick={() => navigate("/employee/tasks")} icon={ChevronRight}>Full Ops</Button>}>
                    <div className="space-y-4">
                        {data.tasks.filter(t => t.status !== 'completed').length > 0 ? (
                            data.tasks.filter(t => t.status !== 'completed').slice(0, 3).map(task => (
                                <div key={task.id} className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-transparent hover:border-[#00b9cd]/30 transition-all group flex justify-between items-center cursor-pointer" onClick={() => navigate("/employee/tasks")}>
                                    <div className="flex-1 mr-4">
                                        <div className="font-black text-slate-800 dark:text-white group-hover:text-[#00b9cd] transition-colors uppercase tracking-tight truncate">{task.title}</div>
                                        <div className="text-[9px] font-black text-slate-400 mt-2 flex items-center gap-3 uppercase tracking-widest">
                                            <span className={`px-2 py-0.5 rounded-10 ${task.priority === 'urgent' ? 'text-rose-500 bg-rose-500/10' : 'text-blue-500 bg-blue-500/10'}`}>{task.priority}</span>
                                            <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'NO DEADLINE'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-[#00b9cd]">+{task.points}</div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">EXP</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-300 dark:text-white/10 italic">
                                <Zap size={40} className="mb-4 opacity-20" />
                                <span className="text-[10px] uppercase font-black tracking-widest">No active tasks detected</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Leaves */}
                <Card title="Leave Forecast" icon={Calendar} actions={<Button variant="ghost" className="!px-3 !py-2" onClick={() => navigate("/employee/leaves")} icon={ChevronRight}>Registry</Button>}>
                    <div className="space-y-4">
                        {data.leaves.length > 0 ? (
                            data.leaves.slice(0, 3).map(leave => (
                                <div key={leave.id} className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-transparent hover:border-emerald-500/20 transition-all flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-10 bg-[#00b9cd] rounded-10 group-hover:scale-y-125 transition-transform"></div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{leave.leave_type?.name || "LEAVE"}</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                {new Date(leave.start_date).toLocaleDateString('default', { month: 'short', day: 'numeric' })} - {new Date(leave.end_date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-10 text-[8px] font-black uppercase tracking-[0.2em] border ${leave.status === "Approved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : leave.status === "Rejected" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                                        {leave.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-300 dark:text-white/10 italic">
                                <Activity size={40} className="mb-4 opacity-20" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Presence 100% Operational</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Comms */}
                <Card title="Broadcasts" icon={Bell} actions={<Button variant="ghost" className="!px-3 !py-2" onClick={() => navigate("/employee/announcements")} icon={ChevronRight}>Full Feed</Button>}>
                    <div className="space-y-4">
                        {data.announcements.length > 0 ? (
                            data.announcements.slice(0, 3).map(ann => (
                                <div key={ann.id} className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-transparent hover:border-[#00b9cd]/30 transition-all group cursor-pointer" onClick={() => navigate("/employee/announcements")}>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-[#00b9cd] transition-colors">{ann.title}</h4>
                                    <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                        <span>INTEL RELEASE</span>
                                        <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-300 dark:text-white/10 italic">
                                <RefreshCw size={40} className="mb-4 opacity-20 animate-spin-slow" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Syncing with Central...</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Location Check Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-10 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] border-2 border-[#00b9cd]/30 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="p-10 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tighter">
                                <MapPin className="text-[#00b9cd] animate-bounce" /> SPATIAL LOCK-ON
                            </h3>
                            <button onClick={() => setShowLocationModal(false)} className="p-3 hover:bg-rose-500 hover:text-white rounded-10 transition-all text-slate-400"><X size={24} /></button>
                        </div>

                        <div className="p-10 space-y-8">
                            {currentLocation && (
                                <div className="space-y-6">
                                    <div className="h-64 rounded-10 overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative">
                                        <MapContainer center={[currentLocation.latitude, currentLocation.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false} dragging={false}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[currentLocation.latitude, currentLocation.longitude]} />
                                        </MapContainer>
                                        <div className="absolute inset-0 pointer-events-none ring-inset ring-8 ring-[#00b9cd]/20"></div>
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-10 border-2 border-[#00b9cd]/10 flex items-center gap-4">
                                        <div className="p-3 bg-[#00b9cd] rounded-10 text-white shadow-lg"><MapPin size={20} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-[#00b9cd] uppercase tracking-[0.4em] mb-1">Geospatial Tag</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white truncate uppercase tracking-tighter">{currentLocationName || "Syncing Address..."}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-[#00b9cd]/5 rounded-10 border-2 border-dashed border-[#00b9cd]/30">
                                <div className="flex items-center gap-4 mb-2 text-[#00b9cd]">
                                    <ShieldCheck size={20} />
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Secure Transmission</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed italic">
                                    Operational coordinates will be encrypted and logged to the central ledger for verification.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex gap-6">
                            <Button variant="ghost" onClick={() => setShowLocationModal(false)} className="flex-1 py-8">Abort</Button>
                            <Button 
                                onClick={proceedWithAction} 
                                disabled={actionLoading} 
                                variant={pendingAction === 'check-in' ? 'success' : 'danger'}
                                className="flex-1 py-8 shadow-[0_20px_40px_-10px_rgba(0,185,205,0.3)]"
                            >
                                {actionLoading ? 'CONNECTING...' : `CONFIRM ${pendingAction === 'check-in' ? 'UPLINK' : 'DOWNLINK'}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Face Enrollment Modal */}
            {showFaceEnrollment && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[110] p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-10 max-w-4xl w-full shadow-[0_0_120px_rgba(0,185,205,0.2)] border-2 border-[#00b9cd]/50 overflow-hidden lg:h-[80vh] flex flex-col">
                        <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                                <Fingerprint size={40} className="text-[#00b9cd] animate-pulse" /> BIOMETRIC ARCHIVE
                            </h3>
                            <button onClick={() => setShowFaceEnrollment(false)} className="p-4 hover:bg-rose-500 hover:text-white rounded-10 transition-all text-slate-400"><X size={32} /></button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                             <FaceEnrollment
                                email={data.profile?.email}
                                onFaceEnrolled={handleFaceEnrolled}
                                onClose={() => setShowFaceEnrollment(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
