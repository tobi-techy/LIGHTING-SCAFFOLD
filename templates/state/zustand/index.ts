import { create } from "zustand";
import type { LazorWallet } from "../lazorkit";

interface AppState {
  wallet: LazorWallet | null;
  setWallet: (wallet: LazorWallet | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  wallet: null,
  setWallet: (wallet) => set({ wallet }),
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));
