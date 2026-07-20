import { create } from 'zustand';

interface ToastState {
  message: string | null;
  type: 'success' | 'error';
  show: (message: string, type?: 'success' | 'error') => void;
  hide: () => void;
}

let hideTimeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  show: (message, type = 'success') => {
    if (hideTimeout) clearTimeout(hideTimeout);
    set({ message, type });
    hideTimeout = setTimeout(() => set({ message: null }), 2000);
  },
  hide: () => set({ message: null }),
}));