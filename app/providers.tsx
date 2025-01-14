'use client';

import { TransactionProvider } from '../context/TransactionContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('🎯 Providers rendering');
  return (
    <TransactionProvider>
      <div className="relative min-h-screen">
        {children}
      </div>
      <Toaster position="top-center" />
    </TransactionProvider>
  );
} 