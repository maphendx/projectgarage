import PostButton from './postButton';
import { ReactElement, useState, useRef, useEffect } from 'react';
import {
  FileContainer,
  FileType,
  Post,
  UserData,
} from '@/components/not_components';
import { motion } from 'framer-motion';
import { useError } from '@/context/ErrorContext';
import MicroPost from '@/components/MicroPost';
import fetchClient from '@/other/fetchClient';
import Image from 'next/image';

interface CompInterface {
  userData: UserData | null;
  onPostCreated: () => Promise<void>;
  showAddFile: (type: FileType) => void;
  addFileStorage: FileContainer;
  resetAddFileStorage: (fileType: FileType) => void;
  repostPost?: Post;
  setRepostPost?: (post: Post | undefined) => void;
}

const NewPostBlock = ({
  userData,
  onPostCreated,
  showAddFile,
  addFileStorage,
  resetAddFileStorage,
  repostPost,
  setRepostPost,
}: CompInterface) => {
  const [content, setContent] = useState('');
  const [showAddHashtags, SetShowAddHashtags] = useState<boolean>(false);
  const [currentHashtag, setCurrentHashtag] = useState<string>('');
  const [listHashtags, SetListHashtags] = useState<string[]>([]);
  const { showError } = useError();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddHashtag = () => {
    if (currentHashtag.length < 3) {
      showError('Хештег не може бути коротшим трьох символів!', 'error');
    } else if (
      listHashtags.filter((element) => element === '#' + currentHashtag)
        .length > 0
    ) {
      showError('Даний хештег вже було додано!', 'error');
    } else {
      SetListHashtags([...listHashtags, '#' + currentHashtag]);
      setCurrentHashtag('');
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleClick = async () => {
    if (content.length <= 5 || content.trim().length <= 3) {
      showError('Довжина вмісту поста занадто коротка!', 'error');
      return;
    }

    if (listHashtags.length < 3) {
      showError('Пост не може мати менше трьох хештегів!', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('hashtags', listHashtags.join(','));
      if (repostPost)
        formData.append('original_post', repostPost.id.toString());
      addFileStorage.photos.forEach((element: File) =>
        formData.append('images', element),
      );
      addFileStorage.videos.forEach((element: File) =>
        formData.append('videos', element),
      );
      addFileStorage.audios.forEach((element: File) =>
        formData.append('audios', element),
      );

      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        const data = await response.json();
        if ('detail' in data) throw new Error(data.detail);
        else throw new Error(`Помилка: ${JSON.stringify(data)}`);
      }

      showError('Пост успішно опубліковано!', 'success');
      resetAddFileStorage(FileType.Photo);
      resetAddFileStorage(FileType.Audio);
      resetAddFileStorage(FileType.Video);
      SetListHashtags([]);
      setContent('');
      SetShowAddHashtags(false);
      if (setRepostPost) setRepostPost(undefined);
      setTimeout(() => {
        // підрендює новий пост методом древнього колхозу
        window.scrollBy(0, 1); // Примусовий скрол (на 1 піксель вниз)
        window.scrollBy(0, -1); // Повернення назад
      }, 220);
      await onPostCreated();
    } catch (error) {
      showError(`${error}`, 'error');
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
      className='border-b-solid border-t-none mb-6 rounded-[30px] border-b-[0.5px] border-t-[0.5px] border-[#2d2d2d] bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6'
      style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
    >
      <div className='mb-4 flex items-center'>
        <Image
          className='h-12 w-12 rounded-[14px] border-[1px] border-[#2d2d2d]'
          src={userData ? userData.photo : 'Завантаження...'}
          alt='User'
          width={50}
          height={50}
        />
        <div className='ml-2 mt-1 flex-1'>
          <textarea
            ref={textareaRef}
            rows={1}
            className='w-full resize-none overflow-hidden rounded-[14px] border-b-[2px] border-white border-opacity-10 bg-opacity-50 bg-gradient-to-r from-[#2D2F3A] to-[#1A1A2E] p-2 text-white placeholder-[#6B7280] transition-all duration-200 focus:outline-none'
            value={content}
            onChange={handleContentChange}
            placeholder='Що нового у світі музики?'
          ></textarea>
        </div>
      </div>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <PostButton
            text='Фото'
            iconClass='fas fa-image mr-2'
            onClick={() => showAddFile(FileType.Photo)}
            countAddedFiles={addFileStorage.photos.length}
            resetAddedFiles={() => resetAddFileStorage(FileType.Photo)}
          />
          <PostButton
            text='Відео'
            iconClass='fas fa-video mr-2'
            onClick={() => showAddFile(FileType.Video)}
            countAddedFiles={addFileStorage.videos.length}
            resetAddedFiles={() => resetAddFileStorage(FileType.Video)}
          />
          <PostButton
            text='Аудіо'
            iconClass='fas fa-music mr-2'
            onClick={() => showAddFile(FileType.Audio)}
            countAddedFiles={addFileStorage.audios.length}
            resetAddedFiles={() => resetAddFileStorage(FileType.Audio)}
          />
          <PostButton
            text='Теги'
            iconClass='fa-solid fa-hashtag mr-2'
            onClick={() => SetShowAddHashtags(!showAddHashtags)}
          />
          {/* Чел для додавання хештегів */}
          {showAddHashtags && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 100, damping: 100 }}
              className='flex rounded-md bg-[#ffffff0f] p-1 text-[#1A1A2E]'
            >
              <p className='mx-1 text-xl'>#</p>
              <input
                className='rounded-md border-0 bg-slate-500 px-2'
                value={currentHashtag}
                onChange={(e) =>
                  setCurrentHashtag(
                    e.target.value.replace(/[^a-zA-Zа-яА-ЯґҐєЄіІїЇ0-9]/g, ''),
                  )
                }
              ></input>

              <motion.button
                className='ml-1 rounded-md bg-[#2D2F3A] p-1 text-white'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 17,
                  duration: 0.1,
                }}
                onClick={handleAddHashtag}
              >
                Додати
              </motion.button>
            </motion.div>
          )}
        </div>
        <motion.button
          className='h-12 rounded-[20px] bg-[#6374B6] px-4 py-2 text-white hover:bg-[#5766a0]'
          onClick={handleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 100, damping: 17 }}
        >
          Опублікувати
        </motion.button>
      </div>
      {/* Список хештегів */}
      {listHashtags.length > 0 ? (
        <div className='flex flex-wrap'>
          {listHashtags.map((element, key) => (
            <motion.div
              key={key}
              className='mr-2 mt-2 flex'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 17 }}
            >
              <div className='rounded-md bg-[#ffffff0f] p-1'>
                <p>{element}</p>
              </div>
              <motion.button
                className='ml-0.5 mr-2 rounded-md bg-[#ffffff0f] p-1 text-white'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 100, damping: 17 }}
                onClick={() =>
                  SetListHashtags((prev) =>
                    prev.filter((tag, index) => index !== key),
                  )
                }
              >
                <i className='fas fa-times text-white'></i>
              </motion.button>
            </motion.div>
          ))}
        </div>
      ) : (
        <></>
      )}
      {repostPost && setRepostPost && (
        <div className='mt-6'>
          <MicroPost post={repostPost} setRepostPost={setRepostPost} />
        </div>
      )}
    </div>
  );
};

export default NewPostBlock;
