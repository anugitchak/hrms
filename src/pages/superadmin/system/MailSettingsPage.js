import React, { useState, useEffect } from "react";
import {
    Mail, Server, Lock, User, Send, RefreshCw, Save,
    Eye, EyeOff, AlertTriangle, CheckCircle, Wifi, Settings
} from "lucide-react";
import api from "../../../api/axios";
import { useGlobalUI } from "../../../context/GlobalUIContext";

const ENCRYPTION_OPTIONS = [
    { value: "", label: "None" },
    { value: "tls", label: "TLS" },
    { value: "ssl", label: "SSL" },
    { value: "starttls", label: "STARTTLS" },
];

const MAILER_OPTIONS = [
    { value: "smtp", label: "SMTP" },
    { value: "sendmail", label: "Sendmail" },
    { value: "log", label: "Log (testing)" },
];

const DEFAULT_FORM = {
    mail_mailer: "smtp",
    mail_host: "",
    mail_port: "587",
    mail_username: "",
    mail_password: "",
    mail_encryption: "tls",
    mail_from_address: "",
    mail_from_name: "",
};

const InputField = ({ id, label, icon: Icon, required, children, hint }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">
            {label} {required && <span className="text-[#f06464]">*</span>}
        </label>
        <div className="relative group/input">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#00b9cd] transition-colors z-10" size={18} />}
            {children}
        </div>
        {hint && <p className="mt-1.5 ml-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{hint}</p>}
    </div>
);

const inputCls = (hasIcon = true, extra = "") =>
    `${hasIcon ? "pl-12" : "pl-4"} pr-4 w-full py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-10 outline-none focus:ring-4 focus:ring-[#00b9cd]/10 focus:border-[#00b9cd] font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all ${extra}`;

const MailSettingsPage = () => {
    const { addToast } = useGlobalUI();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [passwordIsSet, setPasswordIsSet] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState(DEFAULT_FORM);
    const [testEmail, setTestEmail] = useState("");
    const [testResult, setTestResult] = useState(null);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get("/settings/mail");
            const d = res.data;
            setForm({
                mail_mailer:       d.mail_mailer       || "smtp",
                mail_host:         d.mail_host         || "",
                mail_port:         d.mail_port         || "587",
                mail_username:     d.mail_username     || "",
                mail_password:     "",
                mail_encryption:   d.mail_encryption   ?? "tls",
                mail_from_address: d.mail_from_address || "",
                mail_from_name:    d.mail_from_name    || "",
            });
            setPasswordIsSet(d.password_is_set || false);
        } catch {
            addToast("Failed to load mail settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!form.mail_host.trim()) { addToast("SMTP Host is required", "error"); return; }
        if (!form.mail_from_address.trim()) { addToast("From Address is required", "error"); return; }
        if (!form.mail_from_name.trim()) { addToast("From Name is required", "error"); return; }

        setSaving(true);
        try {
            const payload = { ...form };
            if (!payload.mail_password) delete payload.mail_password;
            await api.put("/settings/mail", payload);
            addToast("Mail settings saved successfully!", "success");
            await fetchSettings();
        } catch (err) {
            const msg = err?.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join("; ")
                : err?.response?.data?.message || "Failed to save settings";
            addToast(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail.trim()) { addToast("Please enter a recipient email", "error"); return; }
        setTesting(true);
        setTestResult(null);
        try {
            const payload = { to_email: testEmail, ...form };
            if (!payload.mail_password || payload.mail_password === "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢") delete payload.mail_password;
            const res = await api.post("/settings/mail/test", payload);
            setTestResult({ success: true, msg: res.data.message });
            addToast(res.data.message, "success");
        } catch (err) {
            const msg = err?.response?.data?.message || "Test email failed";
            setTestResult({ success: false, msg });
            addToast(msg, "error");
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="animate-spin mx-auto text-[#00b9cd] mb-4" size={40} />
                    <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Loading Mail Settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">

            {/* â”€â”€ Header â”€â”€ */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Mail <span className="text-transparent bg-clip-text bg-[#00b9cd]">Settings</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-10 shadow-lg shadow-[#f06464]/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Configure outbound SMTP server for system emails</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchSettings}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md px-5 py-3 rounded-10 shadow-md border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out cursor-pointer hover:-translate-y-1 active:translate-y-0 active:shadow-md group"
                    >
                        <RefreshCw size={16} className={`text-[#00b9cd] ${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
                        <span className="uppercase tracking-widest">Refresh</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 text-xs font-black text-white bg-[#00b9cd] hover:bg-[#00b9cd]/80 px-6 py-3 rounded-10 shadow-md border-2 border-transparent hover:shadow-lg hover:border-[#00b9cd]/30 transition-all duration-500 ease-out ${saving ? "opacity-70 animate-pulse" : "hover:-translate-y-1 active:translate-y-0 active:shadow-md"}`}
                    >
                        {saving ? (
                            <><RefreshCw size={16} className="animate-spin" /><span className="uppercase tracking-widest">Savingâ€¦</span></>
                        ) : (
                            <><Save size={16} strokeWidth={3} /><span className="uppercase tracking-widest">Save Settings</span></>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* â”€â”€ Left Column: SMTP Config + Sender Identity â”€â”€ */}
                <div className="xl:col-span-2 flex flex-col gap-8">

                    {/* SMTP Configuration Card */}
                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1">
                        {/* Card Header */}
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-slate-50 dark:border-white/5">
                            <div className="w-12 h-12 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] border border-[#00b9cd]/10 shadow-md">
                                <Server size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">SMTP Configuration</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Outbound mail server credentials</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Mailer + Encryption */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <InputField id="mail_mailer" label="Mailer Driver" icon={Settings}>
                                    <select
                                        id="mail_mailer" name="mail_mailer" value={form.mail_mailer} onChange={handleChange}
                                        className={inputCls()}
                                    >
                                        {MAILER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </InputField>
                                <InputField id="mail_encryption" label="Encryption" icon={Lock}>
                                    <select
                                        id="mail_encryption" name="mail_encryption" value={form.mail_encryption} onChange={handleChange}
                                        className={inputCls()}
                                    >
                                        {ENCRYPTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </InputField>
                            </div>

                            {/* Host + Port */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="sm:col-span-2">
                                    <InputField id="mail_host" label="SMTP Host" icon={Wifi} required hint="e.g. smtp.gmail.com Â· smtp.office365.com">
                                        <input
                                            id="mail_host" name="mail_host" type="text" autoComplete="off"
                                            value={form.mail_host} onChange={handleChange}
                                            placeholder="smtp.gmail.com"
                                            className={inputCls()}
                                        />
                                    </InputField>
                                </div>
                                <InputField id="mail_port" label="Port" required hint="Common: 587 (TLS) Â· 465 (SSL)">
                                    <input
                                        id="mail_port" name="mail_port" type="number" autoComplete="off"
                                        value={form.mail_port} onChange={handleChange}
                                        placeholder="587" min="1" max="65535"
                                        className={inputCls(false)}
                                    />
                                </InputField>
                            </div>

                            {/* Username + Password */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <InputField id="mail_username" label="Username" icon={User} hint="Usually your full email address">
                                    <input
                                        id="mail_username" name="mail_username" type="text" autoComplete="off"
                                        value={form.mail_username} onChange={handleChange}
                                        placeholder="you@gmail.com"
                                        className={inputCls()}
                                    />
                                </InputField>
                                <InputField
                                    id="mail_password"
                                    label={
                                        <span className="flex items-center gap-2">
                                            Password
                                            {passwordIsSet && (
                                                <span className="inline-flex items-center gap-1 text-[#00b9cd] normal-case tracking-normal font-black">
                                                    <CheckCircle size={12} /> saved
                                                </span>
                                            )}
                                        </span>
                                    }
                                    icon={Lock}
                                    hint={passwordIsSet ? "Leave blank to keep existing password" : "Gmail: use App Password"}
                                >
                                    <input
                                        id="mail_password" name="mail_password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={form.mail_password} onChange={handleChange}
                                        placeholder={passwordIsSet ? "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢  (unchanged)" : "Enter password"}
                                        className={inputCls(true, "pr-14")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00b9cd] transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </InputField>
                            </div>
                        </div>
                    </div>

                    {/* Sender Identity Card */}
                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-slate-50 dark:border-white/5">
                            <div className="w-12 h-12 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] border border-[#00b9cd]/10 shadow-md">
                                <Mail size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Sender Identity</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">What recipients see in the From field</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField id="mail_from_address" label="From Address" icon={Mail} required hint="Must match authenticated username for Gmail">
                                <input
                                    id="mail_from_address" name="mail_from_address" type="email" autoComplete="off"
                                    value={form.mail_from_address} onChange={handleChange}
                                    placeholder="noreply@yourcompany.com"
                                    className={inputCls()}
                                />
                            </InputField>
                            <InputField id="mail_from_name" label="From Name" icon={User} required hint="Displayed as the sender name">
                                <input
                                    id="mail_from_name" name="mail_from_name" type="text" autoComplete="off"
                                    value={form.mail_from_name} onChange={handleChange}
                                    placeholder="Your Company"
                                    className={inputCls()}
                                />
                            </InputField>
                        </div>
                    </div>
                </div>

                {/* â”€â”€ Right Column: Test Email + Quick Reference â”€â”€ */}
                <div className="flex flex-col gap-8">

                    {/* Send Test Email Card */}
                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-slate-50 dark:border-white/5">
                            <div className="w-12 h-12 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] border border-[#00b9cd]/10 shadow-md">
                                <Send size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Test Email</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Verify config without saving first</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#00b9cd] transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="recipient@example.com"
                                    className={inputCls()}
                                    onKeyDown={(e) => e.key === "Enter" && handleTest()}
                                />
                            </div>
                            <button
                                onClick={handleTest}
                                disabled={testing}
                                className={`w-full flex items-center justify-center gap-2 py-4 bg-[#00b9cd] hover:bg-[#00b9cd]/80 rounded-10 text-white font-black text-xs uppercase tracking-widest shadow-md border-2 border-transparent hover:border-[#00b9cd]/30 transition-all duration-500 ease-out ${testing ? "opacity-70 animate-pulse" : "hover:-translate-y-1 active:translate-y-0 active:shadow-md"}`}
                            >
                                {testing ? (
                                    <><RefreshCw size={16} className="animate-spin" /> Sendingâ€¦</>
                                ) : (
                                    <><Send size={16} strokeWidth={3} /> Send Test</>
                                )}
                            </button>

                            {testResult && (
                                <div className={`flex items-start gap-3 p-4 rounded-10 border-2 text-sm font-bold ${
                                    testResult.success
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                                        : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                                }`}>
                                    {testResult.success
                                        ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
                                        : <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                    }
                                    <span className="break-words">{testResult.msg}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Reference Card */}
                    <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-8 rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-slate-50 dark:border-white/5">
                            <div className="w-12 h-12 bg-[#00b9cd]/10 rounded-10 flex items-center justify-center text-[#00b9cd] border border-[#00b9cd]/10 shadow-md">
                                <AlertTriangle size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Quick Reference</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Common provider settings</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { name: "Gmail", host: "smtp.gmail.com", port: "587", enc: "TLS", note: "App Password required" },
                                { name: "Outlook / 365", host: "smtp.office365.com", port: "587", enc: "STARTTLS", note: "" },
                                { name: "SendGrid", host: "smtp.sendgrid.net", port: "587", enc: "TLS", note: "Use API key as password" },
                                { name: "Mailgun", host: "smtp.mailgun.org", port: "587", enc: "TLS", note: "" },
                                { name: "Mailtrap (dev)", host: "sandbox.smtp.mailtrap.io", port: "2525", enc: "None", note: "Dev only" },
                            ].map((p) => (
                                <div key={p.name} className="p-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-10 hover:border-[#00b9cd]/30 transition-all duration-300 group cursor-default">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-[#00b9cd] transition-colors">{p.name}</span>
                                        {p.note && <span className="text-[9px] font-black text-[#f06464] uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-10">{p.note}</span>}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 font-mono">{p.host} Â· Port {p.port} Â· {p.enc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MailSettingsPage;


