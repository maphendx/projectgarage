'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import { useRouter } from 'next/navigation';
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  PlusIcon,
  HashtagIcon,
} from '@heroicons/react/24/solid';
import fetchClient from '@/other/fetchClient';

type UserData = {
  id: number;
  username: string;
  display_name?: string;
  email: string;
  photo?: string;
};

type Channel = {
  id: number;
  name: string;
  participants: number;
};

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export default function VoiceChatPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([
    { id: 1, name: 'Загальний', participants: 4 },
    { id: 2, name: 'Ігри', participants: 2 },
    { id: 3, name: 'Музика', participants: 1 },
  ]);

  const [participants, setParticipants] = useState([
    { id: 1, name: 'Олександр Чень', speaking: true, muted: false },
    { id: 2, name: 'Саміра Хан', speaking: false, muted: true },
    { id: 3, name: 'Джеймс Вілсон', speaking: false, muted: false },
    { id: 4, name: 'Марія Гонзалез', speaking: true, muted: false },
  ]);

  const apiRequest = useCallback(
    async (endpoint: string, method: string = 'GET', body?: any) => {
      const headers = {
      'Content-Type': 'application/json',
      };
      if (!headers) return null;
      try {
        const response = await fetchClient(`${API_BASE_URL}${endpoint}`, {
          method,
          headers,
          ...(body && { body: JSON.stringify(body) }),
        });
        if (!response.ok) {
          throw new Error(`Помилка HTTP! статус: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error(`Запит не вдався: ${err}`);
      }
    },
    [],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await apiRequest('/users/profile/');
      if (data) setUserData(data);
    };
    fetchProfile();
  }, [apiRequest]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleCall = useCallback(() => {
    setInCall(!inCall);
  }, [inCall]);

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      const newChannel = {
        id: channels.length + 1,
        name: newChannelName.trim(),
        participants: 0,
      };
      setChannels([...channels, newChannel]);
      setNewChannelName('');
      setIsCreatingChannel(false);
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
      <motion.header
        className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <Topbar paramUserData={userData} />
      </motion.header>

      <div className='flex flex-1 overflow-hidden'>
        {/* Icon Navigation */}
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 border-r border-[#2D2D35] bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        {/* Channels Panel */}
        <aside className='sticky top-0 z-20 h-screen w-64 flex-shrink-0 border-r border-[#2D2D35] bg-[#1C1C1F]'>
          <div className='p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-white'>Голосові канали</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreatingChannel(true)}
                className='rounded-lg bg-[#25252B] p-2 hover:bg-[#2D2D35]'
              >
                <PlusIcon className='h-5 w-5 text-[#6374B6]' />
              </motion.button>
            </div>

            {isCreatingChannel && (
              <div className='mb-4'>
                <input
                  type='text'
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder='Назва каналу'
                  className='mb-2 w-full rounded bg-[#25252B] p-2 text-white'
                />
                <div className='flex gap-2'>
                  <button
                    onClick={handleCreateChannel}
                    className='flex-1 rounded bg-[#6374B6] p-2 hover:bg-opacity-70'
                  >
                    Створити
                  </button>
                  <button
                    onClick={() => setIsCreatingChannel(false)}
                    className='flex-1 rounded bg-[#25252B] p-2 hover:bg-[#2D2D35]'
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}

            <div className='space-y-2'>
              {channels.map((channel) => (
                <motion.button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`flex w-full items-center justify-between rounded-lg p-3 ${
                    selectedChannel?.id === channel.id
                      ? 'bg-[#6374B6]'
                      : 'bg-[#25252B] hover:bg-[#2D2D35]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='flex items-center gap-2'>
                    <HashtagIcon className='h-4 w-4 text-[#6374B6]' />
                    <span>{channel.name}</span>
                  </div>
                  <span className='text-sm opacity-75'>
                    {channel.participants}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </aside>

        <main className='flex-1 overflow-y-auto p-6'>
          {selectedChannel && (
            <div className='mb-6'>
              <h1 className='mb-2 text-2xl font-bold text-white'>
                {selectedChannel.name}
              </h1>
              <p className='text-gray-400'>
                {selectedChannel.participants} учасників у каналі
              </p>
            </div>
          )}

          <motion.div
            className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {participants.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className='relative flex flex-col items-center rounded-2xl bg-[#1E1E24] p-4'
                >
                  <div className='relative'>
                    <div
                      className={`h-20 w-20 rounded-full bg-[#2D2D35] ${
                        user.speaking ? 'ring-2 ring-[#6374B6]' : ''
                      }`}
                    >
                      <div className='absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#2D2D35]'>
                        {user.muted ? (
                          <MicrophoneIcon className='h-4 w-4 text-red-500' />
                        ) : (
                          <SpeakerWaveIcon className='h-4 w-4 text-green-500' />
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className='mt-2 text-center font-medium text-white'>
                    {user.name}
                  </h3>
                  {user.speaking && (
                    <motion.div
                      className='absolute inset-0 rounded-2xl border-2 border-[#6374B6]'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <div className='fixed bottom-8 left-1/2 -translate-x-1/2 transform'>
            <div className='flex items-center gap-4 rounded-full bg-[#25252B] p-2'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full p-4 ${
                  isMuted ? 'bg-red-500' : 'bg-[#6374B6]'
                } transition-colors`}
                onClick={toggleMute}
              >
                <MicrophoneIcon className='h-6 w-6 text-white' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full p-4 ${
                  inCall ? 'bg-red-500' : 'bg-[#6374B6]'
                } transition-colors`}
                onClick={toggleCall}
              >
                {inCall ? 'Вийти' : 'Приєднатися'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='rounded-full bg-[#2D2D35] p-4'
              >
                <UserPlusIcon className='h-6 w-6 text-[#6374B6]' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='rounded-full bg-[#2D2D35] p-4'
              >
                <Cog6ToothIcon className='h-6 w-6 text-[#6374B6]' />
              </motion.button>
            </div>
          </div>
        </main>

        <aside className='sticky top-0 hidden h-screen w-80 flex-shrink-0 border-l border-[#2D2D35] bg-[#1C1C1F] lg:block'>
          <AsidePanelRight />
        </aside>
      </div>
    </motion.div>
  );
}
