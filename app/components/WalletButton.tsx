'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const { publicKey } = useWallet();

  return (
    <div style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      zIndex: 50
    }}>
      <WalletMultiButton />
    </div>
  );
} 