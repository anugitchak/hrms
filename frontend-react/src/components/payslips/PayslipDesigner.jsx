import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Type, Minus, Square, AlignLeft, AlignCenter, AlignRight,
    Bold, Italic, Trash2, Save, Eye, CheckCircle, Sparkles,
    ChevronDown, ChevronUp, Layers, Palette, Plus,
    RotateCcw, RotateCw, FileText, DollarSign, Users, Hash, Briefcase
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
    const isTextEl = el.type !== 'divider' && el.type !== 'rectangle';

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
                borderRadius: el.type === 'divider' ? 0 : 3,
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
                }}>
                    {el.content}
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
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400 dark:text-gray-600 gap-3">
                <Layers size={30} className="opacity-30" />
                <p className="text-xs">Select an element on the canvas to edit its properties</p>
            </div>
        );
    }

    const s = element.style;
    const isShape = element.type === 'divider' || element.type === 'rectangle';

    const updStyle = (key, val) => onChange({ ...element, style: { ...s, [key]: val } });
    const updContent = val => onChange({ ...element, content: val });
    const updPos = (key, val) => onChange({ ...element, [key]: Math.max(key === 'w' || key === 'h' ? MIN_EL_SIZE : 0, parseInt(val) || 0) });

    return (
        <div className="overflow-y-auto h-full p-3 flex flex-col gap-3 text-sm">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-teal-600 dark:text-teal-400 border-b border-gray-200 dark:border-gray-700 pb-1.5">
                Properties
            </p>

            {/* Content textarea */}
            {!isShape && (
                <div>
                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Content</label>
                    <textarea
                        value={element.content || ''}
                        rows={4}
                        disabled={!isSuperAdmin}
                        onChange={e => updContent(e.target.value)}
                        className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                    />
                </div>
            )}

            {/* Quote picker */}
            {element.type === 'quote' && isSuperAdmin && (
                <div>
                    <button onClick={() => setQuoteOpen(v => !v)}
                        className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium hover:underline">
                        <Sparkles size={11} /> Pick from quote bank {quoteOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {quoteOpen && (
                        <div className="mt-1.5 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                            {MOTIVATIONAL_QUOTES.map((q, i) => (
                                <div key={i} onClick={() => { updContent(q); setQuoteOpen(false); }}
                                    className="text-[11px] px-2.5 py-2 hover:bg-teal-50 dark:hover:bg-teal-900/30 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 text-gray-700 dark:text-gray-300">
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
                        className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium hover:underline">
                        <Hash size={11} /> Insert data token {tokenOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {tokenOpen && (
                        <div className="mt-1.5 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                            {DATA_TOKENS.map((t, i) => (
                                <div key={i}
                                    onClick={() => { updContent((element.content || '') + t.token); setTokenOpen(false); }}
                                    className="flex items-center justify-between text-[11px] px-2.5 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
                                    <span className="text-gray-700 dark:text-gray-300">{t.label}</span>
                                    <code className="text-purple-500 text-[10px] ml-1">{t.token}</code>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Font Size */}
            {!isShape && (
                <div className="flex items-center gap-2">
                    <label className="text-[11px] text-gray-500 dark:text-gray-400 w-16 shrink-0">Font Size</label>
                    <input type="number" min={7} max={72} value={s.fontSize || 13}
                        disabled={!isSuperAdmin}
                        onChange={e => updStyle('fontSize', parseInt(e.target.value) || 13)}
                        className="flex-1 border border-gray-200 dark:border-gray-600 rounded p-1 text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 disabled:opacity-50" />
                    <span className="text-[11px] text-gray-400">px</span>
                </div>
            )}

            {/* Text colour */}
            {!isShape && (
                <div className="flex items-center gap-2">
                    <label className="text-[11px] text-gray-500 dark:text-gray-400 w-16 shrink-0">Text Color</label>
                    <input type="color" value={s.color || '#1f2937'}
                        disabled={!isSuperAdmin}
                        onChange={e => updStyle('color', e.target.value)}
                        className="w-8 h-7 border border-gray-200 rounded cursor-pointer disabled:opacity-50" />
                </div>
            )}

            {/* Background colour */}
            <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-500 dark:text-gray-400 w-16 shrink-0">Background</label>
                <input type="color"
                    value={(!s.backgroundColor || s.backgroundColor === 'transparent') ? '#ffffff' : s.backgroundColor}
                    disabled={!isSuperAdmin}
                    onChange={e => updStyle('backgroundColor', e.target.value)}
                    className="w-8 h-7 border border-gray-200 rounded cursor-pointer disabled:opacity-50" />
                {isSuperAdmin && s.backgroundColor && s.backgroundColor !== 'transparent' && (
                    <button onClick={() => updStyle('backgroundColor', 'transparent')}
                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">none</button>
                )}
            </div>

            {/* Bold / Italic / Align */}
            {!isShape && (
                <div>
                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Style & Align</label>
                    <div className="flex flex-wrap gap-1">
                        <button disabled={!isSuperAdmin}
                            onClick={() => updStyle('fontWeight', s.fontWeight === 'bold' ? 'normal' : 'bold')}
                            className={`p-1.5 rounded border text-xs transition-colors disabled:opacity-50 ${s.fontWeight === 'bold' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                            <Bold size={12} />
                        </button>
                        <button disabled={!isSuperAdmin}
                            onClick={() => updStyle('fontStyle', s.fontStyle === 'italic' ? 'normal' : 'italic')}
                            className={`p-1.5 rounded border text-xs transition-colors disabled:opacity-50 ${s.fontStyle === 'italic' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                            <Italic size={12} />
                        </button>
                        {['left', 'center', 'right'].map(align => {
                            const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                            return (
                                <button key={align} disabled={!isSuperAdmin}
                                    onClick={() => updStyle('textAlign', align)}
                                    className={`p-1.5 rounded border text-xs transition-colors disabled:opacity-50 ${s.textAlign === align ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                                    <Icon size={12} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Position & Size */}
            <div>
                <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Position & Size</label>
                <div className="grid grid-cols-2 gap-1">
                    {[['X', 'x'], ['Y', 'y'], ['W', 'w'], ['H', 'h']].map(([lbl, key]) => (
                        <div key={key} className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 w-3.5">{lbl}</span>
                            <input type="number" value={Math.round(element[key] ?? 0)}
                                disabled={!isSuperAdmin}
                                onChange={e => updPos(key, e.target.value)}
                                className="flex-1 border border-gray-200 dark:border-gray-600 rounded p-1 text-[10px] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 disabled:opacity-50" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete */}
            {isSuperAdmin && (
                <button onClick={onDelete}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 text-xs font-medium transition-colors w-full mt-auto">
                    <Trash2 size={13} /> Delete Element
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
        <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: 500 }}>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium animate-pulse ${toast.type === 'error' ? 'bg-red-600' : 'bg-teal-600'}`}>
                    {toast.msg}
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-wrap shrink-0">
                {/* Template name */}
                {isSuperAdmin ? (
                    <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm font-semibold bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 w-52" />
                ) : (
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]">{templateName}</span>
                )}

                <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

                {/* Canvas background */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-1.5">
                        <Palette size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">BG:</span>
                        <input type="color" value={canvasBg} onChange={e => setCanvasBg(e.target.value)}
                            className="w-7 h-7 border border-gray-200 rounded cursor-pointer p-0" />
                    </div>
                )}

                {/* Undo / Redo */}
                {isSuperAdmin && (
                    <>
                        <button onClick={undo} title="Undo (Ctrl+Z)"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-30">
                            <RotateCcw size={14} />
                        </button>
                        <button onClick={redo} title="Redo"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                            <RotateCw size={14} />
                        </button>
                    </>
                )}

                <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

                {/* Preview toggle */}
                <button onClick={() => { setPreviewMode(p => !p); setSelectedId(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${previewMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    <Eye size={13} /> {previewMode ? 'Exit Preview' : 'Preview'}
                </button>

                {/* Load template */}
                {isSuperAdmin && (
                    <div className="relative">
                        <button onClick={() => setLoadOpen(o => !o)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors">
                            <Layers size={13} /> Load
                        </button>
                        {loadOpen && (
                            <div className="absolute top-10 left-0 z-30 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Saved Templates</span>
                                    <button onClick={handleNew} className="flex items-center gap-0.5 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                                        <Plus size={11} /> New
                                    </button>
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                    {templates.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">No saved templates yet</p>
                                    ) : templates.map(t => (
                                        <div key={t.id} onClick={() => handleLoadTemplate(t)}
                                            className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0">
                                            <span className="text-xs text-gray-800 dark:text-gray-200 truncate">{t.name}</span>
                                            {t.is_active && (
                                                <span className="ml-2 shrink-0 text-[10px] bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded-full font-medium">
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

                <div className="ml-auto flex items-center gap-2">
                    {/* Save */}
                    {isSuperAdmin && (
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm">
                            <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                        </button>
                    )}
                    {/* Activate */}
                    {isSuperAdmin && templateId && (
                        <button onClick={handleActivate} disabled={activating}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm">
                            <CheckCircle size={13} /> {activating ? 'Activating…' : 'Activate'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden min-h-0">

                {/* Left palette */}
                {!previewMode && (
                    <div className="w-44 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-3 pt-3 pb-1.5">Elements</p>
                        <div className="px-2 pb-3 flex flex-col gap-1.5">
                            {PALETTE_ITEMS.map(item => (
                                <div
                                    key={item.type}
                                    draggable={isSuperAdmin && !readOnly}
                                    onDragStart={e => onPaletteDragStart(e, item.type)}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs select-none transition-all
                                        ${isSuperAdmin && !readOnly
                                            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 cursor-grab hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-300 dark:hover:border-teal-700 active:cursor-grabbing active:scale-95'
                                            : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 text-gray-400 cursor-not-allowed opacity-50'
                                        }`
                                    }
                                >
                                    <span className="text-teal-600 dark:text-teal-400 shrink-0">{item.icon}</span>
                                    <span className="leading-snug">{item.label}</span>
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

                {/* Canvas area */}
                <div
                    className="flex-1 overflow-auto bg-gray-300 dark:bg-gray-950 flex justify-center items-start p-8"
                    onClick={() => setSelectedId(null)}
                >
                    <div
                        ref={canvasRef}
                        id="payslip-canvas"
                        onDragOver={e => e.preventDefault()}
                        onDrop={onCanvasDrop}
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            width: CANVAS_W,
                            height: CANVAS_H,
                            backgroundColor: canvasBg,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
                            flexShrink: 0,
                            fontFamily: "'Inter', 'Segoe UI', sans-serif",
                            transform: 'scale(0.78)',
                            transformOrigin: 'top center',
                            marginBottom: `${-(CANVAS_H * 0.22)}px`, // compensate scale
                        }}
                    >
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
