import { create } from "zustand";

interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));
