import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Lyrics {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_public: boolean;
}

interface LyricsModalProps {
  lyrics: Lyrics;
  onClose: () => void;
}

const LyricsModal: React.FC<LyricsModalProps> = ({ lyrics, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Handle ESC key to close
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <motion.div
        ref={modalRef}
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl bg-[#2D2D35] shadow-2xl"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#3C4B84] to-[#6374B6] p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-[#2D2D35] bg-opacity-30 p-1 text-white transition-colors hover:bg-opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-white">{lyrics.title}</h2>
          <p className="mt-1 text-sm text-white text-opacity-80">
            {formatDate(lyrics.created_at)}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="rounded-lg bg-[#25252B] p-4 text-gray-200">
            <pre className="whitespace-pre-wrap font-sans">{lyrics.content}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Статус: {lyrics.is_public ? 'Публічний' : 'Приватний'}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg bg-[#3C4B84] px-4 py-2 text-white transition-colors hover:bg-[#6374B6]"
            >
              Закрити
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LyricsModal;