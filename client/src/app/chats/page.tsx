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
  user: number;
  reaction: string;
  created_at: string;
}

interface Message {
  id: number;
  chat: number;
  sender: number;
  sender_name?: string;
  sender_photo?: string;
  content: string;
  timestamp: string;
  reactions?: Reaction[];
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
          ? headers
          : { ...headers, 'Content-Type': 'application/json' },
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

  const handleFetchEmojis = async () => {
    const emojis = await apiRequest<{ [key: string]: string }>(
      '/messaging/emoji/',
    );
    return emojis;
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const [userProfile, rooms] = await Promise.all([
        apiRequest<UserData>('/users/profile/'),
        apiRequest<ChatRoom[]>('/messaging/chatrooms/'),
        handleFetchEmojis(),
      ]);
      setUserData(userProfile);
      setChatRooms(rooms || []);
      if (rooms?.length && !selectedRoom) setSelectedRoom(rooms[0]);
      setIsLoading(false);
    };
    loadInitialData();
  }, [apiRequest, handleFetchEmojis, selectedRoom]);

  // WebSocket setup
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      const msgs = await apiRequest<Message[]>(
        `/messaging/messages/${selectedRoom.id}/`,
      );
      setMessages(msgs || []);
    };
    fetchMessages();

    const roomIdentifier = encodeURIComponent(selectedRoom.name);
    const websocket = new WebSocket(
      `${WS_BASE_URL}/ws/chat/${roomIdentifier}/`,
    );
    websocket.onopen = () => {
      const token = localStorage.getItem('access_token');
      websocket.send(
        JSON.stringify({ type: 'authorization', token: `Bearer ${token}` }),
      );
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Date.now(),
            chat: selectedRoom.id,
            sender: data.sender_id || 0,
            sender_name: data.sender,
            sender_photo: data.sender_photo,
            content: data.message,
            timestamp: new Date().toISOString(),
            reactions: [],
          },
        ]);
      } else if (data.type === 'reaction') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id
              ? {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []),
                    {
                      id: data.reaction_id,
                      user: data.user_id,
                      reaction: data.reaction,
                      created_at: new Date().toISOString(),
                    },
                  ],
                }
              : msg,
          ),
        );
      }
      scrollToBottom();
    };

    websocket.onerror = () => showError('WebSocket connection failed', 'error');

    return () => websocket.close();
  }, [selectedRoom, scrollToBottom, showError, apiRequest]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || isSending) return;

    setIsSending(true);
    const response = await apiRequest<Message>(
      `/messaging/messages/${selectedRoom.id}/`,
      'POST',
      { content: newMessage.trim(), chat: selectedRoom.id },
    );
    if (response) setNewMessage('');
    setIsSending(false);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      showError('Room name is required', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('name', newRoomName.trim());
    if (newRoomParticipants)
      formData.append('participants_display_names', newRoomParticipants);
    if (newRoomImage) formData.append('avatar', newRoomImage);

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
      showError('Room created successfully', 'success');
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
    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
    const mappedReaction =
      {
        '👍': 'like',
        '❤️': 'love',
        '😂': 'laugh',
        '😲': 'wow',
        '😢': 'sad',
        '😠': 'angry',
      }[reaction] || reaction;

    if (!validReactions.includes(mappedReaction)) return;

    const response = await apiRequest<Reaction>(
      `/messaging/messages/${messageId}/reaction/`,
      'POST',
      { reaction: mappedReaction },
    );
    if (response) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), response] }
            : msg,
        ),
      );
    }
  };

  const handleDeleteReaction = async (messageId: number) => {
    await apiRequest(`/messaging/messages/${messageId}/reaction/`, 'DELETE');
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: msg.reactions?.filter((r) => r.user !== userData?.id),
            }
          : msg,
      ),
    );
  };

  const handleDeleteMessage = async (messageId: number) => {
    await apiRequest(`/messaging/messages/${messageId}/delete/`, 'DELETE');
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleDeleteRoom = async (roomId: number) => {
    await apiRequest(`/messaging/chatrooms/${roomId}/`, 'DELETE');
    setChatRooms((prev) => prev.filter((room) => room.id !== roomId));
    if (selectedRoom?.id === roomId) setSelectedRoom(null);
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
              <div className='fixed min-h-[80vh] w-[1280px] rounded-[30px] bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
                <div className='flex flex-row gap-8'>
                  {/* Chat Rooms Sidebar */}
                  <motion.div className='w-64'>
                    <div className='mb-8'>
                      <h2 className='text-2xl font-bold text-white'>Chats</h2>
                      <p className='mt-2 text-sm text-gray-300'>
                        Select a chat room to start messaging
                      </p>
                      <button
                        onClick={handleCreateRoom}
                        className='mt-4 w-full rounded-lg bg-[#6374B6] px-4 py-2 text-white transition-all hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      >
                        Create Chat
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

                  {/* Chat Area */}
                  <motion.div className='flex-1'>
                    <div className='rounded-xl bg-white/5 p-6 backdrop-blur-sm'>
                      {!selectedRoom ? (
                        <div className='flex flex-1 items-center justify-center text-gray-400'>
                          Select a chat to start messaging
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
                              >
                                <UserPlus className='h-4 w-4' /> Settings
                              </motion.button>
                              <label className='flex cursor-pointer items-center gap-1 text-sm hover:text-[#6374B6]'>
                                <ImageIcon className='h-4 w-4' /> Avatar
                                <input
                                  type='file'
                                  className='hidden'
                                  onChange={handleUpdateAvatar}
                                  accept='image/*'
                                />
                              </label>
                            </div>
                          </div>

                          <div className='flex-1 space-y-4 overflow-y-auto p-2'>
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
                                    className={`group flex max-w-[70%] gap-2 ${
                                      msg.sender === userData?.id
                                        ? 'flex-row-reverse'
                                        : ''
                                    }`}
                                  >
                                    {msg.sender !== userData?.id &&
                                      msg.sender_photo && (
                                        <Image
                                          src={msg.sender_photo}
                                          alt={msg.sender_name || ''}
                                          width={36}
                                          height={36}
                                          className='rounded-full'
                                        />
                                      )}
                                    <div className='flex flex-col'>
                                      {msg.sender !== userData?.id && (
                                        <span className='mb-1 text-xs text-gray-400'>
                                          {msg.sender_name}
                                        </span>
                                      )}
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
                                          <div className='mt-2 flex flex-wrap gap-2'>
                                            {msg.reactions.map((r) => (
                                              <motion.span
                                                key={r.id}
                                                whileHover={{ scale: 1.1 }}
                                                className='cursor-pointer rounded-full bg-gray-600/50 px-2 py-1 text-xs'
                                                onClick={() =>
                                                  r.user === userData?.id &&
                                                  handleDeleteReaction(msg.id)
                                                }
                                              >
                                                {r.reaction === 'like'
                                                  ? '👍'
                                                  : r.reaction === 'love'
                                                    ? '❤️'
                                                    : r.reaction === 'laugh'
                                                      ? '😂'
                                                      : r.reaction === 'wow'
                                                        ? '😲'
                                                        : r.reaction === 'sad'
                                                          ? '😢'
                                                          : r.reaction ===
                                                              'angry'
                                                            ? '😠'
                                                            : r.reaction}
                                              </motion.span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className='mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                                        {[
                                          '👍',
                                          '❤️',
                                          '😂',
                                          '😲',
                                          '😢',
                                          '😠',
                                        ].map((emoji) => (
                                          <motion.button
                                            key={emoji}
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                            className='rounded-full p-1 hover:bg-gray-600/50'
                                            onClick={() =>
                                              handleReaction(msg.id, emoji)
                                            }
                                          >
                                            {emoji}
                                          </motion.button>
                                        ))}
                                        {msg.sender === userData?.id && (
                                          <motion.button
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                            className='rounded-full p-1 hover:bg-red-500/50'
                                            onClick={() =>
                                              handleDeleteMessage(msg.id)
                                            }
                                          >
                                            ґ
                                            <Trash2 className='h-4 w-4' />
                                          </motion.button>
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
                                placeholder='Type a message...'
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
    </motion.div>
  );
}
