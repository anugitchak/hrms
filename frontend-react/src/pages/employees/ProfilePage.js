import { useState, useEffect, useRef } from "react";
import api, { STORAGE_URL } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { 
    Camera, Trash2, Loader2, User, Mail, Phone, 
    MapPin, Calendar, Briefcase, Building2, Clock,
    ShieldCheck, Activity, Award, Zap, Fingerprint,
    Info, ExternalLink, Globe, Layout, Shield, AlertTriangle
} from "lucide-react";

// --- Premium Standard Components ---

const Card = ({ children, className, icon: Icon, title, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
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
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-1">{title}</p>
                    <div className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {loading ? <div className="h-8 w-20 bg-slate-100 dark:bg-white/5 animate-pulse rounded-10" /> : value}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = () => {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/user");
        setProfile(data);
      } catch (err) {
        setError("Failed to load profile.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("profile_photo", file);

    try {
      await api.post("/employee/profile-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { data } = await api.get("/user");
      setProfile(data);
      await refreshUser();
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Failed to upload image. Please ensure it is a valid image under 2MB.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?")) return;

    setIsDeleting(true);
    try {
      await api.delete("/employee/profile-photo");
      const { data } = await api.get("/user");
      setProfile(data);
      await refreshUser();
    } catch (err) {
      console.error("Failed to delete image", err);
      alert("Failed to delete image.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
  };

  const maskAadhar = (aadhar) => {
    if (!aadhar) return "N/A";
    return aadhar.replace(/\d{8}(\d{4})/, "XXXX XXXX $1");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950 transition-colors">
        <Loader2 className="w-12 h-12 text-[#00b9cd] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950 text-rose-500 transition-colors">
        <div className="text-xl font-black uppercase tracking-widest">{error}</div>
      </div>
    );
  }

  const InfoRow = ({ label, value, icon: Icon, color = "slate" }) => (
    <div className="group flex items-center justify-between p-4 rounded-10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
        <div className="flex items-center gap-4">
            {Icon && <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-10 text-slate-400 dark:text-slate-500 group-hover:text-[#00b9cd] transition-colors"><Icon size={16} /></div>}
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">{label}</span>
        </div>
        <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-500 overflow-hidden">
      <div className="p-8 max-w-[1600px] mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 px-4">
            <div className="flex items-center gap-8">
                <div className="relative group">
                    <div 
                        className="h-32 w-32 rounded-10 bg-gradient-to-br from-[#00b9cd] to-blue-600 p-1 shadow-2xl transform transition-all duration-500 hover:scale-105 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="h-full w-full rounded-10 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden relative">
                            {(isUploading || isDeleting) && (
                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-20">
                                    <Loader2 className="w-8 h-8 text-[#00b9cd] animate-spin" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-[#00b9cd]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10 text-white font-black uppercase text-[10px] tracking-widest">
                                <Camera className="mb-2" />
                                <span>Update</span>
                            </div>
                            {profile?.employee?.profile_photo ? (
                                <img 
                                    src={profile.employee.profile_photo.startsWith('http') ? profile.employee.profile_photo : `${STORAGE_URL}/${profile.employee.profile_photo}`} 
                                    alt="Profile" 
                                    className="h-full w-full object-cover" 
                                />
                            ) : (
                                <User size={56} className="text-[#00b9cd]" />
                            )}
                        </div>
                    </div>
                    {profile?.employee?.profile_photo && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleImageDelete(); }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-10 shadow-lg hover:scale-110 transition-transform duration-300 z-30"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white dark:border-slate-950 w-8 h-8 rounded-10 shadow-lg flex items-center justify-center text-white">
                        <ShieldCheck size={14} />
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                <div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
                        My <span className="text-transparent bg-clip-text bg-[#00b9cd]">Profile</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="h-1.5 w-16 bg-[#00b9cd] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                            <span>{profile?.name}</span>
                            <span>•</span>
                            <span className="text-[#00b9cd]">{profile?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <span className={`px-4 py-2 rounded-10 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg ${
                    profile?.employee?.status === 'Inactive' 
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                }`}>
                    {profile?.employee?.status || "Active"}
                </span>
                <span className="px-4 py-2 bg-[#00b9cd]/10 text-[#00b9cd] border border-[#00b9cd]/20 rounded-10 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">
                    {profile?.role || "Employee"}
                </span>
            </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <StatCard title="Employee Code" value={profile?.employee?.employee_code} icon={Fingerprint} color="teal" />
            <StatCard title="Department" value={profile?.employee?.department?.name} icon={Building2} color="blue" />
            <StatCard title="Designation" value={profile?.employee?.designation?.name} icon={Briefcase} color="emerald" />
            <StatCard title="Joining Date" value={formatDate(profile?.employee?.date_of_joining)} icon={Calendar} color="amber" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Personal Information */}
          <Card title="Personal Credentials" icon={User} className="h-full">
            <div className="space-y-2">
                <InfoRow label="Gender" value={profile?.employee?.gender} icon={Activity} />
                <InfoRow label="Marital Status" value={profile?.employee?.marital_status} icon={Shield} />
                <InfoRow label="Emergency Contact" value={profile?.employee?.emergency_contact} icon={Phone} />
                <InfoRow label="Aadhar Number" value={maskAadhar(profile?.employee?.aadhar_number)} icon={ShieldCheck} />
                <InfoRow label="PAN Number" value={profile?.employee?.pan_number} icon={AlertTriangle} />
                <InfoRow label="Current Address" value={profile?.employee?.address} icon={MapPin} />
            </div>
          </Card>

          {/* Work & Identity */}
          <Card title="Operational Data" icon={Layout} className="h-full">
            <div className="space-y-2">
                <InfoRow label="Sub Company" value={profile?.employee?.sub_company?.name} icon={Building2} />
                <InfoRow label="Location" value={profile?.employee?.country?.name} icon={Globe} />
                <InfoRow label="Joining Category" value={profile?.employee?.joining_category} icon={Award} />
                {profile?.employee?.joining_category === "New Joinee" && profile?.employee?.probation_months > 0 && (
                    <>
                        <InfoRow label="Probation Status" value={`${profile.employee.probation_months} Months`} icon={Clock} />
                        <InfoRow 
                            label="Probation Maturity" 
                            value={(() => {
                                const doj = new Date(profile.employee.date_of_joining);
                                doj.setMonth(doj.getMonth() + parseInt(profile.employee.probation_months));
                                return formatDate(doj);
                            })()} 
                            icon={Zap} 
                        />
                    </>
                )}
                <InfoRow label="System Email" value={profile?.email} icon={Mail} />
                <InfoRow label="Contact Line" value={profile?.employee?.phone} icon={Phone} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
