import { create } from "zustand";

type ChatState = {
  isOpen: boolean;
  activeThreadId: string | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setActiveThreadId: (id: string | null) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  activeThreadId: null,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
}));
