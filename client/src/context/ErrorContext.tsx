'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Типи для повідомлень
type ErrorType = 'error' | 'warning' | 'success' | 'info';

interface ErrorState {
  message: string;
  type: ErrorType;
}

interface ErrorContextType {
  showError: (message: string, type?: ErrorType) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = (message: string, type: ErrorType = 'error') => {
    setError({ message, type });
    // Автоматично ховаємо помилку через 3 секунди
    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}

      {/* Блок сповіщення */}
      <AnimatePresence>
        {error && (
          <motion.div
            className={`fixed bottom-4 left-1/2 z-50 rounded-xl p-3 ${
              error.type === 'error'
                ? 'bg-red-600'
                : error.type === 'warning'
                  ? 'bg-yellow-500 text-black'
                  : error.type === 'success'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
            }`}
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20 }}
          >
            {error.message}
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
