# LazorKit Copy-Paste Snippets

Minimal, isolated code examples. Copy → Paste → Works.

---

## Passkey Login (10 lines)

```tsx
import { useWallet } from '@lazorkit/wallet';

function Login() {
  const { connect, wallet } = useWallet();
  
  return (
    <button onClick={() => connect()}>
      {wallet ? `Connected: ${wallet.smartWallet.slice(0, 8)}...` : 'Login with Passkey'}
    </button>
  );
}
```

---

## Gasless SOL Transfer (15 lines)

```tsx
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey } from '@solana/web3.js';

function Transfer({ to, amount }: { to: string; amount: number }) {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const send = () => signAndSendTransaction({
    instructions: [
      SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: new PublicKey(to),
        lamports: amount * 1e9,
      }),
    ],
  });

  return <button onClick={send}>Send {amount} SOL</button>;
}
```

---

## Sign Message (8 lines)

```tsx
import { useWallet } from '@lazorkit/wallet';

function SignMessage() {
  const { signMessage } = useWallet();

  const verify = async () => {
    const { signature } = await signMessage('Verify wallet ownership');
    console.log('Signature:', signature);
  };

  return <button onClick={verify}>Sign Message</button>;
}
```

---

## Jupiter Swap Quote (12 lines)

```tsx
const SOL = 'So11111111111111111111111111111111111111112';
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function getSwapQuote(amountInSol: number) {
  const res = await fetch(
    `https://api.jup.ag/swap/v1/quote?` +
    `inputMint=${SOL}&outputMint=${USDC}&amount=${amountInSol * 1e9}&slippageBps=50`
  );
  const quote = await res.json();
  return quote; // { outAmount, priceImpactPct, ... }
}
```

---

## Provider Setup (Web)

```tsx
import { LazorkitProvider } from '@lazorkit/wallet';

function App({ children }) {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{ paymasterUrl: "https://kora.devnet.lazorkit.com" }}
    >
      {children}
    </LazorkitProvider>
  );
}
```

---

## Provider Setup (Mobile/Expo)

```tsx
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';

function App({ children }) {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      configPaymaster={{ paymasterUrl: "https://kora.devnet.lazorkit.com" }}
    >
      {children}
    </LazorKitProvider>
  );
}
```

---

## Mobile Connect (requires redirect)

```tsx
import { useWallet } from '@lazorkit/wallet-mobile-adapter';

function MobileLogin() {
  const { connect, wallet } = useWallet();

  return (
    <button onClick={() => connect({ redirectUrl: 'myapp://callback' })}>
      {wallet ? 'Connected' : 'Login'}
    </button>
  );
}
```

---

## Full Swap Execution (20 lines)

```tsx
import { useWallet } from '@lazorkit/wallet';

function useSwap() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  return async (quote: any) => {
    const { swapTransaction } = await fetch('https://api.jup.ag/swap/v1/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: smartWalletPubkey.toBase58(),
      }),
    }).then(r => r.json());

    return signAndSendTransaction({ 
      transaction: swapTransaction,
      transactionOptions: { feeToken: 'USDC' }
    });
  };
}
```

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User      │────▶│  LazorKit Portal │────▶│  Smart Wallet   │
│  (Passkey)  │     │  (Auth + Keys)   │     │  (PDA on-chain) │
└─────────────┘     └──────────────────┘     └─────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │    Paymaster     │
                    │  (Pays gas fees) │
                    └──────────────────┘
```

**Flow:**
1. User authenticates with Face ID / Touch ID
2. LazorKit Portal manages passkey credentials
3. Smart Wallet (PDA) holds assets on Solana
4. Paymaster sponsors transaction fees → gasless UX
