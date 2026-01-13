# LazorKit Integration Tutorials

Complete step-by-step guides for building Solana apps with passkey authentication and gasless transactions.

---

## Tutorial 1: Create Your First Passkey Wallet

Learn how to create a Solana wallet using Face ID/Touch ID instead of seed phrases.

### Prerequisites
- Node.js 18+ installed
- Basic React knowledge

### Step 1: Scaffold Your Project

```bash
npx create-lightning-scaffold
```

Choose:
- Project name: `my-passkey-wallet`
- Preset: **Web App**
- Framework: **Next.js**
- Styling: **tailwind**
- State: **zustand**
- Package manager: **npm**

### Step 2: Install Dependencies

```bash
cd my-passkey-wallet
npm install
```

### Step 3: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Your `.env` should contain:
```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
```

### Step 4: Understand the Provider Setup

Open `app/providers.tsx` - this wraps your app with LazorKit:

```tsx
import { LazorkitProvider } from '@lazorkit/wallet';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazorkitProvider
      rpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC!}
      portalUrl={process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL!}
      paymasterConfig={{
        paymasterUrl: "https://kora.devnet.lazorkit.com"
      }}
    >
      {children}
    </LazorkitProvider>
  );
}
```

**What's happening:**
- `rpcUrl`: Solana RPC endpoint (Devnet for testing)
- `portalUrl`: LazorKit authentication service
- `paymasterConfig`: Enables gasless transactions

### Step 5: Create a Wallet with Passkey

Open `components/Onboarding.tsx` to see the wallet creation flow:

```tsx
import { useWallet } from '@lazorkit/wallet';

export function Onboarding() {
  const { connect, wallet } = useWallet();

  const handleConnect = async () => {
    try {
      // This triggers Face ID/Touch ID prompt
      await connect();
      // Wallet created! No seed phrase needed
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  return (
    <button onClick={handleConnect}>
      Create Wallet with Passkey
    </button>
  );
}
```

**What happens under the hood:**
1. User clicks "Create Wallet"
2. Browser shows Face ID/Touch ID prompt
3. LazorKit creates a Solana keypair
4. Private key is stored securely in device's secure enclave
5. Smart wallet (PDA) is created on-chain
6. User is authenticated

### Step 6: Run Your App

```bash
npm run dev
```

Visit `http://localhost:3000` and click "Create Wallet with Passkey".

### Step 7: Access Wallet Information

Once connected, you can access wallet data:

```tsx
const { wallet, smartWalletPubkey } = useWallet();

console.log('Wallet address:', wallet?.smartWallet);
console.log('Public key:', smartWalletPubkey?.toBase58());
```

### Key Concepts

**Passkey vs Seed Phrase:**
- Traditional: 12-24 word seed phrase (easy to lose/steal)
- Passkey: Biometric authentication (can't be phished or lost)

**Smart Wallet:**
- Your wallet is a Program Derived Address (PDA)
- Supports multiple devices (add backup passkeys)
- Enables gasless transactions
- Can be recovered if you lose a device

### Next Steps
- Tutorial 2: Send your first gasless transaction
- Tutorial 3: Add device recovery

---

## Tutorial 2: Send a Gasless Transaction

Learn how to send Solana transactions without users paying gas fees.

### Prerequisites
- Completed Tutorial 1
- Wallet created with passkey

### Step 1: Understand Gasless Transactions

Traditional Solana transactions require SOL for gas fees. With LazorKit:
- **Paymaster** pays gas fees for users
- Users can transact with zero SOL balance
- Fees can be paid in USDC or other tokens

### Step 2: Explore the Swap Component

Open `components/Swap.tsx` - this shows a real gasless transaction:

```tsx
import { useWallet } from '@lazorkit/wallet';

export function Swap() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const handleSwap = async () => {
    // 1. Get swap quote from Jupiter
    const quote = await fetch(
      `https://api.jup.ag/swap/v1/quote?inputMint=${SOL}&outputMint=${USDC}&amount=${amount}`
    ).then(r => r.json());

    // 2. Build swap transaction
    const { swapTransaction } = await fetch('https://api.jup.ag/swap/v1/swap', {
      method: 'POST',
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: smartWalletPubkey.toBase58()
      })
    }).then(r => r.json());

    // 3. Sign and send (gasless!)
    const signature = await signAndSendTransaction({
      instructions: [], // Jupiter provides full tx
      transactionOptions: {
        feeToken: 'USDC' // Pay gas in USDC instead of SOL
      }
    });

    console.log('Transaction sent:', signature);
  };
}
```

### Step 3: Build a Simple Transfer

Let's create a basic SOL transfer with gasless execution:

```tsx
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, Transaction } from '@solana/web3.js';

