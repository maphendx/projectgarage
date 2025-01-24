import { InfoBlock } from '@/components/other';
import PostButton from './postButton';
import { ReactElement, useState, useRef } from 'react';
import { UserData } from '@/components/not_components';
import { motion } from 'framer-motion';

interface CompInterface {
  userData: UserData | null;
  onPostCreated: () => Promise<void>;
}

const NewPostBlock = ({ userData, onPostCreated }: CompInterface) => {
  const [content, setContent] = useState('');
  const [messageControl, setMessageControl] = useState<boolean>(true);
  const [messageBlock, setMessageBlock] = useState<ReactElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const updateMessage = (message: ReactElement) => {
    if (messageBlock !== null) {
      setMessageControl(false);
      setTimeout(() => {
        setMessageControl(true);
        setMessageBlock(message);
      }, 1010);
    } else {
      setMessageControl(true);
      setMessageBlock(message);
    }
  };

  const handleClick = async () => {
    const token = localStorage.getItem('token');

    if (content.length <= 5 || content.trim().length <= 3) {
      updateMessage(
        <InfoBlock
          key={Date.now()}
          getClasses='bg-red-600'
          getMessage='Текст посту занадто короткий!'
          getIconClasses='fa fa-times-circle'
          isAlive={messageControl}
        />,
      );
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/posts/posts/', {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ content, hashtags: [1] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Неочікувана помилка');
      }

      setContent('');
      await onPostCreated();
      updateMessage(
        <InfoBlock
          key={Date.now()}
          getClasses='bg-green-600'
          getMessage='Пост успішно опубліковано!'
          getIconClasses='fa fa-check-circle'
          isAlive={messageControl}
        />,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      updateMessage(
        <InfoBlock
          key={Date.now()}
          getClasses='bg-red-600'
          getMessage={`Публікація не вдалась! ${errorMessage}`}
          getIconClasses='fa fa-times-circle'
          isAlive={messageControl}
        />,
      );
    }
  };

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setContent(event.target.value);
    handleInput();
  };

  return (
    <div
      className='mb-6 rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6'
      style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
    >
      <div className='mb-4 flex items-center'>
        <img
          className='h-12 w-12 rounded-[14px]'
          src={userData ? userData.photo : 'Завантаження...'}
          alt='User'
        />
        <div className='ml-3 flex-1'>
          <textarea
            ref={textareaRef}
            rows={1}
            className='w-full resize-none overflow-hidden rounded-[16px] border-[1px] border-white border-opacity-10 bg-opacity-50 bg-gradient-to-r from-[#2D2F3A] to-[#1A1A2E] p-2 text-white placeholder-[#6B7280]'
            value={content}
            onChange={handleContentChange}
            placeholder='Що нового у світі музики?'
          ></textarea>
        </div>
      </div>
      <div className='flex items-center justify-between'>
        <div className='flex space-x-4'>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PostButton text='Фото' iconClass='fas fa-image mr-2' />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PostButton text='Відео' iconClass='fas fa-video mr-2' />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PostButton text='Аудіо' iconClass='fas fa-music mr-2' />
          </motion.div>
        </div>
        <motion.button
          className='h-12 rounded-[20px] bg-[#6374B6] px-4 py-2 text-white'
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Опублікувати
        </motion.button>
      </div>
      {messageBlock}
    </div>
  );
};

export default NewPostBlock;
