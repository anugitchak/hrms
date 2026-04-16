import React, { useState, useRef, useCallback } from "react";
import api from "../../../api/axios";
import { useGlobalUI } from "../../../context/GlobalUIContext";
import {
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronRight,
    RotateCcw,
    Loader2,
    Table,
    Eye,
    Zap,
    Info,
    Users,
} from "lucide-react";

const TEMPLATE_COLUMNS = [
    { key: "name", label: "Full Name", required: true, example: "John Doe" },
    { key: "email", label: "Email", required: true, example: "john@company.com" },
    { key: "department_name", label: "Department", required: true, example: "Engineering" },
    { key: "designation_name", label: "Designation", required: true, example: "Software Engineer" },
    { key: "date_of_joining", label: "Joining Date", required: true, example: "2026-04-01" },
    { key: "dob", label: "Date of Birth", required: true, example: "1995-06-15" },
    { key: "phone", label: "Phone (10 digits)", required: true, example: "9876543210" },
    { key: "country_name", label: "Country", required: true, example: "India" },
    { key: "sub_company_name", label: "Sub-Company", required: true, example: "Mind & Matter" },
    { key: "gross_salary", label: "Gross Salary", required: true, example: "50000" },
    { key: "gender", label: "Gender", required: true, example: "Male" },
    { key: "joining_category", label: "Joining Category", required: true, example: "New Joinee" },
    { key: "marital_status", label: "Marital Status", required: false, example: "Single" },
    { key: "address", label: "Address", required: false, example: "123 Main St" },
    { key: "emergency_contact", label: "Emergency Contact", required: false, example: "9123456789" },
    { key: "aadhar_number", label: "Aadhar No.", required: false, example: "123456789012" },
    { key: "pan_number", label: "PAN No.", required: false, example: "ABCDE1234F" },
];

const PHASE = { UPLOAD: 0, PREVIEW: 1, IMPORTING: 2, RESULTS: 3 };

