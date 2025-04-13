'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import Topbar from '@/components/surrounding/topbar';
import ProfileSettings from '@/components/ProfileSettings';
import { motion } from 'framer-motion';
import { Post, UserData } from '@/components/not_components';
import MicroPost from '@/components/MicroPost';
import fetchClient from '@/other/fetchClient';
import Modal from '@/components/Modal';
import EasterEggGame from '@/components/Egg';
import FullPost from '@/components/FullPost';

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const Profile: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const userId = params.id || '';
  const isOwnProfile = userId === '';
  const profileUrl = isOwnProfile ? 'profile/' : `profile/${userId}/`;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);
  const [easterEggCounter, setEasterEggCounter] = useState(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/');
  };
  const handleProfilePhotoClick = () => {
    setEasterEggCounter((prev) => prev + 1);
    if (easterEggCounter === 4) {
      setIsEasterEggOpen(true);
      setEasterEggCounter(0);
    }
  };
  const fetchUserData = useCallback(async () => {
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
  }, [profileUrl]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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

  const handleUpdateHashtags = async (newHashtags: { name: string }[]) => {
    if (isOwnProfile) {
      try {
        const currentHashtags = userData?.hashtags || [];

        // Remove hashtags
        for (const hashtag of currentHashtags) {
          if (!newHashtags.includes(hashtag)) {
            await fetchClient(
              `${process.env.NEXT_PUBLIC_API_URL}/api/users/hashtags/`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({"hashtag": hashtag.name}),
              },
            );
          }
        }

        // Add new hashtags
        for (const hashtag of newHashtags) {
          if (!currentHashtags.includes(hashtag)) {
            await fetchClient(
              `${process.env.NEXT_PUBLIC_API_URL}/api/users/hashtags/`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({"hashtag": hashtag.name}),
              },
            );
          }
        }

        await fetchUserData();
      } catch (err) {
        console.error('Error updating hashtags:', err);
      }
    }
  };

  const openOriginalPost = async (postId: number) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${postId}/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch post. Status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedPost(data);
      setIsPostModalOpen(true);
    } catch (error) {
      console.error('Error fetching post:', error);
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
                whileHover={{ scale: 1.05 }}
                onClick={handleProfilePhotoClick}
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
                    {userData.hashtags.map(
                      (tag: { name: string }, index: number) => (
                        <span
                          key={index}
                          className='mr-2 inline-block rounded-full bg-gray-700 px-2 py-1 text-xs'
                        >
                          #{tag.name} {/* Only displaying tag.name */}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <motion.button
                onClick={() => setIsSettingsOpen(true)}
                className='mr-4 h-12 rounded-[20px] bg-[#5B6EAE] px-4 py-2 text-white hover:bg-[#6374B6]'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Редагувати профіль
              </motion.button>
            )}
            {isOwnProfile && (
              <motion.button
                onClick={handleLogout}
                className='h-12 rounded-[20px] bg-red-600 px-4 py-2 text-white hover:bg-red-500'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Покинути обліковий запис
              </motion.button>
            )}
            <div className='mx-auto min-h-[85vh] w-[100%] max-w-[100%] rounded-[30px] border-[1px] border-white border-opacity-10 bg-opacity-70 bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
              <h4 className='mb-3 text-lg font-semibold'>Публікації</h4>
              {userData.posts && userData.posts.length > 0 ? (
                <div className='space-y-4'>
                  {userData.posts.toReversed().map((post, key) => (
                    <div
                      key={key}
                      onClick={() => openOriginalPost(post.id)}
                      className='cursor-pointer'
                    >
                      <MicroPost post={post} key={key} />
                    </div>
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
            <Modal
              isOpen={isEasterEggOpen}
              onClose={() => setIsEasterEggOpen(false)}
            >
              <div className='min-h-[600px] w-full text-center'>
                <h2 className='mb-4 text-xl font-bold'>Ура змійкаааа! 🎮</h2>
                <EasterEggGame userPhoto={userData?.photo} />
              </div>
            </Modal>
            {isPostModalOpen && (
              <motion.div
                initial='hidden'
                animate='visible'
                exit='exit'
                variants={modalVariants}
                className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'
              >
                {selectedPost && (
                  <FullPost
                    post={selectedPost}
                    userData={userData}
                    onClose={() => {
                      setIsPostModalOpen(false);
                      setSelectedPost(null);
                    }}
                  />
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
