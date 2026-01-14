"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Onboarding } from "@/components/Onboarding";
import { Swap } from "@/components/Swap";
import { Recovery } from "@/components/Recovery";
import { History } from "@/components/History";

type View = "swap" | "recovery" | "history";

export default function Home() {
  const { isConnected } = useWallet();
  const [view, setView] = useState<View>("swap");

  if (!isConnected) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Onboarding />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {view === "swap" && (
        <>
          <Swap />

          <div className="flex gap-4 mt-4">
            <button onClick={() => setView("history")} className="text-xs text-neutral-500 hover:text-black">History</button>
            <button onClick={() => setView("recovery")} className="text-xs text-neutral-500 hover:text-black">Recovery</button>
          </div>

        </>
      )}
      {view === "recovery" && <Recovery onBack={() => setView("swap")} />}
      {view === "history" && <History onBack={() => setView("swap")} />}
    </main>
  );
}
