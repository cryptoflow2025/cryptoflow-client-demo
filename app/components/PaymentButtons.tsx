'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { ProgramService } from '../../lib/programService';
import { Connection } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { useTransaction } from '../../context/TransactionContext';
import { toast } from 'react-hot-toast';

export function PaymentButtons() {
  const { publicKey } = useWallet();
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    'confirmed'
  );
  const programService = new ProgramService(connection);
  const { startTransaction, updateTransaction, completeTransaction, failTransaction } = useTransaction();

  const [whitelistAmount, setWhitelistAmount] = useState('');
  const [nonWhitelistAmount, setNonWhitelistAmount] = useState('');
  const [whitelistProjectId, setWhitelistProjectId] = useState('');
  const [nonWhitelistProjectId, setNonWhitelistProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 数据加载完成后
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handlePayment = async (amount: string, projectId: string, paymentType: 'whitelist' | 'non-whitelist') => {
    if (!publicKey) {
      alert('Please connect your wallet');
      return;
    }

    console.log("projectId: ", projectId);
    console.log("amount: ", amount);
    console.log("paymentType: ", paymentType);

    try {
      const parsedAmount = parseFloat(amount) * 10 ** 6;
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      startTransaction('Initiating USDC payment...');
      
      const callbacks = {
        onStart: () => updateTransaction('', 'Processing transaction...'),
        onUpdate: (signature: string, message: string) => updateTransaction(signature, message),
        onComplete: () => completeTransaction(),
        onError: (error: Error) => failTransaction(error.message)
      };

      const { success, signature, error } = paymentType === 'whitelist' 
        ? await programService.dispatchUsdcForWhitelistStakingProgram(publicKey, projectId, parsedAmount, callbacks)
        : await programService.dispatchUsdcForNonWhitelistStakingProgram(publicKey, projectId, parsedAmount, callbacks);

      if (success && signature) {
        try {
          updateTransaction(signature, 'Confirming transaction...');
          
          let retries = 30;
          while (retries > 0) {
            const status = await connection.getSignatureStatus(signature);
            console.log('Transaction status:', status);
            
            if (status?.value?.confirmationStatus === 'confirmed' || 
                status?.value?.confirmationStatus === 'finalized') {
              completeTransaction();
              toast.success('Payment successful!', {
                duration: 5000,
                icon: '✅',
                style: {
                  background: 'rgba(16, 185, 129, 0.8)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                },
              });
              return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries--;
          }
          
          if (retries === 0) {
            failTransaction('Transaction confirmation timeout');
            toast.error('Transaction confirmation timeout');
          }
        } catch (confirmError) {
          console.error('Confirmation error:', confirmError);
          failTransaction('Transaction failed to confirm');
          toast.error('Payment failed to confirm');
        }
      } else {
        failTransaction(error || 'Transaction failed');
        console.log("error: ", error);
        // toast.error(`Payment failed: ${error}`);
      }
    } catch (error: any) {
      console.error(`❌ ${paymentType} payment error:`, error);
      failTransaction(error.message || 'Transaction failed');
      toast.error(`Payment error: ${error.message}`);
    }
  };

  const handleWhitelistPayment = () => handlePayment(whitelistAmount, whitelistProjectId, 'whitelist');
  const handleNonWhitelistPayment = () => handlePayment(nonWhitelistAmount, nonWhitelistProjectId, 'non-whitelist');

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        maxWidth: '800px',
        color: '#374151',
      }}>
        <p style={{ marginBottom: '0.5rem' }}>
          This page is for testing <strong>USDC</strong> payments in the <strong>Cryptoflow merchant application</strong> to experience various <strong>Cryptoflow features</strong>.
        </p>
        <p>
          You can get devnet SOL from the{' '}
          <a 
            href="https://faucet.solana.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#3B82F6', textDecoration: 'underline' }}
          >
            faucet
          </a>
        </p>
        <p>
          You can get Solana devnet USDC {' '}
          <a 
            href="https://spl-token-faucet.com/?token-name=USDC-Dev" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#3B82F6', textDecoration: 'underline' }}
          >
            here
          </a>
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '1200px',
        padding: '0 2rem',
      }}>
        {/* Whitelist Container */}
        <div style={{
          flex: '1',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #eee',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>Whitelist Payment</h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>Project ID</label>
              <input
                type="text"
                value={whitelistProjectId}
                onChange={(e) => setWhitelistProjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                }}
                placeholder="Enter project ID"
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>Amount (USDC)</label>
              <input
                type="number"
                value={whitelistAmount}
                onChange={(e) => setWhitelistAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                }}
                placeholder="Enter amount"
              />
            </div>
            <button
              onClick={handleWhitelistPayment}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                marginTop: '0.5rem',
              }}
            >
              Pay USDC for whitelist
            </button>
          </div>
        </div>

        {/* Non-Whitelist Container */}
        <div style={{
          flex: '1',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #eee',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>Non-Whitelist Payment</h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>Project ID</label>
              <input
                type="text"
                value={nonWhitelistProjectId}
                onChange={(e) => setNonWhitelistProjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                }}
                placeholder="Enter project ID"
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
              }}>Amount (USDC)</label>
              <input
                type="number"
                value={nonWhitelistAmount}
                onChange={(e) => setNonWhitelistAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                }}
                placeholder="Enter amount"
              />
            </div>
            <button
              onClick={handleNonWhitelistPayment}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                marginTop: '0.5rem',
              }}
            >
              Pay USDC for non-whitelist
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
} 