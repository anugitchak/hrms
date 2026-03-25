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

const EmailTemplatePage = () => {
    const { addToast, confirm } = useGlobalUI();
    const bodyRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isActive, setIsActive] = useState(true);

    const [defaultSubject, setDefaultSubject] = useState("");
    const [defaultBody, setDefaultBody] = useState("");

    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        setLoading(true);
        try {
            const res = await api.get("/settings/email-template");
            setSubject(res.data.subject ?? "");
            setBody(res.data.body ?? "");
            setIsActive(res.data.is_active ?? true);
            // Store defaults for reset
            if (!defaultSubject) setDefaultSubject(res.data.subject ?? "");
            if (!defaultBody) setDefaultBody(res.data.body ?? "");
        } catch (err) {
            addToast("Failed to load email template", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!subject.trim()) { addToast("Subject cannot be empty", "error"); return; }
        if (!body.trim()) { addToast("Body cannot be empty", "error"); return; }

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

        // Clear from backend
        try {
            await api.put("/settings/email-template", {
                subject: defaultSubject,
                body: defaultBody,
                is_active: true,
            });
            setSubject(defaultSubject);
            setBody(defaultBody);
            setIsActive(true);
            addToast("Template reset to default", "success");
        } catch (err) {
            addToast("Failed to reset template", "error");
        }
    };

    const insertVariable = (tag) => {
        const textarea = bodyRef.current;
        if (!textarea) {
            setBody((prev) => prev + tag);
            return;
        }
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newBody = body.substring(0, start) + tag + body.substring(end);
        setBody(newBody);
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + tag.length;
            textarea.focus();
        }, 0);
    };

    // Simple placeholder preview
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
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Welcome <span className="text-transparent bg-clip-text bg-[#00b9cd]">Email</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-full shadow-lg shadow-[#f06464]/20" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Customize the email sent to new employees on joining
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Toggle email on/off */}
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${isActive ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20" : "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20"}`}>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
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

                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:border-[#00b9cd] transition-all"
                    >
                        {previewMode ? "← Edit" : "Preview →"}
                    </button>

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
                {/* Main editor */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Subject */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md p-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Email Subject Line
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Welcome to {CompanyName}!"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white text-sm transition-all"
                        />
                        {previewMode && (
                            <p className="mt-2 text-xs text-[#00b9cd] font-bold">
                                Preview: {getPreviewText(subject)}
                            </p>
                        )}
                    </div>

                    {/* Body */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md p-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Email Body (HTML Supported)
                            </label>
                            <span className="text-[10px] font-bold text-slate-400">
                                {body.length} characters
                            </span>
                        </div>

                        {previewMode ? (
                            <div
                                className="w-full min-h-[420px] p-6 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-slate-200 overflow-auto leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: getPreviewText(body) }}
                            />
                        ) : (
                            <textarea
                                ref={bodyRef}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={20}
                                placeholder="Enter email body HTML here... Use {EmployeeName}, {Email}, {Password} etc."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-[#00b9cd] font-mono text-slate-900 dark:text-white text-xs resize-y transition-all"
                                spellCheck={false}
                            />
                        )}
                    </div>
                </div>

                {/* Sidebar: Variable Reference */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md p-6 sticky top-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
                            Available Variables
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold mb-5 leading-relaxed">
                            Click a variable to insert it at the cursor position in the body, or copy it to use in the subject line.
                        </p>
                        <div className="space-y-2">
                            {VARIABLES.map(({ tag, desc }) => (
                                <button
                                    key={tag}
                                    onClick={() => insertVariable(tag)}
                                    title={`Insert ${tag}`}
                                    className="w-full text-left group p-3 rounded-lg border-2 border-slate-100 dark:border-white/5 hover:border-[#00b9cd] hover:bg-[#00b9cd]/5 transition-all"
                                >
                                    <span className="block font-mono text-xs font-black text-[#00b9cd] group-hover:text-[#00b9cd]">
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
                                💡 Tip
                            </p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                                The body supports full HTML. Use the <strong>Preview</strong> button to see how the email will look with sample data before saving.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplatePage;
