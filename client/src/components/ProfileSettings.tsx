import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const handleLogout = () => {
    localStorage.removeItem('authToken');

    router.push('/');
  };

  const handleDeleteProfile = async () => {
    try {
      const response = await fetch('/api/users/delete', { method: 'DELETE' });
      if (response.ok) {
        localStorage.removeItem('authToken');
        router.push('/');
      } else {
        throw new Error('Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile', error);
    }
  };

  return (
    <div className='p-6'>
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
        <button
          onClick={handleSave}
          className='w-full rounded-[20px] bg-[#6374B6] px-4 py-2 text-white'
        >
          Зберегти
        </button>
        <button
          onClick={onClose}
          className='w-full rounded-[20px] bg-gray-600 px-4 py-2 text-white hover:bg-gray-500'
        >
          Відмінити
        </button>
      </div>

      <div className='mt-4 flex space-x-4'>
        <button
          onClick={handleLogout}
          className='w-full rounded-[20px] bg-red-600 px-4 py-2 text-white hover:bg-red-500'
        >
          Покинути обліковий запис
        </button>
        <button
          onClick={handleDeleteProfile}
          className='w-full rounded-[20px] bg-red-800 px-4 py-2 text-white hover:bg-red-700'
        >
          Видалити профіль
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
