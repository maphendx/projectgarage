'use client';

import { useEffect, useState, useRef, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Plus, Send } from 'lucide-react';
import { useError } from '@/context/ErrorContext';
import fetchClient from '@/other/fetchClient';

import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const WS_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws')
  : 'ws://localhost:8000';

const ErrorMessages = {
  AUTH_REQUIRED: "Авторизація обов'язкова",
  FETCH_ERROR: 'Помилка отримання даних',
  SEND_ERROR: 'Помилка надсилання повідомлення',
  ROOM_CREATE_ERROR: 'Помилка створення кімнати',
  ROOM_NAME_REQUIRED: "Назва кімнати обов'язкова",
  WS_ERROR: "Помилка з'єднання WebSocket",
  PARTICIPANTS_INVALID: 'Невірний формат ID учасників',
} as const;

interface ChatRoom {
  id: number;
  name: string;
  created_at: string;
  participants: UserData[];
}

interface Reaction {
  id: number;
  user: number;
  reaction: string;
  created_at: string;
}

interface Message {
  id: number;
  chat: number;
  sender: string;
  sender_id: number;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  timestamp: string;
  temporary?: boolean;
  reactions?: Reaction[];
}

interface UserData {
  id: number;
  display_name: string;
  email: string;
}

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
};

