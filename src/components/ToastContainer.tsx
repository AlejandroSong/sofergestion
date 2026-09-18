import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto bg-[#F4F6FA] text-[#16202E] rounded-xl shadow-2xl border border-[#E2E8F0] p-4 flex items-start gap-3 relative overflow-hidden backdrop-blur-md"
          >
            {/* Status indicator bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                toast.type === 'alert'
                  ? 'bg-red-500'
                  : toast.type === 'success'
                  ? 'bg-green-500'
                  : 'bg-[#0A2E6D]'
              }`}
            />

            <div className="mt-0.5 shrink-0 pl-1">
              {toast.type === 'alert' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Bell className="w-5 h-5 text-[#0A2E6D]" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[#16202E]">{toast.title}</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#E8EFF9] text-[#0A2E6D] border border-[#E2E8F0]">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-[#5A6B82] mt-1 leading-relaxed line-clamp-3">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#5A6B82] hover:text-[#16202E] transition-colors p-1 rounded-lg hover:bg-[#E8EFF9] cursor-pointer"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
