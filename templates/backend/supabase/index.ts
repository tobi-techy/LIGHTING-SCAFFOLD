import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Save wallet to user profile
export async function saveWallet(userId: string, walletAddress: string) {
  return supabase.from("wallets").upsert({ user_id: userId, address: walletAddress });
}

// Example: Get user's transactions
export async function getTransactions(walletAddress: string) {
  return supabase.from("transactions").select("*").eq("wallet_address", walletAddress).order("created_at", { ascending: false });
}
