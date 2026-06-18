import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer, ConfirmModal } from '../components/common/GlobalUIComponents';

const GlobalUIContext = createContext();

export const useGlobalUI = () => {
    const context = useContext(GlobalUIContext);
    if (!context) {
        throw new Error('useGlobalUI must be used within a GlobalUIProvider');
    }
    return context;
};

export const GlobalUIProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmOptions, setConfirmOptions] = useState(null);

    // Toast Logic
    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((toast) => toast.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    // Confirm Logic
    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmOptions({
                ...options,
                resolve,
            });
        });
    }, []);

    const handleConfirmClose = (result) => {
        if (confirmOptions?.resolve) {
            confirmOptions.resolve(result);
        }
        setConfirmOptions(null);
    };

    return (
        <GlobalUIContext.Provider value={{ addToast, removeToast, confirm }}>
            {children}
            
            {/* Global Components */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <AnimatePresence>
                {confirmOptions && (
                    <ConfirmModal
                        title={confirmOptions.title || 'Are you sure?'}
                        message={confirmOptions.message || 'This action cannot be undone.'}
                        confirmText={confirmOptions.confirmText || 'Yes, Proceed'}
                        cancelText={confirmOptions.cancelText || 'Cancel'}
                        type={confirmOptions.type || 'warning'} // warning, danger, info
                        onClose={handleConfirmClose}
                    />
                )}
            </AnimatePresence>
        </GlobalUIContext.Provider>
    );
};
