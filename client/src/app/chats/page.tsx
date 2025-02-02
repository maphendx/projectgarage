'use client';

import { useEffect, useState, useRef, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Plus, ArrowLeft, Send } from 'lucide-react';

import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import MusicPlayer from '@/components/surrounding/player';

//
// Types
//
type ChatRoom = {
  id: number;
  name: string;
  created_at: string;
  // Array of participant IDs (or you may adjust to include more info)
  participants: number[];
};

type Message = {
  id: number;
  chat: number;
  sender: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  timestamp: string;
};

type UserData = {
  id: number;
  username: string;
  display_name?: string;
  email: string;
};

//
// ChatPage Component
//
export default function ChatPage() {
  const router = useRouter();

  // Global states
  const [userData, setUserData] = useState<UserData | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showRoomList, setShowRoomList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  // States for room creation
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  // New input for participants: enter comma separated user IDs (e.g., "1,2,3")
  const [newRoomParticipants, setNewRoomParticipants] = useState('');

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Adjust layout for mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper: Get token-based headers
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

  // Helper: Make API requests
  const apiRequest = useCallback(
    async (url: string, method: string = 'GET', body?: any) => {
      const headers = getAuthHeaders();
      if (!headers) return null;
      try {
        const response = await fetch(url, {
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

  // Fetch user profile & chat rooms on load
  useEffect(() => {
    const loadInitialData = async () => {
      const userProfile = await apiRequest(
        'http://localhost:8000/api/users/profile/',
      );
      if (userProfile) {
        setUserData(userProfile);
      }

      const rooms = await apiRequest(
        'http://localhost:8000/api/messaging/chatrooms/',
      );
      if (rooms) {
        setChatRooms(rooms);
      }
      setIsLoading(false);
    };
    loadInitialData();
  }, [apiRequest]);

  // When a room is selected, fetch its messages and set up a WebSocket connection
  useEffect(() => {
    if (!selectedRoom || isLoading) return;

    const fetchMessages = async () => {
      const msgs = await apiRequest(
        `http://localhost:8000/api/messaging/messages/${selectedRoom.id}/`,
      );
      if (msgs) {
        setMessages(msgs);
        scrollToBottom();
      }
    };
    fetchMessages();

    // Open WebSocket connection to the room.
    // Note: if your WebSocket routing uses room name instead of id, adjust accordingly.
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${selectedRoom.id}/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Expecting JSON with message and sender fields.
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    };

    setWebSocket(ws);

    return () => {
      ws.close();
    };
  }, [selectedRoom, apiRequest, isLoading]);

  // Handle sending a new message
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !userData) return;

    try {
      // Add message to local state immediately for instant display
      const tempMessage: Message = {
        id: Date.now(), // temporary ID
        chat: selectedRoom.id,
        sender: userData.username,
        sender_name: userData.display_name || userData.username,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage('');
      scrollToBottom();

      // Send to server
      const messageData = {
        chat: selectedRoom.id,
        content: newMessage.trim(),
      };

      const response = await fetch(
        `http://localhost:8000/api/messaging/messages/${selectedRoom.id}/`,
        {
          method: 'POST',
          headers: getAuthHeaders() || {},
          body: JSON.stringify(messageData),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const createdMessage = await response.json();

      // Update the temporary message with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? {
                ...createdMessage,
                sender_name: userData.display_name || userData.username,
              }
            : msg,
        ),
      );

      // Send through WebSocket
      if (webSocket?.readyState === WebSocket.OPEN) {
        webSocket.send(
          JSON.stringify({
            message: newMessage.trim(),
            sender: userData.username,
            sender_name: userData.display_name || userData.username,
          }),
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message if sending failed
      setMessages((prev) => prev.filter((msg) => msg.id !== Date.now()));
      alert('Failed to send message. Please try again.');
    }
  };

  // Update WebSocket connection effect
  useEffect(() => {
    if (!selectedRoom || !userData) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${selectedRoom.id}/`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Add received message to messages list
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(), // temporary ID for new messages
            chat: selectedRoom.id,
            sender: data.sender,
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

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWebSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedRoom, userData]);

  // Handle room creation including participants selection
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    try {
      // Prepare participants array, including current user
      let participantsArray = newRoomParticipants
        ? newRoomParticipants
            .split(',')
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id))
        : [];

      const roomData = {
        name: newRoomName.trim(),
        participants: participantsArray,
      };

      console.log('Creating room with data:', roomData); // Debug log

      const headers = getAuthHeaders();
      if (!headers) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(
        'http://localhost:8000/api/messaging/chatrooms/',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(roomData),
        },
      );

      console.log('Server response status:', response.status); // Debug log

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create room');
      }

      console.log('Created room:', data); // Debug log

      // Update the chat rooms list with the new room
      setChatRooms((prevRooms) => [...prevRooms, data]);

      // Clear form and close modal
      setNewRoomName('');
      setNewRoomParticipants('');
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Error creating room:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create room. Please try again.',
      );
    }
  };

  // Render layout similar to your Home page layout
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
            Loading...
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

          {/* Main Layout */}
          <div className='flex flex-1 overflow-hidden'>
            {/* Left Sidebar */}
            <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
              <AsidePanelLeft />
            </aside>

            {/* Main Content */}
            <main className='flex-1 overflow-y-auto px-4 py-4'>
              <div className='min-h-[70vh] rounded-[30px] bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-lg'>
                <div className='flex flex-col md:flex-row md:gap-6'>
                  {/* Chat Rooms List */}
                  {(!isMobile || (isMobile && showRoomList)) && (
                    <motion.div className='w-full md:w-1/3 lg:w-1/4'>
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

                  {/* Chat Messages */}
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
                                {messages.map((msg) => (
                                  <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className={`mb-4 max-w-[80%] ${
                                      msg.sender === userData?.username
                                        ? 'ml-auto'
                                        : 'mr-auto'
                                    }`}
                                  >
                                    <div
                                      className={`rounded-xl p-3 ${
                                        msg.sender === userData?.username
                                          ? 'bg-[#6374B6] text-white'
                                          : 'bg-white/10 text-gray-200'
                                      }`}
                                    >
                                      <div className='mb-1 flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-xs uppercase'>
                                            {msg.sender_name?.[0] ||
                                              msg.sender[0]}
                                          </div>
                                          <span className='text-xs font-medium text-white'>
                                            {msg.sender_name || msg.sender}
                                          </span>
                                        </div>
                                        <span className='text-xs text-gray-400 opacity-70'>
                                          {new Date(
                                            msg.timestamp,
                                          ).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </div>
                                      <p className='text-sm text-white'>
                                        {msg.content}
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
                                  onChange={(e) =>
                                    setNewMessage(e.target.value)
                                  }
                                  className='flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none'
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
                  )}
                </div>
              </div>
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

          {/* Room Creation Modal */}
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
                  placeholder='ID учасників (через кому, напр.: 1,2,3)...'
                />{' '}
                <div className='flex justify-end gap-2'>
                  {' '}
                  <button
                    onClick={() => {
                      setShowCreateRoom(false);
                      setNewRoomName('');
                      setNewRoomParticipants('');
                    }}
                    className='rounded-lg px-4 py-2 text-white hover:bg-white/10'
                  >
                    {' '}
                    Скасувати{' '}
                  </button>{' '}
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
