import PostButton from './postButton';
import { ReactElement, useState, useRef, useEffect } from 'react';
import { FileContainer, FileType, Post, UserData } from '@/components/not_components';
import { motion } from 'framer-motion';
import { useError } from '@/context/ErrorContext';

interface CompInterface {
  userData: UserData | null;
  onPostCreated: () => Promise<void>;
  showAddFile: (type : FileType) => void;
  addFileStorage: FileContainer
  resetAddFileStorage: (fileType : FileType) => void;
  repostPost?: Post;
  setRepostPost?: (post : Post | undefined) => void;
}

const NewPostBlock = ({ userData, onPostCreated, showAddFile, addFileStorage, resetAddFileStorage, repostPost, setRepostPost }: CompInterface) => {
  const [content, setContent] = useState('');
  const [showAddHashtags, SetShowAddHashtags] = useState<boolean>(false);
  const [currentHashtag, setCurrentHashtag] = useState<string>("");
  const [listHashtags, SetListHashtags] = useState<string[]>([]);
  const { showError } = useError();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddHashtag = () => {
    if (currentHashtag.length < 3) {
      showError("Хештег не може бути коротшим трьох символів!", "error")
    }
    else if (listHashtags.filter((element) => element === currentHashtag).length > 0) {
      showError("Даний хештег вже було додано!", "error")
    }
    else {
      SetListHashtags([...listHashtags, "#" + currentHashtag]);
      setCurrentHashtag("");
    }
  }

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleClick = async () => {
    const token = localStorage.getItem('token');

    if (content.length <= 5 || content.trim().length <= 3) {
      showError("Довжина вмісту поста занадто коротка!", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", content)
      formData.append("hashtags", listHashtags.join(","))
      if (repostPost)
        formData.append("original_post", repostPost.id.toString())
      addFileStorage.photos.forEach((element : File) => formData.append("image", element))
      addFileStorage.videos.forEach((element : File) => formData.append("video", element))
      addFileStorage.audios.forEach((element : File) => formData.append("audio", element))

      const response = await fetch('http://localhost:8000/api/posts/posts/', {
        headers: {
          Authorization: `Token ${token}`,
        },
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(JSON.stringify(data));
        //throw new Error(data.message || 'Неочікувана помилка');
      }

      showError("Пост успішно опубліковано!", "success");
      resetAddFileStorage(FileType.Photo);
      resetAddFileStorage(FileType.Audio);
      resetAddFileStorage(FileType.Video);
      SetListHashtags([]);
      setContent('');
      SetShowAddHashtags(false);
      await onPostCreated();
    } catch (error) {
      showError(`Помилка: ${error}`, "error");
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
        <div className='flex space-x-4 items-center'>
          <PostButton text='Фото' iconClass='fas fa-image mr-2' onClick={() => showAddFile(FileType.Photo)} countAddedFiles={addFileStorage.photos.length} resetAddedFiles={() => resetAddFileStorage(FileType.Photo)}/>
          <PostButton text='Відео' iconClass='fas fa-video mr-2' onClick={() => showAddFile(FileType.Video)} countAddedFiles={addFileStorage.videos.length} resetAddedFiles={() => resetAddFileStorage(FileType.Video)}/>
          <PostButton text='Аудіо' iconClass='fas fa-music mr-2' onClick={() => showAddFile(FileType.Audio)} countAddedFiles={addFileStorage.audios.length} resetAddedFiles={() => resetAddFileStorage(FileType.Audio)}/>
          <PostButton text='Теги' iconClass='fa-solid fa-hashtag mr-2' onClick={() => SetShowAddHashtags(!showAddHashtags)}/>
          {/* Чел для додавання хештегів */}
          {showAddHashtags && <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 100 }} 
            className='rounded-md bg-[#ffffff0f] p-1 flex text-[#1A1A2E]'
          >
            <p className='mx-1 text-xl'>#</p>
            <input className='bg-slate-500 border-0 rounded-md px-2' value={currentHashtag} onChange={(e) => setCurrentHashtag(e.target.value.replace(/[^a-zA-Zа-яА-ЯґҐєЄіІїЇ0-9]/g, ''))}></input>
            <motion.button
              className='bg-[#2D2F3A] p-1 text-white rounded-md ml-1'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={handleAddHashtag}
            >
              Додати
            </motion.button>
          </motion.div> }
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
      {/* Список хештегів */}
      {listHashtags.length > 0 ? <div className='flex flex-wrap'>
        {listHashtags.map((element, key) => (
        <div className='flex mr-2 mt-2'>
          <div className='bg-[#ffffff0f] p-1 rounded-md'>
            <p>{element}</p>
          </div>
          <motion.button
              className='bg-[#ffffff0f] p-1 text-white rounded-md ml-0.5 mr-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => SetListHashtags((prev) => prev.filter((tag, index) => index !== key))}
            >
              <i className="fas fa-times text-white"></i>
          </motion.button>
        </div>
      ))}
      </div> : <></>}
      {repostPost && setRepostPost && 
        <motion.div
        key={repostPost.id}
        className='mt-5 rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6 flex place-content-between'
        style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div>
          <p className='text-sm'>{repostPost.content}</p>
          {repostPost.image && (
            <img
            src={repostPost.image}
            alt='Post image'
            width={100}
            height={100}
            className='mt-2 rounded'
          />
          )}
          { repostPost.created_at && repostPost.likes &&
            <div className='mt-2 text-xs text-gray-400'>
            {new Date(repostPost.created_at).toLocaleString()}
            <span className='ml-4'>
              Вподобання: {repostPost.likes.length}
            </span>
            <span className='ml-4'>Коментарі: {repostPost.comments}</span>
          </div>
          }
        </div>
        <motion.button
              className='bg-[#ffffff0f] p-3 rounded-md ml-0.5 mr-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => setRepostPost(undefined)}
            >
              <i className="fas fa-times text-[#97A7E7]"></i>
        </motion.button>
      </motion.div>
      }
    </div>
  );
};

export default NewPostBlock;
