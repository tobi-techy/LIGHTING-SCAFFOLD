import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

const PORTAL_URL = process.env.EXPO_PUBLIC_LAZORKIT_PORTAL_URL || "https://portal.lazor.sh";
const PAYMASTER_URL = process.env.EXPO_PUBLIC_LAZORKIT_PAYMASTER_URL || "https://kora.devnet.lazorkit.com";
const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

export interface LazorWallet {
  address: string;
  publicKey: PublicKey;
}

export async function connectPasskey(redirectUrl: string): Promise<LazorWallet | null> {
  const authUrl = `${PORTAL_URL}/auth?redirect=${encodeURIComponent(redirectUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

  if (result.type === "success" && result.url) {
    const params = Linking.parse(result.url);
    const address = params.queryParams?.address as string;
    if (address) return { address, publicKey: new PublicKey(address) };
  }
  return null;
}

export async function signAndSendTransaction(tx: Transaction, wallet: LazorWallet, redirectUrl: string): Promise<string | null> {
  const connection = new Connection(RPC_URL);
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
  const signUrl = `${PORTAL_URL}/sign?tx=${encodeURIComponent(serialized)}&redirect=${encodeURIComponent(redirectUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(signUrl, redirectUrl);

  if (result.type === "success" && result.url) {
    const params = Linking.parse(result.url);
    return (params.queryParams?.signature as string) || null;
  }
  return null;
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
