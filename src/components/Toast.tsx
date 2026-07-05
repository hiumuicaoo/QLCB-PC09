/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 6000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => showToast(message, 'success', duration), [showToast]);
  const error = useCallback((message: string, duration?: number) => showToast(message, 'error', duration), [showToast]);
  const warning = useCallback((message: string, duration?: number) => showToast(message, 'warning', duration), [showToast]);
  const info = useCallback((message: string, duration?: number) => showToast(message, 'info', duration), [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Expose showToast globally as a fallback for non-React contexts or hooks (like usePersonnel.ts)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showToast = (msg: string, type: ToastType = 'info', dur?: number) => {
        showToast(msg, type, dur);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showToast;
      }
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
  key?: string;
}

function ToastCard({ toast, onRemove }: ToastCardProps) {
  const { id, message, type, duration = 6000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const config = {
    success: {
      bg: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-100/40',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
      accent: 'bg-emerald-600',
    },
    error: {
      bg: 'bg-white border-rose-200 text-slate-800 shadow-rose-100/40',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      accent: 'bg-rose-600',
    },
    warning: {
      bg: 'bg-white border-amber-200 text-slate-800 shadow-amber-100/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      accent: 'bg-amber-500',
    },
    info: {
      bg: 'bg-white border-blue-200 text-slate-800 shadow-blue-100/40',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      accent: 'bg-blue-600',
    },
  };

  const currentConfig = config[type] || config.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg overflow-hidden relative ${currentConfig.bg}`}
      id={`toast_card_${id}`}
    >
      {/* Visual top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${currentConfig.accent}`} />
      
      {/* Icon */}
      <div className="mt-0.5">{currentConfig.icon}</div>

      {/* Message and close */}
      <div className="flex-1 pr-2">
        <div className="text-xs font-semibold leading-relaxed whitespace-pre-line text-slate-800">
          {message}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(id)}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 hover:bg-slate-50 rounded-lg cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress countdown bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 opacity-60 ${currentConfig.accent}`}
      />
    </motion.div>
  );
}
