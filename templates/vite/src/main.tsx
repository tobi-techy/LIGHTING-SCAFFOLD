import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazorkitProvider } from '@lazorkit/wallet'
import App from './App'
import './index.css'

const CONFIG = {
  rpcUrl: import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com',
  portalUrl: import.meta.env.VITE_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: import.meta.env.VITE_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com',
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazorkitProvider
      rpcUrl={CONFIG.rpcUrl}
      portalUrl={CONFIG.portalUrl}
      paymasterConfig={CONFIG.paymasterConfig}
    >
      <App />
    </LazorkitProvider>
  </StrictMode>,
)
