import { create } from "zustand";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  isOpen: boolean;
  messages: ChatMessage[];
  toggle: () => void;
  addMessage: (message: Omit<ChatMessage, "id">) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  messages: [],
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, { ...msg, id: Math.random().toString(36).slice(2) }],
    })),
  clear: () => set({ isOpen: false, messages: [] }),
}));
