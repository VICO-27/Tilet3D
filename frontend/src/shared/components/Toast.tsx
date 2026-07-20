import React from 'react';
import { Check, X } from 'lucide-react';
import { useToastStore } from '@/app/store/useToastStore';

const Toast: React.FC = () => {
  const { message, type } = useToastStore();

  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-fade-in">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md border text-sm font-medium ${
          type === 'success'
            ? 'bg-black/90 text-white border-white/10'
            : 'bg-red-600/95 text-white border-red-400/30'
        }`}
      >
        {type === 'success' ? <Check size={16} /> : <X size={16} />}
        {message}
      </div>
    </div>
  );
};

export default Toast;