const BulkImportPage = () => {
    const { addToast } = useGlobalUI();
    const fileInputRef = useRef(null);

    const [phase, setPhase] = useState(PHASE.UPLOAD);
    const [file, setFile] = useState(null);
    const [parsedRows, setParsedRows] = useState([]);
    const [parseErrors, setParseErrors] = useState([]);
    const [results, setResults] = useState(null);
    const [importing, setImporting] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // ── CSV Template Download ────────────────────────────────────────────────
    const downloadTemplate = () => {
        const headers = TEMPLATE_COLUMNS.map((c) => c.key).join(",");
        const examples = TEMPLATE_COLUMNS.map((c) => c.example).join(",");
        const csvContent = `${headers}\n${examples}`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "employee_import_template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    // ── CSV Parsing (client-side) ────────────────────────────────────────────
    const parseCSV = useCallback((text) => {
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] };

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
        const requiredKeys = TEMPLATE_COLUMNS.filter((c) => c.required).map((c) => c.key);
        const missingHeaders = requiredKeys.filter((k) => !headers.includes(k));
        if (missingHeaders.length) {
            return { rows: [], errors: [`Missing required columns: ${missingHeaders.join(", ")}`] };
        }

        const rows = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
            if (values.every((v) => !v)) continue;

            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = values[idx] || "";
            });
            obj._row = i + 1;

            // Flag missing required
            const missingFields = requiredKeys.filter((k) => !obj[k]);
            if (missingFields.length) {
                obj._error = `Missing: ${missingFields.join(", ")}`;
                errors.push(`Row ${obj._row}: ${obj._error}`);
            }

            rows.push(obj);
        }

        return { rows, errors };
    }, []);

    const handleFile = useCallback(
        (selectedFile) => {
            if (!selectedFile) return;
            if (!selectedFile.name.endsWith(".csv")) {
                addToast("Please upload a .csv file", "error");
                return;
            }
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (e) => {
                const { rows, errors } = parseCSV(e.target.result);
                setParsedRows(rows);
                setParseErrors(errors);
                setPhase(PHASE.PREVIEW);
            };
            reader.readAsText(selectedFile);
        },
        [parseCSV, addToast]
    );

    // ── Drag & Drop ──────────────────────────────────────────────────────────
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    // ── Import API Call ──────────────────────────────────────────────────────
    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        setPhase(PHASE.IMPORTING);

        try {
            const formData = new FormData();
            formData.append("csv_file", file);
            const res = await api.post("/employees/bulk-import", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResults(res.data);
            setPhase(PHASE.RESULTS);
            addToast(res.data.message, res.data.failed > 0 ? "warning" : "success");
        } catch (err) {
            addToast(err.response?.data?.message || "Import failed", "error");
            setPhase(PHASE.PREVIEW);
        } finally {
            setImporting(false);
        }
    };

    // ── Download Results CSV ─────────────────────────────────────────────────
    const downloadResults = () => {
        if (!results?.results) return;
        const header = "Row,Name,Email,Status,Employee Code,Reason";
        const rows = results.results.map(
            (r) => `${r.row},"${r.name}","${r.email}",${r.status},${r.employee_code || ""},${r.reason || ""}`
        );
        const csvContent = [header, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `import_results_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const resetAll = () => {
        setPhase(PHASE.UPLOAD);
        setFile(null);
        setParsedRows([]);
        setParseErrors([]);
        setResults(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Breadcrumb Steps ─────────────────────────────────────────────────────
    const steps = [
        { label: "Upload CSV", icon: Upload },
        { label: "Preview & Validate", icon: Eye },
        { label: "Import", icon: Zap },
    ];

    return (
        <div className="p-8 max-w-[1500px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
                        Bulk <span className="text-transparent bg-clip-text bg-[#00b9cd]">Import</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-[#f06464] rounded-full shadow-lg shadow-[#f06464]/20" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Mass employee enrollment via CSV
                        </p>
                    </div>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#00b9cd]/30 bg-[#00b9cd]/5 hover:bg-[#00b9cd]/10 text-[#00b9cd] font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 group"
                >
                    <Download size={16} className="group-hover:animate-bounce" />
                    Download Template
                </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-3 mb-10 p-4 bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = phase >= idx;
                    const isCurrent = phase === idx || (phase === PHASE.RESULTS && idx === 2);
                    return (
                        <React.Fragment key={idx}>
                            {idx > 0 && (
                                <div className={`flex-1 h-0.5 transition-all duration-500 ${isActive ? "bg-[#00b9cd]" : "bg-slate-200 dark:bg-white/10"}`} />
                            )}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isCurrent ? "bg-[#00b9cd]/10 text-[#00b9cd]" : isActive ? "text-[#00b9cd]" : "text-slate-400"}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${isCurrent ? "border-[#00b9cd] bg-[#00b9cd] text-white" : isActive ? "border-[#00b9cd]/50 text-[#00b9cd]" : "border-slate-200 dark:border-white/10"}`}>
                                    <Icon size={14} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{step.label}</span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* ═══════════════════════════ PHASE: UPLOAD ══════════════════════════ */}
            {phase === PHASE.UPLOAD && (
                <div className="space-y-8">
                    {/* Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer border-3 border-dashed rounded-2xl p-20 text-center transition-all duration-300 ${
                            dragActive
                                ? "border-[#00b9cd] bg-[#00b9cd]/5 scale-[1.01]"
                                : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:border-[#00b9cd]/50 hover:bg-[#00b9cd]/5"
                        }`}
                    >
                        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#00b9cd]/10 border-2 border-[#00b9cd]/20 flex items-center justify-center transition-all ${dragActive ? "scale-110 rotate-6" : ""}`}>
                            <FileSpreadsheet size={36} className="text-[#00b9cd]" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                            {dragActive ? "Drop your CSV file here" : "Drag & Drop your CSV file here"}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold mb-6">or click to browse • CSV files only • Max 5MB</p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00b9cd] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#00b9cd]/20 hover:-translate-y-0.5 transition-all">
                            <Upload size={14} />
                            Select File
                        </div>
                    </div>

                    {/* Column Reference */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-[#00b9cd]/10 to-transparent border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                            <Table size={18} className="text-[#00b9cd]" />
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required CSV Columns</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Column</th>
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Required</th>
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Example</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {TEMPLATE_COLUMNS.map((col) => (
                                        <tr key={col.key} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-2.5 font-mono font-bold text-slate-900 dark:text-white">{col.key}</td>
                                            <td className="px-5 py-2.5">
                                                {col.required ? (
                                                    <span className="px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full font-black text-[9px] uppercase tracking-widest">Required</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full font-bold text-[9px] uppercase tracking-widest">Optional</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 font-medium">{col.example}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl">
                        <Info size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Important Notes</p>
                            <ul className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold space-y-1 leading-relaxed">
                                <li>• Passwords are <strong>auto-generated</strong> and sent via welcome email</li>
                                <li>• Department and Country must <strong>already exist</strong> in the system (exact name match)</li>
                                <li>• Dates must be in <strong>YYYY-MM-DD</strong> format</li>
                                <li>• Gender must be <strong>Male, Female, or Other</strong></li>
                                <li>• Joining Category must be <strong>New Joinee, Intern, or Permanent</strong></li>
                                <li>• Each failed row does <strong>not block</strong> other rows</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ PHASE: PREVIEW ═════════════════════════ */}
            {phase === PHASE.PREVIEW && (
                <div className="space-y-6">
                    {/* File Info Bar */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#00b9cd]/10 border border-[#00b9cd]/20 flex items-center justify-center">
                                <FileSpreadsheet size={22} className="text-[#00b9cd]" />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white text-sm">{file?.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                    {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} detected •{" "}
                                    {parseErrors.length > 0 ? (
                                        <span className="text-amber-500">{parseErrors.length} warning{parseErrors.length !== 1 ? "s" : ""}</span>
                                    ) : (
                                        <span className="text-emerald-500">All rows valid</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:border-red-400 hover:text-red-500 transition-all">
                                <RotateCcw size={14} />
                                Change File
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={parsedRows.length === 0}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00b9cd] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#00b9cd]/20 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Zap size={14} />
                                Import {parsedRows.length} Employee{parsedRows.length !== 1 ? "s" : ""}
                            </button>
                        </div>
                    </div>

                    {/* Parse Errors */}
                    {parseErrors.length > 0 && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                                <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Validation Warnings</p>
                            </div>
                            <ul className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold space-y-1">
                                {parseErrors.slice(0, 10).map((e, i) => (
                                    <li key={i}>• {e}</li>
                                ))}
                                {parseErrors.length > 10 && <li>... and {parseErrors.length - 10} more</li>}
                            </ul>
                        </div>
                    )}

                    {/* Preview Table */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md overflow-hidden">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                                    <tr className="border-b-2 border-slate-100 dark:border-white/10">
                                        <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">#</th>
                                        {TEMPLATE_COLUMNS.filter(c => c.required).map((col) => (
                                            <th key={col.key} className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px] whitespace-nowrap">
                                                {col.label}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedRows.map((row, idx) => (
                                        <tr key={idx} className={`border-b border-slate-50 dark:border-white/5 transition-colors ${row._error ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                                            <td className="px-4 py-2.5 font-bold text-slate-400">{row._row}</td>
                                            {TEMPLATE_COLUMNS.filter(c => c.required).map((col) => (
                                                <td key={col.key} className={`px-4 py-2.5 font-medium whitespace-nowrap ${!row[col.key] ? "text-red-500" : "text-slate-900 dark:text-white"}`}>
                                                    {row[col.key] || <span className="text-red-400 text-[9px] font-black uppercase">Missing</span>}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2.5">
                                                {row._error ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        <XCircle size={10} />Invalid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 size={10} />Ready
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ PHASE: IMPORTING ═══════════════════════ */}
            {phase === PHASE.IMPORTING && (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-20 h-20 rounded-2xl bg-[#00b9cd]/10 border-2 border-[#00b9cd]/20 flex items-center justify-center mb-8">
                        <Loader2 size={36} className="text-[#00b9cd] animate-spin" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Importing Employees...</h3>
                    <p className="text-xs text-slate-400 font-bold">Creating accounts, calculating salaries, sending welcome emails</p>
                    <div className="mt-6 w-64 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00b9cd] to-[#00b9cd]/60 rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ PHASE: RESULTS ═════════════════════════ */}
            {phase === PHASE.RESULTS && results && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
                                <Users size={22} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{results.succeeded + results.failed}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Processed</p>
                            </div>
                        </div>
                        <div className="p-5 bg-white dark:bg-slate-900/60 rounded-xl border-2 border-emerald-100 dark:border-emerald-500/20 shadow-md flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{results.succeeded}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imported</p>
                            </div>
                        </div>
                        <div className="p-5 bg-white dark:bg-slate-900/60 rounded-xl border-2 border-red-100 dark:border-red-500/20 shadow-md flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center">
                                <XCircle size={22} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-red-600 dark:text-red-400">{results.failed}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button onClick={downloadResults} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#00b9cd]/30 bg-[#00b9cd]/5 text-[#00b9cd] font-black text-xs uppercase tracking-widest hover:bg-[#00b9cd]/10 transition-all">
                            <Download size={14} />
                            Download Results CSV
                        </button>
                        <button onClick={resetAll} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00b9cd] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#00b9cd]/20 hover:-translate-y-0.5 transition-all">
                            <RotateCcw size={14} />
                            Import Another File
                        </button>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border-2 border-slate-100 dark:border-white/5 shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                            <Table size={18} className="text-[#00b9cd]" />
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Import Results</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                                    <tr className="border-b-2 border-slate-100 dark:border-white/10">
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Row</th>
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Name</th>
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Email</th>
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Status</th>
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Emp. Code</th>
                                        <th className="px-5 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.results.map((r, idx) => (
                                        <tr key={idx} className={`border-b border-slate-50 dark:border-white/5 transition-colors ${r.status === "error" ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"}`}>
                                            <td className="px-5 py-3 font-bold text-slate-400">{r.row}</td>
                                            <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{r.name}</td>
                                            <td className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">{r.email}</td>
                                            <td className="px-5 py-3">
                                                {r.status === "success" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Created
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                        Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-mono font-bold text-[#00b9cd]">{r.employee_code || "—"}</td>
                                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-medium max-w-[300px] truncate">
                                                {r.reason || (r.email_sent ? "Welcome email sent" : "Account created")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkImportPage;
