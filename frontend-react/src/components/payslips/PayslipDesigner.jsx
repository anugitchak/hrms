import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Type, Minus, Square, AlignLeft, AlignCenter, AlignRight,
    Bold, Italic, Trash2, Save, Eye, CheckCircle, Sparkles,
    ChevronDown, ChevronUp, Layers, Palette, Plus,
    RotateCcw, RotateCw, FileText, DollarSign, Users, Hash, Briefcase,
    Building, CalendarDays, Clock, PenTool, Download, Upload, Image as ImageIcon, QrCode, ShieldCheck
} from 'lucide-react';

import axios from '../../api/axios';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const CANVAS_W = 794;
const CANVAS_H = 1122;
const MIN_EL_SIZE = 30;

const MOTIVATIONAL_QUOTES = [
    "Your hard work and dedication make a difference every single day.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Great things are not done by impulse, but by a series of small things brought together.",
    "The secret of getting ahead is getting started.",
    "Opportunities don't happen. You create them.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Don't watch the clock; do what it does. Keep going.",
    "It always seems impossible until it's done.",
    "Quality is not an act, it is a habit.",
    "Your dedication fuels our progress. Thank you!",
    "Every pay is a reminder of the value you bring to this team.",
    "Hard work beats talent when talent doesn't work hard.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Dream big, work hard, stay focused, and surround yourself with good people.",
    "You don't have to be great to start, but you have to start to be great.",
    "The best way to predict the future is to create it.",
    "Innovation distinguishes between a leader and a follower.",
    "We appreciate your commitment and contributions to our success!",
];

const DATA_TOKENS = [
    { label: 'Employee Name',   token: '{{employee_name}}' },
    { label: 'Employee Code',   token: '{{employee_code}}' },
    { label: 'Designation',     token: '{{designation}}' },
    { label: 'Department',      token: '{{department}}' },
    { label: 'Month & Year',    token: '{{month_year}}' },
    { label: 'Days Worked',     token: '{{days_worked}}' },
    { label: 'Basic Salary',    token: '{{basic}}' },
    { label: 'HRA',             token: '{{hra}}' },
    { label: 'Gross Salary',    token: '{{gross_salary}}' },
    { label: 'PF Deduction',    token: '{{pf}}' },
    { label: 'ESIC',            token: '{{esic}}' },
    { label: 'PTAX',            token: '{{ptax}}' },
    { label: 'Total Deductions',token: '{{total_deductions}}' },
    { label: 'Net Pay',         token: '{{net_pay}}' },
    { label: 'Bank Name',       token: '{{bank_name}}' },
    { label: 'Account Number',  token: '{{account_number}}' },
    { label: 'IFSC Code',       token: '{{ifsc_code}}' },
    { label: 'Total Leaves',    token: '{{total_leaves}}' },
    { label: 'Leaves Taken',    token: '{{leaves_taken}}' },
    { label: 'Leave Balance',   token: '{{leave_balance}}' },
    { label: 'Present Days',    token: '{{present_days}}' },
    { label: 'Absent Days',     token: '{{absent_days}}' },
    { label: 'Half Days',       token: '{{half_days}}' },
    { label: 'Company Name',    token: '{{company_name}}' },
];

