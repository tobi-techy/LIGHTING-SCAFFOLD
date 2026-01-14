"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";

export function Onboarding() {
  const { connect, isConnecting } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setError(null);
    try {
      await connect();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (

    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Create a wallet with your fingerprint or face. No seed phrases.
        </p>
        <button
          onClick={handleStart}
          disabled={isConnecting}
          className="mt-8 w-full py-3 px-4 bg-black text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isConnecting ? "Creating..." : "Create Wallet"}
        </button>
        <p className="mt-4 text-xs text-neutral-400">Secured by passkeys</p>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>

  );
}
