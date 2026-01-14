"use client";
import { LazorkitProvider } from "@lazorkit/wallet";
import { ReactNode } from "react";

const CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
  portalUrl: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || "https://kora.devnet.lazorkit.com",
  },
};

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || require("buffer").Buffer;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LazorkitProvider
      rpcUrl={CONFIG.rpcUrl}
      portalUrl={CONFIG.portalUrl}
      paymasterConfig={CONFIG.paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}