const PALETTE_ITEMS = [
    {
        type: 'text',
        icon: <Type size={15} />, label: 'Text Block',
        defaultContent: 'Edit this text...',
        defaultStyle: { fontSize: 13, color: '#1f2937', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: 'transparent' },
        defaultW: 300, defaultH: 70,
    },
    {
        type: 'company_name',
        icon: <Briefcase size={15} />, label: 'Company Name',
        defaultContent: '{{company_name}}',
        defaultStyle: { fontSize: 20, color: '#0f766e', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', backgroundColor: 'transparent' },
        defaultW: 500, defaultH: 50,
    },
    {
        type: 'heading',
        icon: <Hash size={15} />, label: 'Payslip Heading',
        defaultContent: 'SALARY SLIP — {{month_year}}',
        defaultStyle: { fontSize: 17, color: '#111827', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', backgroundColor: 'transparent' },
        defaultW: 500, defaultH: 46,
    },
    {
        type: 'employee_info',
        icon: <Users size={15} />, label: 'Employee Info',
        defaultContent: 'Name: {{employee_name}}\nCode: {{employee_code}}\nDept: {{department}}\nDesignation: {{designation}}',
        defaultStyle: { fontSize: 12, color: '#374151', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#f9fafb' },
        defaultW: 320, defaultH: 100,
    },
    {
        type: 'earnings_table',
        icon: <DollarSign size={15} />, label: 'Earnings Table',
        defaultContent: 'EARNINGS\nBasic Salary:    {{basic}}\nHRA:             {{hra}}\n─────────────────\nGross Salary:    {{gross_salary}}',
        defaultStyle: { fontSize: 12, color: '#065f46', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#ecfdf5' },
        defaultW: 320, defaultH: 120,
    },
    {
        type: 'deductions_table',
        icon: <FileText size={15} />, label: 'Deductions Table',
        defaultContent: 'DEDUCTIONS\nPF:            {{pf}}\nESIC:          {{esic}}\nPTAX:          {{ptax}}\n─────────────────\nTotal:         {{total_deductions}}',
        defaultStyle: { fontSize: 12, color: '#7f1d1d', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#fef2f2' },
        defaultW: 320, defaultH: 130,
    },
    {
        type: 'net_pay',
        icon: <DollarSign size={15} />, label: 'Net Pay Block',
        defaultContent: 'NET PAY: {{net_pay}}',
        defaultStyle: { fontSize: 22, color: '#ffffff', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', backgroundColor: '#0f766e' },
        defaultW: 400, defaultH: 60,
    },
    {
        type: 'quote',
        icon: <Sparkles size={15} />, label: 'Motivational Quote',
        defaultContent: MOTIVATIONAL_QUOTES[0],
        defaultStyle: { fontSize: 11, color: '#6b7280', fontWeight: 'normal', fontStyle: 'italic', textAlign: 'center', backgroundColor: '#f3f4f6' },
        defaultW: 600, defaultH: 70,
    },
    {
        type: 'bank_details',
        icon: <Building size={15} />, label: 'Bank Details',
        defaultContent: 'BANK DETAILS\nBank Name: {{bank_name}}\nA/C No:    {{account_number}}\nIFSC Code: {{ifsc_code}}',
        defaultStyle: { fontSize: 11, color: '#4b5563', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#f3f4f6' },
        defaultW: 250, defaultH: 80,
    },
    {
        type: 'leave_summary',
        icon: <CalendarDays size={15} />, label: 'Leave Summary',
        defaultContent: 'LEAVE SUMMARY\nTotal Leaves:  {{total_leaves}}\nLeaves Taken:  {{leaves_taken}}\nLeave Balance: {{leave_balance}}',
        defaultStyle: { fontSize: 11, color: '#4b5563', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#e0f2fe' },
        defaultW: 220, defaultH: 80,
    },
    {
        type: 'attendance_summary',
        icon: <Clock size={15} />, label: 'Attendance',
        defaultContent: 'ATTENDANCE\nPresent:   {{present_days}}\nAbsent:    {{absent_days}}\nHalf Days: {{half_days}}',
        defaultStyle: { fontSize: 11, color: '#4b5563', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#fef3c7' },
        defaultW: 220, defaultH: 80,
    },
    {
        type: 'signature',
        icon: <PenTool size={15} />, label: 'Signature Block',
        defaultContent: '\n\n─────────────────\nAuthorized Signatory',
        defaultStyle: { fontSize: 12, color: '#111827', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', backgroundColor: 'transparent' },
        defaultW: 200, defaultH: 80,
    },
    {
        type: 'watermark',
        icon: <Type size={15} />, label: 'Watermark',
        defaultContent: 'CONFIDENTIAL',
        defaultStyle: { fontSize: 72, color: 'rgba(203, 213, 225, 0.3)', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', backgroundColor: 'transparent' },
        defaultW: 600, defaultH: 100,
    },
    {
        type: 'image',
        icon: <ImageIcon size={15} />, label: 'Image / Logo',
        defaultContent: '',
        defaultStyle: { backgroundColor: 'transparent' },
        defaultW: 150, defaultH: 100,
    },
    {
        type: 'qr_code',
        icon: <QrCode size={15} />, label: 'QR Code',
        defaultContent: 'QR',
        defaultStyle: { backgroundColor: '#ffffff', color: '#000000' },
        defaultW: 80, defaultH: 80,
    },
    {
        type: 'badge_paid',
        icon: <ShieldCheck size={15} />, label: 'Paid Badge',
        defaultContent: 'PAID',
        defaultStyle: { fontSize: 16, color: '#047857', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', backgroundColor: '#d1fae5', borderRadius: 9999 },
        defaultW: 100, defaultH: 36,
    },
    {
        type: 'divider',
        icon: <Minus size={15} />, label: 'Divider Line',
        defaultContent: '',
        defaultStyle: { fontSize: 12, color: '#0f766e', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#0f766e' },
        defaultW: 680, defaultH: 3,
    },
    {
        type: 'rectangle',
        icon: <Square size={15} />, label: 'Rectangle',
        defaultContent: '',
        defaultStyle: { fontSize: 12, color: '#374151', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', backgroundColor: '#e5e7eb' },
        defaultW: 200, defaultH: 80,
    },
];

const genId = () => `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function makeElement(type, x, y) {
    const p = PALETTE_ITEMS.find(i => i.type === type);
    return {
        id: genId(),
        type,
        x: Math.max(0, x),
        y: Math.max(0, y),
        w: p?.defaultW ?? 280,
        h: p?.defaultH ?? 80,
        content: p?.defaultContent ?? '',
        style: { ...(p?.defaultStyle ?? {}) },
    };
}

// ─────────────────────────────────────────────────────────
// Handle renders for canvas elements
// ─────────────────────────────────────────────────────────
function CanvasElement({ el, selected, previewMode, onPointerDown }) {
    const isTextEl = el.type !== 'divider' && el.type !== 'rectangle' && el.type !== 'image' && el.type !== 'qr_code';

    return (
        <div
            onMouseDown={(e) => { if (!previewMode) { e.stopPropagation(); onPointerDown(e, el.id, 'move'); } }}
            style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                cursor: previewMode ? 'default' : 'move',
                outline: selected && !previewMode ? '2px solid #0f766e' : '1.5px dashed transparent',
                outlineOffset: 1,
                borderRadius: el.style.borderRadius ?? (el.type === 'divider' ? 0 : 3),
                boxSizing: 'border-box',
                overflow: 'hidden',
                userSelect: 'none',
                backgroundColor: el.style.backgroundColor === 'transparent' ? 'transparent' : (el.style.backgroundColor || 'transparent'),
            }}
        >
            {/* Text content */}
            {isTextEl && (
                <div style={{
                    width: '100%',
                    height: '100%',
                    padding: '6px 9px',
                    fontSize: el.style.fontSize || 13,
                    color: el.style.color || '#1f2937',
                    fontWeight: el.style.fontWeight || 'normal',
                    fontStyle: el.style.fontStyle || 'normal',
                    textAlign: el.style.textAlign || 'left',
                    whiteSpace: 'pre-wrap',
                    boxSizing: 'border-box',
                    lineHeight: 1.55,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: el.type.startsWith('badge') ? 'center' : 'flex-start',
                }}>
                    {el.content}
                </div>
            )}

            {/* Image content */}
            {el.type === 'image' && (
                <div className="w-full h-full flex items-center justify-center relative">
                    {el.content ? (
                        <img src={el.content} alt="element" className="w-full h-full object-contain" draggable={false} />
                    ) : (
                        <div className="flex flex-col items-center text-slate-400 opacity-50">
                            <ImageIcon size={24} />
                            <span className="text-[10px] mt-1 font-black uppercase">No Image</span>
                        </div>
                    )}
                </div>
            )}

            {/* QR Code Placeholder */}
            {el.type === 'qr_code' && (
                <div className="w-full h-full flex items-center justify-center p-2 border-4 border-[currentColor] bg-[currentColor] bg-opacity-10" style={{ color: el.style.color || '#1f2937' }}>
                    <QrCode size="100%" strokeWidth={1} />
                </div>
            )}

            {/* Resize handles — only when selected and not preview */}
            {selected && !previewMode && ['se', 'sw', 'ne', 'nw', 'e', 's'].map(corner => {
                const style = {
                    position: 'absolute',
                    width: 9, height: 9,
                    background: '#0f766e',
                    border: '1.5px solid #fff',
                    borderRadius: 2,
                    zIndex: 10,
                    cursor: `${corner}-resize`,
                };
                if (corner.includes('e') && !corner.includes('n') && !corner.includes('s')) { style.right = -4; style.top = '50%'; style.transform = 'translateY(-50%)'; }
                if (corner.includes('s') && !corner.includes('e') && !corner.includes('w')) { style.bottom = -4; style.left = '50%'; style.transform = 'translateX(-50%)'; }
                if (corner === 'se') { style.right = -4; style.bottom = -4; }
                if (corner === 'sw') { style.left = -4; style.bottom = -4; }
                if (corner === 'ne') { style.right = -4; style.top = -4; }
                if (corner === 'nw') { style.left = -4; style.top = -4; }
                return (
                    <div key={corner} style={style}
                        onMouseDown={e => { e.stopPropagation(); onPointerDown(e, el.id, corner); }}
                    />
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Properties panel
// ─────────────────────────────────────────────────────────
function PropertiesPanel({ element, isSuperAdmin, onChange, onDelete }) {
    const [quoteOpen, setQuoteOpen] = useState(false);
    const [tokenOpen, setTokenOpen] = useState(false);

    if (!element) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 opacity-40">
                    <Layers size={40} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 max-w-[150px]">Select an element on the canvas to edit its properties</p>
            </div>
        );
    }

    const s = element.style;
    const isShape = element.type === 'divider' || element.type === 'rectangle';
    const isImageOrQR = element.type === 'image' || element.type === 'qr_code';
    const isTextEl = !isShape && !isImageOrQR;

    const updStyle = (key, val) => onChange({ ...element, style: { ...s, [key]: val } });
    const updContent = val => onChange({ ...element, content: val });
    const updPos = (key, val) => onChange({ ...element, [key]: Math.max(key === 'w' || key === 'h' ? MIN_EL_SIZE : 0, parseInt(val) || 0) });

    return (
        <div className="overflow-y-auto h-full p-5 flex flex-col gap-5 custom-scrollbar">
            {/* Content textarea */}
            {isTextEl && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content</label>
                    <textarea
                        value={element.content || ''}
                        rows={4}
                        disabled={!isSuperAdmin}
                        onChange={e => updContent(e.target.value)}
                        className="w-full text-[11px] font-black leading-relaxed border-2 border-slate-900/10 dark:border-white/10 rounded-2xl p-3 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white resize-y outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all disabled:opacity-50"
                    />
                </div>
            )}

            {/* Image Upload */}
            {element.type === 'image' && isSuperAdmin && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Image Source</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => updContent(ev.target.result);
                            reader.readAsDataURL(file);
                        }}
                        className="w-full text-[10px] font-black file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl p-2 text-slate-900 dark:text-white outline-none cursor-pointer"
                    />
                </div>
            )}

            {/* Quote picker */}
            {element.type === 'quote' && isSuperAdmin && (
                <div>
                    <button onClick={() => setQuoteOpen(v => !v)}
                        className="flex items-center gap-2 text-[10px] font-black text-teal-600 dark:text-teal-400 tracking-widest uppercase hover:underline">
                        <Sparkles size={12} /> Pick from quote bank {quoteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {quoteOpen && (
                        <div className="mt-2 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-white dark:bg-slate-900 shadow-xl">
                            {MOTIVATIONAL_QUOTES.map((q, i) => (
                                <div key={i} onClick={() => { updContent(q); setQuoteOpen(false); }}
                                    className="text-[10px] font-bold px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer border-b-2 border-slate-900/5 dark:border-white/5 last:border-0 text-slate-600 dark:text-slate-300">
                                    {q.length > 58 ? q.slice(0, 58) + '…' : q}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Data token inserter */}
            {!isShape && isSuperAdmin && (
                <div>
                    <button onClick={() => setTokenOpen(v => !v)}
                        className="flex items-center gap-2 text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-widest uppercase hover:underline">
                        <Hash size={12} /> Insert data token {tokenOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {tokenOpen && (
                        <div className="mt-2 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-white dark:bg-slate-900 shadow-xl">
                            {DATA_TOKENS.map((t, i) => (
                                <div key={i}
                                    onClick={() => { updContent((element.content || '') + t.token); setTokenOpen(false); }}
                                    className="flex items-center justify-between text-[10px] font-bold px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer border-b-2 border-slate-900/5 dark:border-white/5 last:border-0">
                                    <span className="text-slate-600 dark:text-slate-300">{t.label}</span>
                                    <code className="bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-300 transform scale-90">{t.token}</code>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* Font Size */}
                {(isTextEl || element.type === 'badge_paid') && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Size (px)</label>
                        <input type="number" min={7} max={72} value={s.fontSize || 13}
                            disabled={!isSuperAdmin}
                            onChange={e => updStyle('fontSize', parseInt(e.target.value) || 13)}
                            className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-teal-500 transition-all disabled:opacity-50" />
                    </div>
                )}

                {/* Text colour */}
                {!isShape && element.type !== 'image' && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl p-1 pr-2">
                             <input type="color" value={s.color || '#1f2937'}
                                disabled={!isSuperAdmin}
                                onChange={e => updStyle('color', e.target.value)}
                                className="w-8 h-7 rounded-lg cursor-pointer bg-transparent overflow-hidden" />
                             <span className="text-[10px] font-black text-slate-400">{s.color || '#1f2937'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Background colour */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Background</label>
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl p-1 pr-3">
                        <input type="color"
                            value={(!s.backgroundColor || s.backgroundColor === 'transparent') ? '#ffffff' : s.backgroundColor}
                            disabled={!isSuperAdmin}
                            onChange={e => updStyle('backgroundColor', e.target.value)}
                            className="w-10 h-8 rounded-lg cursor-pointer bg-transparent overflow-hidden" />
                        <span className="text-[10px] font-black text-slate-400 truncate">{s.backgroundColor || 'transparent'}</span>
                    </div>
                    {isSuperAdmin && s.backgroundColor && s.backgroundColor !== 'transparent' && (
                        <button onClick={() => updStyle('backgroundColor', 'transparent')}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Bold / Italic / Align */}
            {(isTextEl || element.type === 'badge_paid') && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Typography & Alignment</label>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 border-2 border-slate-900/5 dark:border-white/5">
                            <button disabled={!isSuperAdmin}
                                onClick={() => updStyle('fontWeight', s.fontWeight === 'bold' ? 'normal' : 'bold')}
                                className={`p-2 rounded-lg transition-all ${s.fontWeight === 'bold' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                                <Bold size={14} strokeWidth={3} />
                            </button>
                            <button disabled={!isSuperAdmin}
                                onClick={() => updStyle('fontStyle', s.fontStyle === 'italic' ? 'normal' : 'italic')}
                                className={`p-2 rounded-lg transition-all ${s.fontStyle === 'italic' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                                <Italic size={14} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 border-2 border-slate-900/5 dark:border-white/5">
                            {['left', 'center', 'right'].map(align => {
                                const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                                return (
                                    <button key={align} disabled={!isSuperAdmin}
                                        onClick={() => updStyle('textAlign', align)}
                                        className={`p-2 rounded-lg transition-all ${s.textAlign === align ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <Icon size={14} strokeWidth={3} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Position & Size */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position & Dimensions</label>
                <div className="grid grid-cols-2 gap-3">
                    {[['X Axis', 'x'], ['Y Axis', 'y'], ['Width', 'w'], ['Height', 'h']].map(([lbl, key]) => (
                        <div key={key} className="space-y-1">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{lbl}</span>
                            <input type="number" value={Math.round(element[key] ?? 0)}
                                disabled={!isSuperAdmin}
                                onChange={e => updPos(key, e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl px-3 py-2 text-[11px] font-black text-slate-900 dark:text-white outline-none focus:border-teal-500 transition-all disabled:opacity-50" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete */}
            {isSuperAdmin && (
                <button onClick={onDelete}
                    className="flex items-center justify-center gap-3 px-6 py-3.5 bg-red-500 hover:bg-red-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.25)] hover:-translate-y-1 active:translate-y-0 active:shadow-none w-full mt-4">
                    <Trash2 size={16} strokeWidth={3} /> Delete Element
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Main Designer
// ─────────────────────────────────────────────────────────
export default function PayslipDesigner({ isSuperAdmin = false, readOnly = true }) {
    const [elements, setElements] = useState([]);
    const [canvasBg, setCanvasBg] = useState('#ffffff');
    const [selectedId, setSelectedId] = useState(null);
    const [templateName, setTemplateName] = useState('New Payslip Template');
    const [templateId, setTemplateId] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [saving, setSaving] = useState(false);
    const [activating, setActivating] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [loadOpen, setLoadOpen] = useState(false);
    const [toast, setToast] = useState(null);

    // History for undo/redo
    const historyRef = useRef([[]]); // array of snapshots
    const histIdxRef = useRef(0);

    const canvasRef = useRef(null);
    // Drag state stored in ref (avoids stale closure issues)
    const drag = useRef({ active: false, handle: null, elId: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 });

    const fileInputRef = useRef(null);

    const handleExportTemplate = () => {
        const payload = {
            version: "1.0",
            name: templateName,
            background_color: canvasBg,
            design_data: elements
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${templateName.replace(/\s+/g, '_')}_template.json`);
        document.body.appendChild(downloadAnchorNode); 
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast('Template exported successfully!', 'success');
    };

    const handleImportTemplate = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (json && Array.isArray(json.design_data)) {
                    setElements(json.design_data);
                    setCanvasBg(json.background_color || '#ffffff');
                    setTemplateName(json.name || 'Imported Template');
                    setTemplateId(null);
                    setSelectedId(null);
                    historyRef.current = [[], JSON.parse(JSON.stringify(json.design_data))];
                    histIdxRef.current = 1;
                    showToast('Template imported successfully!', 'success');
                } else {
                    showToast('Invalid template file format.', 'error');
                }
            } catch (error) {
                showToast('Error parsing template file.', 'error');
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsText(file);
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── History helpers ─────────────────────────────────
    const snapshot = useCallback((els) => {
        const clone = JSON.parse(JSON.stringify(els));
        historyRef.current = historyRef.current.slice(0, histIdxRef.current + 1);
        historyRef.current.push(clone);
        histIdxRef.current = historyRef.current.length - 1;
    }, []);

    const commitElements = useCallback((newEls) => {
        setElements(newEls);
        snapshot(newEls);
    }, [snapshot]);

    const undo = useCallback(() => {
        if (histIdxRef.current > 0) {
            histIdxRef.current -= 1;
            setElements(JSON.parse(JSON.stringify(historyRef.current[histIdxRef.current])));
            setSelectedId(null);
        }
    }, []);

    const redo = useCallback(() => {
        if (histIdxRef.current < historyRef.current.length - 1) {
            histIdxRef.current += 1;
            setElements(JSON.parse(JSON.stringify(historyRef.current[histIdxRef.current])));
            setSelectedId(null);
        }
    }, []);

    // ── Load templates on mount ──────────────────────────
    useEffect(() => {
        axios.get('/payslip-templates')
            .then(r => setTemplates(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});

        axios.get('/payslip-templates/active')
            .then(r => {
                const t = r.data;
                if (t && t.id) {
                    // DB column is `design_data`, bg is `background_color`
                    const els = Array.isArray(t.design_data) ? t.design_data : [];
                    setElements(els);
                    setCanvasBg(t.background_color || '#ffffff');
                    setTemplateName(t.name || 'Active Template');
                    setTemplateId(t.id);
                    historyRef.current = [[], JSON.parse(JSON.stringify(els))];
                    histIdxRef.current = 1;
                }
            })
            .catch(() => {}); // no active template is fine — start blank
    }, []);

    // ── Selected element ────────────────────────────────
    const selectedEl = elements.find(e => e.id === selectedId) ?? null;

    // ── Palette drag start ──────────────────────────────
    const onPaletteDragStart = (e, type) => {
        e.dataTransfer.setData('dsn_type', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    // ── Canvas drop ─────────────────────────────────────
    const onCanvasDrop = useCallback((e) => {
        e.preventDefault();
        if (!isSuperAdmin || readOnly) return;
        const type = e.dataTransfer.getData('dsn_type');
        if (!type) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const scaleX = CANVAS_W / rect.width;
        const scaleY = CANVAS_H / rect.height;
        const p = PALETTE_ITEMS.find(i => i.type === type);
        const elW = p?.defaultW ?? 280;
        const elH = p?.defaultH ?? 80;
        const dropX = (e.clientX - rect.left) * scaleX - elW / 2;
        const dropY = (e.clientY - rect.top) * scaleY - elH / 2;
        const el = makeElement(type, Math.max(0, Math.min(CANVAS_W - elW, dropX)), Math.max(0, Math.min(CANVAS_H - elH, dropY)));
        const next = [...elements, el];
        commitElements(next);
        setSelectedId(el.id);
    }, [isSuperAdmin, readOnly, elements, commitElements]);

    // ── Element mouse-down (move or resize) ─────────────
    const onElementPointerDown = useCallback((e, id, handle) => {
        if (!isSuperAdmin || readOnly) return;
        e.preventDefault();
        const el = elements.find(el => el.id === id);
        if (!el) return;

        setSelectedId(id); // Set selection when clicking to drag

        drag.current = {
            active: true,
            handle,
            elId: id,
            startX: e.clientX,
            startY: e.clientY,
            origX: el.x,
            origY: el.y,
            origW: el.w,
            origH: el.h,
        };
    }, [isSuperAdmin, readOnly, elements]);

    // ── Global mouse move ────────────────────────────────
    useEffect(() => {
        const onMove = (e) => {
            if (!drag.current.active) return;
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const scaleX = CANVAS_W / rect.width;
            const scaleY = CANVAS_H / rect.height;
            const dx = (e.clientX - drag.current.startX) * scaleX;
            const dy = (e.clientY - drag.current.startY) * scaleY;
            const { handle, elId, origX, origY, origW, origH } = drag.current;

            setElements(prev => prev.map(el => {
                if (el.id !== elId) return el;
                if (handle === 'move') {
                    return {
                        ...el,
                        x: Math.max(0, Math.min(CANVAS_W - el.w, origX + dx)),
                        y: Math.max(0, Math.min(CANVAS_H - el.h, origY + dy)),
                    };
                }
                // Resize
                let { x, y, w, h } = { x: origX, y: origY, w: origW, h: origH };
                if (handle === 'e')  { w = Math.max(MIN_EL_SIZE, origW + dx); }
                if (handle === 's')  { h = Math.max(MIN_EL_SIZE, origH + dy); }
                if (handle === 'se') { w = Math.max(MIN_EL_SIZE, origW + dx); h = Math.max(MIN_EL_SIZE, origH + dy); }
                if (handle === 'sw') { x = origX + dx; w = Math.max(MIN_EL_SIZE, origW - dx); h = Math.max(MIN_EL_SIZE, origH + dy); }
                if (handle === 'ne') { y = origY + dy; w = Math.max(MIN_EL_SIZE, origW + dx); h = Math.max(MIN_EL_SIZE, origH - dy); }
                if (handle === 'nw') { x = origX + dx; y = origY + dy; w = Math.max(MIN_EL_SIZE, origW - dx); h = Math.max(MIN_EL_SIZE, origH - dy); }
                return { ...el, x, y, w, h };
            }));
        };

        const onUp = () => {
            if (!drag.current.active) return;
            drag.current.active = false;
            // Commit as a history snapshot on mouse-up
            setElements(prev => {
                snapshot(prev);
                return prev;
            });
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [snapshot]);

    // ── Element property update ──────────────────────────
    const handleElementChange = useCallback((updated) => {
        const next = elements.map(e => e.id === updated.id ? updated : e);
        commitElements(next);
    }, [elements, commitElements]);

    const handleDeleteSelected = useCallback(() => {
        if (!selectedId) return;
        const next = elements.filter(e => e.id !== selectedId);
        commitElements(next);
        setSelectedId(null);
    }, [selectedId, elements, commitElements]);

    // ── Save ─────────────────────────────────────────────
    const handleSave = async () => {
        if (!isSuperAdmin) return;
        setSaving(true);
        try {
            // Use actual DB column names: design_data, background_color
            const payload = {
                name:             templateName,
                design_data:      elements,
                background_color: canvasBg,
            };
            if (templateId) {
                await axios.put(`/payslip-templates/${templateId}`, payload);
                showToast('✅ Template saved successfully!');
            } else {
                const r = await axios.post('/payslip-templates', payload);
                setTemplateId(r.data?.template?.id ?? null);
                showToast('✅ Template created!');
            }
            const list = await axios.get('/payslip-templates');
            setTemplates(Array.isArray(list.data) ? list.data : []);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Save failed. Please try again.';
            showToast(`❌ ${msg}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Activate ─────────────────────────────────────────
    const handleActivate = async () => {
        if (!templateId || !isSuperAdmin) return;
        setActivating(true);
        try {
            await axios.post(`/payslip-templates/${templateId}/activate`);
            showToast('🎉 Template is now Active! Payslips will use this design.');
            const list = await axios.get('/payslip-templates');
            setTemplates(Array.isArray(list.data) ? list.data : []);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Activation failed.';
            showToast(`❌ ${msg}`, 'error');
        } finally {
            setActivating(false);
        }
    };

    // ── Load saved template ───────────────────────────────
    const handleLoadTemplate = async (t) => {
        try {
            // Fetch full template (the index only returns summary fields)
            const r = await axios.get(`/payslip-templates/${t.id}`);
            const full = r.data;
            const els = Array.isArray(full.design_data) ? full.design_data : [];
            setElements(els);
            setCanvasBg(full.background_color || '#ffffff');
            setTemplateName(full.name || 'Template');
            setTemplateId(full.id);
            setSelectedId(null);
            historyRef.current = [[], JSON.parse(JSON.stringify(els))];
            histIdxRef.current = 1;
            setLoadOpen(false);
            showToast(`📂 Loaded: ${full.name}`);
        } catch {
            showToast('❌ Failed to load template', 'error');
        }
    };

    const handleNew = () => {
        setElements([]);
        setTemplateName('New Payslip Template');
        setTemplateId(null);
        setCanvasBg('#ffffff');
        setSelectedId(null);
        historyRef.current = [[]];
        histIdxRef.current = 0;
        setLoadOpen(false);
    };

    // ─────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6" style={{ minHeight: 600 }}>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] text-white text-sm font-black uppercase tracking-widest animate-in slide-in-from-right duration-300 ${toast.type === 'error' ? 'bg-red-500' : 'bg-teal-600'}`}>
                    <div className="flex items-center gap-3">
                        {toast.type === 'error' ? <Trash2 size={20} /> : <CheckCircle size={20} />}
                        {toast.msg}
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-md p-4 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.2)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] border-2 border-slate-900/10 dark:border-white/10 flex items-center gap-4 flex-wrap shrink-0">
                {/* Template name */}
                {isSuperAdmin ? (
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                            <FileText size={16} />
                        </div>
                        <input 
                            value={templateName} 
                            onChange={e => setTemplateName(e.target.value)}
                            placeholder="Template Name..."
                            className="bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all w-64" 
                        />
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                        <FileText size={16} className="text-teal-500" />
                        <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[200px]">{templateName}</span>
                    </div>
                )}

                <div className="w-px h-8 bg-slate-900/10 dark:bg-white/10 hidden sm:block" />

                {/* Canvas background UI */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl p-1.5 pr-3">
                        <div className="p-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10">
                             <Palette size={14} className="text-teal-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">BG:</span>
                        <input 
                            type="color" 
                            value={canvasBg} 
                            onChange={e => setCanvasBg(e.target.value)}
                            className="w-10 h-7 border-2 border-slate-900/10 dark:border-white/10 rounded-lg cursor-pointer bg-transparent overflow-hidden" 
                        />
                    </div>
                )}

                {/* Undo / Redo */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border-2 border-slate-900/10 dark:border-white/10 rounded-xl p-1">
                        <button onClick={undo} title="Undo (Ctrl+Z)"
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-teal-500 transition-all disabled:opacity-30">
                            <RotateCcw size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={redo} title="Redo"
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-teal-500 transition-all disabled:opacity-30">
                            <RotateCw size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                    <div className="w-px h-8 bg-slate-900/10 dark:bg-white/10 hidden lg:block" />

                    {/* Import / Export */}
                    {isSuperAdmin && !readOnly && !previewMode && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="file" 
                                accept=".json" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleImportTemplate} 
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                title="Import Template (JSON)"
                                className="group flex items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 text-slate-500 hover:text-teal-600 hover:border-teal-500/30 transition-all shadow-sm shadow-[2px_2px_0px_0px_rgba(71,85,105,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(13,148,136,0.15)] hover:-translate-y-0.5"
                            >
                                <Upload size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                            </button>
                            <button 
                                onClick={handleExportTemplate}
                                title="Export Template (JSON)"
                                className="group flex items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 text-slate-500 hover:text-teal-600 hover:border-teal-500/30 transition-all shadow-sm shadow-[2px_2px_0px_0px_rgba(71,85,105,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(13,148,136,0.15)] hover:-translate-y-0.5"
                            >
                                <Download size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    )}

                    <div className="w-px h-8 bg-slate-900/10 dark:bg-white/10 hidden lg:block" />

                    {/* Undo/Redo/Preview Modes */}
                <button 
                    onClick={() => { setPreviewMode(p => !p); setSelectedId(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 
                        ${previewMode 
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-[4px_4px_0px_0px_rgba(79,70,229,0.3)]' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-900/10 dark:border-white/10 hover:border-teal-500/50 hover:bg-teal-50 dark:hover:bg-teal-900/10'}`}
                >
                    <Eye size={16} strokeWidth={2.5} /> {previewMode ? 'Exit Preview' : 'Preview'}
                </button>

                {/* Load template */}
                {isSuperAdmin && (
                    <div className="relative">
                        <button 
                            onClick={() => setLoadOpen(o => !o)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-teal-500/50 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all"
                        >
                            <Layers size={16} strokeWidth={2.5} /> Load
                        </button>
                        {loadOpen && (
                            <div className="absolute top-14 left-0 z-[60] w-72 bg-white dark:bg-slate-900 border-2 border-slate-900/20 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-900/10 dark:border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Templates</span>
                                    <button onClick={handleNew} className="flex items-center gap-1.5 text-xs font-black text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors">
                                        <Plus size={14} strokeWidth={3} /> NEW
                                    </button>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-2">
                                    {templates.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                                            <FileText size={24} className="opacity-20" />
                                            <p className="text-[10px] font-black uppercase">No saved templates</p>
                                        </div>
                                    ) : templates.map(t => (
                                        <div key={t.id} onClick={() => handleLoadTemplate(t)}
                                            className="group flex items-center justify-between mx-1 px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-2xl cursor-pointer transition-all border-2 border-transparent hover:border-teal-500/20">
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate group-hover:text-teal-600">{t.name}</span>
                                            {t.is_active && (
                                                <span className="ml-2 shrink-0 text-[8px] bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="ml-auto flex items-center gap-3">
                    {/* Save */}
                    {isSuperAdmin && (
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(13,148,136,0.2)] hover:-translate-y-1 active:translate-y-0 disabled:translate-y-0 disabled:shadow-none"
                        >
                            <Save size={16} strokeWidth={2.5} /> {saving ? 'Saving…' : 'Save'}
                        </button>
                    )}
                    {/* Activate */}
                    {isSuperAdmin && templateId && (
                        <button 
                            onClick={handleActivate} 
                            disabled={activating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)] hover:-translate-y-1 active:translate-y-0 disabled:translate-y-0 disabled:shadow-none"
                        >
                            <CheckCircle size={16} strokeWidth={2.5} /> {activating ? 'Activating…' : 'Activate'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 gap-6 overflow-hidden min-h-0 pb-2">

                {/* Left palette */}
                {!previewMode && (
                    <div className="w-56 shrink-0 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border-2 border-slate-900/10 dark:border-white/10 rounded-3xl shadow-[4px_4px_0px_0px_rgba(71,85,105,0.15)] overflow-hidden flex flex-col">
                        <div className="bg-slate-50 dark:bg-white/5 px-4 py-3 border-b-2 border-slate-900/10 dark:border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Element Palette</p>
                        </div>
                        <div className="px-3 py-4 flex flex-col gap-2.5 overflow-y-auto">
                            {PALETTE_ITEMS.map(item => (
                                <div
                                    key={item.type}
                                    draggable={isSuperAdmin && !readOnly}
                                    onDragStart={e => onPaletteDragStart(e, item.type)}
                                    className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border-2 select-none transition-all duration-300
                                        ${isSuperAdmin && !readOnly
                                            ? 'border-slate-900/10 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 cursor-grab hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-500/30 hover:shadow-[4px_4px_0px_0px_rgba(13,148,136,0.1)] hover:-translate-y-0.5 active:cursor-grabbing active:scale-95'
                                            : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                                        }`
                                    }
                                >
                                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10 group-hover:border-teal-500/30 group-hover:bg-white transition-colors">
                                        <span className="text-teal-600 dark:text-teal-400 shrink-0">{item.icon}</span>
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-wider leading-snug">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        {!isSuperAdmin && (
                            <div className="mx-2 mt-1 mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                                ✦ Template designs are managed by the Super Admin only.
                            </div>
                        )}
                    </div>
                )}

                {/* Center Canvas */}
                <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/40 rounded-3xl border-2 border-slate-900/10 dark:border-white/10 shadow-inner flex justify-center p-8 custom-scrollbar">
                    <div
                        ref={canvasRef}
                        onDragOver={e => e.preventDefault()}
                        onDrop={onCanvasDrop}
                        onMouseDown={() => setSelectedId(null)}
                        className="relative shrink-0 shadow-2xl transition-all duration-300 ring-2 ring-slate-900/5 dark:ring-white/5"
                        style={{
                            width: CANVAS_W,
                            height: CANVAS_H,
                            backgroundColor: canvasBg,
                            transform: previewMode ? 'scale(1)' : 'scale(1)',
                            transformOrigin: 'top center',
                        }}
                    >
                        {/* Background Grid (Dots) */}
                        {!previewMode && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]" 
                                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                        )}

                        {elements.map(el => (
                            <CanvasElement
                                key={el.id}
                                el={el}
                                selected={el.id === selectedId}
                                previewMode={previewMode}
                                onPointerDown={onElementPointerDown}
                            />
                        ))}

                        {elements.length === 0 && !previewMode && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
                                <Sparkles size={52} className="text-gray-300 dark:text-gray-600" />
                                <p className="text-gray-300 dark:text-gray-600 text-lg font-medium">Drag elements here to start designing</p>
                                <p className="text-gray-300 dark:text-gray-600 text-sm">Use data tokens like {'{{employee_name}}'} for dynamic content</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right properties panel */}
                {!previewMode && (
                    <div className="w-56 shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                        <PropertiesPanel
                            element={selectedEl}
                            isSuperAdmin={isSuperAdmin}
                            onChange={handleElementChange}
                            onDelete={handleDeleteSelected}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
