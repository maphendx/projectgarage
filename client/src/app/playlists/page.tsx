'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Globe, 
  User, 
  FileText, 
  Search, 
  Eye, 
  EyeOff,
  Play, 
  Pause,
  Download
} from 'lucide-react';

import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';
import { UserData } from '@/components/not_components';
import { useError } from '@/context/ErrorContext';
import fetchClient from '@/other/fetchClient';
import SongCard from '@/components/playlists/SongCard';
import LyricsCard from '@/components/playlists/LyricsCard';
import LyricsModal from '@/components/playlists/LyricsModal';

type SongType = {
  id: string;
  task_id: string;
  audio_id?: string;
  model_name: string;
  title: string;
  audio_file: string;
  photo_file: string;
  created_at: string;
  is_public: boolean;
  lyrics?: LyricsType | null;
};

type LyricsType = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_public: boolean;
};

type TabType = 'user-songs' | 'public-songs' | 'user-lyrics' | 'public-lyrics';

export default function PlaylistsPage() {
  const router = useRouter();
  const { showError } = useError();
  
  // Стан даних користувача
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Стан для табів і даних
  const [activeTab, setActiveTab] = useState<TabType>('user-songs');
  const [userSongs, setUserSongs] = useState<SongType[]>([]);
  const [publicSongs, setPublicSongs] = useState<SongType[]>([]);
  const [userLyrics, setUserLyrics] = useState<LyricsType[]>([]);
  const [publicLyrics, setPublicLyrics] = useState<LyricsType[]>([]);
  
  // Стан для пошуку і фільтрації
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<SongType[] | LyricsType[]>([]);
  
  // Стан для програвання і модального вікна
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [selectedLyrics, setSelectedLyrics] = useState<LyricsType | null>(null);
  
  // Стан для пагінації публічних даних
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Завантаження даних користувача
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`);
      if (!response.ok) throw new Error('Не вдалося завантажити дані користувача');
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Помилка завантаження даних користувача:', error);
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/auth');
      }
    }
  }, [router]);

  // Завантаження пісень користувача
  const fetchUserSongs = useCallback(async () => {
    try {
      const response = await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/songs/`);
      if (!response.ok) throw new Error('Не вдалося завантажити пісні користувача');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.songs)) {
        setUserSongs(data.songs);
        if (activeTab === 'user-songs') {
          setFilteredItems(data.songs);
        }
      }
    } catch (error) {
      console.error('Помилка завантаження пісень користувача:', error);
      showError('Не вдалося завантажити пісні користувача', 'error');
    }
  }, [activeTab, showError]);

  // Завантаження публічних пісень
  const fetchPublicSongs = useCallback(async (page: number = 1) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/public/songs/?page=${page}&page_size=10`
      );
      if (!response.ok) throw new Error('Не вдалося завантажити публічні пісні');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.songs)) {
        setPublicSongs(data.songs);
        if (activeTab === 'public-songs') {
          setFilteredItems(data.songs);
        }
        
        // Встановлення пагінації
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.total_pages);
        }
      }
    } catch (error) {
      console.error('Помилка завантаження публічних пісень:', error);
      showError('Не вдалося завантажити публічні пісні', 'error');
    }
  }, [activeTab, showError]);

  // Завантаження текстів користувача
  const fetchUserLyrics = useCallback(async () => {
    try {
      const response = await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/lyrics/`);
      if (!response.ok) throw new Error('Не вдалося завантажити тексти користувача');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.lyrics)) {
        setUserLyrics(data.lyrics);
        if (activeTab === 'user-lyrics') {
          setFilteredItems(data.lyrics);
        }
      }
    } catch (error) {
      console.error('Помилка завантаження текстів користувача:', error);
      showError('Не вдалося завантажити тексти користувача', 'error');
    }
  }, [activeTab, showError]);

  // Завантаження публічних текстів
  const fetchPublicLyrics = useCallback(async (page: number = 1) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/public/lyrics/?page=${page}&page_size=10`
      );
      if (!response.ok) throw new Error('Не вдалося завантажити публічні тексти');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.lyrics)) {
        setPublicLyrics(data.lyrics);
        if (activeTab === 'public-lyrics') {
          setFilteredItems(data.lyrics);
        }
        
        // Встановлення пагінації
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.total_pages);
        }
      }
    } catch (error) {
      console.error('Помилка завантаження публічних текстів:', error);
      showError('Не вдалося завантажити публічні тексти', 'error');
    }
  }, [activeTab, showError]);

  // Змінити видимість (публічність) пісні
  const toggleSongVisibility = useCallback(async (songId: string, isPublic: boolean) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/songs/${songId}/visibility/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_public: !isPublic }),
        }
      );
      
      if (!response.ok) throw new Error('Не вдалося змінити видимість пісні');
      
      // Оновлюємо локальний стан
      setUserSongs(prev => 
        prev.map(song => 
          song.id === songId ? { ...song, is_public: !isPublic } : song
        )
      );
      
      // Оновлюємо фільтровані елементи, якщо потрібно
      if (activeTab === 'user-songs') {
        setFilteredItems(prev => 
          (prev as SongType[]).map(song => 
            song.id === songId ? { ...song, is_public: !isPublic } : song
          )
        );
      }
      
      showError(`Пісню зроблено ${!isPublic ? 'публічною' : 'приватною'}`, 'success');
    } catch (error) {
      console.error('Помилка зміни видимості пісні:', error);
      showError('Не вдалося змінити видимість пісні', 'error');
    }
  }, [activeTab, showError]);

  // Змінити видимість (публічність) тексту
  const toggleLyricsVisibility = useCallback(async (lyricsId: string, isPublic: boolean) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/lyrics/${lyricsId}/visibility/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_public: !isPublic }),
        }
      );
      
      if (!response.ok) throw new Error('Не вдалося змінити видимість тексту');
      
      // Оновлюємо локальний стан
      setUserLyrics(prev => 
        prev.map(lyrics => 
          lyrics.id === lyricsId ? { ...lyrics, is_public: !isPublic } : lyrics
        )
      );
      
      // Оновлюємо фільтровані елементи, якщо потрібно
      if (activeTab === 'user-lyrics') {
        setFilteredItems(prev => 
          (prev as LyricsType[]).map(lyrics => 
            lyrics.id === lyricsId ? { ...lyrics, is_public: !isPublic } : lyrics
          )
        );
      }
      
      showError(`Текст зроблено ${!isPublic ? 'публічним' : 'приватним'}`, 'success');
    } catch (error) {
      console.error('Помилка зміни видимості тексту:', error);
      showError('Не вдалося змінити видимість тексту', 'error');
    }
  }, [activeTab, showError]);

  // Функція для відтворення/паузи пісні
  const togglePlay = useCallback((audioId: string, audioUrl: string) => {
    if (currentlyPlaying === audioId) {
      // Зупиняємо поточну пісню
      const audioElement = document.getElementById('audio-player') as HTMLAudioElement;
      if (audioElement) {
        audioElement.pause();
      }
      setCurrentlyPlaying(null);
    } else {
      // Починаємо відтворення нової пісні
      const audioElement = document.getElementById('audio-player') as HTMLAudioElement;
      if (audioElement) {
        // Переконайтеся, що URL правильний
        console.log(`Спроба відтворити: ${process.env.NEXT_PUBLIC_API_URL}/media/${audioUrl}`);
        audioElement.src = `${process.env.NEXT_PUBLIC_API_URL}/media/${audioUrl}`;
        
        // Додайте обробник подій для помилок
        audioElement.onerror = (e) => {
          console.error('Помилка відтворення аудіо:', e);
          console.error('Джерело аудіо:', audioElement.src);
          showError('Не вдалося відтворити аудіо. Деталі помилки в консолі.', 'error');
        };
        
        audioElement.play().catch(err => {
          console.error('Помилка відтворення аудіо:', err);
          showError('Не вдалося відтворити аудіо', 'error');
        });
      }
      setCurrentlyPlaying(audioId);
    }
  }, [currentlyPlaying, showError]);

  // Завантаження WAV файлу
  const downloadWav = useCallback(async (taskId: string, audioId: string) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate/wav/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId,
            audioId,
            callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`,
          }),
        }
      );
      
      if (!response.ok) throw new Error('Не вдалося створити WAV файл');
      
      const data = await response.json();
      if (data.success) {
        showError('Запит на створення WAV файлу прийнято', 'success');
      } else {
        throw new Error(data.error || 'Помилка створення WAV файлу');
      }
    } catch (error) {
      console.error('Помилка створення WAV файлу:', error);
      showError(error instanceof Error ? error.message : 'Помилка створення WAV файлу', 'error');
    }
  }, [showError]);

  // Функція зміни вкладки
  const changeTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
    setCurrentPage(1);
    
    // Встановлюємо відповідний список в залежності від вкладки
    switch (tab) {
      case 'user-songs':
        setFilteredItems(userSongs);
        break;
      case 'public-songs':
        fetchPublicSongs(1);
        break;
      case 'user-lyrics':
        setFilteredItems(userLyrics);
        break;
      case 'public-lyrics':
        fetchPublicLyrics(1);
        break;
    }
  }, [userSongs, userLyrics, fetchPublicSongs, fetchPublicLyrics]);

  // Функція пошуку
  const handleSearch = useCallback(() => {
    const query = searchQuery.toLowerCase();
    
    if (query === '') {
      // Якщо запит порожній, показуємо всі елементи поточної вкладки
      switch (activeTab) {
        case 'user-songs':
          setFilteredItems(userSongs);
          break;
        case 'public-songs':
          setFilteredItems(publicSongs);
          break;
        case 'user-lyrics':
          setFilteredItems(userLyrics);
          break;
        case 'public-lyrics':
          setFilteredItems(publicLyrics);
          break;
      }
      return;
    }
    
    // Фільтруємо відповідно до активної вкладки
    switch (activeTab) {
      case 'user-songs':
      case 'public-songs':
        const songs = activeTab === 'user-songs' ? userSongs : publicSongs;
        const filteredSongs = songs.filter(song => 
          song.title.toLowerCase().includes(query) ||
          song.model_name.toLowerCase().includes(query)
        );
        setFilteredItems(filteredSongs);
        break;
        
      case 'user-lyrics':
      case 'public-lyrics':
        const lyrics = activeTab === 'user-lyrics' ? userLyrics : publicLyrics;
        const filteredLyrics = lyrics.filter(lyric => 
          lyric.title.toLowerCase().includes(query) ||
          lyric.content.toLowerCase().includes(query)
        );
        setFilteredItems(filteredLyrics);
        break;
    }
  }, [activeTab, searchQuery, userSongs, publicSongs, userLyrics, publicLyrics]);

  // Обробка зміни сторінки для пагінації
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    
    if (activeTab === 'public-songs') {
      fetchPublicSongs(newPage);
    } else if (activeTab === 'public-lyrics') {
      fetchPublicLyrics(newPage);
    }
  }, [activeTab, totalPages, fetchPublicSongs, fetchPublicLyrics]);

  // Початкове завантаження даних
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchUserData();
      await fetchUserSongs();
      setIsLoading(false);
    };
    
    loadInitialData();
  }, [fetchUserData, fetchUserSongs]);

  // Обробник зміни вкладки
  useEffect(() => {
    if (userData) {
      switch (activeTab) {
        case 'user-songs':
          fetchUserSongs();
          break;
        case 'public-songs':
          fetchPublicSongs(currentPage);
          break;
        case 'user-lyrics':
          fetchUserLyrics();
          break;
        case 'public-lyrics':
          fetchPublicLyrics(currentPage);
          break;
      }
    }
  }, [activeTab, currentPage, userData, fetchUserSongs, fetchPublicSongs, fetchUserLyrics, fetchPublicLyrics]);

  // Обробник зміни пошукового запиту
  useEffect(() => {
    handleSearch();
  }, [searchQuery, handleSearch]);

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
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Завантаження...
          </motion.div>
        </div>
      ) : (
        <>
          <motion.header
            className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <Topbar paramUserData={userData} />
          </motion.header>

          <div className='flex flex-1 overflow-hidden'>
            <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
              <AsidePanelLeft />
            </aside>

            <main className='flex-1 overflow-y-auto px-4 pb-4'>
              <div className='relative min-h-[80vh] w-full max-w-[1280px] mx-auto rounded-[30px] bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-lg'>
                <h1 className='mb-6 text-2xl font-bold'>Мої плейлисти</h1>

                {/* Вкладки */}
                <div className='mb-6 flex border-b border-gray-700'>
                  <motion.button
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'user-songs' ? 'border-b-2 border-[#6374B6] font-semibold' : 'text-gray-300'}`}
                    onClick={() => changeTab('user-songs')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User size={16} />
                    <span>Мої пісні</span>
                  </motion.button>

                  <motion.button
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'public-songs' ? 'border-b-2 border-[#6374B6] font-semibold' : 'text-gray-300'}`}
                    onClick={() => changeTab('public-songs')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Globe size={16} />
                    <span>Публічні пісні</span>
                  </motion.button>

                  <motion.button
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'user-lyrics' ? 'border-b-2 border-[#6374B6] font-semibold' : 'text-gray-300'}`}
                    onClick={() => changeTab('user-lyrics')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FileText size={16} />
                    <span>Мої тексти</span>
                  </motion.button>

                  <motion.button
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'public-lyrics' ? 'border-b-2 border-[#6374B6] font-semibold' : 'text-gray-300'}`}
                    onClick={() => changeTab('public-lyrics')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Globe size={16} />
                    <span>Публічні тексти</span>
                  </motion.button>
                </div>

                {/* Поле пошуку */}
                <div className='mb-6 relative'>
                  <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Пошук...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full rounded-lg bg-[#2D2D35] py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6374B6]'
                  />
                </div>

                {/* Контент вкладки */}
                <div className='space-y-4'>
                  <AnimatePresence mode="wait">
                    {/* Відображення пісень */}
                    {(activeTab === 'user-songs' || activeTab === 'public-songs') && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
                      >
                        {filteredItems.length > 0 ? (
                          (filteredItems as SongType[]).map((song) => (
                            <SongCard
                              key={song.id}
                              song={song}
                              isUserSong={activeTab === 'user-songs'}
                              isPlaying={currentlyPlaying === song.id}
                              onTogglePlay={() => togglePlay(song.id, song.audio_file)}
                              onToggleVisibility={() => toggleSongVisibility(song.id, song.is_public)}
                              onDownloadWav={() => downloadWav(song.task_id, song.audio_id || '')}
                            />
                          ))
                        ) : (
                          <div className='col-span-full text-center py-8 text-gray-400'>
                            {searchQuery ? 'Не знайдено пісень за вашим запитом' : 'Немає доступних пісень'}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Відображення текстів */}
                    {(activeTab === 'user-lyrics' || activeTab === 'public-lyrics') && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
                      >
                        {filteredItems.length > 0 ? (
                          (filteredItems as LyricsType[]).map((lyrics) => (
                            <LyricsCard
                              key={lyrics.id}
                              lyrics={lyrics}
                              isUserLyrics={activeTab === 'user-lyrics'}
                              onView={() => setSelectedLyrics(lyrics)}
                              onToggleVisibility={() => toggleLyricsVisibility(lyrics.id, lyrics.is_public)}
                            />
                          ))
                        ) : (
                          <div className='col-span-full text-center py-8 text-gray-400'>
                            {searchQuery ? 'Не знайдено текстів за вашим запитом' : 'Немає доступних текстів'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Пагінація для публічних даних */}
                  {(activeTab === 'public-songs' || activeTab === 'public-lyrics') && totalPages > 1 && (
                    <div className='mt-6 flex items-center justify-center gap-2'>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className='rounded-md bg-[#2D2D35] px-3 py-1 text-white disabled:opacity-50'
                      >
                        &lt;
                      </button>
                      <span className='mx-2'>
                        {currentPage} з {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className='rounded-md bg-[#2D2D35] px-3 py-1 text-white disabled:opacity-50'
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </main>

            <aside className='sticky top-0 hidden h-screen w-80 flex-shrink-0 lg:block'>
              <AsidePanelRight />
            </aside>
          </div>

          <footer className='fixed bottom-0 left-0 right-0 bg-[#1C1C1F] shadow-md'>
            <MusicPlayer />
            {/* Аудіо плеєр для фонового відтворення */}
            <audio id="audio-player" onEnded={() => setCurrentlyPlaying(null)} className="hidden" />
          </footer>

          {/* Модальне вікно для перегляду тексту */}
          {selectedLyrics && (
            <LyricsModal
              lyrics={selectedLyrics}
              onClose={() => setSelectedLyrics(null)}
            />
          )}
        </>
      )}
    </motion.div>
  );
}