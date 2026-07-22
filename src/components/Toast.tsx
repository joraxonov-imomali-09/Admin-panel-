/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'alert';
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void; key?: string }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-[#D4AF37]" />,
    info: <Info className="w-4 h-4 text-slate-400" />,
    alert: <AlertTriangle className="w-4 h-4 text-red-400" />,
  };

  const borderColors = {
    success: 'border-[#D4AF37]/30 shadow-yellow-500/5',
    info: 'border-white/10 shadow-slate-500/5',
    alert: 'border-red-500/30 shadow-red-500/5',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-center justify-between p-4 rounded-[20px] border bg-slate-950/95 dark:bg-[#0F0F0F]/95 text-white shadow-2xl backdrop-blur-md ${borderColors[toast.type]}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
          {icons[toast.type]}
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider font-sans text-slate-100">{toast.text}</p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/5 cursor-pointer ml-3"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
