import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
      {type === 'info' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
      {type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
};
