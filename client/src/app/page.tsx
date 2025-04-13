'use client';

import MainContent from '@/components/important/main_page_content';
import {
  FileContainer,
  FileType,
  Post,
  UserData,
} from '@/components/not_components';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';
import Topbar from '@/components/surrounding/topbar';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import DropzoneUploader from '@/components/DropzoneUploader';
import { useError } from '@/context/ErrorContext';
import fetchClient from '@/other/fetchClient';

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [postsListToShow, setPostsListToShow] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showError } = useError();
  const [addFileWindow, setAddFileWindow] = useState<boolean>(false); // 4 чела для загрузки файлів
  const [addFileType, setAddfileType] = useState<FileType>(FileType.Audio);
  const [addFilesLoaded, setAddFilesLoaded] = useState<File[]>([]);
  const [addFileStorage, setAddFileStorage] = useState<FileContainer>({
    photos: [],
    videos: [],
    audios: [],
  });

  useEffect(() => {
    if (error) {
      showError(error, 'error');
    }
  }, [error, showError]);

  const handleAddFile = (fileType: FileType) => {
    setAddFileWindow(true);
    setAddfileType(fileType);
  };

  const handleConfirmFile = () => {
    if (addFilesLoaded.length > 0) {
      switch (addFileType) {
        case FileType.Audio: {
          setAddFileStorage((prevState) => ({
            ...prevState,
            audios: [...addFilesLoaded],
          }));
          break;
        }
        case FileType.Video: {
          setAddFileStorage((prevState) => ({
            ...prevState,
            videos: [...addFilesLoaded],
          }));
          break;
        }
        case FileType.Photo: {
          setAddFileStorage((prevState) => ({
            ...prevState,
            photos: [...addFilesLoaded],
          }));
          break;
        }
      }
      setAddFileWindow(false);
      setAddFilesLoaded([]);
    } else {
      showError('Ви не додали жодного файлу!', 'warning');
    }
  };

  const resetAddFileStorage = (fileType: FileType) => {
    switch (fileType) {
      case FileType.Photo: {
        setAddFileStorage((prevState) => ({
          ...prevState,
          photos: [],
        }));
        break;
      }
      case FileType.Audio: {
        setAddFileStorage((prevState) => ({
          ...prevState,
          audios: [],
        }));
        break;
      }
      case FileType.Video: {
        setAddFileStorage((prevState) => ({
          ...prevState,
          videos: [],
        }));
        break;
      }
    }
  };

  const fetchData = useCallback(
    async (url: string) => {
      try {
        const dataResponse = await fetchClient(url);

        if (!dataResponse.ok) {
          throw new Error(`HTTP error! status: ${dataResponse.status}`);
        }

        return await dataResponse.json();
      } catch (err) {
        setError(`Не вдалося отримати дані за "${url}": ${err}`);
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/');
        }
      }
    },
    [router],
  );

  const handlePostsListTrigger = useCallback(async () => {
    const postsListResponse: Post[] = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/`,
    );
    if (postsListResponse) {
      setPostsListToShow(postsListResponse.reverse());
      setTimeout(() => {
        window.scrollBy(0, 1); // Примусовий скрол (на 1 піксель вниз)
        window.scrollBy(0, -1); // Повернення назад
      }, 50);
    }
  }, [fetchData]);

  useEffect(() => {
    const loadUserData = async () => {
      const userDataResponse = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`,
      );
      if (userDataResponse) {
        setUserData(userDataResponse);
      }
    };
    const loadPosts = async () => {
      await handlePostsListTrigger();
      setIsLoading(false);
    };
    loadUserData();
    loadPosts();
  }, [router, fetchData, handlePostsListTrigger]);

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
            Завантаження...
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
          <div className='relative flex flex-1 overflow-hidden'>
            {/* Left Sidebar */}
            <aside className='sticky top-0 z-20 hidden h-screen w-16 flex-shrink-0 bg-[#1C1C1F] sm:block md:w-20'>
              <AsidePanelLeft />
            </aside>

            {/* Main Content */}
            <main className='relative z-10 flex-1 overflow-y-auto pb-4'>
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
                    showAddFile={handleAddFile}
                    addFileStorage={addFileStorage}
                    resetAddFileStorage={resetAddFileStorage}
                  />
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Right Sidebar */}
            <aside className='sticky top-0 hidden h-screen min-w-[240px] max-w-[320px] flex-shrink-0 bg-[#1C1C1F] lg:hidden xl:w-[20vw] 2xl:block'>
              <div className='relative z-20'>
                <AsidePanelRight />
              </div>
            </aside>
          </div>

          {/* Footer: Music Player */}
          <footer className='fixed bottom-0 left-0 right-0 bg-[#1C1C1F] shadow-md'>
            <MusicPlayer />
          </footer>

          <Modal onClose={() => setAddFileWindow(false)} isOpen={addFileWindow}>
            <div className='flex flex-col'>
              <h2 className='mb-3 text-center text-lg'>Додати файли</h2>
              <DropzoneUploader
                setFiles={setAddFilesLoaded}
                fileType={addFileType}
              />
              <motion.button
                className='mt-3 rounded-lg bg-pink-800 p-2 transition-colors duration-300 ease-out hover:bg-pink-400'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={handleConfirmFile}
              >
                Підтвердити
              </motion.button>
            </div>
          </Modal>
        </>
      )}
    </motion.div>
  );
}
