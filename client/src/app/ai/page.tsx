'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useError } from '@/context/ErrorContext';

import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';

const SunoDemoPage = () => {
  const router = useRouter();
  const { showError } = useError();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
    }
    setIsLoading(false);
  }, [router]);

  // Можливі режими запиту
  const [activeTab, setActiveTab] = useState<
    'generate_audio' | 'extend_audio' | 'lyrics' | 'wav'
  >('generate_audio');
  const [response, setResponse] = useState<any>(null);

  // Стан для форми генерації аудіо
  const [genAudioData, setGenAudioData] = useState({
    customMode: false,
    instrumental: false,
    callBackUrl: '',
    model: 'V3_5',
    example: '',
  });

  // Стан для форми розширення аудіо
  const [extendAudioData, setExtendAudioData] = useState({
    defaultParamFlag: false,
    audioId: '',
    callBackUrl: '',
    model: '',
    prompt: '',
    style: '',
    title: '',
    continueAt: '',
    example: '',
  });

  // Стан для форми генерації лірик
  const [lyricsData, setLyricsData] = useState({
    prompt: '',
    callBackUrl: '',
    example: '',
  });

  // Стан для форми генерації WAV
  const [wavData, setWavData] = useState({
    taskId: '',
    audioId: '',
    callBackUrl: '',
    example: '',
  });

  // Обробник відправки запиту
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    let payload = {};

    if (activeTab === 'generate_audio') {
      url = '/api/v1/generate/';
      payload = genAudioData;
    } else if (activeTab === 'extend_audio') {
      url = '/api/v1/generate/extend/';
      payload = extendAudioData;
    } else if (activeTab === 'lyrics') {
      url = '/api/v1/lyrics/';
      payload = lyricsData;
    } else if (activeTab === 'wav') {
      url = '/api/v1/wav/generate/';
      payload = wavData;
    }

    // Витягуємо токен із localStorage (за умови, що користувач автентифікований)
    const token = localStorage.getItem('access_token') || '';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Помилка при запиті:', error);
      setResponse({ error: 'Сталася помилка при запиті.' });
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

            <main className='overflow-y flex-1 px-4 pb-4'>
              <div className='fixed min-h-[80vh] w-[1280px] rounded-[30px] bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-lg'>
                <div className='flex flex-row gap-6'>
                  {/* Tabs Panel */}
                  <motion.div className='w-60'>
                    <div className='mb-6'>
                      <h2 className='text-xl font-bold text-white'>
                        AI Генерація
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      {['generate_audio', 'extend_audio', 'lyrics', 'wav'].map(
                        (tab) => (
                          <motion.div
                            key={tab}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`cursor-pointer rounded-lg p-4 transition-all ${
                              activeTab === tab
                                ? 'bg-[#6374B6] text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                            onClick={() => setActiveTab(tab as any)}
                          >
                            <span className='text-sm text-white'>
                              {tab === 'generate_audio'
                                ? 'Генерація аудіо'
                                : tab === 'extend_audio'
                                  ? 'Розширення аудіо'
                                  : tab === 'lyrics'
                                    ? 'Генерація лірики'
                                    : 'WAV генерація'}
                            </span>
                          </motion.div>
                        ),
                      )}
                    </div>
                  </motion.div>

                  {/* Form Panel */}
                  <motion.div className='flex-1'>
                    <div className='rounded-lg bg-white/5 p-4'>
                      <form
                        onSubmit={handleSubmit}
                        className='space-y-4 text-white'
                      >
                        {activeTab === 'generate_audio' && (
                          <div>
                            <h2 className='mb-4 text-2xl font-semibold'>
                              Генерація аудіо
                            </h2>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Custom Mode:</label>
                              <input
                                type='checkbox'
                                checked={genAudioData.customMode}
                                onChange={(e) =>
                                  setGenAudioData({
                                    ...genAudioData,
                                    customMode: e.target.checked,
                                  })
                                }
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                Instrumental:
                              </label>
                              <input
                                type='checkbox'
                                checked={genAudioData.instrumental}
                                onChange={(e) =>
                                  setGenAudioData({
                                    ...genAudioData,
                                    instrumental: e.target.checked,
                                  })
                                }
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                CallBack URL:
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={genAudioData.callBackUrl}
                                onChange={(e) =>
                                  setGenAudioData({
                                    ...genAudioData,
                                    callBackUrl: e.target.value,
                                  })
                                }
                                placeholder='https://example.com/callback'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Model:</label>
                              <select
                                className='w-full rounded border p-2'
                                value={genAudioData.model}
                                onChange={(e) =>
                                  setGenAudioData({
                                    ...genAudioData,
                                    model: e.target.value,
                                  })
                                }
                              >
                                <option value='V3_5'>V3_5</option>
                                <option value='V4'>V4</option>
                              </select>
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                Example (опціонально):
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={genAudioData.example}
                                onChange={(e) =>
                                  setGenAudioData({
                                    ...genAudioData,
                                    example: e.target.value,
                                  })
                                }
                                placeholder='Приклад запиту'
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === 'extend_audio' && (
                          <div>
                            <h2 className='mb-4 text-2xl font-semibold'>
                              Розширення аудіо
                            </h2>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                Default Param Flag:
                              </label>
                              <input
                                type='checkbox'
                                checked={extendAudioData.defaultParamFlag}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    defaultParamFlag: e.target.checked,
                                  })
                                }
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Audio ID:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.audioId}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    audioId: e.target.value,
                                  })
                                }
                                placeholder='Ідентифікатор аудіо'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                CallBack URL:
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.callBackUrl}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    callBackUrl: e.target.value,
                                  })
                                }
                                placeholder='https://example.com/callback'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Model:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.model}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    model: e.target.value,
                                  })
                                }
                                placeholder='Версія моделі'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Prompt:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.prompt}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    prompt: e.target.value,
                                  })
                                }
                                placeholder='Підказка для генерації'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Style:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.style}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    style: e.target.value,
                                  })
                                }
                                placeholder='Стиль музики'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Title:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.title}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    title: e.target.value,
                                  })
                                }
                                placeholder='Назва пісні'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Continue At:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.continueAt}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    continueAt: e.target.value,
                                  })
                                }
                                placeholder='Місце продовження'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                Example (опціонально):
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={extendAudioData.example}
                                onChange={(e) =>
                                  setExtendAudioData({
                                    ...extendAudioData,
                                    example: e.target.value,
                                  })
                                }
                                placeholder='Приклад запиту'
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === 'lyrics' && (
                          <div>
                            <h2 className='mb-4 text-2xl font-semibold'>
                              Генерація лірик
                            </h2>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Prompt:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={lyricsData.prompt}
                                onChange={(e) =>
                                  setLyricsData({
                                    ...lyricsData,
                                    prompt: e.target.value,
                                  })
                                }
                                placeholder='Підказка для тексту пісні'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                CallBack URL:
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={lyricsData.callBackUrl}
                                onChange={(e) =>
                                  setLyricsData({
                                    ...lyricsData,
                                    callBackUrl: e.target.value,
                                  })
                                }
                                placeholder='https://example.com/callback'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                Example (опціонно):
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={lyricsData.example}
                                onChange={(e) =>
                                  setLyricsData({
                                    ...lyricsData,
                                    example: e.target.value,
                                  })
                                }
                                placeholder='Приклад запиту'
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === 'wav' && (
                          <div>
                            <h2 className='mb-4 text-2xl font-semibold'>
                              Генерація WAV
                            </h2>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Task ID:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={wavData.taskId}
                                onChange={(e) =>
                                  setWavData({
                                    ...wavData,
                                    taskId: e.target.value,
                                  })
                                }
                                placeholder='Task ID з генерації аудіо'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>Audio ID:</label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={wavData.audioId}
                                onChange={(e) =>
                                  setWavData({
                                    ...wavData,
                                    audioId: e.target.value,
                                  })
                                }
                                placeholder='Ідентифікатор аудіо'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                CallBack URL:
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={wavData.callBackUrl}
                                onChange={(e) =>
                                  setWavData({
                                    ...wavData,
                                    callBackUrl: e.target.value,
                                  })
                                }
                                placeholder='https://example.com/callback'
                              />
                            </div>
                            <div className='mb-4'>
                              <label className='mb-1 block'>
                                Example (опціонно):
                              </label>
                              <input
                                type='text'
                                className='w-full rounded border p-2'
                                value={wavData.example}
                                onChange={(e) =>
                                  setWavData({
                                    ...wavData,
                                    example: e.target.value,
                                  })
                                }
                                placeholder='Приклад запиту'
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type='submit'
                          className='w-full rounded-lg bg-[#6374B6] px-4 py-3 text-white hover:bg-opacity-70'
                        >
                          Згенерувати
                        </button>
                      </form>

                      {response && (
                        <div className='mt-4 rounded-lg bg-white/10 p-4'>
                          <h3 className='mb-2 text-lg font-semibold text-white'>
                            Результат:
                          </h3>
                          <pre className='whitespace-pre-wrap text-gray-300'>
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
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

export default SunoDemoPage;
