import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Users, Eye, DollarSign, ClipboardList, Building2, FileText,
    Settings, Palette, LogOut, CheckSquare, Megaphone, Video, FolderOpen,
    ShieldCheck, X, Save, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';

// ─── Permission Registry ─────────────────────────────────────────────────────
const PERMISSION_GROUPS = [
    {
        category: 'Employees',
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#bfdbfe',
        permissions: [
            { key: 'can_manage_employees', label: 'Manage Employees', description: 'Add, edit or remove employees', icon: Users },
            { key: 'can_view_employees',   label: 'View Employees',   description: 'View employee information',      icon: Eye },
        ]
    },
    {
        category: 'Attendance',
        color: '#8b5cf6',
        bg: '#f5f3ff',
        border: '#ddd6fe',
        permissions: [
            { key: 'can_manage_attendance', label: 'Manage Attendance', description: 'Mark or edit attendance records', icon: ClipboardList },
            { key: 'can_view_attendance',   label: 'View Attendance',   description: 'View all attendance records',    icon: Eye },
            { key: 'can_force_checkout',    label: 'Force Checkout',    description: 'Forcefully checkout employees',  icon: LogOut },
        ]
    },
    {
        category: 'Leaves',
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#a7f3d0',
        permissions: [
            { key: 'can_manage_leaves', label: 'Manage Leaves', description: 'Approve or reject leave requests', icon: ClipboardList },
            { key: 'can_view_leaves',   label: 'View Leaves',   description: 'View all leave applications',     icon: Eye },
        ]
    },
    {
        category: 'Payroll',
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fde68a',
        permissions: [
            { key: 'can_manage_salaries',         label: 'Manage Salaries',         description: 'Update salary information',              icon: DollarSign },
            { key: 'can_view_salaries',           label: 'View Salaries',           description: 'View salary and payroll data',           icon: Eye },
            { key: 'can_manage_payslips',         label: 'Manage Payslips',         description: 'Generate and send payslips',             icon: FileText },
            { key: 'can_manage_payroll_settings', label: 'Payroll Settings',        description: 'Configure payroll policies and settings', icon: Settings },
            { key: 'can_manage_payslip_designer', label: 'Payslip Designer',        description: 'Create and edit payslip templates',      icon: Palette },
        ]
    },
    {
        category: 'Organization',
        color: '#06b6d4',
        bg: '#ecfeff',
        border: '#a5f3fc',
        permissions: [
            { key: 'can_manage_departments', label: 'Manage Departments', description: 'Create or edit departments', icon: Building2 },
        ]
    },
    {
        category: 'Tasks',
        color: '#ec4899',
        bg: '#fdf2f8',
        border: '#fbcfe8',
        permissions: [
            { key: 'can_assign_tasks', label: 'Manage Tasks', description: 'Assign, verify and manage employee tasks', icon: CheckSquare },
        ]
    },
    {
        category: 'Communication',
        color: '#6366f1',
        bg: '#eef2ff',
        border: '#c7d2fe',
        permissions: [
            { key: 'can_manage_announcements', label: 'Manage Announcements', description: 'Create, edit and delete announcements', icon: Megaphone },
            { key: 'can_manage_meetings',      label: 'Manage Meetings',      description: 'Schedule, edit and cancel meetings',    icon: Video },
        ]
    },
    {
        category: 'Documents',
        color: '#64748b',
        bg: '#f8fafc',
        border: '#e2e8f0',
        permissions: [
            { key: 'can_manage_documents', label: 'Manage Documents', description: 'Upload and delete employee documents', icon: FolderOpen },
        ]
    },
];

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
            position: 'relative',
            display: 'inline-flex',
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: checked ? '#00b9cd' : '#e2e8f0',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.25s ease',
            flexShrink: 0,
            opacity: disabled ? 0.5 : 1,
        }}
        aria-checked={checked}
        role="switch"
    >
        <span style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '23px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.25s ease',
        }} />
    </button>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────
