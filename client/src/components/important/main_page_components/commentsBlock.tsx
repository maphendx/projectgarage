import { UserData } from '@/components/not_components';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import fetchClient from '@/other/fetchClient';
import Image from 'next/image';

interface CompInterface {
  isVisible: boolean;
  userData: UserData | null;
  postId: number;
  commentList: Array<{
    author: { display_name: string; photo: string };
    content: string;
    id: number;
  }>;
  updateListOfComments: (commentAdd?: boolean) => Promise<void>;
}

const CommentBlock = ({
  isVisible,
  userData,
  postId,
  commentList,
  updateListOfComments,
}: CompInterface) => {
  const [content, setContent] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const handleClick = async () => {
    try {
      if (content.length <= 5 || content.trim().length <= 3) {
        throw new Error('Текст коментара занадто короткий!');
      }

      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${postId}/comments/`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            content: content,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      } else {
        await updateListOfComments(true);
        setContent('');
      }
    } catch (error) {
      console.error(`Публікація не вдалась! ${error}`);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className='mb-6 rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6'
          style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={modalVariants}
        >
          <div className='flex'>
            <Image
              className='h-10 w-10 rounded-[14px]'
              src={userData ? userData.photo : '/path/to/placeholder-image.png'}
              alt='User'
              width={40}
              height={40}
            />
            <div className='ml-3 flex-1'>
              <textarea
                rows={1}
                className='w-full resize-none overflow-hidden rounded-[16px] border-[1px] border-white border-opacity-10 bg-opacity-50 bg-gradient-to-r from-[#2D2F3A] to-[#1A1A2E] p-2 text-white placeholder-[#6B7280]'
                value={content}
                onChange={handleChange}
                placeholder='Додати коментар...'
              ></textarea>
            </div>
            <button
              className='ml-2 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#6374B6] text-white'
              onClick={handleClick}
            >
              <i className='fa fa-paper-plane'></i>
            </button>
          </div>
          {commentList instanceof Array
            ? commentList.map((comment) => (
                <motion.div
                  className='mt-4 flex'
                  key={comment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    className='h-10 w-10 rounded-[14px]'
                    src={
                      userData
                        ? userData.photo
                        : '/path/to/placeholder-image.png'
                    }
                    alt={comment.author.display_name || 'User'}
                    width={40}
                    height={40}
                  />
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-white'>
                      {userData ? userData.display_name : 'Завантаження...'}
                    </p>
                    <p className='mt-1 whitespace-pre-wrap break-words text-white'>
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              ))
            : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentBlock;
