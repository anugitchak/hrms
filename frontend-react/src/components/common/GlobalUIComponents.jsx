import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// --- TOAST COMPONENTS ---

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const icons = {
        success: <CheckCircle className="w-6 h-6 text-emerald-500" />,
        error: <AlertCircle className="w-6 h-6 text-rose-500" />,
        info: <Info className="w-6 h-6 text-blue-500" />,
        warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    };

    const gradientBorder = {
        success: 'from-emerald-400 to-teal-500',
        error: 'from-rose-400 to-red-500',
        info: 'from-blue-400 to-indigo-500',
        warning: 'from-amber-400 to-orange-500',
    };

    const bgColors = {
        success: 'bg-emerald-50 dark:bg-emerald-500/10',
        error: 'bg-rose-50 dark:bg-rose-500/10',
        info: 'bg-blue-50 dark:bg-blue-500/10',
        warning: 'bg-amber-50 dark:bg-amber-500/10',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="pointer-events-auto relative flex items-center gap-4 p-4 pr-14 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-black/50 hover:shadow-2xl bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 min-w-[320px] max-w-[450px] cursor-pointer transition-shadow"
            onClick={onRemove}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b ${gradientBorder[toast.type]}`} />

            <div className={`flex-shrink-0 p-2 rounded-xl border border-gray-100 dark:border-gray-700/50 ${bgColors[toast.type]}`}>
                {icons[toast.type]}
            </div>

            <div className="flex-grow flex flex-col py-1">
                <span className="text-base font-bold text-gray-900 dark:text-white leading-tight capitalize tracking-tight">
                    {toast.type}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                    {toast.message}
                </span>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex-shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
                <X className="w-5 h-5" />
            </button>
        </motion.div>
    );
};

// --- MODAL COMPONENTS ---

export const ConfirmModal = ({ title, message, confirmText, cancelText, type, onClose }) => {
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="w-full max-w-md bg-[#1a1c1e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            >
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${type === 'danger' ? 'bg-rose-500/20 text-rose-400' :
                                type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-sky-500/20 text-sky-400'
                            }`}>
                            {type === 'danger' ? <AlertCircle className="w-6 h-6" /> :
                                type === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                                    <Info className="w-6 h-6" />}
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                    </div>

                    <p className="text-slate-400 leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row-reverse gap-3">
                        <button
                            onClick={() => onClose(true)}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all transform active:scale-95 ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' :
                                    type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30' :
                                        'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/30'
                                }`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={() => onClose(false)}
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>

                {/* Decorative Accent */}
                <div className={`h-1 w-full ${type === 'danger' ? 'bg-rose-500' :
                        type === 'warning' ? 'bg-amber-500' :
                            'bg-teal-500'
                    }`} />
            </motion.div>
        </div>
    );
};
