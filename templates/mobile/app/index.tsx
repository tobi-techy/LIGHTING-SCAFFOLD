import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { Onboarding } from '@/components/Onboarding';
import { Swap } from '@/components/Swap';

export default function Index() {
  const { isConnected } = useWallet();
  return isConnected ? <Swap /> : <Onboarding />;
}
