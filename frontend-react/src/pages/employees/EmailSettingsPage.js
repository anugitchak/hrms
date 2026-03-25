import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Mail, Send, Inbox, Clock, Trash2, RefreshCw,
    ChevronRight, ArrowLeft, CheckCircle, Search,
    Settings, Edit3, MessageSquare, X
} from 'lucide-react';
import { useGlobalUI } from "../../context/GlobalUIContext";

// --- Design System Components ---

const Card = ({ children, className = '', icon: Icon, title, subtitle, actions }) => (
    <div className={`bg-white dark:bg-slate-900/60 dark:backdrop-blur-md rounded-10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out flex flex-col ${className}`}>
        {(title || Icon) && (
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    {Icon && <div className="p-3 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd] group-hover:bg-[#00b9cd] group-hover:text-white transition-all duration-500"><Icon size={20} /></div>}
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h3>
                        {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                    </div>
                </div>
                {actions}
            </div>
        )}
        <div className="p-6 flex-1 flex flex-col">{children}</div>
    </div>
);

const Button = ({ children, onClick, disabled, variant = 'primary', className = '', icon: Icon, type = 'button' }) => {
    const variants = {
        primary: 'bg-[#00b9cd] text-white hover:bg-cyan-600 shadow-md',
        outline: 'bg-transparent border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#00b9cd] hover:text-[#00b9cd]',
        ghost: 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600',
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-0.5'} ${className}`}
        >
            {Icon && <Icon size={15} />}
            {children}
        </button>
    );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', required }) => (
    <div className="flex flex-col gap-1.5">
        {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00b9cd] transition-colors duration-300 placeholder:text-slate-400"
        />
    </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 8, required }) => (
    <div className="flex flex-col gap-1.5">
        {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>}
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
            className="w-full px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00b9cd] transition-colors duration-300 placeholder:text-slate-400 resize-none"
        />
    </div>
);

