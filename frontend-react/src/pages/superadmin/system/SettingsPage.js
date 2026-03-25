import React, { useState, useEffect, useCallback } from"react"; import api from"../../../api/axios"; import { useGlobalUI } from"../../../context/GlobalUIContext"; // Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-10 border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#00b9cd]/10 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${enabled ? 'bg-[#00b9cd] border-[#00b9cd] shadow-lg shadow-[#f06464]/20' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-10 bg-white shadow-md transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
};

// Permission Card Component
const PermissionCard = ({ permission, enabled, onChange, disabled }) => {
    const getCategoryIcon = (category) => {
        // ... svg icons ... (keep existing icons)
        switch (category) {
            case 'Leaves': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
            case 'Attendance': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'Employees': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
            case 'Payroll': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'Organization': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
            case 'Tasks': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
            default: return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Leaves': return 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20';
            case 'Attendance': return 'text-[#00b9cd] bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 border-[#00b9cd]/10 dark:border-[#00b9cd]/20';
            case 'Employees': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
            case 'Payroll': return 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20';
            case 'Organization': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20';
            case 'Tasks': return 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20';
            default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700';
        }
    };

    return (
        <div className={`p-6 rounded-10 group ${
            enabled 
                ? 'bg-white dark:bg-slate-900/60 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out dark:shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out' 
                : 'bg-white dark:bg-slate-900/60 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out'
        } hover:-translate-y-1 `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-10 border transition-transform group-hover:scale-110 duration-500 ${getCategoryColor(permission.category)}`}>
                        {getCategoryIcon(permission.category)}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{permission.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{permission.description}</p>
                    </div>
                </div>
                <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
            </div>
        </div>
    );
};
 // Role Tab Component
// Role Tab Component
const RoleTab = ({ role, isActive, onClick }) => {
    const getRoleIcon = (roleId) => {
        // ... (standard svg icons)
        if (roleId === 2) return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-8 py-4 rounded-10 font-black uppercase tracking-widest text-xs ${
                isActive 
                    ? 'bg-[#00b9cd] text-white shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1' 
                    : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400'
            }`}
        >
            {getRoleIcon(role.id)}
            <span>{role.name} Control</span>
        </button>
    );
};
 // Main Settings Page
