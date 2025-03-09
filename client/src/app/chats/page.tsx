'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  FormEvent,
  ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Send,
  Trash2,
  Image as ImageIcon,
  UserPlus,
} from 'lucide-react';
import { useError } from '@/context/ErrorContext';
import fetchClient from '@/other/fetchClient';
import Image from 'next/image';

import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const WS_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws')
  : 'ws://localhost:8000';

interface UserData {
  id: number;
  display_name: string;
  email: string;
  photo?: string;
}

interface ChatRoom {
  id: number;
  name: string;
  created_at: string;
  participants: UserData[];
  avatar?: string;
}

interface Reaction {
  id: number;
  message: number; // Add message reference
  user: number;
  reaction: string;
  created_at: string;
}

interface Message {
  id: number;
  chat: number;
  sender: number;
  sender_name?: string; // Add sender name
  sender_photo?: string; // Add sender photo
  content: string;
  timestamp: string;
  parent?: number; // Add support for reply threading
  reactions: Reaction[];
}

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function ChatPage() {
  const router = useRouter();
  const { showError } = useError();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomParticipants, setNewRoomParticipants] = useState('');
  const [newRoomImage, setNewRoomImage] = useState<File | null>(null);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newParticipants, setNewParticipants] = useState('');

  const websocketRef = useRef<WebSocket | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) router.push('/auth');
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : null;
  }, []);

  const apiRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: string = 'GET',
      body?: unknown,
      isMultipart: boolean = false,
    ): Promise<T | null> => {
      const headers = getAuthHeaders();
      if (!headers) return null;

      const config: RequestInit = {
        method,
        headers: isMultipart
          ? { ...(headers as Record<string, string>) }
          : {
              ...(headers as Record<string, string>),
              'Content-Type': 'application/json',
            },
        ...(body && !isMultipart && { body: JSON.stringify(body) }),
        ...(body && isMultipart && { body }),
      };

      try {
        const response = await fetchClient(
          `${API_BASE_URL}${endpoint}`,
          config,
        );
        if (!response.ok) throw new Error(await response.text());
        return response.status === 204 ? null : await response.json();
      } catch (error) {
        showError((error as Error).message || 'API request failed', 'error');
        return null;
      }
    },
    [getAuthHeaders, showError],
  );

  const getReactionEmoji = (reaction: string) => {
    const reactionMap: { [key: string]: string } = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😲',
      sad: '😢',
      angry: '😠',
    };
    return reactionMap[reaction] || reaction;
  };

  const groupReactions = (reactions: Reaction[]) => {
    const grouped: { [key: string]: number } = {};
    reactions.forEach((reaction) => {
      const emoji = getReactionEmoji(reaction.reaction);
      if (grouped[emoji]) {
        grouped[emoji]++;
      } else {
        grouped[emoji] = 1;
      }
    });
    return grouped;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const [userProfile, rooms] = await Promise.all([
        apiRequest<UserData>('/users/profile/'),
        apiRequest<ChatRoom[]>('/messaging/chatrooms/'),
      ]);

      if (userProfile) setUserData(userProfile);
      if (rooms?.length) {
        setChatRooms(rooms);
        // Only set selected room if it's not already set
        if (!selectedRoom) {
          const firstRoom = rooms[0];
          setSelectedRoom(firstRoom);
        }
      }
      setIsLoading(false);
    };

    const token = localStorage.getItem('access_token');
    if (token) loadInitialData();
  }, [apiRequest, selectedRoom]);

  useEffect(() => {
    if (!selectedRoom?.id || !userData) return;

    const fetchMessages = async () => {
      const msgs = await apiRequest<Message[]>(
        `/messaging/messages/${selectedRoom.id}/`,
      );
      if (msgs) setMessages(msgs);
    };

    fetchMessages();
    // Setup websocket connection...
    const websocket = new WebSocket(
      `${WS_BASE_URL}/ws/chat/${encodeURIComponent(selectedRoom.name)}/`,
    );
    websocketRef.current = websocket;

    websocket.onopen = () => {
      console.log('WebSocket Connected');
      const token = localStorage.getItem('access_token');
      websocket.send(
        JSON.stringify({
          type: 'authorization',
          token: `Bearer ${token}`,
        }),
      );
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        if (data.type === 'chat_message') {
          const sender = selectedRoom?.participants.find(
            (p) => p.id === data.sender_id,
          );
          const newMessage: Message = {
            id: data.message_id,
            chat: selectedRoom.id,
            sender: data.sender_id,
            sender_name: sender?.display_name || data.sender,
            sender_photo: sender?.photo || data.sender_photo,
            content: data.message,
            timestamp: data.timestamp,
            reactions: [],
            parent: data.parent_id,
          };

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          scrollToBottom();
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      showError('Failed to connect to chat. Please try again.', 'error');
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [selectedRoom, userData, scrollToBottom]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom?.id || isSending || !userData)
      return;

    setIsSending(true);
    const messageContent = {
      content: newMessage.trim(),
      sender_name: userData.display_name,
      sender_photo: userData.photo,
    };

    try {
      const response = await apiRequest<Message>(
        `/messaging/messages/${selectedRoom.id}/`,
        'POST',
        messageContent,
      );

      if (response) {
        setNewMessage('');
        // Add message locally for immediate feedback
        setMessages((prev) => [
          ...prev,
          {
            ...response,
            sender_name: userData.display_name,
            sender_photo: userData.photo,
          },
        ]);
        scrollToBottom();
      }
    } catch (error) {
      showError('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      showError('Room name is required', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('name', newRoomName.trim());

    // Handle participants array properly
    if (newRoomParticipants) {
      const participants = newRoomParticipants
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name);
      formData.append(
        'participants_display_names',
        JSON.stringify(participants),
      );
    }

    if (newRoomImage) {
      formData.append('avatar', newRoomImage);
    }

    const newRoom = await apiRequest<ChatRoom>(
      '/messaging/chatrooms/',
      'POST',
      formData,
      true,
    );

    if (newRoom) {
      setChatRooms((prev) => [...prev, newRoom]);
      setSelectedRoom(newRoom);
      setNewRoomName('');
      setNewRoomParticipants('');
      setNewRoomImage(null);
      setShowNewRoomModal(false);
      showError('Room created successfully', 'success');
    }
  };

  const handleAddUsersToRoom = async () => {
    if (!selectedRoom || !newParticipants.trim()) {
      showError('Please enter participant names', 'warning');
      return;
    }

    const userDisplayNames = newParticipants
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name);

    const response = await apiRequest<ChatRoom>(
      `/messaging/chatrooms/${selectedRoom.id}/add_user/`,
      'POST',
      { user_display_names: userDisplayNames },
    );

    if (response) {
      setChatRooms((prev) =>
        prev.map((room) => (room.id === selectedRoom.id ? response : room)),
      );
      setSelectedRoom(response);
      setNewParticipants('');
      setShowAddUserModal(false);
      showError('Users added successfully', 'success');
    }
  };

  const handleUpdateAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!selectedRoom || !e.target.files?.[0]) return;

    const formData = new FormData();
    formData.append('avatar', e.target.files[0]);

    const updatedRoom = await apiRequest<ChatRoom>(
      `/messaging/chatrooms/${selectedRoom.id}/avatar/`,
      'PATCH',
      formData,
      true,
    );

    if (updatedRoom) {
      setChatRooms((prev) =>
        prev.map((room) => (room.id === selectedRoom.id ? updatedRoom : room)),
      );
      setSelectedRoom(updatedRoom);
      showError('Avatar updated successfully', 'success');
    }
  };

  const handleReaction = async (messageId: number, reaction: string) => {
    const reactionMap: { [key: string]: string } = {
      '👍': 'like',
      '❤️': 'love',
      '😂': 'laugh',
      '😲': 'wow',
      '😢': 'sad',
      '😠': 'angry',
    };

    const backendReaction = reactionMap[reaction];
    if (!backendReaction) return;

    await apiRequest<Reaction>(
      `/messaging/messages/${messageId}/reaction/`,
      'POST',
      { reaction: backendReaction },
    );
  };

  const handleDeleteReaction = async (messageId: number) => {
    await apiRequest(`/messaging/messages/${messageId}/reaction/`, 'DELETE');
  };

  const handleDeleteMessage = async (messageId: number) => {
    await apiRequest(`/messaging/messages/${messageId}/`, 'DELETE');
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleDeleteRoom = async (roomId: number) => {
    await apiRequest(`/messaging/chatrooms/${roomId}/`, 'DELETE');
    setChatRooms((prev) => prev.filter((room) => room.id !== roomId));
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(
        chatRooms.length > 1
          ? chatRooms.find((room) => room.id !== roomId) || null
          : null,
      );
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'>
      {isLoading ? (
        <div className='flex h-screen items-center justify-center'>
          <div className='text-lg font-semibold text-gray-300'>
            Завантаження...
          </div>
        </div>
      ) : (
        <>
          <header className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'>
            <Topbar paramUserData={userData} />
          </header>

          <div className='flex flex-1 overflow-hidden'>
            <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
              <AsidePanelLeft />
            </aside>

            <main className='flex-1 overflow-y-auto px-4 pb-4'>
              <div className='fixed min-h-[80vh] w-[1280px] rounded-[30px] bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
                <div className='flex flex-row gap-8'>
                  <motion.div className='w-64'>
                    <div className='mb-8'>
                      <h2 className='text-2xl font-bold text-white'>Чати</h2>
                      <p className='mt-2 text-sm text-gray-300'>
                        Оберіть чат для початку спілкування
                      </p>
                      <button
                        onClick={() => setShowNewRoomModal(true)}
                        className='mt-4 w-full rounded-lg bg-[#6374B6] px-4 py-2 text-white transition-all hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      >
                        Створити чат
                      </button>
                    </div>
                    <div className='space-y-3'>
                      {chatRooms.map((room) => (
                        <motion.div
                          key={room.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`cursor-pointer rounded-xl p-4 transition-all ${
                            selectedRoom?.id === room.id
                              ? 'bg-[#6374B6] text-white shadow-lg'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedRoom(room)}
                        >
                          <div className='flex items-center gap-3'>
                            {room.avatar ? (
                              <Image
                                src={room.avatar}
                                alt={room.name}
                                width={40}
                                height={40}
                                className='rounded-full'
                              />
                            ) : (
                              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-600'>
                                <Users className='h-5 w-5 text-[#6374B6]' />
                              </div>
                            )}
                            <span className='flex-1 truncate'>{room.name}</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoom(room.id);
                              }}
                              className='rounded-full p-1 hover:bg-red-500/20'
                            >
                              <Trash2 className='h-4 w-4' />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div className='flex-1'>
                    <div className='rounded-xl bg-white/5 p-6 backdrop-blur-sm'>
                      {!selectedRoom ? (
                        <div className='flex flex-1 items-center justify-center text-gray-400'>
                          Оберіть чат для початку спілкування
                        </div>
                      ) : (
                        <>
                          <div className='mb-4 flex items-center justify-between border-b border-gray-700 pb-3'>
                            <div className='flex items-center gap-3'>
                              {selectedRoom.avatar && (
                                <Image
                                  src={selectedRoom.avatar}
                                  alt={selectedRoom.name}
                                  width={40}
                                  height={40}
                                  className='rounded-full'
                                />
                              )}
                              <h3 className='text-lg font-semibold'>
                                {selectedRoom.name}
                              </h3>
                            </div>
                            <div className='flex gap-3'>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                className='flex items-center gap-1 text-sm hover:text-[#6374B6]'
                                onClick={() => setShowAddUserModal(true)}
                              >
                                <UserPlus className='h-4 w-4' /> Додати
                                користувача
                              </motion.button>
                              <label className='flex cursor-pointer items-center gap-1 text-sm hover:text-[#6374B6]'>
                                <ImageIcon className='h-4 w-4' /> Аватар
                                <input
                                  type='file'
                                  className='hidden'
                                  onChange={handleUpdateAvatar}
                                  accept='image/*'
                                />
                              </label>
                            </div>
                          </div>

                          <div className='max-h-[60vh] flex-1 space-y-4 overflow-y-auto p-2'>
                            <AnimatePresence>
                              {messages.map((msg) => (
                                <motion.div
                                  key={msg.id}
                                  variants={messageVariants}
                                  initial='hidden'
                                  animate='visible'
                                  exit='exit'
                                  className={`flex ${
                                    msg.sender === userData?.id
                                      ? 'justify-end'
                                      : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`group flex max-w-[70%] items-end gap-2 ${
                                      msg.sender === userData?.id
                                        ? 'flex-row-reverse'
                                        : ''
                                    }`}
                                  >
                                    <div className='flex flex-col'>
                                      <div
                                        className={`rounded-2xl p-3 shadow-md ${
                                          msg.sender === userData?.id
                                            ? 'bg-[#6374B6] text-white'
                                            : 'bg-gray-700 text-gray-200'
                                        }`}
                                      >
                                        <p className='whitespace-pre-wrap text-sm'>
                                          {msg.content}
                                        </p>
                                        {msg.reactions?.length > 0 && (
                                          <div className='mt-2 flex space-x-2'>
                                            {Object.entries(
                                              groupReactions(
                                                msg.reactions || [],
                                              ),
                                            ).map(([emoji, count]) => (
                                              <span
                                                key={emoji}
                                                className='flex items-center space-x-1 text-sm'
                                              >
                                                <span>{emoji}</span>
                                                <span>{count}</span>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className='mt-1 flex space-x-2 text-xs text-gray-400'>
                                        <div className='flex items-center gap-2'>
                                          {msg.sender_photo && (
                                            <Image
                                              src={msg.sender_photo}
                                              alt={msg.sender_name || 'User'}
                                              width={20}
                                              height={20}
                                              className='rounded-full'
                                            />
                                          )}
                                          <span>
                                            {msg.sender_name || 'Unknown'}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleReaction(msg.id, '👍')
                                          }
                                          className='hover:text-white'
                                        >
                                          👍
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleReaction(msg.id, '❤️')
                                          }
                                          className='hover:text-white'
                                        >
                                          ❤️
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleReaction(msg.id, '😂')
                                          }
                                          className='hover:text-white'
                                        >
                                          😂
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteReaction(msg.id)
                                          }
                                          className='hover:text-white'
                                        >
                                          Видалити реакцію
                                        </button>
                                        {msg.sender === userData?.id && (
                                          <button
                                            onClick={() =>
                                              handleDeleteMessage(msg.id)
                                            }
                                            className='hover:text-white'
                                          >
                                            Видалити
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                          </div>

                          <form onSubmit={handleSendMessage} className='mt-4'>
                            <div className='flex items-center gap-2 rounded-full bg-gray-700/50 p-2 shadow-inner'>
                              <input
                                type='text'
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className='flex-1 bg-transparent p-2 text-white placeholder-gray-400 focus:outline-none'
                                placeholder='Введіть повідомлення...'
                              />
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                type='submit'
                                disabled={!newMessage.trim() || isSending}
                                className='rounded-full bg-[#6374B6] p-2 disabled:opacity-50'
                              >
                                <Send className='h-5 w-5' />
                              </motion.button>
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
        </>
      )}

      {showNewRoomModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className='w-full max-w-md rounded-xl bg-[#2C2C3C] p-6 shadow-xl'
          >
            <h2 className='mb-4 text-xl font-bold'>
              Створити нову кімнату чату
            </h2>
            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm text-gray-300'>
                  Назва кімнати
                </label>
                <input
                  type='text'
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className='w-full rounded-lg bg-gray-700 p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Введіть назву кімнати'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm text-gray-300'>
                  Учасники (через кому)
                </label>
                <input
                  type='text'
                  value={newRoomParticipants}
                  onChange={(e) => setNewRoomParticipants(e.target.value)}
                  className='w-full rounded-lg bg-gray-700 p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='user1, user2, user3'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm text-gray-300'>
                  Аватар кімнати
                </label>
                <input
                  type='file'
                  onChange={(e) =>
                    e.target.files && setNewRoomImage(e.target.files[0])
                  }
                  className='w-full rounded-lg bg-gray-700 p-2 text-white'
                  accept='image/*'
                />
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  onClick={() => setShowNewRoomModal(false)}
                  className='rounded-lg bg-gray-600 px-4 py-2 text-white transition-all hover:bg-gray-700'
                >
                  Скасувати
                </button>
                <button
                  onClick={handleCreateRoom}
                  className='rounded-lg bg-[#6374B6] px-4 py-2 text-white transition-all hover:opacity-90'
                >
                  Створити
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showAddUserModal && selectedRoom && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className='w-full max-w-md rounded-xl bg-[#2C2C3C] p-6 shadow-xl'
          >
            <h2 className='mb-4 text-xl font-bold'>
              Додати користувачів до {selectedRoom.name}
            </h2>
            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm text-gray-300'>
                  Користувачі (через кому)
                </label>
                <input
                  type='text'
                  value={newParticipants}
                  onChange={(e) => setNewParticipants(e.target.value)}
                  className='w-full rounded-lg bg-gray-700 p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='user1, user2, user3'
                />
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className='rounded-lg bg-gray-600 px-4 py-2 text-white transition-all hover:bg-gray-700'
                >
                  Скасувати
                </button>
                <button
                  onClick={handleAddUsersToRoom}
                  className='rounded-lg bg-[#6374B6] px-4 py-2 text-white transition-all hover:opacity-90'
                >
                  Додати користувачів
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