function GaslessTransfer() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const sendSOL = async (recipient: string, amount: number) => {
    // Create transfer instruction
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: new PublicKey(recipient),
      lamports: amount * 1e9 // Convert SOL to lamports
    });

    // Send transaction (paymaster covers gas)
    const signature = await signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: {
        feeToken: 'USDC' // Optional: pay gas in USDC
      }
    });

    return signature;
  };

  return (
    <button onClick={() => sendSOL('RECIPIENT_ADDRESS', 0.1)}>
      Send 0.1 SOL (Gasless)
    </button>
  );
}
```

### Step 4: Test the Transaction

1. Run your app: `npm run dev`
2. Create a wallet (Tutorial 1)
3. Get devnet SOL from faucet: https://faucet.solana.com
4. Click "Send 0.1 SOL"
5. Approve with Face ID/Touch ID
6. Transaction sent without paying gas!

### Step 5: View Transaction History

The generated app includes a History component:

```tsx
import { Connection, PublicKey } from '@solana/web3.js';

function History() {
  const { wallet } = useWallet();
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    const conn = new Connection('https://api.devnet.solana.com');
    conn.getSignaturesForAddress(new PublicKey(wallet.smartWallet))
      .then(sigs => setTxs(sigs))
      .catch(console.error);
  }, [wallet]);

  return (
    <div>
      {txs.map(tx => (
        <a href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}>
          {tx.signature.slice(0, 8)}...
        </a>
      ))}
    </div>
  );
}
```

### Step 6: Handle Transaction Errors

Always wrap transactions in try-catch:

```tsx
const handleTransaction = async () => {
  try {
    const sig = await signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: { feeToken: 'USDC' }
    });
    console.log('Success:', sig);
  } catch (error) {
    if (error.message.includes('User rejected')) {
      console.log('User cancelled transaction');
    } else {
      console.error('Transaction failed:', error);
    }
  }
};
```

### Key Concepts

**Paymaster:**
- Service that pays gas fees on behalf of users
- Configured in `LazorkitProvider`
- Can sponsor all transactions or set limits

**Fee Tokens:**
- Default: Paymaster pays in SOL
- Optional: User pays in USDC/other tokens
- Specify with `feeToken` parameter

**Transaction Options:**
```tsx
transactionOptions: {
  feeToken: 'USDC',        // Pay gas in USDC
  skipPreflight: false,    // Simulate before sending
  maxRetries: 3            // Retry on failure
}
```

### Next Steps
- Tutorial 3: Add device recovery
- Explore Jupiter swap integration
- Build custom transaction flows

---

## Tutorial 3: Add Device Recovery & Backup Passkeys

Learn how to add backup passkeys so users never lose access to their wallet.

### Prerequisites
- Completed Tutorial 1
- Wallet created with passkey

### The Problem

With traditional passkeys:
- Lose your device = lose your wallet
- No way to access from another device

LazorKit solves this with **multi-device support**.

### Step 1: Understand Recovery Architecture

Your wallet supports multiple passkeys:
- **Primary passkey**: Created during onboarding
- **Backup passkeys**: Added from other devices
- All passkeys can sign transactions
- Lose one device? Use another

### Step 2: Explore the Recovery Component

Open `components/Recovery.tsx`:

```tsx
import { useWallet } from '@lazorkit/wallet';

export function Recovery() {
  const { wallet } = useWallet();
  const portalUrl = process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL;

  const handleAddDevice = () => {
    // Opens LazorKit portal to register new passkey
    window.open(`${portalUrl}/recovery/add-device`, '_blank');
  };

  const handleManageDevices = () => {
    // View all registered passkeys
    window.open(`${portalUrl}/recovery/devices`, '_blank');
  };

  return (
    <div>
      <button onClick={handleAddDevice}>
        Add Backup Device
      </button>
      <button onClick={handleManageDevices}>
        Manage Devices
      </button>
    </div>
  );
}
```

### Step 3: Add a Backup Passkey

**From your primary device:**

1. Run your app and connect wallet
2. Navigate to Recovery section
3. Click "Add Backup Device"
4. You'll see a QR code

**From your backup device (phone/tablet):**

1. Scan the QR code
2. Approve with Face ID/Touch ID
3. Backup passkey registered!

Now you can access your wallet from both devices.

### Step 4: Test Recovery

1. Close your app on primary device
2. Open app on backup device
3. Click "Connect Wallet"
4. Use Face ID/Touch ID on backup device
5. Same wallet, same balance!

### Step 5: Build Custom Recovery UI

Create a custom recovery flow:

```tsx
import { useWallet } from '@lazorkit/wallet';
import * as Linking from 'expo-linking'; // For mobile

