import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastSuccess = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const toastError = useCallback((msg) => addToast(msg, 'error', 5500), [addToast]);
  const toastWarning = useCallback((msg) => addToast(msg, 'warning', 5000), [addToast]);
  const toastInfo = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toastSuccess, toastError, toastWarning, toastInfo }}>
      {children}
      {/* Toast Render Portal / Container */}
      <div 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-card-dark border backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-navy-900/95 border-status-success/40 text-slate-100 shadow-glow-success/20'
                  : toast.type === 'error'
                  ? 'bg-navy-900/95 border-status-danger/40 text-slate-100 shadow-glow-danger/20'
                  : toast.type === 'warning'
                  ? 'bg-navy-900/95 border-brand-gold/40 text-slate-100 shadow-glow-gold/20'
                  : 'bg-navy-900/95 border-brand-blue/40 text-slate-100 shadow-glow-blue/20'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-status-success" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-status-danger" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-brand-gold" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-brand-blue-light" />}
              </div>
              <div className="flex-1 text-sm font-medium leading-snug">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-white rounded-lg transition-colors focus-visible:ring-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