const PermissionModal = ({ user: targetUser, onClose, onSaved }) => {
    const [permissions, setPermissions] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error'

    // Build initial state from all known permission keys
    useEffect(() => {
        if (!targetUser) return;
        const allKeys = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
        const initial = {};
        allKeys.forEach(key => {
            initial[key] = Boolean(targetUser[key]);
        });
        setPermissions(initial);
    }, [targetUser]);

    const toggleAll = (checked) => {
        const allKeys = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
        const next = {};
        allKeys.forEach(k => { next[k] = checked; });
        setPermissions(next);
    };

    const toggleGroup = (groupPerms, checked) => {
        const next = { ...permissions };
        groupPerms.forEach(p => { next[p.key] = checked; });
        setPermissions(next);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus(null);
        try {
            await api.put(`/superadmin/users/${targetUser.id}/permissions`, permissions);
            setSaveStatus('success');
            setTimeout(() => {
                setSaveStatus(null);
                onSaved && onSaved();
                onClose();
            }, 1200);
        } catch (err) {
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    if (!targetUser) return null;

    const totalEnabled = Object.values(permissions).filter(Boolean).length;
    const totalPermissions = PERMISSION_GROUPS.flatMap(g => g.permissions).length;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%', maxWidth: '700px', maxHeight: '90vh',
                    background: '#fff', borderRadius: '20px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '24px 28px', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <ShieldCheck style={{ color: '#00b9cd', width: '22px', height: '22px' }} />
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Manage Permissions</h2>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                            {targetUser.name} &bull; <span style={{ color: totalEnabled > 0 ? '#00b9cd' : '#94a3b8' }}>{totalEnabled} of {totalPermissions} enabled</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => toggleAll(true)} style={{ fontSize: '11px', fontWeight: 700, color: '#00b9cd', border: '1px solid #00b9cd', background: '#ecfeff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                            Enable All
                        </button>
                        <button onClick={() => toggleAll(false)} style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                            Disable All
                        </button>
                        <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <X style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                </div>

                {/* Body — scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
                    {PERMISSION_GROUPS.map(group => {
                        const groupEnabled = group.permissions.every(p => permissions[p.key]);
                        const groupPartial = group.permissions.some(p => permissions[p.key]) && !groupEnabled;

                        return (
                            <div key={group.category} style={{ marginBottom: '20px', border: `1.5px solid ${group.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                                {/* Group Header */}
                                <div style={{ background: group.bg, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${group.border}` }}>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: group.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        {group.category}
                                    </span>
                                    <ToggleSwitch
                                        checked={groupEnabled}
                                        onChange={(v) => toggleGroup(group.permissions, v)}
                                    />
                                </div>
                                {/* Group Permissions */}
                                <div style={{ padding: '4px 0' }}>
                                    {group.permissions.map(perm => {
                                        const Icon = perm.icon;
                                        const isOn = permissions[perm.key] || false;
                                        return (
                                            <div
                                                key={perm.key}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '14px',
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    cursor: 'pointer',
                                                    background: isOn ? '#fafcff' : 'transparent',
                                                    transition: 'background 0.15s',
                                                }}
                                                onClick={() => setPermissions(prev => ({ ...prev, [perm.key]: !prev[perm.key] }))}
                                            >
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: group.bg, border: `1.5px solid ${group.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Icon style={{ width: '16px', height: '16px', color: group.color }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{perm.label}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{perm.description}</div>
                                                </div>
                                                <ToggleSwitch
                                                    checked={isOn}
                                                    onChange={(v) => setPermissions(prev => ({ ...prev, [perm.key]: v }))}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 28px', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#fafafa' }}>
                    {/* Status Message */}
                    <div>
                        {saveStatus === 'success' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
                                <CheckCircle style={{ width: '16px', height: '16px' }} /> Permissions saved!
                            </div>
                        )}
                        {saveStatus === 'error' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                                <AlertTriangle style={{ width: '16px', height: '16px' }} /> Failed to save. Try again.
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onClose}
                            style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none',
                                background: saving ? '#94a3b8' : '#00b9cd',
                                color: '#fff', fontSize: '13px', fontWeight: 700,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}
                        >
                            {saving ? <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '15px', height: '15px' }} />}
                            {saving ? 'Saving...' : 'Save Permissions'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;
