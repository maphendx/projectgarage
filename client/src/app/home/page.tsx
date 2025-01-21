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

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [postsListToShow, setPostsListToShow] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [postsListTrigger, setPostsListTrigger] = useState<boolean>(false);

  const handlePostsListTrigger = () => {
    setPostsListTrigger(!postsListTrigger);
  };

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

  useEffect(() => {
    const loadUserData = async () => {
      const userDataResponse = await fetchData(
        'http://localhost:8000/api/users/profile/',
      );
      if (userDataResponse) {
        setUserData(userDataResponse);
      }
    };
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
  );
}
