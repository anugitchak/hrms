import React, { useState, useEffect, useRef } from "react";
import api from "../../../api/axios";
import { useGlobalUI } from "../../../context/GlobalUIContext";

const VARIABLES = [
    { tag: "{EmployeeName}", desc: "Full name of the new employee" },
    { tag: "{Email}", desc: "Login email address" },
    { tag: "{Password}", desc: "Temporary password" },
    { tag: "{EmployeeCode}", desc: "Employee code / ID" },
    { tag: "{Department}", desc: "Department name" },
    { tag: "{Designation}", desc: "Job designation / title" },
    { tag: "{JoiningDate}", desc: "Date of joining (dd Mon, YYYY)" },
    { tag: "{CompanyName}", desc: "Company / portal name" },
    { tag: "{PortalURL}", desc: "Link to the HRMS portal" },
];

const TEXT_COLORS = [
    "#111827",
    "#1f2937",
    "#0f766e",
    "#0c4a6e",
    "#4338ca",
    "#be123c",
    "#9a3412",
    "#166534",
];

const HIGHLIGHT_COLORS = [
    "#fef08a",
    "#bfdbfe",
    "#bbf7d0",
    "#fecaca",
    "#fbcfe8",
    "#e9d5ff",
    "#fed7aa",
    "#e5e7eb",
];

