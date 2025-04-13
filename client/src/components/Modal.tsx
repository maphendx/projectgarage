import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Забороняємо прокрутку
    } else {
      document.body.style.overflow = ''; // Відновлюємо прокрутку
    }

    return () => {
      document.body.style.overflow = ''; // Очистка ефекту при розмонтуванні
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className='fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1F]/60 backdrop-blur-sm'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className='relative w-full max-w-md rounded-lg bg-[#2B2D31] p-6 text-[#B5D6E7] shadow-lg'
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className='absolute right-4 top-4 text-[#B5BFE7] transition-colors hover:text-[#6374B6]'
              onClick={onClose}
              aria-label='Close Modal'
            >
              ✕
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
