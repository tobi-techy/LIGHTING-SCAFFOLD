import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { Stack } from 'expo-router';
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { StatusBar } from 'expo-status-bar';

const CONFIG = {
  rpcUrl: process.env.EXPO_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
  portalUrl: process.env.EXPO_PUBLIC_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh',
  configPaymaster: {
    paymasterUrl: process.env.EXPO_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com',
  },
};

export default function RootLayout() {
  return (
    <LazorKitProvider
      rpcUrl={CONFIG.rpcUrl}
      portalUrl={CONFIG.portalUrl}
      configPaymaster={CONFIG.configPaymaster}
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </LazorKitProvider>
  );
}