const UserSelect = ({ label, value, onChange, users, required }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
    );

    const selected = users.find(u => u.id === value);

    useEffect(() => {
        const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-1.5" ref={ref}>
            {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(prev => !prev)}
                    className="w-full px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-left text-sm focus:outline-none focus:border-[#00b9cd] transition-colors duration-300 flex items-center justify-between text-slate-900 dark:text-white"
                >
                    {selected
                        ? <span>{selected.name} <span className="text-slate-400 text-xs">({selected.email})</span></span>
                        : <span className="text-slate-400">Select recipient...</span>
                    }
                    <ChevronRight size={14} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
                </button>

                {open && (
                    <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-10 shadow-xl overflow-hidden">
                        <div className="p-2 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                            <Search size={14} className="text-slate-400 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                        <ul className="max-h-56 overflow-y-auto">
                            {filtered.length === 0
                                ? <li className="px-4 py-3 text-sm text-slate-400 text-center">No users found</li>
                                : filtered.map(u => (
                                    <li
                                        key={u.id}
                                        onClick={() => { onChange(u.id); setOpen(false); setQuery(''); }}
                                        className={`px-4 py-3 cursor-pointer hover:bg-[#00b9cd]/10 text-sm flex flex-col transition-colors ${u.id === value ? 'bg-[#00b9cd]/10 text-[#00b9cd] font-bold' : 'text-slate-700 dark:text-slate-200'}`}
                                    >
                                        <span className="font-semibold">{u.name}</span>
                                        <span className="text-xs text-slate-400">{u.email}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
};

const TABS = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Clock },
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'templates', label: 'Templates', icon: Settings },
];

const EmailSettingsPage = () => {
    const { addToast } = useGlobalUI();

    const [activeTab, setActiveTab] = useState('inbox');
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [compose, setCompose] = useState({ receiver_id: null, subject: '', body: '' });
    const [sending, setSending] = useState(false);

    // Templates state
    const [preferences, setPreferences] = useState([]);
    const [prefLoading, setPrefLoading] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        if (activeTab === 'inbox') fetchInbox();
        if (activeTab === 'sent') fetchSent();
        if (activeTab === 'templates') fetchPreferences();
        setSelectedMessage(null);
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/messages/users');
            setUsers(res.data || []);
        } catch { /* non-critical */ }
    };

    const fetchInbox = async () => {
        setLoading(true);
        try {
            const res = await api.get('/messages/inbox');
            setInbox(res.data || []);
        } catch { addToast('Failed to load inbox.', 'error'); }
        finally { setLoading(false); }
    };

    const fetchSent = async () => {
        setLoading(true);
        try {
            const res = await api.get('/messages/sent');
            setSent(res.data || []);
        } catch { addToast('Failed to load sent messages.', 'error'); }
        finally { setLoading(false); }
    };

    const openMessage = async (msg, listSetter) => {
        try {
            const res = await api.get(`/messages/${msg.id}`);
            setSelectedMessage(res.data);
            if (activeTab === 'inbox') {
                listSetter(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
            }
        } catch { addToast('Could not open message.', 'error'); }
    };

    const deleteMessage = async (id) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await api.delete(`/messages/${id}`);
            addToast('Message deleted.', 'success');
            setSelectedMessage(null);
            if (activeTab === 'inbox') fetchInbox(); else fetchSent();
        } catch { addToast('Failed to delete message.', 'error'); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!compose.receiver_id) { addToast('Please select a recipient.', 'error'); return; }
        if (!compose.subject.trim()) { addToast('Subject is required.', 'error'); return; }
        if (!compose.body.trim()) { addToast('Message body is required.', 'error'); return; }
        setSending(true);
        try {
            await api.post('/messages/compose', compose);
            addToast('Message sent successfully!', 'success');
            setCompose({ receiver_id: null, subject: '', body: '' });
            setActiveTab('sent');
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to send message.', 'error');
        } finally { setSending(false); }
    };

    const fetchPreferences = async () => {
        setPrefLoading(true);
        try {
            const res = await api.get('/email-preferences');
            setPreferences(res.data || []);
        } catch { addToast('Failed to load templates.', 'error'); }
        finally { setPrefLoading(false); }
    };

    const handleEdit = (pref) => {
        setSelectedType(pref);
        setFormData({
            to_emails: pref.to_emails || '',
            cc_emails: pref.cc_emails || '',
            bcc_emails: pref.bcc_emails || '',
            subject_template: pref.subject_template || '',
            body_template: pref.body_template || '',
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedType) return;
        setIsSubmitting(true);
        try {
            await api.post('/email-preferences', { leave_type_id: selectedType.leave_type_id, ...formData });
            addToast('Template saved successfully.', 'success');
            fetchPreferences();
            setSelectedType(null);
        } catch { addToast('Failed to save template.', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const unreadCount = inbox.filter(m => !m.is_read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-[#00b9cd]/10 rounded-10 text-[#00b9cd]"><Mail size={24} /></div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Messages</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Internal HRMS Mail System</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-10 font-black text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${
                                isActive
                                    ? 'bg-[#00b9cd] text-white shadow-md shadow-[#00b9cd]/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#00b9cd] border-2 border-slate-200 dark:border-white/10'
                            }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                            {tab.id === 'inbox' && unreadCount > 0 && (
                                <span className="ml-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'compose' && (
                <Card icon={Send} title="Compose Message" subtitle="Send an internal message with real email delivery">
                    <form onSubmit={handleSend} className="flex flex-col gap-5">
                        <UserSelect
                            label="To"
                            value={compose.receiver_id}
                            onChange={id => setCompose(prev => ({ ...prev, receiver_id: id }))}
                            users={users}
                            required
                        />
                        <Input
                            label="Subject"
                            value={compose.subject}
                            onChange={e => setCompose(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter subject..."
                            required
                        />
                        <Textarea
                            label="Message"
                            value={compose.body}
                            onChange={e => setCompose(prev => ({ ...prev, body: e.target.value }))}
                            placeholder="Write your message here..."
                            rows={10}
                            required
                        />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" icon={Send} disabled={sending}>
                                {sending ? 'Sending...' : 'Send Message'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {(activeTab === 'inbox' || activeTab === 'sent') && (
                <div className="flex gap-6 h-[calc(100vh-260px)] min-h-[400px]">
                    <div className="w-full max-w-sm flex flex-col">
                        <Card
                            icon={activeTab === 'inbox' ? Inbox : Clock}
                            title={activeTab === 'inbox' ? 'Inbox' : 'Sent'}
                            subtitle={activeTab === 'inbox' ? `${unreadCount} unread` : `${sent.length} messages`}
                            actions={
                                <button
                                    onClick={activeTab === 'inbox' ? fetchInbox : fetchSent}
                                    className="p-2 rounded-10 text-slate-400 hover:text-[#00b9cd] hover:bg-[#00b9cd]/10 transition-all duration-300"
                                    title="Refresh"
                                >
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                </button>
                            }
                            className="flex-1 overflow-hidden"
                        >
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <RefreshCw size={24} className="animate-spin text-[#00b9cd] opacity-60" />
                                </div>
                            ) : (activeTab === 'inbox' ? inbox : sent).length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
                                    <Mail size={36} className="text-slate-300 dark:text-slate-700" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {activeTab === 'inbox' ? 'No messages yet' : 'Nothing sent yet'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="overflow-y-auto -mx-6 -mb-6 divide-y divide-slate-100 dark:divide-white/5">
                                    {(activeTab === 'inbox' ? inbox : sent).map(msg => {
                                        const isSelected = selectedMessage?.id === msg.id;
                                        const isUnread = activeTab === 'inbox' && !msg.is_read;
                                        const person = activeTab === 'inbox' ? msg.sender : msg.receiver;
                                        return (
                                            <li
                                                key={msg.id}
                                                onClick={() => openMessage(msg, activeTab === 'inbox' ? setInbox : setSent)}
                                                className={`px-6 py-4 cursor-pointer transition-all duration-200 flex flex-col gap-1 ${
                                                    isSelected
                                                        ? 'bg-[#00b9cd]/10 border-l-4 border-[#00b9cd]'
                                                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-sm truncate ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                                        {person?.name || 'Unknown'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(msg.created_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isUnread && <span className="w-2 h-2 rounded-full bg-[#00b9cd] shrink-0" />}
                                                    <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {msg.subject}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Card>
                    </div>

                    <div className="flex-1">
                        {selectedMessage ? (
                            <Card className="h-full overflow-hidden flex flex-col">
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedMessage.subject}</h2>
                                        <div className="mt-2 flex flex-col gap-1">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-black uppercase tracking-widest text-[10px] text-slate-400 mr-2">From</span>
                                                {selectedMessage.sender?.name} <span className="text-slate-400">({selectedMessage.sender?.email})</span>
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-black uppercase tracking-widest text-[10px] text-slate-400 mr-2">To</span>
                                                {selectedMessage.receiver?.name} <span className="text-slate-400">({selectedMessage.receiver?.email})</span>
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                <span className="font-black uppercase tracking-widest text-[10px] mr-2">Date</span>
                                                {new Date(selectedMessage.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedMessage.is_read && (
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                                <CheckCircle size={12} /> Read
                                            </span>
                                        )}
                                        <button
                                            onClick={() => deleteMessage(selectedMessage.id)}
                                            className="p-2 rounded-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-300"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedMessage(null)}
                                            className="p-2 rounded-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                                            title="Close"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/5 pt-6 flex-1 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {selectedMessage.body}
                                    </pre>
                                </div>
                            </Card>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                                <div className="p-6 bg-[#00b9cd]/5 rounded-full">
                                    <Mail size={40} className="text-[#00b9cd] opacity-30" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select a message</p>
                                    <p className="text-xs text-slate-400 mt-1">Click on a message to read it here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'templates' && (
                <div>
                    {prefLoading ? (
                        <div className="flex justify-center py-16">
                            <RefreshCw size={28} className="animate-spin text-[#00b9cd] opacity-60" />
                        </div>
                    ) : preferences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <Mail size={40} className="text-slate-300 dark:text-slate-700" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No leave types configured</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {preferences.map(pref => (
                                <Card
                                    key={pref.leave_type_id}
                                    icon={Mail}
                                    title={pref.leave_type_name}
                                    subtitle="Email Notification Template"
                                    actions={
                                        <span className={`px-3 py-1 rounded-10 text-[8px] font-black uppercase tracking-[0.2em] border ${
                                            pref.has_custom_template
                                                ? 'bg-[#00b9cd]/10 text-[#00b9cd] border-[#00b9cd]/20'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
                                        }`}>
                                            {pref.has_custom_template ? 'Custom' : 'Default'}
                                        </span>
                                    }
                                >
                                    <div className="mb-5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                            <MessageSquare size={11} className="text-[#00b9cd]" /> Subject
                                        </p>
                                        <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-10 border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 truncate">
                                            {pref.subject_template || <span className="italic text-slate-400">Default template</span>}
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant={pref.has_custom_template ? 'outline' : 'primary'}
                                        onClick={() => handleEdit(pref)}
                                        icon={Edit3}
                                    >
                                        {pref.has_custom_template ? 'Edit Template' : 'Customize'}
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Template Edit Modal */}
                    {selectedType && (
                        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6">
                            <div className="bg-white dark:bg-slate-900 rounded-10 max-w-3xl w-full shadow-2xl border-2 border-[#00b9cd]/40 overflow-hidden max-h-[90vh] flex flex-col">
                                <div className="p-6 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                            <Settings size={18} className="text-[#00b9cd]" /> Edit Template
                                        </h3>
                                        <p className="text-[10px] font-black text-[#00b9cd] uppercase tracking-widest mt-1">{selectedType.leave_type_name}</p>
                                    </div>
                                    <button onClick={() => setSelectedType(null)} className="p-2 hover:bg-rose-500 hover:text-white rounded-10 transition-all text-slate-400">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">To (extra)</label>
                                            <input type="text" value={formData.to_emails} onChange={e => setFormData({ ...formData, to_emails: e.target.value })} placeholder="manager auto-included" className="px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00b9cd] transition-colors placeholder:text-slate-400" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">CC</label>
                                            <input type="text" value={formData.cc_emails} onChange={e => setFormData({ ...formData, cc_emails: e.target.value })} placeholder="cc recipients" className="px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00b9cd] transition-colors placeholder:text-slate-400" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">BCC</label>
                                            <input type="text" value={formData.bcc_emails} onChange={e => setFormData({ ...formData, bcc_emails: e.target.value })} placeholder="bcc recipients" className="px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00b9cd] transition-colors placeholder:text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Subject Template <span className="text-rose-500">*</span></label>
                                        <input type="text" required value={formData.subject_template} onChange={e => setFormData({ ...formData, subject_template: e.target.value })} className="px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00b9cd] transition-colors" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Body Template <span className="text-rose-500">*</span></label>
                                        <textarea required rows="10" value={formData.body_template} onChange={e => setFormData({ ...formData, body_template: e.target.value })} className="px-4 py-3 rounded-10 border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00b9cd] transition-colors resize-none font-mono leading-relaxed" />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button variant="ghost" type="button" onClick={() => setSelectedType(null)} className="flex-1">Cancel</Button>
                                        <Button type="submit" icon={X ? null : null} disabled={isSubmitting} className="flex-1">
                                            {isSubmitting ? 'Saving...' : 'Save Template'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmailSettingsPage;
