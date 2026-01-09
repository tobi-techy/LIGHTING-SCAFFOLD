"use client";
import { useState } from "react";
import Link from "next/link";
import { connectPasskey } from "@/lib/lazorkit";
import { useStore } from "@/lib/store";

export default function PasskeyLogin() {
  const { wallet, setWallet } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await connectPasskey();
      if (result) setWallet(result);
      else setError("Connection cancelled");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold">Passkey Login</h1>
      <p className="text-gray-500 mt-2 mb-8">Connect with biometric authentication</p>

      {wallet ? (
        <div className="bg-gray-100 p-6 rounded-xl w-full max-w-sm">
          <p className="text-sm text-gray-500">Connected Wallet</p>
          <p className="font-mono font-semibold">{wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}</p>
          <button onClick={() => setWallet(null)} className="w-full mt-4 border border-gray-300 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={handleConnect} disabled={loading} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Connecting..." : "Connect with Passkey"}
        </button>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <Link href="/examples" className="text-blue-600 mt-8">← Back to Examples</Link>
    </div>
  );
}
