"use client";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

const PORTAL_URL = process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || "https://portal.lazor.sh";
const PAYMASTER_URL = process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || "https://kora.devnet.lazorkit.com";
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

export interface LazorWallet {
  address: string;
  publicKey: PublicKey;
}

export async function connectPasskey(): Promise<LazorWallet | null> {
  const redirectUrl = `${window.location.origin}/auth/callback`;
  const popup = window.open(`${PORTAL_URL}/auth?redirect=${encodeURIComponent(redirectUrl)}`, "lazorkit", "width=500,height=600");

  return new Promise((resolve) => {
    const handler = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.address) {
        window.removeEventListener("message", handler);
        popup?.close();
        resolve({ address: e.data.address, publicKey: new PublicKey(e.data.address) });
      }
    };
    window.addEventListener("message", handler);
    const check = setInterval(() => {
      if (popup?.closed) { clearInterval(check); window.removeEventListener("message", handler); resolve(null); }
    }, 500);
  });
}

export async function signAndSendTransaction(tx: Transaction, wallet: LazorWallet): Promise<string | null> {
  const connection = new Connection(RPC_URL);
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
  const redirectUrl = `${window.location.origin}/auth/callback`;
  const popup = window.open(`${PORTAL_URL}/sign?tx=${encodeURIComponent(serialized)}&redirect=${encodeURIComponent(redirectUrl)}`, "lazorkit", "width=500,height=600");

  return new Promise((resolve) => {
    const handler = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.signature) {
        window.removeEventListener("message", handler);
        popup?.close();
        resolve(e.data.signature);
      }
    };
    window.addEventListener("message", handler);
    const check = setInterval(() => {
      if (popup?.closed) { clearInterval(check); window.removeEventListener("message", handler); resolve(null); }
    }, 500);
  });
}

export async function sponsorTransaction(tx: Transaction): Promise<Transaction> {
  const res = await fetch(`${PAYMASTER_URL}/sponsor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: tx.serialize({ requireAllSignatures: false }).toString("base64") }),
  });
  const { sponsoredTx } = await res.json();
  return Transaction.from(Buffer.from(sponsoredTx, "base64"));
}

export const connection = new Connection(RPC_URL);
