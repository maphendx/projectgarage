'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useError } from '@/context/ErrorContext';

import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';
import { UserData } from '@/components/not_components';
import fetchClient from '@/other/fetchClient';
import SongsList from '@/components/ai/SongsList';

// Типи для даних відповідей від API
type ResponseData = {
  error?: string;
  success?: boolean;
  message?: string;
  taskId?: string;
  status?: string;
  wav_file?: string; // Add this field to store the WAV file path
  task?: {
    status: string;
    result?: {
      audio_wav_file?: string; // Add this field to handle WAV file from task result
    };
  };
};

// Тип для об'єкта аудіо
type SongData = {
  audio_id: string;
  id: string;
  task_id: string;
  title: string;
  audio_file: string;
  photo_file: string;
  model_name: string;
  created_at: string;
};

// Оновіть тип для genAudioData
type GenAudioData = {
  customMode: boolean;
  instrumental: boolean;
  callBackUrl: string;
  model: string;
  example: string;
  prompt: string;
  style: string;
  title: string;
};

// Головний компонент сторінки
const SunoAIPage = () => {
  const router = useRouter();
  const { showError } = useError();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Режими роботи інтерфейсу
  const [activeTab, setActiveTab] = useState<
    'generate_audio' | 'extend_audio' | 'lyrics' | 'wav'
  >('generate_audio');
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [songs, setSongs] = useState<SongData[]>([]);
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [showSongsList, setShowSongsList] = useState(false);

  // Змініть стан genAudioData
  const [genAudioData, setGenAudioData] = useState<GenAudioData>({
    customMode: true,
    instrumental: false,
    callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`,
    model: 'V3_5',
    example: '',
    prompt: '',
    style: '',
    title: '',
  });

  // Стан для форми розширення аудіо
  const [extendAudioData, setExtendAudioData] = useState({
    defaultParamFlag: false,
    audioId: '',
    callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`,
    model: 'V3_5',
    prompt: '',
    style: '',
    title: '',
    continueAt: 0,
    example: '',
  });

  // Стан для форми генерації лірики
  const [lyricsData, setLyricsData] = useState({
    prompt: '',
    callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`,
    example: '',
  });

  // Стан для форми генерації WAV
  const [wavData, setWavData] = useState({
    taskId: '',
    audioId: '',
    callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`,
    example: '',
  });

  // Показуємо помилки через контекст помилок
  useEffect(() => {
    if (error) {
      showError(error, 'error');
    }
  }, [error, showError]);

  // Функція для отримання даних користувача
  const fetchUserData = async (): Promise<UserData | null> => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`,
      );
      if (!response.ok) {
        console.error(`Помилка: ${response.status} - ${response.statusText}`);
        throw new Error('Помилка мережі');
      }
      const data: UserData = await response.json();
      return data;
    } catch (error) {
      console.error('Помилка отримання даних:', error);
      return null;
    }
  };

  const downloadWavFile = (filePath: string) => {
    if (!filePath) {
      showError('Шлях до WAV файлу не знайдено', 'error');
      return;
    }
    
    // Construct the full URL to the WAV file
    // Assuming the filePath is relative to the media root on the server
    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/media/${filePath}`;
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `downloaded_audio_${Date.now()}.wav`; // Generate a unique filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showError('Файл завантажується...', 'success');
  };

  // Функція для отримання пісень користувача
  const fetchUserSongs = async () => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/songs/`,
      );
      if (!response.ok) {
        console.error(`Помилка: ${response.status} - ${response.statusText}`);
        throw new Error('Не вдалося отримати список пісень');
      }
      const data = await response.json();
      
      if (data.success && Array.isArray(data.songs)) {
        setSongs(data.songs);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.error('Помилка отримання пісень:', error);
      setSongs([]);
    }
  };

  // Перевірка автентифікації та завантаження даних користувача при монтуванні
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/auth');
          return;
        }

        const userDataResponse = await fetchUserData();
        if (userDataResponse) {
          setUserData(userDataResponse);
        }
        
        // Завантажуємо пісні користувача
        await fetchUserSongs();
      } catch (err) {
        setError(`Не вдалося отримати дані: ${err}`);
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  // Функція для вибору пісні зі списку
  const handleSelectSong = useCallback((song: SongData) => {
    setSelectedSong(song);
    setShowSongsList(false);

    // Заповнюємо поля форми в залежності від активного режиму
    if (activeTab === 'extend_audio') {
      setExtendAudioData(prev => ({
        ...prev,
        audioId: song.audio_id, // Використовуємо audio_id замість id
        model: song.model_name.includes('V4') ? 'V4' : 'V3_5'
      }));
    } else if (activeTab === 'wav') {
      // Для WAV конвертації потрібні обидва ID
      console.log('Setting WAV data from song:', song); // Debug log
      
      // Перевіряємо чи містить об'єкт пісні обов'язкові поля
      if (!song.audio_id || !song.task_id) {
        showError(
          'Помилка: Пісня не містить необхідних даних для конвертації у WAV', 
          'error'
        );
        return;
      }
      
      setWavData(prev => ({
        ...prev,
        audioId: song.audio_id, // Використовуємо audio_id замість id
        taskId: song.task_id
      }));
      
      console.log('Updated WAV form data:', {
        audioId: song.audio_id,
        taskId: song.task_id
      });
    }
  }, [activeTab, showError]);

  // Функція для відправки запиту на генерацію
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    let payload: {
      taskId?: string;
      audioId?: string;
      callBackUrl: string;
      example?: string;
      customMode?: boolean;
      instrumental?: boolean;
      model?: string;
    } = { callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/` };

    if (activeTab === 'generate_audio') {
      url = '/api/ai/generate/audio/';
      payload = {
        ...genAudioData,
        callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`,
      };
      
      // Додаємо обов'язкові поля в залежності від режиму
      if (genAudioData.customMode) {
        if (genAudioData.instrumental) {
          if (!genAudioData.style || !genAudioData.title) {
            showError('Для інструментальної музики в користувацькому режимі потрібні поля style та title', 'error');
            return;
          }
        } else {
          if (!genAudioData.style || !genAudioData.prompt || !genAudioData.title) {
            showError('Для музики з текстом в користувацькому режимі потрібні поля style, prompt та title', 'error');
            return;
          }
        }
      } else {
        if (!genAudioData.prompt) {
          showError('Поле prompt є обов\'язковим в будь-якому режимі', 'error');
          return;
        }
      }
    } else if (activeTab === 'extend_audio') {
      if (!selectedSong) {
        showError('Будь ласка, оберіть пісню для розширення', 'warning');
        setShowSongsList(true);
        return;
      }
      
      url = '/api/ai/generate/extend/';
      payload = {
        ...extendAudioData,
        callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`
      };
      
      // Валідація в залежності від режиму розширення
      if (extendAudioData.defaultParamFlag) {
        if (extendAudioData.continueAt === undefined || extendAudioData.continueAt < 0) {
          showError('Поле continueAt є обов\'язковим при включеному defaultParamFlag', 'error');
          return;
        }
      }
    } else if (activeTab === 'lyrics') {
      url = '/api/ai/generate/lyrics/';
      payload = {
        ...lyricsData,
        callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`
      };
      
      if (!lyricsData.prompt) {
        showError('Поле prompt є обов\'язковим для генерації лірики', 'error');
        return;
      }
    } else if (activeTab === 'wav') {
      if (!selectedSong) {
        showError('Будь ласка, оберіть пісню для конвертації у WAV', 'warning');
        setShowSongsList(true);
        return;
      }
      
      url = '/api/ai/generate/wav/';
      
      // Ensure both taskId and audioId are set properly from the selected song
      const taskId = wavData.taskId || selectedSong.task_id;
      const audioId = wavData.audioId || selectedSong.audio_id; // Use audio_id here!
      
      // Validate that all required fields exist
      if (!taskId || !audioId) {
        showError('Помилка: ID завдання або ID аудіо відсутні', 'error');
        return;
      }
      
      // Create the payload with explicit values (not using wavData directly)
      payload = {
        taskId: taskId,
        audioId: audioId,
        callBackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ai/callback/`,
      };
      
      // If example is provided, add it to the payload
      if (wavData.example) {
        payload.example = wavData.example;
      }
      
      console.log('WAV payload:', payload); // Debug log
    }

    try {
      setResponse({ message: "Відправляємо запит..." });
      
      console.log(`Sending request to ${process.env.NEXT_PUBLIC_API_URL}${url} with payload:`, payload);
      
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}${url}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();
      console.log('API response:', data); // Debug log

      if (response.ok) {
        showError('Запит успішно відправлено! Перевірте статус завдання пізніше.', 'success');
        setResponse(data);
        // Оновлюємо список пісень після успішного запиту (з затримкою)
        setTimeout(() => {
          fetchUserSongs();
        }, 1000);
      } else {
        showError(`Помилка: ${data.error || data.message || 'Невідома помилка'}`, 'error');
        setResponse(data);
      }
    } catch (error) {
      console.error('Помилка при запиті:', error);
      setResponse({ error: 'Сталася помилка при запиті.' });
    }
  };

  // Функція для перевірки статусу завдання
  const checkTaskStatus = async () => {
    if (!response?.taskId) {
      showError('Немає ID завдання для перевірки', 'warning');
      return;
    }

    let url = '';
    if (activeTab === 'generate_audio' || activeTab === 'extend_audio') {
      url = `/api/ai/task/?taskId=${response.taskId}`;
    } else if (activeTab === 'lyrics') {
      url = `/api/ai/lyrics-task/?taskId=${response.taskId}`;
    } else if (activeTab === 'wav') {
      url = `/api/ai/wav-task/?taskId=${response.taskId}`;
    }

    try {
      const statusResponse = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}${url}`,
      );

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setResponse(data);
        
        if (data.task && (data.task.status === 'completed' || data.task.status === 'SUCCESS')) {
          showError('Завдання успішно виконано!', 'success');
          fetchUserSongs();
        } else if (data.task && (data.task.status === 'failed' || data.task.status.includes('FAILED'))) {
          showError(`Помилка виконання завдання: ${data.task.errorMessage || 'невідома помилка'}`, 'error');
        } else {
          showError(`Статус завдання: ${data.task ? data.task.status : 'очікування'}`, 'info');
        }
      } else {
        showError('Не вдалося отримати статус завдання', 'error');
      }
    } catch (error) {
      console.error('Помилка при перевірці статусу:', error);
      showError('Помилка при перевірці статусу завдання', 'error');
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
              <div className='relative min-h-[80vh] w-full max-w-[1280px] mx-auto rounded-[30px] bg-gradient-to-r from-[#2D2D45] to-[#3F4B8A] p-8 shadow-2xl backdrop-blur-lg'>
                <div className='flex flex-row gap-8'>
                  {/* Панель з вкладками */}
                  <motion.div className='w-64'>
                    <div className='mb-8'>
                      <h2 className='text-2xl font-bold text-white'>
                        AI Генерація
                      </h2>
                      <p className='mt-2 text-sm text-gray-300'>
                        Оберіть тип генерації для створення контенту
                      </p>
                    </div>
                    <div className='space-y-3'>
                      {[
                        {
                          id: 'generate_audio',
                          label: 'Генерація аудіо',
                          icon: '🎵',
                        },
                        {
                          id: 'extend_audio',
                          label: 'Розширення аудіо',
                          icon: '🎼',
                        },
                        { id: 'lyrics', label: 'Генерація лірики', icon: '📝' },
                        { id: 'wav', label: 'WAV генерація', icon: '🎚️' },
                      ].map((tab) => (
                        <motion.div
                          key={tab.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`cursor-pointer rounded-xl p-4 transition-all ${
                            activeTab === tab.id
                              ? 'bg-[#6374B6] text-white shadow-lg'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                          onClick={() => {
                            setActiveTab(
                              tab.id as
                                | 'generate_audio'
                                | 'extend_audio'
                                | 'lyrics'
                                | 'wav',
                            );
                            setShowSongsList(false);
                            setSelectedSong(null);
                          }}
                        >
                          <div className='flex items-center gap-3'>
                            <span className='text-xl'>{tab.icon}</span>
                            <span className='text-sm font-medium'>
                              {tab.label}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Блок з кредитами */}
                    <div className='mt-8 rounded-xl bg-white/5 p-4'>
                      <h3 className='text-sm font-semibold'>Вартість кредитів:</h3>
                      <ul className='mt-2 text-xs text-gray-300'>
                        <li>• Модель V3.5: 7 кредитів</li>
                        <li>• Модель V4: 10 кредитів</li>
                        <li>• Розширення аудіо: 10 кредитів</li>
                        <li>• Генерація WAV: 0.4 кредита</li>
                        <li>• Генерація лірики: 0.4 кредита</li>
                      </ul>
                    </div>
                  </motion.div>

                  {/* Панель форми */}
                  <motion.div className='flex-1'>
                    {/* Список пісень (відображається при потребі) */}
                    {showSongsList && (
                      <SongsList
                      songs={songs}
                      onSelect={(song) => handleSelectSong(song as unknown as SongData)}
                      onClose={() => setShowSongsList(false)}
                    />
                    
                    )}
                    
                    {/* Основна форма */}
                    {!showSongsList && (
                      <div className='rounded-xl bg-white/5 p-6 backdrop-blur-sm'>
                        <form onSubmit={handleSubmit} className='space-y-6'>
                          {activeTab === 'generate_audio' && (
                            <div>
                              <h2 className='mb-4 text-2xl font-semibold'>
                                Генерація аудіо
                              </h2>
                              <div className='grid grid-cols-2 gap-4'>
                                <div className='mb-4'>
                                  <label className='mb-2 block text-sm font-medium text-gray-300'>
                                    Режим генерації:
                                  </label>
                                  <div className='flex items-center space-x-2'>
                                    <input
                                      type='checkbox'
                                      id='customMode'
                                      checked={genAudioData.customMode}
                                      onChange={(e) =>
                                        setGenAudioData({
                                          ...genAudioData,
                                          customMode: e.target.checked,
                                        })
                                      }
                                      className='h-4 w-4 rounded border-gray-300 bg-gray-700 text-[#6374B6] focus:ring-[#6374B6]'
                                    />
                                    <label htmlFor='customMode' className='text-sm text-gray-300'>
                                      Користувацький режим
                                    </label>
                                  </div>
                                </div>
                                
                                <div className='mb-4'>
                                  <label className='mb-2 block text-sm font-medium text-gray-300'>
                                    Тип музики:
                                  </label>
                                  <div className='flex items-center space-x-2'>
                                    <input
                                      type='checkbox'
                                      id='instrumental'
                                      checked={genAudioData.instrumental}
                                      onChange={(e) =>
                                        setGenAudioData({
                                          ...genAudioData,
                                          instrumental: e.target.checked,
                                        })
                                      }
                                      className='h-4 w-4 rounded border-gray-300 bg-gray-700 text-[#6374B6] focus:ring-[#6374B6]'
                                    />
                                    <label htmlFor='instrumental' className='text-sm text-gray-300'>
                                      Інструментальна музика (без тексту)
                                    </label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className='mb-4'>
                                <label className='mb-2 block text-sm font-medium text-gray-300'>
                                  Модель:
                                </label>
                                <select
                                  className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white'
                                  value={genAudioData.model}
                                  onChange={(e) =>
                                    setGenAudioData({
                                      ...genAudioData,
                                      model: e.target.value,
                                    })
                                  }
                                >
                                  <option value='V3_5'>V3.5 (7 кредитів)</option>
                                  <option value='V4'>V4 (10 кредитів)</option>
                                </select>
                              </div>
                              
                              {genAudioData.customMode && (
                                <>
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      Стиль:
                                    </label>
                                    <input
                                      type='text'
                                      className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                      value={genAudioData.style}
                                      onChange={(e) =>
                                        setGenAudioData({
                                          ...genAudioData,
                                          style: e.target.value,
                                        })
                                      }
                                      placeholder='Наприклад: Rock, Jazz, Classical'
                                    />
                                  </div>
                                  
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      Назва пісні:
                                    </label>
                                    <input
                                      type='text'
                                      className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                      value={genAudioData.title}
                                      onChange={(e) =>
                                        setGenAudioData({
                                          ...genAudioData,
                                          title: e.target.value,
                                        })
                                      }
                                      placeholder='Введіть назву вашої пісні'
                                    />
                                  </div>
                                </>
                              )}
                              
                              <div className='mb-4'>
                                <label className='mb-2 block text-sm font-medium text-gray-300'>
                                  {genAudioData.instrumental 
                                    ? 'Опис бажаної музики:' 
                                    : 'Текст пісні або опис:'}
                                </label>
                                <textarea
                                  className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                  value={genAudioData.prompt}
                                  onChange={(e) =>
                                    setGenAudioData({
                                      ...genAudioData,
                                      prompt: e.target.value,
                                    })
                                  }
                                  placeholder={genAudioData.instrumental 
                                    ? 'Опишіть яку інструментальну музику ви хочете почути' 
                                    : 'Введіть текст пісні або опис бажаної музики'}
                                  rows={5}
                                />
                              </div>
                              
                              <div className='mb-4'>
                                <label className='mb-2 block text-sm font-medium text-gray-300'>
                                  Приклад (опціонально):
                                </label>
                                <input
                                  type='text'
                                  className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                  value={genAudioData.example}
                                  onChange={(e) =>
                                    setGenAudioData({
                                      ...genAudioData,
                                      example: e.target.value,
                                    })
                                  }
                                  placeholder='Посилання на приклад подібної музики'
                                />
                              </div>
                            </div>
                          )}

                          {activeTab === 'extend_audio' && (
                            <div>
                              <h2 className='mb-4 text-2xl font-semibold'>
                                Розширення аудіо
                              </h2>
                              
                              {!selectedSong ? (
                                <div className='mb-4 text-center'>
                                  <p className='mb-4 text-gray-300'>
                                    Потрібно вибрати пісню для розширення
                                  </p>
                                  <button
                                    type='button'
                                    onClick={() => setShowSongsList(true)}
                                    className='rounded-lg bg-[#6374B6] px-6 py-3 text-white transition-all hover:opacity-90'
                                  >
                                    Вибрати пісню
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className='mb-4 flex items-center justify-between rounded-lg bg-[#2D2D45]/50 p-4'>
                                    <div>
                                      <h3 className='font-semibold'>{selectedSong.title}</h3>
                                      <p className='text-sm text-gray-300'>{selectedSong.model_name}</p>
                                    </div>
                                    <button
                                      type='button'
                                      onClick={() => setShowSongsList(true)}
                                      className='rounded-lg bg-[#6374B6]/50 px-4 py-2 text-sm text-white transition-all hover:bg-[#6374B6]'
                                    >
                                      Змінити
                                    </button>
                                  </div>
                                
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      Режим розширення:
                                    </label>
                                    <div className='flex items-center space-x-2'>
                                      <input
                                        type='checkbox'
                                        id='defaultParamFlag'
                                        checked={extendAudioData.defaultParamFlag}
                                        onChange={(e) =>
                                          setExtendAudioData({
                                            ...extendAudioData,
                                            defaultParamFlag: e.target.checked,
                                          })
                                        }
                                        className='h-4 w-4 rounded border-gray-300 bg-gray-700 text-[#6374B6] focus:ring-[#6374B6]'
                                      />
                                      <label htmlFor='defaultParamFlag' className='text-sm text-gray-300'>
                                        Використовувати власні параметри (при вимкненні використовуються оригінальні параметри)
                                      </label>
                                    </div>
                                  </div>
                                  
                                  {extendAudioData.defaultParamFlag && (
                                    <>
                                      <div className='mb-4'>
                                        <label className='mb-2 block text-sm font-medium text-gray-300'>
                                          Модель:
                                        </label>
                                        <select
                                          className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white'
                                          value={extendAudioData.model}
                                          onChange={(e) =>
                                            setExtendAudioData({
                                              ...extendAudioData,
                                              model: e.target.value,
                                            })
                                          }
                                        >
                                          <option value='V3_5'>V3.5</option>
                                          <option value='V4'>V4</option>
                                        </select>
                                        <p className='mt-1 text-xs text-gray-400'>Модель повинна відповідати оригінальній пісні</p>
                                      </div>
                                      
                                      <div className='mb-4'>
                                        <label className='mb-2 block text-sm font-medium text-gray-300'>
                                          Стиль:
                                        </label>
                                        <input
                                          type='text'
                                          className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                          value={extendAudioData.style}
                                          onChange={(e) =>
                                            setExtendAudioData({
                                              ...extendAudioData,
                                              style: e.target.value,
                                            })
                                          }
                                          placeholder='Стиль музики для розширення'
                                        />
                                      </div>
                                      
                                      <div className='mb-4'>
                                        <label className='mb-2 block text-sm font-medium text-gray-300'>
                                          Назва:
                                        </label>
                                        <input
                                          type='text'
                                          className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                          value={extendAudioData.title}
                                          onChange={(e) =>
                                            setExtendAudioData({
                                              ...extendAudioData,
                                              title: e.target.value,
                                            })
                                          }
                                          placeholder='Назва розширеної пісні'
                                        />
                                      </div>
                                      
                                      <div className='mb-4'>
                                        <label className='mb-2 block text-sm font-medium text-gray-300'>
                                          Опис/текст розширення:
                                        </label>
                                        <textarea
                                          className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                          value={extendAudioData.prompt}
                                          onChange={(e) =>
                                            setExtendAudioData({
                                              ...extendAudioData,
                                              prompt: e.target.value,
                                            })
                                          }
                                          placeholder='Опишіть як повинна розширитись музика'
                                          rows={4}
                                        />
                                      </div>
                                    </>
                                  )}
                                  
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      Розпочати з моменту (секунди):
                                    </label>
                                    <input
                                      type='number'
                                      className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                      value={extendAudioData.continueAt}
                                      onChange={(e) =>
                                        setExtendAudioData({
                                          ...extendAudioData,
                                          continueAt: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      placeholder='0'
                                      min="0"
                                    />
                                    <p className='mt-1 text-xs text-gray-400'>Вказується момент у секундах, з якого буде розширюватись пісня</p>
                                  </div>
                                  
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      Приклад (опціонально):
                                    </label>
                                    <input
                                      type='text'
                                      className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                      value={extendAudioData.example}
                                      onChange={(e) =>
                                        setExtendAudioData({
                                          ...extendAudioData,
                                          example: e.target.value,
                                        })
                                      }
                                      placeholder='Посилання на приклад'
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {activeTab === 'lyrics' && (
                            <div>
                              <h2 className='mb-4 text-2xl font-semibold'>
                                Генерація тексту пісні
                              </h2>
                              <div className='mb-4'>
                                <label className='mb-2 block text-sm font-medium text-gray-300'>
                                  Опис бажаного тексту:
                                </label>
                                <textarea
                                  className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                  value={lyricsData.prompt}
                                  onChange={(e) =>
                                    setLyricsData({
                                      ...lyricsData,
                                      prompt: e.target.value,
                                    })
                                  }
                                  placeholder='Опишіть про що має бути текст пісні'
                                  rows={5}
                                />
                              </div>
                              <div className='mb-4'>
                                <label className='mb-2 block text-sm font-medium text-gray-300'>
                                  Приклад (опціонально):
                                </label>
                                <input
                                  type='text'
                                  className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                  value={lyricsData.example}
                                  onChange={(e) =>
                                    setLyricsData({
                                      ...lyricsData,
                                      example: e.target.value,
                                    })
                                  }
                                  placeholder='Посилання на приклад подібного тексту'
                                />
                              </div>
                            </div>
                          )}

                          {activeTab === 'wav' && (
                            <div>
                              <h2 className='mb-4 text-2xl font-semibold'>
                                Конвертація у WAV
                              </h2>
                              
                              {!selectedSong ? (
                                <div className='mb-4 text-center'>
                                  <p className='mb-4 text-gray-300'>
                                    Потрібно вибрати пісню для конвертації у WAV формат
                                  </p>
                                  <button
                                    type='button'
                                    onClick={() => setShowSongsList(true)}
                                    className='rounded-lg bg-[#6374B6] px-6 py-3 text-white transition-all hover:opacity-90'
                                  >
                                    Вибрати пісню
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className='mb-4 flex items-center justify-between rounded-lg bg-[#2D2D45]/50 p-4'>
                                    <div>
                                      <h3 className='font-semibold'>{selectedSong.title}</h3>
                                      <p className='text-sm text-gray-300'>{selectedSong.model_name}</p>
                                    </div>
                                    <button
                                      type='button'
                                      onClick={() => setShowSongsList(true)}
                                      className='rounded-lg bg-[#6374B6]/50 px-4 py-2 text-sm text-white transition-all hover:bg-[#6374B6]'
                                    >
                                      Змінити
                                    </button>
                                  </div>
                                  
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      ID задачі (автоматично):
                                    </label>
                                    <input
                                      type='text'
                                      className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-gray-400'
                                      value={wavData.taskId}
                                      readOnly
                                    />
                                  </div>
                                  
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      ID аудіо (автоматично):
                                    </label>
                                    <input
                                      type='text'
                                      className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-gray-400'
                                      value={wavData.audioId}
                                      readOnly
                                    />
                                  </div>
                                  
                                  <div className='mb-4'>
                                    <label className='mb-2 block text-sm font-medium text-gray-300'>
                                      Приклад (опціонально):
                                    </label>
                                    <input
                                      type='text'
                                      className='w-full rounded-lg border border-gray-600 bg-[#2D2D45] p-3 text-white placeholder-gray-400 focus:border-[#6374B6] focus:outline-none focus:ring-1 focus:ring-[#6374B6]'
                                      value={wavData.example}
                                      onChange={(e) =>
                                        setWavData({
                                          ...wavData,
                                          example: e.target.value,
                                        })
                                      }
                                      placeholder='Посилання на приклад'
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          <div className='flex justify-between'>
                            <button
                              type='submit'
                              className='rounded-lg bg-gradient-to-r from-[#6374B6] to-[#8594D4] px-6 py-3 text-white transition-all hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            >
                              Згенерувати
                            </button>
                            
                            {response?.taskId && (
                              <button
                                type='button'
                                onClick={checkTaskStatus}
                                className='rounded-lg bg-[#3C4B84] px-6 py-3 text-white transition-all hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                              >
                                Перевірити статус
                              </button>
                            )}
                            
                            {(response?.wav_file || (response?.task?.result?.audio_wav_file)) ? (
                              <button
                                type='button'
                                onClick={() => {
                                  const filePath = response?.wav_file || response?.task?.result?.audio_wav_file;
                                  if (filePath) downloadWavFile(filePath);
                                }}
                                className='ml-4 rounded-lg bg-green-600 px-6 py-3 text-white transition-all hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                              >
                                Завантажити WAV
                              </button>
                            ) : null}
                          </div>
                        </form>

                        {response && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className='mt-6 rounded-lg bg-white/5 p-6 backdrop-blur-sm'
                          >
                            <h3 className='mb-3 text-lg font-semibold text-white'>
                              Результат:
                            </h3>
                            <pre className='rounded-lg bg-[#2D2D45] p-4 text-sm text-gray-300 overflow-auto max-h-[300px]'>
                              {JSON.stringify(response, null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </main>

            <aside className='sticky top-0 hidden h-screen w-80 flex-shrink-0 lg:block'>
              <AsidePanelRight />
            </aside>
          </div>

          <footer className='fixed bottom-0 left-0 right-0 bg-[#1C1C1F] shadow-md'>
            <MusicPlayer />
          </footer>
        </>
      )}
    </motion.div>
  );
};

export default SunoAIPage;