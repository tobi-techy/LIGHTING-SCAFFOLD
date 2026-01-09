"use client";
import { useState } from "react";
import Link from "next/link";
import { connectPasskey } from "@/lib/lazorkit";
import { useStore } from "@/lib/store";

export default function BiometricOnboard() {
  const { wallet, setWallet } = useStore();
  const [step, setStep] = useState<"welcome" | "connecting" | "done">("welcome");
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setStep("connecting");
    setError(null);
    try {
      const result = await connectPasskey();
      if (result) {
        setWallet(result);
        setStep("done");
      } else {
        setError("Connection cancelled");
        setStep("welcome");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStep("welcome");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {step === "welcome" && (
        <>
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-gray-500 mt-2 mb-8">Secure your wallet with passkeys</p>
          <button onClick={handleConnect} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700">
            Get Started
          </button>
        </>
      )}

      {step === "connecting" && (
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Creating your wallet...</p>
        </div>
      )}

      {step === "done" && wallet && (
        <>
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold">You're all set!</h1>
          <div className="bg-gray-100 p-4 rounded-xl mt-6 w-full max-w-sm">
            <p className="text-sm text-gray-500">Your wallet</p>
            <p className="font-mono">{wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}</p>
          </div>
          <Link href="/" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold mt-6 hover:bg-blue-700">
            Continue to App
          </Link>
        </>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {step === "welcome" && (
        <Link href="/examples" className="text-blue-600 mt-8">← Back to Examples</Link>
      )}
    </div>
  );
}
