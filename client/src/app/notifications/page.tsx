'use client';
import { UserData } from '@/components/not_components';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { refreshAccessToken } from '@/other/fetchClient';
import fetchClient from '@/other/fetchClient';

interface NotificationData {
  type: string;
  message: string;
  post_id?: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();

  const fetchUserData = async (url: string): Promise<UserData | null> => {
    try {
      const response = await fetchClient(url);
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

  const fetchNotifications = useCallback(
    async (url: string) => {
      try {
        const dataResponse = await fetchClient(url);

        if (!dataResponse.ok) {
          throw new Error(`HTTP error! status: ${dataResponse.status}`);
        }

        return await dataResponse.json();
      } catch (err) {
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/');
        }
      }
    },
    [router],
  );

  const setupWebSocket = async () => {
    // Формуємо WebSocket URL на основі протоколу поточної сторінки
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const token = await refreshAccessToken();
    const wsUrl = `${protocol}://localhost:8000/ws/notifications/?token=${token}`;

    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data: NotificationData = JSON.parse(event.data);
        // Додаємо нове повідомлення на початок списку
        setNotifications((prev) => [data, ...prev]);
      } catch (error) {
        console.error('Помилка обробки повідомлення:', error);
      }
    };

    socket.onclose = (event) => {
      console.warn("WebSocket з'єднання закрито", event);
    };

    return () => {
      socket.close();
    };
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    setupWebSocket().then((clean) => {
      cleanup = clean;
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const removeNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const loadUserData = async () => {
      const userDataResponse = await fetchUserData(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`,
      );
      if (userDataResponse) {
        setUserData(userDataResponse);
      }
    };
    loadUserData();
  }, [router]);

  useEffect(() => {
    const loadUserData = async () => {
      const userDataResponse = await fetchNotifications(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`,
      );
      if (userDataResponse) {
        setUserData(userDataResponse);
      }
    };
    loadUserData();
  }, [router, fetchNotifications]);

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
          <h1 className='mb-4 text-3xl font-bold'>Повідомлення</h1>

          <AnimatePresence>
            {notifications.map((notif, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className='mb-4 flex items-center justify-between rounded-lg bg-[#2D2D35] p-4 shadow-lg'
              >
                <div>
                  <p className='font-medium'>{notif.message}</p>
                  {notif.post_id && (
                    <p className='mt-1 text-sm text-gray-400'>
                      ID поста: {notif.post_id}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(index)}
                  className='ml-4 rounded bg-[#6374B6] px-3 py-1 text-xs hover:bg-opacity-80'
                >
                  Видалити
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {notifications.length === 0 && (
            <p className='mt-4 text-gray-400'>Немає нових повідомлень</p>
          )}
        </main>
      </div>
    </motion.div>
  );
}
