'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { Post, UserData } from '@/components/not_components';
import { useError } from '@/context/ErrorContext';
import fetchClient from '@/other/fetchClient';
import MicroPost from '@/components/MicroPost';
import FullPost from '@/components/FullPost';

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function FavoritesPage() {
  const router = useRouter();
  const [likedPosts, setLikedPosts] = useState<Post[] | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useError();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (error) {
      showError(error, 'error');
    }
  }, [error, showError]);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        const response = await fetchClient(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/history/likes/`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setLikedPosts(data.reverse());
      } catch (err) {
        setError(`Не вдалося отримати дані: ${err}`);
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserData = async (): Promise<UserData | null> => {
      try {
        const response = await fetchClient(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`,
        );
        if (!response.ok) {
          console.error(`Error: ${response.status} - ${response.statusText}`);
          throw new Error('Network response was not ok');
        }
        const data: UserData = await response.json();
        return data;
      } catch (error) {
        console.error('Fetch data error:', error);
        return null;
      }
    };

    const loadUserData = async () => {
      const userDataResponse = await fetchUserData();
      if (userDataResponse) {
        setUserData(userDataResponse);
      }
    };

    loadUserData();
    fetchLikedPosts();
  }, [router]);

  const openOriginalPost = async (postId: number) => {
    try {
      console.log(`Attempting to fetch post with ID: ${postId}`);

      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${postId}/`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/`,
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/`,
      ];

      let response;
      for (const endpoint of endpoints) {
        console.log(`Trying endpoint: ${endpoint}`);

        response = await fetchClient(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          break;
        }
      }

      if (!response || !response.ok) {
        const errorText = response ? await response.text() : 'No response';
        console.error(
          `HTTP error! status: ${response?.status || 'Unknown'}`,
          `Error text: ${errorText}`,
          `Full URL attempts: ${endpoints.join(', ')}`,
        );

        throw new Error(
          `Failed to fetch post. Status: ${response?.status || 'Unknown'}`,
        );
      }

      const data = await response.json();
      console.log('Fetched post data:', data);

      setSelectedPost(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Detailed error fetching post:', error);
      showError(
        `Не вдалося завантажити пост: ${error instanceof Error ? error.message : 'Невідома помилка'}`,
        'error',
      );
    }
  };

  return (
    <motion.div
      className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Topbar */}
      <motion.header
        className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <Topbar paramUserData={userData} />
      </motion.header>

      <div className='flex flex-1 overflow-hidden'>
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 border-r border-gray-800 bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        <main className='flex-1 overflow-y-auto p-6'>
          <h1 className='mb-4 text-3xl font-bold'>Лайкнуті пости</h1>

          {isLoading ? (
            <p className='mt-4 text-gray-400'>Завантаження...</p>
          ) : (
            <AnimatePresence>
              {likedPosts && likedPosts.length > 0 ? (
                likedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => openOriginalPost(post.id)}
                    className='cursor-pointer'
                  >
                    <MicroPost post={post} />
                  </div>
                ))
              ) : (
                <p className='mt-4 text-gray-400'>Немає лайкнутих постів</p>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
      {isModalOpen && (
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
                setIsModalOpen(false);
                setSelectedPost(null);
              }}
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
