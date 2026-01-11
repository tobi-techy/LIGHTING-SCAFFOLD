import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
}

export interface SwapRecord {
  id: string;
  wallet_address: string;
  from_token: string;
  to_token: string;
  from_amount: string;
  to_amount: string;
  signature: string;
  created_at: string;
}

// User Management
export async function createOrGetUser(walletAddress: string) {
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("users")
    .insert({ wallet_address: walletAddress })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Swap History
export async function saveSwap(swap: Omit<SwapRecord, "id" | "created_at">) {
  const { data, error } = await supabase.from("swaps").insert(swap).select().single();
  if (error) throw error;
  return data;
}

export async function getSwapHistory(walletAddress: string, limit = 20) {
  const { data, error } = await supabase
    .from("swaps")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Message Signatures (for verification records)
export async function saveSignature(walletAddress: string, message: string, signature: string) {
  const { data, error } = await supabase
    .from("signatures")
    .insert({ wallet_address: walletAddress, message, signature })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/*
SQL Schema - Run in Supabase SQL Editor:

create table users (
  id uuid default gen_random_uuid() primary key,
  wallet_address text unique not null,
  created_at timestamp with time zone default now()
);

create table swaps (
  id uuid default gen_random_uuid() primary key,
  wallet_address text not null references users(wallet_address),
  from_token text not null,
  to_token text not null,
  from_amount text not null,
  to_amount text not null,
  signature text not null,
  created_at timestamp with time zone default now()
);

create table signatures (
  id uuid default gen_random_uuid() primary key,
  wallet_address text not null references users(wallet_address),
  message text not null,
  signature text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table users enable row level security;
alter table swaps enable row level security;
alter table signatures enable row level security;

-- Policies (adjust based on your auth setup)
create policy "Users can read own data" on users for select using (true);
create policy "Users can insert" on users for insert with check (true);
create policy "Swaps readable by wallet owner" on swaps for select using (true);
create policy "Swaps insertable" on swaps for insert with check (true);
create policy "Signatures readable" on signatures for select using (true);
create policy "Signatures insertable" on signatures for insert with check (true);
*/
