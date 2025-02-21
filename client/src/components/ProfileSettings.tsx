import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import fetchClient from '@/other/fetchClient';

interface ProfileSettingsProps {
  onUpdateBio: (newBio: string) => void;
  onUpdateHashtags: (newHashtags: string[]) => void;
  onClose: () => void;
  initialHashtags: string[];
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  onUpdateBio,
  onUpdateHashtags,
  onClose,
  initialHashtags,
}) => {
  const [bio, setBio] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags);
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    setHashtags(initialHashtags);
  }, [initialHashtags]);

  const handleBioChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(event.target.value);
  };

  const handleHashtagInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setHashtagInput(event.target.value);
  };

  const handleHashtagKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      let newTag = hashtagInput.trim();
      if (newTag.startsWith('#')) {
        newTag = newTag.substring(1);
      }
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
        setHashtagInput('');
      }
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    const cleanTag = tagToRemove.startsWith('#')
      ? tagToRemove.substring(1)
      : tagToRemove;
    setHashtags(hashtags.filter((tag) => tag !== cleanTag));
  };

  const handleSave = () => {
    if (bio) {
      onUpdateBio(bio);
    }
    const cleanedHashtags = hashtags.map((tag) =>
      tag.startsWith('#') ? tag.substring(1) : tag,
    );
    onUpdateHashtags(cleanedHashtags);
    onClose();
  };

  const handleDeleteProfile = async () => {
    try {
      const response = await fetchClient('/api/users/delete', {
        method: 'DELETE',
      });
      if (response.ok) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/');
      } else {
        throw new Error('Failed to delete profile');
      }
    } catch (error) {
      console.error('Помилка видалення профілю', error);
    }
  };

  return (
    <motion.div
      className='p-6'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className='mb-4 text-xl font-semibold text-white'>
        Редагування профілю
      </h2>

      {/* Bio */}
      <div className='mb-4'>
        <label htmlFor='bio' className='block text-white'>
          Біо
        </label>
        <textarea
          id='bio'
          value={bio}
          onChange={handleBioChange}
          placeholder='Напишіть щось про себе...'
          className='w-full rounded-lg border border-gray-600 bg-[#1C1C1F] p-2 text-white'
          rows={4}
        />
      </div>

      {/* Hashtags */}
      <div className='mb-4'>
        <label htmlFor='hashtags' className='block text-white'>
          Хештеги
        </label>
        <div className='mb-2 flex flex-wrap gap-2'>
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className='flex items-center rounded-full bg-[#6374B6] px-3 py-1 text-sm text-white'
            >
              #{tag}
              <button
                onClick={() => removeHashtag(tag)}
                className='ml-2 text-white hover:text-red-300'
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          id='hashtags'
          type='text'
          value={hashtagInput}
          onChange={handleHashtagInputChange}
          onKeyPress={handleHashtagKeyPress}
          placeholder='Введіть хештег та натисніть Enter'
          className='w-full rounded-lg border border-gray-600 bg-[#1C1C1F] p-2 text-white'
        />
        <p className='mt-2 text-sm text-gray-400'>
          Натисніть Enter або кому для додавання хештегу
        </p>
      </div>

      {/* Buttons */}
      <div className='flex space-x-4'>
        <motion.button
          onClick={handleSave}
          className='w-full rounded-[20px] bg-[#6374B6] px-4 py-2 text-white'
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Зберегти
        </motion.button>
        <motion.button
          onClick={onClose}
          className='w-full rounded-[20px] bg-gray-600 px-4 py-2 text-white hover:bg-gray-500'
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Відмінити
        </motion.button>
      </div>

      <div className='mt-4 flex space-x-4'>
        <motion.button
          onClick={handleDeleteProfile}
          className='w-full rounded-[20px] bg-red-800 px-4 py-2 text-white hover:bg-red-700'
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Видалити профіль
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;