export default function ChatPage() {
  const router = useRouter();
  const { showError } = useError();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
    }
  }, [router]);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomParticipants, setNewRoomParticipants] = useState('');
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      showError(ErrorMessages.AUTH_REQUIRED, 'error');
      router.push('/auth');
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [router, showError]);

  const apiRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: string = 'GET',
      body?: any,
    ): Promise<T | null> => {
      const headers = getAuthHeaders();
      if (!headers) return null;

      try {
        const response = await fetchClient(`${API_BASE_URL}${endpoint}`, {
          method,
          headers,
          ...(body && { body: JSON.stringify(body) }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'API Request failed');
        }

        return await response.json();
      } catch (error) {
        showError(
          error instanceof Error ? error.message : ErrorMessages.FETCH_ERROR,
          'error',
        );
        return null;
      }
    },
    [getAuthHeaders, showError],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [userProfile, rooms] = await Promise.all([
          apiRequest<UserData>('/users/profile/'),
          apiRequest<ChatRoom[]>('/messaging/chatrooms/'),
        ]);

        if (userProfile) setUserData(userProfile);
        if (rooms) {
          setChatRooms(rooms);
          if (rooms.length > 0 && !selectedRoom) {
            setSelectedRoom(rooms[0]);
          }
        }
      } catch (error) {
        showError(ErrorMessages.FETCH_ERROR, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [apiRequest, showError]);

  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      const msgs = await apiRequest<Message[]>(
        `/messaging/messages/${selectedRoom.id}/`,
      );
      if (msgs) {
        setMessages(msgs);
        scrollToBottom();
      }
    };
    fetchMessages();

    const ws = new WebSocket(
      `${WS_BASE_URL}/ws/chat/${encodeURIComponent(selectedRoom.name)}/`,
    );

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            chat: selectedRoom.id,
            sender: data.sender,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            content: data.message,
            timestamp: new Date().toISOString(),
          },
        ]);
        scrollToBottom();
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    setWebSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedRoom]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !userData || isSending) return;

    setIsSending(true);

    try {
      const messageData = {
        content: newMessage.trim(),
        chat: selectedRoom.id,
      };

      const response = await apiRequest<Message>(
        `/messaging/messages/${selectedRoom.id}/`,
        'POST',
        messageData,
      );

      if (!response) throw new Error(ErrorMessages.SEND_ERROR);

      const tempMessage: Message = {
        id: response.id,
        chat: selectedRoom.id,
        sender: userData.display_name,
        sender_id: userData.id,
        sender_name: userData.display_name,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage('');
      scrollToBottom();

      if (webSocket?.readyState === WebSocket.OPEN) {
        webSocket.send(
          JSON.stringify({
            type: 'chat_message',
            message: newMessage.trim(),
            sender: userData.display_name,
          }),
        );
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : ErrorMessages.SEND_ERROR,
        'error',
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      showError(ErrorMessages.ROOM_NAME_REQUIRED, 'warning');
      return;
    }

    setIsCreatingRoom(true);

    try {
      const participantNames = newRoomParticipants
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name);

      const response = await apiRequest<ChatRoom>(
        '/messaging/chatrooms/',
        'POST',
        {
          name: newRoomName.trim(),
          participants_display_names: participantNames,
        },
      );

      if (!response) throw new Error(ErrorMessages.ROOM_CREATE_ERROR);

      setChatRooms((prev) => [...prev, response]);
      showError('Кімнату успішно створено', 'success');

      setNewRoomName('');
      setNewRoomParticipants('');
      setShowCreateRoom(false);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : ErrorMessages.ROOM_CREATE_ERROR,
        'error',
      );
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleReaction = async (messageId: number, reaction: string) => {
    try {
      const response = await apiRequest<Reaction>(
        `/messaging/messages/${messageId}/reaction/`,
        'POST',
        { reaction },
      );

      if (!response) throw new Error('Failed to add reaction');

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: [...(msg.reactions || []), response],
              }
            : msg,
        ),
      );
    } catch (error) {
      showError('Failed to add reaction', 'error');
    }
  };

  const handleRemoveReaction = async (messageId: number) => {
    try {
      await apiRequest(`/messaging/messages/${messageId}/reaction/`, 'DELETE');

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: msg.reactions?.filter(
                  (r) => r.user !== userData?.id,
                ),
              }
            : msg,
        ),
      );
    } catch (error) {
      showError('помилкааа', 'error');
    }
  };

  const handleAddParticipants = async (
    roomId: number,
    participantNames: string[],
  ) => {
    try {
      const response = await apiRequest<ChatRoom>(
        `/messaging/chatrooms/${roomId}/add_user/`,
        'POST',
        { user_display_names: participantNames },
      );

      if (!response) throw new Error('Failed to add participants');

      setChatRooms((prev) =>
        prev.map((room) => (room.id === roomId ? response : room)),
      );

      showError('Учасників успішно додано', 'success');
    } catch (error) {
      showError('Failed to add participants', 'error');
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
            <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
              <AsidePanelLeft />
            </aside>

            <main className='overflow-y flex-1 px-4 pb-4'>
              <div className='fixed min-h-[80vh] w-[1280px] rounded-[30px] bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-lg'>
                <div className='flex flex-row gap-6'>
                  {/* Chat Rooms List */}
                  <motion.div className='w-60'>
                    <div className='mb-6 flex items-center justify-between'>
                      <h2 className='flex items-center text-xl font-bold text-white'>
                        <MessageCircle className='mr-2 text-[#6374B6]' />
                        Чат кімнати
                      </h2>
                      <button
                        onClick={() => setShowCreateRoom(true)}
                        className='rounded-full p-2 hover:bg-white/10'
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
                          onClick={() => setSelectedRoom(room)}
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

                  {/* Conversation Pane */}
                  <motion.div className='flex-1'>
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
                            <span className='text-sm text-white'>
                              {selectedRoom.participants.length} учасників
                            </span>
                          </div>

                          <div
                            className='no-scrollbar h-[70vh] overflow-y-auto'
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none',
                            }}
                          >
                            <AnimatePresence>
                              {messages.map((msg, index) => (
                                <motion.div
                                  key={msg.id}
                                  variants={messageVariants}
                                  initial='hidden'
                                  animate='visible'
                                  exit='exit'
                                  transition={{ delay: index * 0.05 }}
                                  className={`mb-4 max-w-[80%] ${
                                    msg.sender_id === userData?.id
                                      ? 'ml-auto'
                                      : 'mr-auto'
                                  }`}
                                >
                                  {/* Only display sender name if message is not from current user */}
                                  {msg.sender_id !== userData?.id && (
                                    <p className='mb-1 text-xs font-bold text-gray-300'>
                                      {msg.sender_name}
                                    </p>
                                  )}
                                  <div
                                    className={`rounded-xl p-3 ${
                                      msg.sender_id === userData?.id
                                        ? 'bg-[#6374B6] text-white'
                                        : 'bg-white/10 text-gray-200'
                                    } relative`}
                                  >
                                    <p className='text-sm text-white'>
                                      {msg.content}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                              <div ref={messagesEndRef} />
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                          </div>

                          <form onSubmit={handleSendMessage} className='mt-4'>
                            <div className='flex overflow-hidden rounded-full bg-white/10'>
                              <input
                                type='text'
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className='flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6374B6]'
                                placeholder='Напишіть повідомлення...'
                              />
                              <button
                                type='submit'
                                disabled={!newMessage.trim()}
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

          {showCreateRoom && (
            <motion.div
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className='w-full max-w-md rounded-lg bg-[#2A2A40] p-6'>
                <h2 className='mb-4 text-lg font-semibold text-white'>
                  Створити кімнату
                </h2>
                <input
                  type='text'
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className='mb-4 w-full rounded-lg bg-white/10 p-3 text-white placeholder-gray-400 focus:outline-none'
                  placeholder='Назва кімнати...'
                />
                <input
                  type='text'
                  value={newRoomParticipants}
                  onChange={(e) => setNewRoomParticipants(e.target.value)}
                  className='mb-4 w-full rounded-lg bg-white/10 p-3 text-white placeholder-gray-400 focus:outline-none'
                  placeholder='ID учасників (через кому, напр.: 1,2,3)'
                  title='Введіть ID учасників через кому'
                />
                <div className='flex justify-end gap-2'>
                  <button
                    onClick={() => {
                      setShowCreateRoom(false);
                      setNewRoomName('');
                      setNewRoomParticipants('');
                    }}
                    className='rounded-lg px-4 py-2 text-white hover:bg-white/10'
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim()}
                    className='rounded-lg bg-[#6374B6] px-4 py-2 text-white hover:bg-opacity-70'
                  >
                    Створити
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
