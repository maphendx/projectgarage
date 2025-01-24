'use client';

import MainContent from '@/components/important/main_page_content';
import { Post, UserData } from '@/components/not_components';
import { InfoBlock } from '@/components/other';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';
import Topbar from '@/components/surrounding/topbar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
<<<<<<< HEAD
=======
import { motion, AnimatePresence } from 'framer-motion';
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [postsListToShow, setPostsListToShow] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
  const [postsListTrigger, setPostsListTrigger] = useState<boolean>(false);

  const handlePostsListTrigger = () => {
    setPostsListTrigger(!postsListTrigger);
  };
=======
  const [isLoading, setIsLoading] = useState<boolean>(true);
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)

  const fetchData = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const dataResponse = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!dataResponse.ok) {
        throw new Error(`HTTP error! status: ${dataResponse.status}`);
      }
      return await dataResponse.json();
    } catch (err) {
      setError(`Не вдалося отримати дані за "${url}": ${err}`);
      if (err instanceof Error && err.message.includes('401')) {
        localStorage.removeItem('token');
        router.push('/');
      }
    }
  };

<<<<<<< HEAD
=======
  const handlePostsListTrigger = async () => {
    const postsListResponse: Post[] = await fetchData(
      'http://localhost:8000/api/posts/posts/',
    );
    if (postsListResponse) {
      setPostsListToShow(postsListResponse.reverse());
    }
  };

>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
  useEffect(() => {
    const loadUserData = async () => {
      const userDataResponse = await fetchData(
        'http://localhost:8000/api/users/profile/',
      );
      if (userDataResponse) {
        setUserData(userDataResponse);
      }
    };
<<<<<<< HEAD
    loadUserData();
  }, [router]);

  useEffect(() => {
    const loadPosts = async () => {
      const postsListResponse: Post[] = await fetchData(
        'http://localhost:8000/api/posts/posts/',
      );
      if (postsListResponse) {
        setPostsListToShow(postsListResponse.reverse());
      }
    };
    loadPosts();
  }, [router, postsListTrigger]);

  return (
    <div className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'>
      {/* Topbar */}
      <header className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'>
        <Topbar paramUserData={userData} />
      </header>

      {/* Main Layout */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Left Sidebar */}
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        {/* Main Content */}
        <main
          className='flex-1 overflow-auto pl-6 pr-6'
          style={{
            backgroundPosition: 'center top',
            backgroundSize: 'cover',
          }}
        >
          <MainContent
            userData={userData}
            postsList={postsListToShow}
            handlePostsListTrigger={handlePostsListTrigger}
          />
        </main>

        {/* Right Sidebar */}
        <aside className='sticky top-0 hidden h-screen w-80 flex-shrink-0 bg-[#1C1C1F] lg:block'>
          <AsidePanelRight />
        </aside>
      </div>

      {/* Footer: Music Player */}
      <footer className='fixed bottom-0 left-0 right-0 bg-[#1C1C1F] shadow-md'>
        <MusicPlayer />
      </footer>

      {/* Error Notification */}
      {error && (
        <div className='fixed bottom-0 left-0 right-0 p-4 text-center text-white'>
          <InfoBlock
            getMessage={`Помилка! ${error}`}
            getClasses='text-sm'
            getIconClasses='fa fa-times-circle'
            isAlive={true}
          />
        </div>
      )}
    </div>
=======
    const loadPosts = async () => {
      await handlePostsListTrigger();
      setIsLoading(false);
    };
    loadUserData();
    loadPosts();
  }, [router]);

  return (
    <motion.div
      className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isLoading ? (
        <div className='flex h-screen items-center justify-center'>
          <motion.div
            className='text-lg font-semibold text-gray-300'
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading...
          </motion.div>
        </div>
      ) : (
        <>
          {/* Topbar */}
          <motion.header
            className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <Topbar paramUserData={userData} />
          </motion.header>

          {/* Main Layout */}
          <div className='flex flex-1 overflow-hidden'>
            {/* Left Sidebar */}
            <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
              <AsidePanelLeft />
            </aside>

            {/* Main Content */}
            <main className='overflow-y flex-1 px-4 pb-4'>
              <AnimatePresence>
                <motion.div
                  className='space-y-4'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <MainContent
                    userData={userData}
                    postsList={postsListToShow}
                    handlePostsListTrigger={handlePostsListTrigger}
                  />
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Right Sidebar */}
            <aside className='sticky top-0 hidden h-screen w-80 flex-shrink-0 bg-[#1C1C1F] lg:block'>
              <AsidePanelRight />
            </aside>
          </div>

          {/* Footer: Music Player */}
          <footer className='fixed bottom-0 left-0 right-0 bg-[#1C1C1F] shadow-md'>
            <MusicPlayer />
          </footer>

          {/* Error Notification */}
          {error && (
            <motion.div
              className='fixed bottom-0 left-0 right-0 bg-red-600 p-4 text-center text-white'
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <InfoBlock
                getMessage={`Помилка! ${error}`}
                getClasses='text-sm'
                getIconClasses='fa fa-times-circle'
                isAlive={true}
              />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
  );
}
