import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface PhotoModalProps {
  images: { id: number; image: string }[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Встановлюємо mounted у true після першого рендеру для портала
  useEffect(() => {
    setMounted(true);
  }, []);

  // Блокування скролу на body, коли модальне вікно відкрите
  useEffect(() => {
    if (isOpen) {
      // Збережемо поточну позицію скролу
      const scrollY = window.scrollY;
      
      // Додамо додатковий клас для ізоляції модального вікна  
      document.documentElement.classList.add('modal-open');
      
      // Блокуємо скрол і зберігаємо позицію
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Відновлюємо скрол при закритті модального вікна
        document.documentElement.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    // Скидання масштабу при зміні зображення
    setScale(1);
    setIsLoading(true);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handlePrevious = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = () => {
    if (images && images[currentIndex]) {
      const link = document.createElement('a');
      link.href = images[currentIndex].image;
      link.download = `image-${images[currentIndex].id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImageClick = () => {
    // Перемикання між масштабами 1x та 2x при кліку
    setScale((prev) => (prev === 1 ? 2 : 1));
  };

  // Перевіряємо наявність об'єкта document
  // Це потрібно для SSR в Next.js
  if (!mounted || typeof document === 'undefined' || !images || images.length === 0) {
    return null;
  }

  // Використовуємо портал для відображення модального вікна поза звичайним потоком DOM
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Основний контейнер */}
          <div 
            ref={modalRef}
            className="relative flex h-full w-full items-center justify-center"
            style={{
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закриття */}
            <motion.button
              className="absolute right-4 top-4 rounded-full bg-black bg-opacity-50 p-3 text-white hover:bg-opacity-70"
              style={{ zIndex: 10010 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              <i className="fas fa-times text-xl"></i>
            </motion.button>

            {/* Кнопка завантаження */}
            <motion.button
              className="absolute right-20 top-4 rounded-full bg-black bg-opacity-50 p-3 text-white hover:bg-opacity-70"
              style={{ zIndex: 10010 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
            >
              <i className="fas fa-download text-xl"></i>
            </motion.button>

            {/* Кнопка попереднього зображення */}
            {images.length > 1 && (
              <motion.button
                className="absolute left-4 rounded-full bg-black bg-opacity-50 p-3 text-white hover:bg-opacity-70"
                style={{ zIndex: 10010 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevious}
              >
                <i className="fas fa-chevron-left text-xl"></i>
              </motion.button>
            )}

            {/* Кнопка наступного зображення */}
            {images.length > 1 && (
              <motion.button
                className="absolute right-4 rounded-full bg-black bg-opacity-50 p-3 text-white hover:bg-opacity-70"
                style={{ zIndex: 10010 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
              >
                <i className="fas fa-chevron-right text-xl"></i>
              </motion.button>
            )}

            {/* Контейнер зображення */}
            <div 
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              style={{ zIndex: 10005 }}
            >
              {/* Індикатор завантаження */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                </div>
              )}

              {/* Поточне зображення */}
              <motion.div
                className="relative"
                style={{ zIndex: 10005 }}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  scale: scale,
                  transition: { duration: 0.3 }
                }}
                key={`image-${currentIndex}`}
                style={{ 
                  cursor: scale === 1 ? 'zoom-in' : 'zoom-out',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  width: '100%'
                }}
                onClick={handleImageClick}
              >
                <img
                  src={images[currentIndex].image}
                  alt={`Фото ${currentIndex + 1}`}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  onLoad={() => setIsLoading(false)}
                  style={{
                    transition: 'transform 0.3s ease'
                  }}
                />
              </motion.div>
            </div>

            {/* Лічильник зображень */}
            {images.length > 1 && (
              <div 
                className="absolute bottom-6 left-1/2 -translate-x-1/2 transform rounded-full bg-black bg-opacity-50 px-4 py-2 text-base text-white"
                style={{ zIndex: 10010 }}
              >
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PhotoModal;