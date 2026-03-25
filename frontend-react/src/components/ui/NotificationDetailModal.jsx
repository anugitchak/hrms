const NotificationDetailModal = ({ isOpen, onClose, notification }) => {
    if (!isOpen || !notification) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl w-full max-w-lg shadow-2xl border border-white/20 dark:border-slate-800/50 overflow-hidden transform transition-all">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Notification Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="p-8">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                             <div className="w-2 h-2 rounded-10 bg-[#00b9cd]"></div>
                             <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{notification.title}</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg">
                        Received: {new Date(notification.created_at).toLocaleString()}
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-[#00b9cd] hover:bg-[#00a5b9] text-black dark:text-white font-black uppercase tracking-widest text-xs rounded-12 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_20px_-5px_rgba(0,185,205,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(0,185,205,0.4)] cursor-pointer border-none"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailModal;
