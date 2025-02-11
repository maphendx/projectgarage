import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const TopbarSearchField = () => {
  const [isTyping, setIsTyping] = useState(false);
  let typingTimeout: NodeJS.Timeout;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeout);
    };
  }, []);

  return (
    <motion.div
      className='group relative ml-6 flex-1 transition-all duration-300 ease-out'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className='relative'>
        <div className='absolute left-2 top-1/2 -translate-y-1/2 transform'>
          <i
            className='fas fa-search ml-2 mt-[20px] text-[#A1A1A1]'
            style={{ opacity: 0.8, lineHeight: '52px' }}
          ></i>
        </div>
        <motion.input
          type='text'
          placeholder='Пошук...'
          className='text-ml-4 mt-5 h-[52px] w-[1275px] rounded-[16px] bg-[rgb(43,45,49)] px-4 pl-10 pr-10 text-[#A1A1A1] placeholder-[#A1A1A1]/60 transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#2B2D31]'
          onChange={handleInputChange}
          animate={{
            boxShadow: isTyping
              ? '0 0 10px rgba(216, 180, 255, 0.9)'
              : '0 0 5px rgba(216, 180, 255, 0.6)',
            borderColor: isTyping ? '#D8B4FF' : 'transparent',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

export default TopbarSearchField;