const SettingsPage = () => { const { addToast } = useGlobalUI(); const [roles, setRoles] = useState([ { id: 2, name: 'Admin', permissions: {} }, { id: 3, name: 'HR', permissions: {} } ]); const [availablePermissions, setAvailablePermissions] = useState([]); const [activeRoleId, setActiveRoleId] = useState(2); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [hasChanges, setHasChanges] = useState(false); // Fetch data on mount
useEffect(() => { fetchData(); }, []); const fetchData = async () => { setLoading(true); try { const [rolesRes, permissionsRes] = await Promise.all([ api.get('/role-permissions'), api.get('/permissions/available') ]); setRoles(rolesRes.data); setAvailablePermissions(permissionsRes.data); } catch (err) { console.error('Failed to fetch permissions:', err); addToast('Failed to load permissions', 'error'); } finally { setLoading(false); } }; const handlePermissionChange = useCallback((permissionKey, value) => { setRoles(prevRoles => prevRoles.map(role => role.id === activeRoleId ? { ...role, permissions: { ...role.permissions, [permissionKey]: value } } : role ) ); setHasChanges(true); }, [activeRoleId]); const handleSave = async () => { setSaving(true); try { const activeRole = roles.find(r => r.id === activeRoleId); await api.put(`/role-permissions/${activeRoleId}`, activeRole.permissions); addToast(`${activeRole.name} permissions updated successfully!`, 'success'); setHasChanges(false); } catch (err) { console.error('Failed to save permissions:', err); addToast('Failed to save permissions', 'error'); } finally { setSaving(false); } }; const handleEnableAll = () => { const allEnabled = {}; availablePermissions.forEach(p => { allEnabled[p.key] = true; }); setRoles(prevRoles => prevRoles.map(role => role.id === activeRoleId ? { ...role, permissions: allEnabled } : role ) ); setHasChanges(true); }; const handleDisableAll = () => { const allDisabled = {}; availablePermissions.forEach(p => { allDisabled[p.key] = false; }); setRoles(prevRoles => prevRoles.map(role => role.id === activeRoleId ? { ...role, permissions: allDisabled } : role ) ); setHasChanges(true); }; const activeRole = roles.find(r => r.id === activeRoleId); const groupedPermissions = availablePermissions.reduce((acc, perm) => { if (!acc[perm.category]) acc[perm.category] = []; acc[perm.category].push(perm); return acc; }, {});     if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-vh-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#00b9cd] border-t-transparent rounded-10 animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-bold">Loading permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none mb-3">
                        System <span className="text-transparent bg-clip-text bg-[#00b9cd]">Settings</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Configure corporate roles and platform permissions</p>
                    </div>
                </div>
            </div>

            {/* Role Tabs */}
            <div className="flex flex-wrap gap-4 mb-10">
                {roles.map(role => (
                    <RoleTab 
                        key={role.id} 
                        role={role} 
                        isActive={activeRoleId === role.id} 
                        onClick={() => setActiveRoleId(role.id)} 
                    />
                ))}
            </div>

            {/* Permissions Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        {activeRole?.name} <span className="text-[#00b9cd]">Permissions</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Refine access granularity for this organizational tier</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleEnableAll} 
                        className="px-6 py-3 text-xs font-black text-[#00b9cd] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 hover:border-[#00b9cd] transition-all rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md uppercase tracking-widest"
                    >
                        Enable All
                    </button>
                    <button 
                        onClick={handleDisableAll} 
                        className="px-6 py-3 text-xs font-black text-red-600 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 hover:border-red-600 transition-all rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-red-200 dark:hover:border-red-700 transition-all duration-500 ease-out hover:-translate-y-1 active:translate-y-0 active:shadow-md uppercase tracking-widest"
                    >
                        Disable All
                    </button>
                </div>
            </div>

            <div className="space-y-10">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="relative">
                        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-white/10 px-5 py-3 rounded-10 w-fit shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-none">{category}</h3>
                            <span className="text-[10px] font-black bg-[#00b9cd] text-white px-3 py-1 rounded-10 leading-none">{permissions.length} Units</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {permissions.map(permission => (
                                <PermissionCard 
                                    key={permission.key} 
                                    permission={permission} 
                                    enabled={activeRole?.permissions?.[permission.key] || false} 
                                    onChange={(value) => handlePermissionChange(permission.key, value)} 
                                    disabled={saving} 
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Actions Bar */}
            <div className="sticky bottom-8 mt-16 p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex items-center justify-between gap-6 border border-white/20">
                <div className="hidden sm:block">
                    {hasChanges ? (
                        <span className="flex items-center gap-4 px-6 py-3 bg-amber-50 dark:bg-amber-500/10 rounded-10 border border-amber-200 dark:border-amber-500/20">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-10 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]"></span>
                            <span className="font-black text-amber-700 dark:text-amber-400 text-xs uppercase tracking-widest">Unsaved Refinements</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-4 px-6 py-3 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 rounded-10 border border-[#00b9cd]/30 dark:border-[#00b9cd]/20">
                            <svg className="w-5 h-5 text-[#00b9cd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-black text-[#00b9cd] dark:text-[#00b9cd] text-xs uppercase tracking-widest">Architecture Synced</span>
                        </span>
                    )}
                </div>
                
                <button 
                    onClick={handleSave} 
                    disabled={saving || !hasChanges} 
                    className={`px-12 py-5 rounded-10 font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                        saving || !hasChanges 
                            ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed' 
                            : 'bg-[#00b9cd] text-white shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] hover:border-[#00b9cd]/30 dark:hover:border-[#00b9cd]/50 transition-all duration-500 ease-out hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-y-0 active:shadow-md'
                    }`}
                >
                    {saving ? (
                        <><div className="w-5 h-5 border-3 border-white border-t-transparent rounded-10 animate-spin"></div>Processing...</>
                    ) : (
                        <>Apply Refinements</>
                    )}
                </button>
            </div>

        </div>
    );
};

export default SettingsPage;