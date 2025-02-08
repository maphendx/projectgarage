'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import Topbar from '@/components/surrounding/topbar';
import ProfileSettings from '@/components/ProfileSettings';
import { motion } from 'framer-motion';
import { Post } from '@/components/not_components';
import MicroPost from '@/components/MicroPost';
import fetchClient from '@/other/fetchClient';

interface UserData {
  display_name?: string;
  email?: string;
  photo?: string;
  bio?: string;
  hashtags?: string[];
  subscriptions_count?: number;
  subscribers_count?: number;
  total_likes?: number;
  posts?: Post[];
}

const Profile: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const userId = params.id || '';
  const isOwnProfile = userId === '';
  const profileUrl = isOwnProfile ? 'profile/' : `profile/${userId}/`;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchUserData = async () => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${profileUrl}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data.');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [router, userId, isOwnProfile]);

  const handleUpdateBio = async (newBio: string) => {
    if (isOwnProfile) {
      try {
        const response = await fetchClient(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bio: newBio }),
          },
        );

        if (response.ok) {
          const updatedData = await response.json();
          setUserData((prev) =>
            prev ? { ...prev, bio: updatedData.bio } : null,
          );
        } else {
          console.error('Failed to update bio');
        }
      } catch (err) {
        console.error('Error updating bio:', err);
      }
    }
  };

  const handleUpdateHashtags = async (newHashtags: string[]) => {
    if (isOwnProfile) {
      try {
        const currentHashtags = userData?.hashtags || [];

        // Remove hashtags
        for (const hashtag of currentHashtags) {
          if (!newHashtags.includes(hashtag)) {
            await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/users/hashtags/`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ hashtag }),
            });
          }
        }

        // Add new hashtags
        for (const hashtag of newHashtags) {
          if (!currentHashtags.includes(hashtag)) {
            await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/users/hashtags/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ hashtag }),
            });
          }
        }

        await fetchUserData();
      } catch (err) {
        console.error('Error updating hashtags:', err);
      }
    }
  };

  if (!userData) {
    return <div className='mt-20 text-center text-white'>Loading...</div>;
  }

  return (
    <div className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'>
      <header className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'>
        <Topbar paramUserData={userData} />
      </header>

      <div className='flex flex-1 overflow-hidden'>
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        <main className='flex-1 overflow-auto p-6'>
          <div className='space-y-6'>
            <div className='flex items-center space-x-5'>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Image
                  src={userData.photo || '/default-profile.jpg'}
                  alt='Profile Photo'
                  width={100}
                  height={100}
                  style={{ width: '100px', height: '100px' }}
                  className='rounded-[20px]'
                />
              </motion.div>
              <div>
                <h3 className='inline-block text-xl font-semibold'>
                  {userData.display_name || 'User'}
                </h3>
                <div className='ml-4 inline-block text-sm'>
                  <span>{userData.subscribers_count || 0} підписників</span>
                  <span className='ml-4'>
                    {userData.subscriptions_count || 0} підписок
                  </span>
                  <span className='ml-4'>
                    {userData.total_likes || 0} вподобань
                  </span>
                </div>
                <p className='text-sm text-gray-400'>
                  @{userData.email?.split('@')[0]}
                </p>
                <p className='text-sm'>{userData.bio || 'No description'}</p>
                {userData.hashtags && userData.hashtags.length > 0 && (
                  <div className='mt-2'>
                    {userData.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className='mr-2 inline-block rounded-full bg-gray-700 px-2 py-1 text-xs'
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <motion.button
                onClick={() => setIsSettingsOpen(true)}
                className='h-12 rounded-[20px] bg-[#6374B6] px-4 py-2 text-white'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Редагувати профіль
              </motion.button>
            )}
            <div className='mx-auto min-h-[85vh] w-[100%] max-w-[100%] rounded-[30px] border-[1px] border-white border-opacity-10 bg-opacity-70 bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
              <h4 className='text-lg font-semibold mb-3'>Публікації</h4>
              {userData.posts && userData.posts.length > 0 ? (
                <div className='space-y-4'>
                  {userData.posts.toReversed().map((post, key) => (
                    <MicroPost post={post} key={key} />
                  ))}
                </div>
              ) : (
                <p className='text-gray-400'>Немає публікацій</p>
              )}
            </div>
            {isSettingsOpen && (
              <div className='fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75'>
                <div className='w-full max-w-md rounded-lg bg-[#2B2D31] p-6'>
                  <ProfileSettings
                    onUpdateBio={handleUpdateBio}
                    onUpdateHashtags={handleUpdateHashtags}
                    onClose={() => setIsSettingsOpen(false)}
                    initialHashtags={userData?.hashtags || []}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
