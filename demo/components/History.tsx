"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Connection, PublicKey } from "@solana/web3.js";

interface Props {
  onBack: () => void;
}

interface TxInfo {
  signature: string;
  slot: number;
  blockTime: number | null | undefined;
  err: any;
}

export function History({ onBack }: Props) {
  const { wallet } = useWallet();
  const [txs, setTxs] = useState<TxInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet?.smartWallet) return;
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
    const conn = new Connection(rpc);
    conn.getSignaturesForAddress(new PublicKey(wallet.smartWallet), { limit: 10 })
      .then((sigs) => setTxs(sigs.map((s) => ({ signature: s.signature, slot: s.slot, blockTime: s.blockTime, err: s.err }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wallet?.smartWallet]);

  const formatTime = (ts: number | null) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const explorerUrl = (sig: string) => {
    const cluster = (process.env.NEXT_PUBLIC_SOLANA_RPC || "").includes("mainnet") ? "" : "?cluster=devnet";
    return `https://solscan.io/tx/${sig}${cluster}`;
  };

  return (

    <div className="w-full max-w-sm bg-neutral-900 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">History</h1>
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-white">← Back</button>
      </div>
      {loading ? (
        <p className="text-center py-8 text-neutral-500">Loading...</p>
      ) : txs.length === 0 ? (
        <p className="text-center py-8 text-neutral-500">No transactions yet</p>
      ) : (
        <div className="space-y-2">
          {txs.map((tx) => (
            <a key={tx.signature} href={explorerUrl(tx.signature)} target="_blank" rel="noopener noreferrer" className="block border border-neutral-700 rounded-xl p-3 bg-neutral-800 hover:bg-neutral-700">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">{tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${tx.err ? "bg-red-900 text-red-400" : "bg-green-900 text-green-400"}`}>
                  {tx.err ? "Failed" : "Success"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">{formatTime(tx.blockTime)}</p>
            </a>
          ))}
        </div>
      )}
    </div>

  );
}