function CustomRecovery() {
  const { wallet } = useWallet();
  const [qrCode, setQrCode] = useState('');

  const generateRecoveryLink = async () => {
    // Generate recovery link
    const recoveryUrl = `${portalUrl}/recovery/add-device?wallet=${wallet.smartWallet}`;
    setQrCode(recoveryUrl);
  };

  const addDeviceFromLink = async (link: string) => {
    // Open recovery link
    await Linking.openURL(link);
  };

  return (
    <div>
      <button onClick={generateRecoveryLink}>
        Generate Recovery QR
      </button>
      {qrCode && <QRCode value={qrCode} />}
    </div>
  );
}
```

### Step 6: Remove Compromised Devices

If a device is lost or stolen:

```tsx
const handleManageDevices = () => {
  // Opens portal to view all passkeys
  window.open(`${portalUrl}/recovery/devices`, '_blank');
  
  // User can:
  // 1. See all registered devices
  // 2. Remove compromised passkeys
  // 3. Add new backup passkeys
};
```

### Step 7: Best Practices

**Onboarding Flow:**
```tsx
function Onboarding() {
  const [step, setStep] = useState(1);

  return (
    <>
      {step === 1 && <CreateWallet onSuccess={() => setStep(2)} />}
      {step === 2 && <AddBackupDevice onSuccess={() => setStep(3)} />}
      {step === 3 && <WalletReady />}
    </>
  );
}
```

**Prompt users to add backup:**
```tsx
useEffect(() => {
  const hasBackup = localStorage.getItem('backup-added');
  if (!hasBackup && wallet) {
    // Show reminder after 1 day
    setTimeout(() => {
      setShowBackupReminder(true);
    }, 24 * 60 * 60 * 1000);
  }
}, [wallet]);
```

### Key Concepts

**Multi-Device Architecture:**
- Each device has its own passkey
- All passkeys linked to same smart wallet
- Any passkey can sign transactions
- Passkeys stored in device secure enclave

**Security Model:**
- Passkeys can't be exported
- Each device authenticates independently
- Compromised device can be removed
- Wallet remains secure

**Recovery vs Backup:**
- **Backup**: Proactive (add devices before losing one)
- **Recovery**: Reactive (restore after losing device)
- Always encourage users to add backups early

### Mobile-Specific Implementation

For React Native/Expo:

```tsx
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const addBackupDevice = async () => {
  const redirectUrl = Linking.createURL('/recovery-callback');
  const recoveryUrl = `${portalUrl}/recovery/add-device?redirect=${redirectUrl}`;
  
  await WebBrowser.openAuthSessionAsync(recoveryUrl, redirectUrl);
};
```

### Testing Recovery

1. Create wallet on Device A
2. Add backup passkey from Device B
3. Close app on Device A
4. Open app on Device B
5. Connect with backup passkey
6. Verify same wallet address
7. Send transaction from Device B
8. Check transaction history on Device A

### Next Steps
- Implement social recovery (coming soon)
- Add email backup option
- Build custom recovery UI
- Integrate with hardware wallets

---

## Additional Resources

### Code Examples
- [Full Next.js Example](https://github.com/your-repo/examples/nextjs)
- [Vite Example](https://github.com/your-repo/examples/vite)
- [React Native Example](https://github.com/your-repo/examples/mobile)

### API Reference
- [LazorKit SDK Docs](https://docs.lazorkit.com)
- [Jupiter API](https://station.jup.ag/docs/apis/swap-api)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

### Community
- [Discord](https://discord.gg/lazorkit)
- [Twitter](https://twitter.com/lazorkit)
- [GitHub](https://github.com/lazorkit)

### Troubleshooting

**Passkey not working:**
- Ensure HTTPS (localhost is OK for dev)
- Check browser supports WebAuthn
- Verify device has biometric auth enabled

**Transaction failing:**
- Check wallet has sufficient balance
- Verify RPC endpoint is responsive
- Ensure paymaster is configured correctly

**Recovery not working:**
- Confirm both devices use same portal URL
- Check wallet address matches
- Verify backup passkey was registered successfully

---

## What's Next?

You've learned:
✅ Create passkey wallets
✅ Send gasless transactions  
✅ Add device recovery

**Build something amazing:**
- DeFi app with no gas fees
- NFT marketplace with passkey login
- Gaming wallet with biometric auth
- Social app with seamless onboarding

Share your project with the community! 🚀
