import { create } from 'zustand';

interface AssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  minimizeAssistant: () => void;
  toggleAssistant: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  isOpen: false,
  isMinimized: true, // Default to minimized if not fully open, but only visible if isOpen is true? No, wait. 
  // Let's define the states clearly.
  // We actually need: 'closed' | 'minimized' | 'expanded'
  openAssistant: () => set({ isOpen: true, isMinimized: false }),
  closeAssistant: () => set({ isOpen: false, isMinimized: false }),
  minimizeAssistant: () => set({ isOpen: true, isMinimized: true }),
  toggleAssistant: () => set((state) => {
    if (!state.isOpen) return { isOpen: true, isMinimized: false };
    if (state.isMinimized) return { isOpen: true, isMinimized: false };
    return { isOpen: false, isMinimized: false };
  }),
}));
