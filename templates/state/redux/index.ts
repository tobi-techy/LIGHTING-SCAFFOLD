import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { LazorWallet } from "../lazorkit";

interface AppState {
  wallet: LazorWallet | null;
  isLoading: boolean;
}

const appSlice = createSlice({
  name: "app",
  initialState: { wallet: null, isLoading: false } as AppState,
  reducers: {
    setWallet: (state, action: PayloadAction<LazorWallet | null>) => {
      state.wallet = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setWallet, setLoading } = appSlice.actions;

export const store = configureStore({ reducer: { app: appSlice.reducer } });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
