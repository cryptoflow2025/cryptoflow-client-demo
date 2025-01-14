'use client';

import { PaymentButtons } from './components/PaymentButtons';
import { WalletButton } from './components/WalletButton';

export default function Home() {
  return (
    <main>
      <WalletButton />
      <PaymentButtons />
    </main>
  );
}
