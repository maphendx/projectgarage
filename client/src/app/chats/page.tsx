'use client';

import { useEffect, useState, useCallback, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Users, Plus, ArrowLeft } from 'lucide-react';
import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';

type ChatRoom = {
  id: number;
  name: string;
  created_at: string;
  participants: number[];
};

type Message = {
  id: number;
  chat: number;
  sender: string;
  content: string;
  timestamp: string;
};

type UserData = {
  id: number;
  username: string;
  display_name?: string;
  email: string;
};

const API_BASE_URL = 'http://localhost:8000/api';

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showRoomList, setShowRoomList] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return null;
    }
    return {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    };
  }, [router]);

  const apiRequest = useCallback(
    async (endpoint: string, method: string = 'GET', body?: any) => {
      const headers = getAuthHeaders();
      if (!headers) return null;

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method,
          headers,
          ...(body && { body: JSON.stringify(body) }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('API Request Error:', error);
        return null;
      }
    },
    [getAuthHeaders],
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      const userDataResponse = await apiRequest('/users/profile/');
      if (userDataResponse) {
        setUserData(userDataResponse);
      } else {
        console.error('Failed to fetch user data');
      }

      const chatRoomsResponse = await apiRequest('/messaging/chatrooms/');
      if (chatRoomsResponse) setChatRooms(chatRoomsResponse);

      setIsLoading(false);
    };
    fetchInitialData();
  }, [apiRequest]);

  useEffect(() => {
    if (!selectedRoom || isLoading) return;

    const fetchMessages = async () => {
      const messagesData = await apiRequest(
        `/messaging/messages/${selectedRoom.id}/`,
      );
      if (messagesData) {
        setMessages(messagesData);
        scrollToBottom();
      }
    };
    fetchMessages();

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${selectedRoom.id}/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    };

    setWebSocket(ws);

    return () => {
      ws.close();
    };
  }, [selectedRoom, apiRequest, isLoading]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !newMessage.trim() || !selectedRoom || !userData?.id)
      return;

    try {
      const messageData = {
        chat: selectedRoom.id,
        content: newMessage.trim(),
        sender: userData.id,
      };

      const response = await apiRequest(
        `/messaging/messages/${selectedRoom.id}/`,
        'POST',
        messageData,
      );
      if (response && webSocket) {
        webSocket.send(
          JSON.stringify({
            message: newMessage.trim(),
            sender: userData.username,
          }),
        );
        setNewMessage('');
      }
    } catch (error) {
      console.error('Send Message Error:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (isLoading || !newRoomName.trim()) return;

    try {
      const response = await apiRequest('/messaging/chatrooms/', 'POST', {
        name: newRoomName.trim(),
        participants: [userData?.id],
      });

      if (response) {
        setChatRooms((prev) => [...prev, response]);
        setNewRoomName('');
        setShowNewRoomDialog(false);
      }
    } catch (error) {
      console.error('Create Room Error:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'>
      <motion.header className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'>
        <Topbar paramUserData={userData} />
      </motion.header>

      <div className='flex flex-1 overflow-hidden'>
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        <main className='flex-1 p-4'>
          <div className='min-h-[85vh] w-full rounded-[30px] bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-lg'>
            <div className='flex flex-col md:flex-row md:gap-6'>
              {(!isMobile || (isMobile && showRoomList)) && (
                <motion.div className='w-full md:w-1/3 lg:w-1/4'>
                  <div className='mb-6 flex items-center justify-between'>
                    <h2 className='flex items-center text-xl font-bold text-white'>
                      <MessageCircle className='mr-2 text-[#6374B6]' />
                      Чат кімнати
                    </h2>
                    <button
                      onClick={() => setShowNewRoomDialog(true)}
                      className='rounded-full p-2 hover:bg-white/10'
                      disabled={isLoading}
                    >
                      <Plus className='h-5 w-5 text-white' />
                    </button>
                  </div>

                  <div className='space-y-2'>
                    {chatRooms.map((room) => (
                      <motion.div
                        key={room.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`cursor-pointer rounded-lg p-4 transition-all ${
                          selectedRoom?.id === room.id
                            ? 'bg-[#6374B6] text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                        onClick={() => {
                          setSelectedRoom(room);
                          if (isMobile) setShowRoomList(false);
                        }}
                      >
                        <div className='flex items-center'>
                          <Users className='mr-2 h-4 w-4 text-[#6374B6]' />
                          <span className='text-sm text-white'>
                            {room.name}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {(!isMobile || (isMobile && !showRoomList)) && (
                <motion.div className='flex-1'>
                  {isMobile && selectedRoom && (
                    <button
                      className='mb-4 flex items-center rounded-lg px-4 py-2 hover:bg-white/10'
                      onClick={() => setShowRoomList(true)}
                    >
                      <ArrowLeft className='mr-2 h-4 w-4 text-white' />
                      <span className='text-white'>Назад до кімнат</span>
                    </button>
                  )}

                  <div className='rounded-lg bg-white/5 p-4'>
                    {!selectedRoom ? (
                      <div className='flex h-[60vh] items-center justify-center text-gray-400'>
                        Виберіть чат кімнату, щоб почати спілкування
                      </div>
                    ) : (
                      <>
                        <div className='mb-4 flex items-center justify-between border-b border-white/10 pb-4'>
                          <h3 className='text-lg font-semibold text-white'>
                            {selectedRoom.name}
                          </h3>
                          <span className='text-sm text-gray-400'>
                            {selectedRoom.participants.length} учасників
                          </span>
                        </div>

                        <div className='h-[50vh] overflow-y-auto'>
                          <AnimatePresence>
                            {messages.map((message) => (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className={`mb-4 max-w-[80%] ${
                                  message.sender === userData?.username
                                    ? 'ml-auto'
                                    : 'mr-auto'
                                }`}
                              >
                                <div
                                  className={`rounded-xl p-3 ${
                                    message.sender === userData?.username
                                      ? 'bg-[#6374B6] text-white'
                                      : 'bg-white/10 text-gray-200'
                                  }`}
                                >
                                  <div className='mb-1 flex items-center justify-between'>
                                    <span className='text-xs font-medium text-white'>
                                      {message.sender}
                                    </span>
                                    <span className='text-xs text-gray-400 opacity-70'>
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                  <p className='text-sm text-white'>
                                    {message.content}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className='mt-4'>
                          <div className='flex overflow-hidden rounded-full bg-white/10'>
                            <input
                              type='text'
                              value={newMessage}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                              ) => setNewMessage(e.target.value)}
                              className='flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none'
                              placeholder='Напишіть повідомлення...'
                              disabled={isLoading}
                            />
                            <button
                              type='submit'
                              disabled={isLoading || !newMessage.trim()}
                              className='bg-[#6374B6] px-4 py-3 hover:bg-opacity-70 disabled:opacity-50'
                            >
                              <Send className='h-4 w-4 text-white' />
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showNewRoomDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-lg bg-[#2A2A40] p-6'>
            <h2 className='mb-4 text-lg font-semibold text-white'>
              Створити нову чат кімнату
            </h2>
            <input
              type='text'
              value={newRoomName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewRoomName(e.target.value)
              }
              className='mb-4 w-full rounded-lg bg-white/10 p-3 text-white placeholder-gray-400 focus:outline-none'
              placeholder='Назва кімнати...'
              disabled={isLoading}
            />
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setShowNewRoomDialog(false)}
                className='rounded-lg px-4 py-2 text-white hover:bg-white/10'
                disabled={isLoading}
              >
                Скасувати
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={isLoading || !newRoomName.trim()}
                className='rounded-lg bg-[#6374B6] px-4 py-2 text-white hover:bg-opacity-70 disabled:opacity-50'
              >
                Створити
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
