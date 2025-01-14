import React, { createContext, useContext, useState, useEffect } from 'react';

interface TransactionState {
  isLoading: boolean;
  loadingMessage: string;
  currentTxId: string | null;
}

interface TransactionContextType {
  state: TransactionState;
  startTransaction: (message: string) => void;
  updateTransaction: (txId: string, message: string) => void;
  completeTransaction: () => void;
  failTransaction: (error: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    loadingMessage: '',
    currentTxId: null
  });

  const startTransaction = (message: string) => {
    console.log('🚀 Starting transaction:', message);
    setState(prev => {
      console.log('Previous state:', prev);
      const newState = {
        isLoading: true,
        loadingMessage: message,
        currentTxId: null
      };
      console.log('New state:', newState);
      return newState;
    });
  };

  useEffect(() => {
    console.log('Transaction state changed:', state);
  }, [state]);

  const updateTransaction = (txId: string, message: string) => {
    setState({
      isLoading: true,
      loadingMessage: message,
      currentTxId: txId
    });
  };

  const completeTransaction = () => {
    setState({
      isLoading: false,
      loadingMessage: '',
      currentTxId: null
    });
  };

  const failTransaction = (error: string) => {
    setState({
      isLoading: false,
      loadingMessage: error,
      currentTxId: null
    });
  };

  return (
    <TransactionContext.Provider
      value={{
        state,
        startTransaction,
        updateTransaction,
        completeTransaction,
        failTransaction
      }}
    >
      {children}
      {state.isLoading && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '300px',
            maxWidth: '90%'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p style={{ 
              marginTop: '16px',
              textAlign: 'center',
              color: '#1a1a1a',
              fontSize: '16px',
              fontWeight: '500'
            }}>{state.loadingMessage}</p>
            {state.currentTxId && (
              <p style={{ 
                marginTop: '8px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
                wordBreak: 'break-all',
                padding: '0 16px'
              }}>
                Transaction ID: {state.currentTxId}
              </p>
            )}
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
} 