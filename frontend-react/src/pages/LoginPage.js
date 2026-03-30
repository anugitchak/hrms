import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { reverseGeocode } from "../utils/locationUtils";
import LiquidChrome from "../components/LiquidChrome.jsx";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Camera, AlertTriangle, Lightbulb, MapPin, CheckCircle, X } from "lucide-react";

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme } = useTheme();
    const [formValues, setFormValues] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isQuickCheckIn, setIsQuickCheckIn] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showMap, setShowMap] = useState(false);
    const [checkInLocation, setCheckInLocation] = useState(null);
    const [checkInLocationName, setCheckInLocationName] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showFaceAuth, setShowFaceAuth] = useState(false);
    const [faceAuthMode, setFaceAuthMode] = useState('login'); // 'login' or 'enroll'
    const [stream, setStream] = useState(null);
    const [faceAuthLoading, setFaceAuthLoading] = useState(false);
    const faceAuthLoadingRef = useRef(false);
    const [isQuickCheckInFlow, setIsQuickCheckInFlow] = useState(false);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Cleanup webcam stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Attach stream to video element
    useEffect(() => {
        const video = document.getElementById('faceAuthVideo');
        if (video && stream && showFaceAuth) {
            video.srcObject = stream;
        }
    }, [stream, showFaceAuth]);

    // Note: face-api.js no longer used. Face recognition is handled server-side
    // by the Python dlib microservice via AuthController.

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTimezone = (date) => {
        const tzName = date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
        return tzName;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!formValues.email || !formValues.password) {
            setError("Email and password are required.");
            return;
        }

        try {
            setIsLoading(true);
            const { data } = await api.post("/login", formValues);

            if (!data?.token) {
                setError("Invalid response from server.");
                return;
            }

            localStorage.setItem("token", data.token);

            if (data.force_password_change) {
                if (data.user_id) localStorage.setItem("temp_user_id", data.user_id);
                navigate("/change-password", { replace: true });
                return;
            }

            if (data.user) login(data.token, data.user);
            navigate("/", { replace: true });
        } catch (err) {
            const message = err?.response?.data?.message || "Failed to login. Please try again.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickCheckIn = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setShowMap(false);
        setCheckInLocation(null);

        // Start face authentication flow for quick check-in
        setIsQuickCheckInFlow(true);
        await handleFaceAuth(false);
    };

    const handleFaceAuth = async (isEnroll = false) => {
        setShowFaceAuth(true);
        setFaceAuthMode(isEnroll ? 'enroll' : 'login');
        setError("");
        setSuccessMessage("");
        try {
            // Start webcam
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            setStream(mediaStream);
        } catch (err) {
            setError("Camera access denied. Please enable camera permissions.");
            setShowFaceAuth(false);
            setIsQuickCheckInFlow(false);
        }
    };

    const completeQuickCheckIn = async (token, user) => {
        try {
            setIsLoading(true);
            setIsQuickCheckIn(true);

            // Check if user is employee (role 4)
            if (user?.role_id !== 4) {
                setError("Quick Check-In is only available for employees.");
                setIsQuickCheckInFlow(false);
                return;
            }

            // Check if already checked in today
            try {
                const attendanceResponse = await api.get("/my-attendance", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const today = new Date().toISOString().split("T")[0];
                const todayRecord = attendanceResponse.data?.find((record) => record.date === today);

                if (todayRecord?.check_in) {
                    setSuccessMessage(`You are already checked in today at ${todayRecord.check_in}!`);
                    // Redirect after 2 seconds
                    setTimeout(() => { navigate("/employee/dashboard", { replace: true }); }, 2000);
                    return;
                }
            } catch (err) {
                console.error("Error checking today's attendance:", err); // Continue with check-in if we can't verify
            }

            // Step 1: Get location
            const location = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error("Geolocation is not supported"));
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
                    (error) => reject(new Error("Location access denied")),
                    { timeout: 10000, enableHighAccuracy: true }
                );
            });

            // Show map if location obtained
            if (location) {
                setCheckInLocation(location);
                setShowMap(true);
                reverseGeocode(location.latitude, location.longitude).then(name => setCheckInLocationName(name));
            }

            // Get device info
            const ua = navigator.userAgent;
            let deviceType = 'Desktop';
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                deviceType = 'Tablet';
            } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                deviceType = 'Mobile';
            }

            let browser = 'Unknown';
            if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
            else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
            else if (ua.indexOf('Safari') > -1) browser = 'Safari';
            else if (ua.indexOf('Edge') > -1) browser = 'Edge';

            let deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('device_id', deviceId);
            }

            // Step 2: Check-in with force flag and device info
            const checkInData = {
                latitude: location.latitude,
                longitude: location.longitude,
                force_checkin: true,
                device_id: deviceId,
                device_type: deviceType,
                browser: browser
            };

            await api.post("/my-attendance/check-in", checkInData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Success!
            setSuccessMessage(`Checked in successfully at ${new Date().toLocaleTimeString()}!`);
            // Redirect after 3 seconds
            setTimeout(() => { navigate("/employee/dashboard", { replace: true }); }, 3000);

        } catch (err) {
            console.error("Quick check-in error:", err);
            const message = err?.response?.data?.message || "Check-in failed. Please try again.";
            setError(message);
            setShowMap(false);
        } finally {
            setIsLoading(false);
            setIsQuickCheckIn(false);
            setIsQuickCheckInFlow(false);
        }
    };

    /**
     * captureFaceAuth - v2 (Python dlib service)
     * Captures raw image from camera and sends to backend.
     * No more face-api.js descriptor extraction on the client.
     * The Python microservice handles all face processing server-side.
     */
    const captureFaceAuth = async (isAuto = false) => {
        if (!stream) {
            if (!isAuto) setError('Camera is not ready. Please allow camera access and try again.');
            return;
        }

        const video = document.getElementById('faceAuthVideo');
        if (!video || video.readyState < 2) {
            if (!isAuto) setError('Video is still loading. Please wait a second and try again.');
            return;
        }

        setFaceAuthLoading(true);
        faceAuthLoadingRef.current = true;
        if (!isAuto) setError('');

        try {
            // Capture a snapshot of the video frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Convert to JPEG blob — the Python service handles face detection
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));

            if (!blob) {
                throw new Error('Failed to capture image from camera');
            }

            if (faceAuthMode === 'enroll') {
                // Enrollment mode
                if (!formValues.email) {
                    setError('Please enter your email first before enrolling face authentication.');
                    closeFaceAuth();
                    return;
                }
                const formData = new FormData();
                formData.append('email', formValues.email);
                formData.append('face_image', blob, 'face.jpg');

                const { data } = await api.post('/auth/enroll-face', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 30000,
                });
                setSuccessMessage('✓ Face enrolled! You can now log in using face authentication.');
                closeFaceAuth();
            } else {
                // Login mode — send raw image to backend
                const formData = new FormData();
                formData.append('face_image', blob, 'face.jpg');

                const { data } = await api.post('/auth/login-face', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 30000,
                });

                if (!data?.token) {
                    if (!isAuto) {
                        setError('Face not recognized. Please try again or use email/password login.');
                        closeFaceAuth();
                    }
                    return;
                }

                localStorage.setItem('token', data.token);

                if (data.force_password_change) {
                    if (data.user_id) localStorage.setItem('temp_user_id', data.user_id);
                    navigate('/change-password', { replace: true });
                    closeFaceAuth();
                    return;
                }

                if (data.user) login(data.token, data.user);
                setSuccessMessage(`Face authentication successful! (${data.confidence ?? ''}% confidence)`);
                closeFaceAuth();

                if (isQuickCheckInFlow) {
                    await completeQuickCheckIn(data.token, data.user);
                } else {
                    setTimeout(() => { navigate('/', { replace: true }); }, 1000);
                }
            }
        } catch (err) {
            // ── Face service offline ──
            if (err?.response?.status === 503) {
                setError('Face recognition service is offline. Please use email/password login.');
                setIsQuickCheckInFlow(false);
                // Auto-close face modal after 3 seconds and redirect to email login
                setTimeout(() => {
                    closeFaceAuth();
                    setError('Face recognition service is offline. Please use your email and password to sign in.');
                }, 3000);
                return;
            }
            if (!isAuto) {
                const message = err?.response?.data?.error === 'no_face_detected'
                    ? 'No face detected. Try moving to better lighting or closer to the camera.'
                    : err?.response?.data?.message || 'Face authentication failed. Please try again.';
                setError(message);
                setIsQuickCheckInFlow(false);
            }
        } finally {
            setFaceAuthLoading(false);
            faceAuthLoadingRef.current = false;
        }
    };

    // Auto-capture loop while face auth modal is open for login
    useEffect(() => {
        let interval;
        if (showFaceAuth && faceAuthMode !== 'enroll' && stream) {
            interval = setInterval(() => {
                const video = document.getElementById('faceAuthVideo');
                if (!faceAuthLoadingRef.current && video && video.readyState >= 2) {
                    captureFaceAuth(true); // isAuto = true
                }
            }, 2000); // 2 second polling
        }
        return () => clearInterval(interval);
    }, [showFaceAuth, faceAuthMode, stream]);

    const closeFaceAuth = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowFaceAuth(false);
        setFaceAuthLoading(false);
        setIsQuickCheckInFlow(false);
    };

    return (
        <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
            {/* 🔹 LIQUID CHROME BACKGROUND */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                <LiquidChrome baseColor={[0.92, 0.94, 0.98]} speed={0.8} amplitude={0.35} interactive={false} />
            </div>

            {/* 🔹 Background image layer */}
            <div style={{
                position: "absolute", inset: 0, zIndex: 1, 
                backgroundColor: theme === 'dark' ? "#0f172a" : "#f6f8fb",
                backgroundImage: `url('${theme === 'dark' ? "/darkimage.jpg" : "/bg1.jpg"}')`,
                backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", 
                filter: "saturate(105%)",
            }} />

            {/* 🔹 Soft contrast overlay */}
            <div style={{ 
                position: "absolute", inset: 0, zIndex: 2, 
                background: theme === 'dark' 
                    ? "linear-gradient(120deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.45) 45%, rgba(15,23,42,0.25) 70%)"
                    : "linear-gradient(120deg, rgba(255,255,255,0.75) 0%, rgba(245,249,255,0.35) 45%, rgba(245,249,255,0.15) 70%)", 
            }} />

            {/* 🔹 Logo top-left */}
            <div style={{ position: "absolute", top: "22px", left: "28px", zIndex: 20, display: "flex", alignItems: "center", gap: "10px", padding: "6px 8px", borderRadius: "12px", background: "transparent", boxShadow: "none", border: "none" }} >
                <img
                    src={theme === 'dark' ? "/logo-dark.png" : "/logo-light.png"}
                    alt="HRMS Logo"
                    style={{ width: "240px", height: "140px", objectFit: "contain", borderRadius: "12px" }}
                />
            </div>

            {/* 🔹 FOREGROUND: overlapping form on hero image */}
            <div style={{ position: "relative", zIndex: 3, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "40px 48px" }} >
                <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-md p-10 lg:p-12 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out w-full max-w-[520px] z-10">
                    {/* Logo/Brand Section */}
                    <div style={{ marginBottom: "32px" }}>
                        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: theme === 'dark' ? "#ffffff" : "#111827", letterSpacing: "-0.02em" }}>Welcome Back</h1>
                        <p style={{ fontSize: "15px", color: theme === 'dark' ? "rgba(255,255,255,0.7)" : "#6b7280", lineHeight: "1.5" }}>Sign in to access your HRMS dashboard</p>

                        {/* Digital Clock */}
                        <div style={{ marginTop: "16px", padding: "8px 14px", background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(37,99,235,0.06))", borderRadius: "8px", border: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 2px 8px rgba(59,130,246,0.06)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                                {/* <span style={{ fontSize:"14px" }}>🕐</span> */}
                                <div style={{ fontSize: "18px", fontWeight: 700, color: "#1c93e1ff", letterSpacing: "0.5px", fontFamily: "monospace" }}>
                                    {formatTime(currentTime)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === 'dark' ? "rgba(255,255,255,0.9)" : "#374151" }}>Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={formValues.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 rounded-10 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white transition-all shadow-inner"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === 'dark' ? "rgba(255,255,255,0.9)" : "#374151" }}>Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    value={formValues.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    placeholder="Enter your password"
                                    required
                                className="w-full px-4 py-3 pr-16 rounded-10 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-[#00b9cd]/20 focus:border-[#00b9cd] font-medium text-slate-900 dark:text-white transition-all shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", fontSize: "14px", color: "#6b7280", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{ padding: "14px 16px", backgroundColor: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "14px", fontWeight: 500 }}>{error}</div>
                        )}

                        {successMessage && (
                            <div style={{ padding: "14px 16px", backgroundColor: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "8px", color: "#16a34a", fontSize: "14px", fontWeight: 500 }}>{successMessage}</div>
                        )}

                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md h-[50px] uppercase tracking-widest`}
                            >
                                {isLoading && !isQuickCheckIn ? "Logging in..." : "Sign In"}
                            </button>
                            <button
                                type="button"
                                onClick={handleQuickCheckIn}
                                disabled={isLoading}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-black text-white bg-[#f06464] hover:bg-[#f06464]/80 px-6 py-3 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#f06464]/30 dark:hover:border-[#f06464]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md h-[50px] uppercase tracking-widest`}
                            >
                                {isLoading && isQuickCheckIn ? "Checking in..." : "Quick Check-In"}
                            </button>
                        </div>

                        <p style={{ marginTop: "12px", fontSize: "12px", color: theme === 'dark' ? "rgba(255,255,255,0.5)" : "#6b7280", textAlign: "center", lineHeight: "1.5" }}>
                            Use <strong>Quick Check-In</strong> for fast attendance marking during rush hours
                        </p>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "20px", textAlign: "center", background: "linear-gradient(to top, rgba(0,0,0,0.05), transparent)" }}>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: 500 }}>
                    © 2026 Mind & Matter. All rights reserved.
                </p>
            </div>

            {/* Map Popup Modal */}
            {showMap && checkInLocation && (
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)", padding: "20px",
                        animation: "fadeIn 0.3s ease",
                    }}
                    onClick={() => setShowMap(false)}
                >
                    <div
                        style={{
                            width: "100%", maxWidth: "700px",
                            background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))",
                            borderRadius: "20px", overflow: "hidden",
                            boxShadow: "0 25px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.3)",
                            animation: "slideUp 0.4s ease",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "20px 24px", background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "white", display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <MapPin className="w-6 h-6 text-emerald-100" />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Check-In Location</h3>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                                        Verified at {new Date().toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMap(false)}
                                style={{
                                    background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px",
                                    color: "white", fontSize: "24px", width: "36px", height: "36px", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.3)"; }}
                                onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.2)"; }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Map */}
                        <div style={{ height: "450px", width: "100%", position: "relative" }}>
                            <MapContainer
                                center={[checkInLocation.latitude, checkInLocation.longitude]}
                                zoom={16}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[checkInLocation.latitude, checkInLocation.longitude]}>
                                    <Popup>
                                        <strong>Your Check-In Location</strong><br />
                                        {checkInLocationName || 'Resolving location...'}<br />
                                        Time: {new Date().toLocaleTimeString()}
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>

                        {/* Footer with coordinates */}
                        <div
                            style={{
                                padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb",
                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#6b7280", flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: "#065f46", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><MapPin className="w-4 h-4" style={{ flexShrink: 0 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{checkInLocationName || 'Resolving location...'}</span></div>
                            </div>
                            <div
                                style={{
                                    padding: "6px 12px", background: "#d1fae5", color: "#065f46",
                                    borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                                    display: "flex", alignItems: "center", gap: "6px",
                                }}
                            >
                                <CheckCircle className="w-4 h-4" /> Location Verified
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Face Authentication Modal */}
            {showFaceAuth && (
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(12px)", padding: "20px",
                        animation: "fadeIn 0.3s ease",
                    }}
                    onClick={closeFaceAuth}
                >
                    <div
                        style={{
                            width: "100%", maxWidth: "600px",
                            background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))",
                            borderRadius: "20px", overflow: "hidden",
                            boxShadow: "0 25px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.3)",
                            animation: "slideUp 0.4s ease",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "20px 24px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                color: "white", display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                                        {faceAuthMode === 'enroll' ? 'Enroll Face Authentication' : (isQuickCheckInFlow ? 'Quick Check-In - Face Authentication' : 'Face Login')}
                                    </h3>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                                        {faceAuthMode === 'enroll' ? 'Position your face in the center and capture' : (isQuickCheckInFlow ? 'Authenticate your face to proceed with check-in' : 'Look at the camera to authenticate')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeFaceAuth}
                                style={{
                                    background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px",
                                    color: "white", fontSize: "24px", width: "36px", height: "36px", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.3)"; }}
                                onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.2)"; }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Video Feed */}
                        <div style={{ padding: "24px", background: "#000", position: "relative" }}>
                            <video
                                id="faceAuthVideo"
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: "100%", maxHeight: "400px", borderRadius: "12px", objectFit: "cover",
                                }}
                            />
                            {/* Face Detection Overlay */}
                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "280px", height: "360px", border: "3px solid rgba(139, 92, 246, 0.8)", borderRadius: "50%", pointerEvents: "none", boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)" }} />
                        </div>

                        {/* Footer with Actions */}
                        <div
                            style={{
                                padding: "20px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb",
                                display: "flex", flexDirection: "column", gap: "12px",
                            }}
                        >
                            <button
                                onClick={captureFaceAuth}
                                disabled={faceAuthLoading || !stream}
                                style={{
                                    width: "100%", padding: "14px 24px", borderRadius: "10px", border: "none",
                                    background: faceAuthLoading ? "linear-gradient(135deg, #9ca3af, #9ca3af)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                    color: "#ffffff", fontSize: "16px", fontWeight: 700,
                                    cursor: faceAuthLoading ? "not-allowed" : "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
                                }}
                            >
                                {faceAuthLoading ? (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                    </span>
                                ) : (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                        <Camera className="w-5 h-5" /> {faceAuthMode === 'enroll' ? 'Capture & Enroll' : 'Capture & Login'}
                                    </span>
                                )}
                            </button>
                            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                {faceAuthMode === 'enroll' ? <><AlertTriangle className="w-4 h-4 text-amber-500" /> Make sure to enter your email first before enrolling</> : <><Lightbulb className="w-4 h-4 text-amber-500" /> Ensure good lighting and look directly at the camera</>}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
};

export default LoginPage;