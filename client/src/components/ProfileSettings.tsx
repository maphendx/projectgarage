import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import fetchClient from '@/other/fetchClient';
import AvatarEditor from 'react-avatar-editor';

interface ProfileSettingsProps {
  onUpdateBio: (newBio: string) => void;
  onUpdateHashtags: (newHashtags: { name: string }[]) => void;
  onClose: () => void;
  initialHashtags: { name: string }[];
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  onUpdateBio,
  onUpdateHashtags,
  onClose,
  initialHashtags,
}) => {
  const [bio, setBio] = useState<string>('');
  const [hashtags, setHashtags] = useState<{ name: string }[]>(initialHashtags);
  const [newHashtag, setNewHashtag] = useState<string>('');
  const router = useRouter();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarScale, setAvatarScale] = useState<number>(1);
  const [editedAvatar, setEditedAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const editorRef = useRef<AvatarEditor | null>(null);

  useEffect(() => {
    setHashtags(initialHashtags);
  }, [initialHashtags]);

  const handleBioChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(event.target.value);
  };

  const handleNewHashtagChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setNewHashtag(event.target.value);
  };

  const addHashtag = () => {
    if (
      newHashtag.trim() &&
      !hashtags.some((tag) => tag.name === newHashtag.trim())
    ) {
      setHashtags([...hashtags, { name: newHashtag.trim() }]);
      setNewHashtag('');
    }
    // ç;
  };

  const removeHashtag = (name: string) => {
    setHashtags(hashtags.filter((tag) => tag.name !== name));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAvatar(event.target.files[0]);
    }
  };

  const handleAvatarScaleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAvatarScale(parseFloat(event.target.value));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (bio) {
        await onUpdateBio(bio);
      }
      await onUpdateHashtags(hashtags);
      if (editedAvatar) {
        await updateAvatar(editedAvatar);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (avatarDataUrl: string) => {
    const formData = new FormData();
    const blob = await (await fetch(avatarDataUrl)).blob();
    formData.append('photo', blob, 'avatar.png');

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`;
      console.log(`Sending avatar update request to ${apiUrl}`);

      const token = localStorage.getItem('access_token');

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error('Failed to update avatar');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
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

  const handleSaveAvatar = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas().toDataURL();
      setEditedAvatar(canvas);
      console.log(canvas);
    }
  };

  return (
    <motion.div
      className='max-h-[80vh] overflow-y-auto rounded-lg bg-[#2B2D31] p-6 shadow-lg'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-white'>
          Редагування профілю
        </h2>
        <button
          onClick={onClose}
          className='text-white hover:text-gray-400'
          aria-label='Close'
        >
          &times;
        </button>
      </div>

      {/* Avatar Editor */}
      <div className='mb-4'>
        <label htmlFor='avatar' className='block text-white'>
          Аватар
        </label>
        <input
          id='avatar'
          type='file'
          accept='image/*'
          onChange={handleAvatarChange}
          className='w-full rounded-lg border border-gray-600 bg-[#1C1C1F] p-2 text-white'
        />
        {avatar && (
          <div className='mt-4'>
            <AvatarEditor
              ref={editorRef}
              image={avatar}
              width={250}
              height={250}
              border={50}
              borderRadius={125}
              scale={avatarScale}
              className='mx-auto'
            />
            <input
              type='range'
              min='1'
              max='2'
              step='0.01'
              value={avatarScale}
              onChange={handleAvatarScaleChange}
              className='mt-2 w-full'
            />
            <button
              onClick={handleSaveAvatar}
              className='mt-2 w-full rounded-[20px] bg-[#6374B6] px-4 py-2 text-white'
            >
              Зберегти аватар
            </button>
          </div>
        )}
        {editedAvatar && (
          <div className='mt-4'>
            <img
              src={editedAvatar}
              alt='Edited Avatar'
              className='mx-auto rounded-full'
              style={{ width: '100px', height: '100px' }}
            />
          </div>
        )}
      </div>

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
        <div className='flex items-center'>
          <input
            id='newHashtag'
            type='text'
            value={newHashtag}
            onChange={handleNewHashtagChange}
            placeholder='Add a new hashtag'
            className='flex-grow rounded-lg border border-gray-600 bg-[#1C1C1F] p-2 text-white'
          />
          <button
            onClick={addHashtag}
            className='ml-2 rounded-lg bg-[#6374B6] px-4 py-2 text-white'
          >
            Додати
          </button>
        </div>
        <div className='mt-2 flex flex-wrap'>
          {hashtags.map((tag) => (
            <div
              key={tag.name}
              className='m-1 flex items-center rounded-full bg-gray-700 px-3 py-1 text-sm text-white'
            >
              #{tag.name} {/* Only displaying tag.name */}
              <button
                onClick={() => removeHashtag(tag.name)}
                className='ml-2 text-red-500 hover:text-red-700'
                aria-label={`Remove ${tag.name}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className='flex space-x-4'>
        <motion.button
          onClick={handleSave}
          className='w-full rounded-[20px] bg-[#6374B6] px-4 py-2 text-white'
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          disabled={isLoading}
        >
          {isLoading ? 'Збереження...' : 'Зберегти'}
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
