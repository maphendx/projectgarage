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
  const router = useRouter();

  useEffect(() => {
    setHashtags(initialHashtags);
  }, [initialHashtags]);

  const handleBioChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(event.target.value);
  };

  const handleHashtagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newHashtags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setHashtags(newHashtags);
  };

  const handleSave = () => {
    if (bio) {
      onUpdateBio(bio);
    }
    onUpdateHashtags(hashtags);
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
        <input
          id='hashtags'
          type='text'
          value={hashtags.join(', ')}
          onChange={handleHashtagsChange}
          placeholder='Enter hashtags separated by commas'
          className='w-full rounded-lg border border-gray-600 bg-[#1C1C1F] p-2 text-white'
        />
        <p className='mt-2 text-sm text-gray-400'>
          Введіть хештеги (e.g., "photography, music, coding").
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
