"use client";
import { useState } from "react";
import Link from "next/link";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { signAndSendTransaction, sponsorTransaction } from "@/lib/lazorkit";
import { useStore } from "@/lib/store";

export default function GaslessTransfer() {
  const { wallet } = useStore();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTransfer = async () => {
    if (!wallet || !recipient || !amount) return;
    setLoading(true);
    setResult(null);

    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      const sponsoredTx = await sponsorTransaction(tx);
      const signature = await signAndSendTransaction(sponsoredTx, wallet);

      setResult(signature ? { success: true, message: `Sent! ${signature.slice(0, 20)}...` } : { success: false, message: "Cancelled" });
    } catch (e) {
      setResult({ success: false, message: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold mb-4">Connect wallet first</h1>
        <Link href="/examples/passkey-login" className="bg-blue-600 text-white px-6 py-3 rounded-xl">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold">Gasless Transfer</h1>
      <p className="text-gray-500 mt-2 mb-8">Send SOL without paying gas</p>

      <div className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Recipient address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3"
        />
        <input
          type="text"
          placeholder="Amount (SOL)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3"
        />
        <button
          onClick={handleTransfer}
          disabled={loading || !recipient || !amount}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send (Gasless)"}
        </button>
      </div>

      {result && (
        <p className={`mt-4 ${result.success ? "text-green-600" : "text-red-500"}`}>{result.message}</p>
      )}

      <Link href="/examples" className="text-blue-600 mt-8">← Back to Examples</Link>
    </div>
  );
}