// ─── Permission Modal ────────────────────────────────────────────────────────
const PermissionModal = ({ onClose }) => {
    const { addToast } = useGlobalUI();
    const [loadingPerms, setLoadingPerms] = useState(true);
    const [saving, setSaving] = useState(false);

    // Which roles get access: key = roleId, value = boolean
    const [access, setAccess] = useState({ 2: false, 3: false });

    useEffect(() => {
        const fetchPerms = async () => {
            setLoadingPerms(true);
            try {
                const res = await api.get("/role-permissions");
                const adminRole = res.data.find((r) => r.id === 2);
                const hrRole = res.data.find((r) => r.id === 3);
                setAccess({
                    2: adminRole?.permissions?.can_manage_email_templates ?? false,
                    3: hrRole?.permissions?.can_manage_email_templates ?? false,
                });
            } catch {
                addToast("Failed to load access permissions", "error");
            } finally {
                setLoadingPerms(false);
            }
        };
        fetchPerms();
    }, [addToast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                api.put("/role-permissions/2", { can_manage_email_templates: access[2] }),
                api.put("/role-permissions/3", { can_manage_email_templates: access[3] }),
            ]);
            addToast("Access permissions updated successfully!", "success");
            onClose();
        } catch {
            addToast("Failed to update permissions", "error");
        } finally {
            setSaving(false);
        }
    };

    const roles = [
        {
            id: 2,
            label: "Admin",
            desc: "Grants Admin role users access to edit the welcome email template.",
            color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
        {
            id: 3,
            label: "HR",
            desc: "Grants HR role users access to edit the welcome email template.",
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Modal */}
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-[#00b9cd]/10 to-transparent flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#00b9cd]/10 border border-[#00b9cd]/20 flex items-center justify-center text-[#00b9cd] flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Access Control</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Welcome Email Template Permissions</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-6 space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Control which roles can access and modify the Welcome Email Template. Changes apply to <strong>all users</strong> of that role.
                    </p>

                    {loadingPerms ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-8 h-8 border-3 border-[#00b9cd] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                                        access[role.id]
                                            ? "border-[#00b9cd]/40 bg-[#00b9cd]/5 dark:bg-[#00b9cd]/10"
                                            : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${role.color}`}>
                                                {role.icon}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{role.label} Role</p>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">{role.desc}</p>
                                            </div>
                                        </div>
                                        {/* Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setAccess((prev) => ({ ...prev, [role.id]: !prev[role.id] }))}
                                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#00b9cd]/10 ${
                                                access[role.id]
                                                    ? "bg-[#00b9cd] border-[#00b9cd]"
                                                    : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                                            }`}
                                            role="switch"
                                            aria-checked={access[role.id]}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                                                    access[role.id] ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Status badge */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                access[role.id]
                                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                                    : "bg-slate-100 dark:bg-white/5 text-slate-400"
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${access[role.id] ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                            {access[role.id] ? "Access Granted" : "Access Denied"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-white dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loadingPerms}
                        className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                            saving || loadingPerms
                                ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                                : "bg-[#00b9cd] text-white shadow-lg shadow-[#00b9cd]/20 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                        }`}
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                Apply Permissions
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToolbarButton = ({ title, onClick, children }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className="h-9 min-w-9 px-3 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-black text-slate-700 dark:text-slate-200 hover:border-[#00b9cd] hover:text-[#00b9cd] transition-all"
    >
        {children}
    </button>
);

const EmailTemplatePage = () => {
    const { addToast, confirm } = useGlobalUI();

    const subjectRef = useRef(null);
    const bodyRef = useRef(null);
    const editorRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [sourceMode, setSourceMode] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [activeField, setActiveField] = useState("body");

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isActive, setIsActive] = useState(true);

    const [defaultSubject, setDefaultSubject] = useState("");
    const [defaultBody, setDefaultBody] = useState("");

    useEffect(() => {
        fetchTemplate();
    }, []);

    useEffect(() => {
        if (!previewMode && !sourceMode && editorRef.current && editorRef.current.innerHTML !== body) {
            editorRef.current.innerHTML = body || "";
        }
    }, [body, previewMode, sourceMode]);

    const fetchTemplate = async () => {
        setLoading(true);
        try {
            const res = await api.get("/settings/email-template");
            const nextSubject = res.data.subject ?? "";
            const nextBody = res.data.body ?? "";

            setSubject(nextSubject);
            setBody(nextBody);
            setIsActive(res.data.is_active ?? true);

            if (!defaultSubject) setDefaultSubject(nextSubject);
            if (!defaultBody) setDefaultBody(nextBody);
        } catch {
            addToast("Failed to load email template", "error");
        } finally {
            setLoading(false);
        }
    };

    const getPreviewText = (text) =>
        text
            .replace(/\{EmployeeName\}/g, "John Doe")
            .replace(/\{Email\}/g, "john.doe@company.com")
            .replace(/\{Password\}/g, "Temp@1234")
            .replace(/\{EmployeeCode\}/g, "EMP-001")
            .replace(/\{Department\}/g, "Engineering")
            .replace(/\{Designation\}/g, "Software Engineer")
            .replace(/\{JoiningDate\}/g, "01 Apr, 2026")
            .replace(/\{CompanyName\}/g, "Mind & Matter")
            .replace(/\{PortalURL\}/g, "https://hrms.company.com");

    const handleSave = async () => {
        if (!subject.trim()) {
            addToast("Subject cannot be empty", "error");
            return;
        }

        const trimmedBody = body.replace(/<[^>]*>/g, "").trim();
        if (!trimmedBody) {
            addToast("Body cannot be empty", "error");
            return;
        }

        setSaving(true);
        try {
            await api.put("/settings/email-template", { subject, body, is_active: isActive });
            addToast("Email template saved successfully!", "success");
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to save template", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: "Reset to Default",
            message: "This will restore the default welcome email template. Your current changes will be lost.",
            confirmText: "Reset",
            type: "danger",
        });
        if (!confirmed) return;

        try {
            await api.put("/settings/email-template", {
                subject: defaultSubject,
                body: defaultBody,
                is_active: true,
            });

            setSubject(defaultSubject);
            setBody(defaultBody);
            setIsActive(true);
            setPreviewMode(false);
            setSourceMode(false);
            addToast("Template reset to default", "success");
        } catch {
            addToast("Failed to reset template", "error");
        }
    };

    const runEditorCommand = (command, value = null) => {
        if (previewMode || sourceMode || !editorRef.current) return;

        editorRef.current.focus();
        document.execCommand(command, false, value);
        setBody(editorRef.current.innerHTML);
    };

    const insertIntoSubject = (tag) => {
        const input = subjectRef.current;
        if (!input) {
            setSubject((prev) => prev + tag);
            return;
        }

        const start = input.selectionStart ?? subject.length;
        const end = input.selectionEnd ?? subject.length;
        const nextValue = subject.slice(0, start) + tag + subject.slice(end);
        setSubject(nextValue);

        setTimeout(() => {
            input.focus();
            input.selectionStart = input.selectionEnd = start + tag.length;
        }, 0);
    };

    const insertIntoSource = (tag) => {
        const textarea = bodyRef.current;
        if (!textarea) {
            setBody((prev) => prev + tag);
            return;
        }

        const start = textarea.selectionStart ?? body.length;
        const end = textarea.selectionEnd ?? body.length;
        const nextValue = body.slice(0, start) + tag + body.slice(end);
        setBody(nextValue);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        }, 0);
    };

    const insertVariable = (tag) => {
        if (activeField === "subject") {
            insertIntoSubject(tag);
            return;
        }

        if (sourceMode) {
            insertIntoSource(tag);
            return;
        }

        if (!editorRef.current) {
            setBody((prev) => prev + tag);
            return;
        }

        editorRef.current.focus();
        const inserted = document.execCommand("insertText", false, tag);
        if (!inserted) {
            document.execCommand("insertHTML", false, tag);
        }
        setBody(editorRef.current.innerHTML);
    };

    const insertLink = () => {
        const url = window.prompt("Enter URL", "https://");
        if (!url) return;
        runEditorCommand("createLink", url);
    };

    const clearFormatting = () => {
        runEditorCommand("removeFormat");
        runEditorCommand("unlink");
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#00b9cd] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold">Loading template...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1500px] mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Welcome <span className="text-transparent bg-clip-text bg-[#00b9cd]">Email</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-full shadow-lg shadow-[#f06464]/20" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Rich text with style controls, source mode and preview
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${isActive ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20" : "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20"}`}>
                        <button
                            type="button"
                            onClick={() => setIsActive((prev) => !prev)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${isActive ? "bg-green-500 border-green-500" : "bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600"}`}
                            role="switch"
                            aria-checked={isActive}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 mt-[1px] ml-[2px] ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <span className={`text-xs font-black uppercase tracking-widest ${isActive ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {isActive ? "Email Enabled" : "Email Disabled"}
                        </span>
                    </div>

                    <div className="inline-flex rounded-xl border-2 border-slate-200 dark:border-white/10 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewMode(false);
                                setSourceMode(false);
                            }}
                            className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${!previewMode && !sourceMode ? "bg-[#00b9cd] text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}
                        >
                            Design
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSourceMode(true);
                                setPreviewMode(false);
                            }}
                            className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-l-2 border-slate-200 dark:border-white/10 ${sourceMode ? "bg-[#00b9cd] text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}
                        >
                            HTML
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewMode(true);
                                setSourceMode(false);
                            }}
                            className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-l-2 border-slate-200 dark:border-white/10 ${previewMode ? "bg-[#00b9cd] text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}
                        >
                            Preview
                        </button>
                    </div>

                    <button
                        onClick={handleReset}
                        className="px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:border-red-400 hover:text-red-500 transition-all"
                    >
                        Reset Default
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-3 rounded-xl bg-[#00b9cd] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all ${saving ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"}`}
                    >
                        {saving ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md p-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Email Subject Line
                        </label>
                        <input
                            ref={subjectRef}
                            type="text"
                            value={subject}
                            onFocus={() => setActiveField("subject")}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Welcome to {CompanyName}!"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white text-sm transition-all"
                        />
                        <p className="mt-2 text-xs text-[#00b9cd] font-bold">
                            Preview: {getPreviewText(subject)}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Email Body
                            </label>
                            <span className="text-[10px] font-bold text-slate-400">
                                {body.length} characters
                            </span>
                        </div>

                        {!previewMode && !sourceMode && (
                            <div className="mb-4 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        onChange={(e) => {
                                            if (!e.target.value) return;
                                            runEditorCommand("formatBlock", e.target.value);
                                            e.target.value = "";
                                        }}
                                        className="h-9 px-3 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-black text-slate-700 dark:text-slate-200"
                                        defaultValue=""
                                    >
                                        <option value="">Format</option>
                                        <option value="<p>">Paragraph</option>
                                        <option value="<h1>">Heading 1</option>
                                        <option value="<h2>">Heading 2</option>
                                        <option value="<h3>">Heading 3</option>
                                    </select>

                                    <ToolbarButton title="Bold" onClick={() => runEditorCommand("bold")}>B</ToolbarButton>
                                    <ToolbarButton title="Italic" onClick={() => runEditorCommand("italic")}>I</ToolbarButton>
                                    <ToolbarButton title="Underline" onClick={() => runEditorCommand("underline")}>U</ToolbarButton>
                                    <ToolbarButton title="Bullet List" onClick={() => runEditorCommand("insertUnorderedList")}>List</ToolbarButton>
                                    <ToolbarButton title="Numbered List" onClick={() => runEditorCommand("insertOrderedList")}>1.</ToolbarButton>
                                    <ToolbarButton title="Align Left" onClick={() => runEditorCommand("justifyLeft")}>Left</ToolbarButton>
                                    <ToolbarButton title="Align Center" onClick={() => runEditorCommand("justifyCenter")}>Center</ToolbarButton>
                                    <ToolbarButton title="Align Right" onClick={() => runEditorCommand("justifyRight")}>Right</ToolbarButton>
                                    <ToolbarButton title="Insert Link" onClick={insertLink}>Link</ToolbarButton>
                                    <ToolbarButton title="Clear Formatting" onClick={clearFormatting}>Clear</ToolbarButton>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Text</span>
                                    {TEXT_COLORS.map((color) => (
                                        <button
                                            key={`text-${color}`}
                                            type="button"
                                            title={`Text color ${color}`}
                                            onClick={() => runEditorCommand("foreColor", color)}
                                            className="w-7 h-7 rounded-md border-2 border-white shadow-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}

                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mr-1">Highlight</span>
                                    {HIGHLIGHT_COLORS.map((color) => (
                                        <button
                                            key={`bg-${color}`}
                                            type="button"
                                            title={`Highlight color ${color}`}
                                            onClick={() => runEditorCommand("hiliteColor", color)}
                                            className="w-7 h-7 rounded-md border-2 border-slate-300 dark:border-white/20 shadow-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {previewMode ? (
                            <div
                                className="w-full min-h-[460px] p-6 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-slate-200 overflow-auto leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: getPreviewText(body) }}
                            />
                        ) : sourceMode ? (
                            <textarea
                                ref={bodyRef}
                                value={body}
                                onFocus={() => setActiveField("body")}
                                onChange={(e) => setBody(e.target.value)}
                                rows={22}
                                placeholder="Edit HTML source for the welcome email body"
                                className="w-full min-h-[460px] px-4 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-[#00b9cd] font-mono text-slate-900 dark:text-white text-xs resize-y transition-all"
                                spellCheck={false}
                            />
                        ) : (
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onFocus={() => setActiveField("body")}
                                onInput={(e) => setBody(e.currentTarget.innerHTML)}
                                className="w-full min-h-[460px] p-6 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-[#00b9cd] text-sm text-slate-900 dark:text-white overflow-auto"
                            />
                        )}
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md p-6 sticky top-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
                            Available Variables
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold mb-5 leading-relaxed">
                            Insert placeholders into the currently focused field ({activeField === "subject" ? "subject" : "body"}).
                        </p>
                        <div className="space-y-2">
                            {VARIABLES.map(({ tag, desc }) => (
                                <button
                                    key={tag}
                                    onClick={() => insertVariable(tag)}
                                    title={`Insert ${tag}`}
                                    className="w-full text-left group p-3 rounded-lg border-2 border-slate-100 dark:border-white/5 hover:border-[#00b9cd] hover:bg-[#00b9cd]/5 transition-all"
                                >
                                    <span className="block font-mono text-xs font-black text-[#00b9cd]">
                                        {tag}
                                    </span>
                                    <span className="block text-[10px] text-slate-400 mt-0.5 font-semibold">
                                        {desc}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl">
                            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2">
                                Notes
                            </p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                                Use <strong>Design</strong> for rich editing, <strong>HTML</strong> for direct source control, and <strong>Preview</strong> to test sample output before saving.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {showPermissionModal && <PermissionModal onClose={() => setShowPermissionModal(false)} />}
        </div>
    );
};

export default EmailTemplatePage;
