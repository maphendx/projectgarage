import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface compInterface {
  iconClass?: string; // клас для іконки
  text?: any;
  onClick?: any; // обробник натискання
  additionClasses?: string; // додатково докинути класів, щоб стилізувати конкретну кнопку
  countAddedFiles?: number; // кількість доданих файлів для кнопок в newPostBlock
  resetAddedFiles?: () => void; // скинути додані файли в newPostBlock
}

const PostButton = ({
  iconClass,
  text,
  onClick,
  additionClasses,
  countAddedFiles,
  resetAddedFiles,
}: compInterface) => {
  return (
    // маленька кнопочка мімімі, яка тусується в постах
    <div className='flex'>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 50 }}
      >
        <button
          className={`flex items-center rounded-md p-1 text-gray-400 hover:text-gray-300 ${additionClasses} ${countAddedFiles && countAddedFiles > 0 ? ` ${`bg-[#FFFFFF1A]`}` : ``}`}
          onClick={onClick}
        >
          <i className={iconClass}></i>
          {text}
          {countAddedFiles && countAddedFiles > 0
            ? ` (${countAddedFiles})`
            : ``}
        </button>
      </motion.div>
      {countAddedFiles && resetAddedFiles && countAddedFiles > 0 ? (
        <motion.button
          className='ml-1 rounded-md bg-[#ffffff0f] p-1 text-red-800'
          onClick={resetAddedFiles}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <i className='fas fa-times'></i>
        </motion.button>
      ) : (
        <></>
      )}
    </div>
  );
};

export default PostButton;
