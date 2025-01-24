import { UserData } from '@/components/not_components';
import { useState } from 'react';
<<<<<<< HEAD

interface compInterface {
  isVisible: boolean;
  userData: UserData | null;
  postId: number;
  commentList: Array<{ content: string; id: number }>;
=======
import { motion, AnimatePresence } from 'framer-motion';

interface CompInterface {
  isVisible: boolean;
  userData: UserData | null;
  postId: number;
  commentList: Array<{
    author: { display_name: string; photo: string };
    content: string;
    id: number;
  }>;
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
  updateListOfComments: (commentAdd?: boolean) => Promise<void>;
}

const CommentBlock = ({
  isVisible,
  userData,
  postId,
  commentList,
  updateListOfComments,
<<<<<<< HEAD
}: compInterface) => {
  // компонента з УСІМА коментарами

  const [content, setContent] = useState('');
=======
}: CompInterface) => {
  const [content, setContent] = useState('');

>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const handleClick = async () => {
<<<<<<< HEAD
    // одбробник кнопки створення коментаря
=======
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
    const token = localStorage.getItem('token');

    try {
      if (content.length <= 5 || content.trim().length <= 3) {
<<<<<<< HEAD
        throw Error('Текст коментара занадто короткий!');
      }

      const postPostResponse = await fetch(
=======
        throw new Error('Текст коментара занадто короткий!');
      }

      const response = await fetch(
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
        `http://localhost:8000/api/posts/posts/${postId}/comments/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            content: content,
          }),
        },
      );

<<<<<<< HEAD
      if (!postPostResponse.ok) {
        const data = await postPostResponse.json();
        throw new Error(data.message);
      } else {
        updateListOfComments(true);
        setContent('');
      }
    } catch (Error) {
      console.error(`Публікація не вдалась! ${Error}`);
    }
  };

  return (
    <div
      className={`-translate-y-6 rounded-lg border-2 border-[#101010] bg-[#181717] p-6 shadow-xl ${isVisible ? '' : 'hidden'}`}
    >
      <div className='mb-4 flex'>
        <img
          className='h-12 w-12 rounded-full'
          src={userData ? userData.photo : 'Завантаження...'}
          alt='User'
        />
        <button
          className='ml-3 rounded-l-xl bg-[#2f3846] p-4 text-white duration-300 hover:bg-[#1b1f27]'
          onClick={handleClick}
        >
          <i className='fa fa-paper-plane fs-lg'></i>
        </button>
        <textarea
          rows={2}
          className='w-full rounded-r-xl border-0 bg-[#374151] p-1 text-gray-400 placeholder-[#6B7280]'
          value={content}
          onChange={handleChange}
          placeholder='Додати коментар...'
        ></textarea>
      </div>
      {commentList instanceof Array
        ? commentList.map((comment) => {
            return (
              <div className='mb-4 flex' key={comment.id}>
                <img
                  className='mr-3 h-12 w-12 rounded-full'
                  src={userData ? userData.photo : 'Завантаження...'}
                  alt='User'
                />
                <p className='w-full rounded-xl border-0 bg-[#374151] p-1 text-gray-400 placeholder-[#6B7280]'>
                  {comment.content}
                </p>
              </div>
            );
          })
        : []}
    </div>
=======
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
            <img
              className='h-10 w-10 rounded-[14px]'
              src={userData ? userData.photo : 'Завантаження...'}
              alt='User'
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
              className='flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#6374B6] text-white'
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
                  <img
                    className='h-10 w-10 rounded-[14px]'
                    src={userData ? userData.photo : 'Завантаження...'}
                    alt={comment.author.display_name || 'User'}
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
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
  );
};

export default CommentBlock;
