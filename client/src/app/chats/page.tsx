'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Plus,
  Search,
  Send,
  Smile,
  X,
  Users,
  Settings,
  Edit,
  Trash2,
  MoreVertical,
  Heart,
  ThumbsUp,
  Laugh
} from 'lucide-react';

import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { UserData } from '@/components/not_components';
import { useError } from '@/context/ErrorContext';
import fetchClient, { refreshAccessToken } from '@/other/fetchClient';
import EmojiPicker from 'emoji-picker-react';
import { stringify } from 'querystring';

// Types
interface ChatRoom {
  id: number;
  name: string;
  avatar?: string | null;
  participants: UserData[];
  created_at: string;
}

interface Message {
  id: number;
  content: string;
  timestamp: string;
  sender: UserData;
  chat: number;
  parent?: number | null;
  reactions: Reaction[];
}

interface Reaction {
  id: number;
  message: number;
  user: number;
  reaction: string;
  created_at: string;
}

interface EmojiData {
  id: string;
  name: string;
  emoji: string;
  unicode: string;
}

// Main component
const ChatPage: React.FC = () => {
  const router = useRouter();
  const { showError } = useError();
  
  // User data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat state
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emojis, setEmojis] = useState<EmojiData[]>([]);
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditAvatarModal, setShowEditAvatarModal] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState<number | null>(null);
  
  // Form data
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomParticipants, setNewRoomParticipants] = useState<string[]>([]);
  const [newParticipantField, setNewParticipantField] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  
  // Fetch user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/`);
        if (!response.ok) throw new Error('Failed to fetch user profile');
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        showError('Failed to load user profile');
        // Redirect to login if unauthorized
        if (error instanceof Error && error.message.includes('401')) {
          router.push('/auth');
        }
      }
    };
    
    fetchUserProfile();
  }, [router, showError]);

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    if (!userData) return;
    
    try {
      setIsLoading(true);
      const response = await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/messaging/chatrooms/`);
      
      if (!response.ok) throw new Error('Failed to fetch chat rooms');
      
      const data = await response.json();
      setChatRooms(data);
      
      // Select first room if none selected
      if (data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0]);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      showError('Failed to load chat rooms');
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch messages for selected room
  const fetchMessages = async () => {
    if (!selectedRoom) return;
    
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/messages/${selectedRoom.id}/`
      );
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showError('Failed to load messages');
    }
  }

  // Fetch available emojis
  const fetchEmojis = async () => {
    try {
      const response = await fetchClient(`${process.env.NEXT_PUBLIC_API_URL}/api/messaging/emoji/`);
      
      if (!response.ok) throw new Error('Failed to fetch emojis');
      
      const data = await response.json();
      setEmojis(data);
    } catch (error) {
      console.error('Error fetching emojis:', error);
      // Non-critical, so no error shown
    }
  };

  // Initialize websocket connection
  const initializeWebSocket = async () => {
    if (!selectedRoom || webSocketRef.current) return;
    
    try {
      // Get fresh token
      const token = await refreshAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${baseUrl.replace(/^https?:\/\//, '')}/ws/chat/${selectedRoom.id}/?token=${token}`;
      console.log("WebSocket URL:", wsUrl);
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle incoming message
        if (data.message) {
          setMessages(prev => [
            ...prev, 
            {
              id: Date.now(), // Temporary ID until refresh
              content: data.message,
              timestamp: new Date().toISOString(),
              sender: {
                id: -1, // Placeholder
                display_name: data.sender,
                photo: data.sender_photo || ''
              },
              chat: selectedRoom.id,
              reactions: []
            }
          ]);
          
          scrollToBottom();
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        webSocketRef.current = null;
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        showError('WebSocket connection error');
      };
      
      webSocketRef.current = socket;
      
      // Clean up when component unmounts
      return () => {
        socket.close();
        webSocketRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      showError('Failed to connect to chat server');
    }
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial data
  const prevUserData = useRef(userData);
  useEffect(() => {
    if (!userData || JSON.stringify(prevUserData.current) === JSON.stringify(userData)) return;

    console.log(`\nuserData ${JSON.stringify(userData)}\nchatRooms ${chatRooms} emojis ${emojis}`)
    if (userData) {
      fetchChatRooms();
      fetchEmojis();
    }
    prevUserData.current = userData;
  }, [userData]);
 
  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom && !webSocketRef.current) {
      fetchMessages();
      initializeWebSocket();
    }
    
    // Clean up WebSocket on room change
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [selectedRoom]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/messages/${selectedRoom.id}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newMessage }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to send message');
      
      // Clear input after send
      setNewMessage('');
      
      // Optionally refresh messages to get server-side data
      // fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  };

  // Create a new chat room
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      showError('Room name is required');
      return;
    }
    
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/chatrooms/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newRoomName,
            participants_display_names: newRoomParticipants
          }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to create chat room');
      
      // Reset form and close modal
      setNewRoomName('');
      setNewRoomParticipants([]);
      setShowCreateRoomModal(false);
      
      // Refresh chat room list
      fetchChatRooms();
      showError('Chat room created successfully', 'success');
    } catch (error) {
      console.error('Error creating chat room:', error);
      showError('Failed to create chat room');
    }
  };

  // Add user to chat room
  const handleAddUser = async () => {
    if (!selectedRoom) return;
    
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/chatrooms/${selectedRoom.id}/add_user/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_display_names: newRoomParticipants
          }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to add users to chat room');
      
      // Reset form and close modal
      setNewRoomParticipants([]);
      setShowAddUserModal(false);
      
      // Refresh chat room data
      fetchChatRooms();
      showError('Users added successfully', 'success');
    } catch (error) {
      console.error('Error adding users to chat room:', error);
      showError('Failed to add users to chat room');
    }
  };

  // Update chat room avatar
  const handleUpdateAvatar = async () => {
    if (!selectedRoom || !avatarFile) return;
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/chatrooms/${selectedRoom.id}/avatar/`,
        {
          method: 'PATCH',
          body: formData,
        }
      );
      
      if (!response.ok) throw new Error('Failed to update avatar');
      
      // Reset form and close modal
      setAvatarFile(null);
      setAvatarPreview(null);
      setShowEditAvatarModal(false);
      
      // Refresh chat room data
      fetchChatRooms();
      showError('Avatar updated successfully', 'success');
    } catch (error) {
      console.error('Error updating avatar:', error);
      showError('Failed to update avatar');
    }
  };

  // Delete chat room
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    if (!confirm('Are you sure you want to delete this chat room?')) return;
    
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/chatrooms/${selectedRoom.id}/`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete chat room');
      
      // Reset selected room and close menu
      setSelectedRoom(null);
      setShowRoomMenu(false);
      
      // Refresh chat room list
      fetchChatRooms();
      showError('Chat room deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting chat room:', error);
      showError('Failed to delete chat room');
    }
  };

  // Add reaction to message
  const handleAddReaction = async (messageId: number, reaction: string) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/messages/${messageId}/reaction/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reaction }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to add reaction');
      
      // Close reaction menu
      setShowReactionMenu(null);
      
      // Refresh messages to show updated reactions
      fetchMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
      showError('Failed to add reaction');
    }
  };

  // Remove reaction from message
  const handleRemoveReaction = async (messageId: number) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/messages/${messageId}/reaction/`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) throw new Error('Failed to remove reaction');
      
      // Refresh messages to show updated reactions
      fetchMessages();
    } catch (error) {
      console.error('Error removing reaction:', error);
      showError('Failed to remove reaction');
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messaging/messages/${messageId}/delete/`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      // Remove message from state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      showError('Message deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Failed to delete message');
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter chat rooms by search query
  const filteredChatRooms = chatRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 border-r border-gray-800 bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        <div className='flex flex-1'>
          {/* Chat List Sidebar */}
          <div className='w-80 border-r border-gray-800 bg-[#25252B]'>
            <div className='flex h-full flex-col'>
              {/* Search and Create Room */}
              <div className='p-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-xl font-bold'>Chat Rooms</h2>
                  <button 
                    onClick={() => setShowCreateRoomModal(true)}
                    className='rounded-full bg-[#3C4B84] p-2 text-white hover:bg-[#6374B6]'
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className='mt-4 relative'>
                  <input
                    type='text'
                    placeholder='Search chats...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full rounded-lg bg-[#1C1C1F] py-2 pl-8 pr-4 text-white placeholder-gray-400'
                  />
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-400' />
                </div>
              </div>

              {/* Chat Rooms List */}
              <div className='flex-1 overflow-y-auto'>
                {isLoading ? (
                  <div className='flex items-center justify-center p-8'>
                    <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#6374B6] border-t-transparent'></div>
                  </div>
                ) : filteredChatRooms.length > 0 ? (
                  <div className='space-y-1 p-2'>
                    {filteredChatRooms.map((room) => (
                      <motion.div
                        key={room.id}
                        className={`flex cursor-pointer items-center rounded-lg p-3 transition-colors ${
                          selectedRoom?.id === room.id 
                            ? 'bg-[#3C4B84]' 
                            : 'hover:bg-[#2D2D35]'
                        }`}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className='relative h-12 w-12 flex-shrink-0'>
                          {room.avatar ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_URL}/media/${room.avatar}`}
                              alt={room.name}
                              width={48}
                              height={48}
                              className='h-full w-full rounded-full object-cover'
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center rounded-full bg-[#6374B6] text-lg font-semibold'>
                              {room.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className='ml-3 flex-1 overflow-hidden'>
                          <div className='flex items-center justify-between'>
                            <h3 className='truncate font-medium text-white'>{room.name}</h3>
                          </div>
                          <p className='truncate text-sm text-gray-400'>
                            {room.participants.length} participants
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className='flex items-center justify-center p-8 text-gray-400'>
                    {searchQuery ? 'No matching chat rooms' : 'No chat rooms yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Main Area */}
          <div className='flex flex-1 flex-col'>
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className='flex items-center justify-between border-b border-gray-800 bg-[#2D2D35] p-4'>
                  <div className='flex items-center'>
                    <div className='relative h-10 w-10 flex-shrink-0'>
                      {selectedRoom.avatar ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_URL}/media/${selectedRoom.avatar}`}
                          alt={selectedRoom.name}
                          width={40}
                          height={40}
                          className='h-full w-full rounded-full object-cover'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center rounded-full bg-[#6374B6] text-md font-semibold'>
                          {selectedRoom.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className='ml-3'>
                      <h3 className='font-medium text-white'>{selectedRoom.name}</h3>
                      <p className='text-xs text-gray-400'>
                        {selectedRoom.participants.length} participants
                      </p>
                    </div>
                  </div>
                  <div className='relative'>
                    <button
                      onClick={() => setShowRoomMenu(!showRoomMenu)}
                      className='rounded-full p-2 hover:bg-[#3C3C46]'
                    >
                      <MoreVertical size={20} className='text-gray-400' />
                    </button>
                    
                    {/* Room Menu */}
                    {showRoomMenu && (
                      <div className='absolute right-0 top-full z-10 mt-1 w-48 rounded-md bg-[#2D2D35] shadow-lg'>
                        <div className='py-1'>
                          <button
                            onClick={() => {
                              setShowAddUserModal(true);
                              setShowRoomMenu(false);
                            }}
                            className='flex w-full items-center px-4 py-2 text-left text-sm text-white hover:bg-[#3C3C46]'
                          >
                            <Users size={16} className='mr-2' />
                            Add Participants
                          </button>
                          <button
                            onClick={() => {
                              setShowEditAvatarModal(true);
                              setShowRoomMenu(false);
                            }}
                            className='flex w-full items-center px-4 py-2 text-left text-sm text-white hover:bg-[#3C3C46]'
                          >
                            <Edit size={16} className='mr-2' />
                            Change Avatar
                          </button>
                          <button
                            onClick={handleDeleteRoom}
                            className='flex w-full items-center px-4 py-2 text-left text-sm text-red-500 hover:bg-[#3C3C46]'
                          >
                            <Trash2 size={16} className='mr-2' />
                            Delete Room
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Container */}
                <div 
                  ref={messageContainerRef}
                  className='flex-1 overflow-y-auto p-4'
                  style={{ maxHeight: 'calc(100vh - 92px - 64px - 80px)' }}
                >
                  {messages.length === 0 ? (
                    <div className='flex h-full items-center justify-center text-gray-400'>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {messages.map((message) => {
                        const isMyMessage = message.sender.id === userData?.id;
                        
                        return (
                          <div 
                            key={message.id}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`relative max-w-3/4 ${isMyMessage ? 'order-2' : 'order-1'}`}>
                              {!isMyMessage && (
                                <div className='absolute -left-12 top-0'>
                                  {message.sender.photo ? (
                                    <Image
                                      src={message.sender.photo}
                                      alt={message.sender.display_name || ''}
                                      width={32}
                                      height={32}
                                      className='h-8 w-8 rounded-full'
                                    />
                                  ) : (
                                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[#6374B6] text-xs font-semibold'>
                                      {message.sender.display_name?.substring(0, 2).toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div
                                className={`relative rounded-lg p-3 ${
                                  isMyMessage 
                                    ? 'rounded-tr-none bg-[#6374B6]' 
                                    : 'rounded-tl-none bg-[#3C3C46]'
                                }`}
                              >
                                {!isMyMessage && (
                                  <p className='mb-1 text-xs font-semibold text-gray-300'>
                                    {message.sender.display_name}
                                  </p>
                                )}
                                
                                <p className='whitespace-pre-wrap break-words text-white'>
                                  {message.content}
                                </p>
                                
                                <div className='mt-1 flex items-center justify-between text-xs text-gray-300'>
                                  <span>{formatTime(message.timestamp)}</span>
                                </div>
                                
                                {/* Reaction container */}
                                {message.reactions && message.reactions.length > 0 && (
                                  <div className='mt-2 flex flex-wrap gap-1'>
                                    {message.reactions.map((reaction) => (
                                      <span 
                                        key={reaction.id}
                                        className='inline-flex items-center rounded-full bg-[#2D2D35] px-2 py-1 text-xs'
                                      >
                                        {reaction.reaction} 1
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Reaction button */}
                                <div className='absolute -bottom-3 right-2'>
                                  <button
                                    onClick={() => setShowReactionMenu(
                                      showReactionMenu === message.id ? null : message.id
                                    )}
                                    className='rounded-full bg-[#2D2D35] p-1 text-gray-400 hover:bg-[#3C3C46] hover:text-white'
                                  >
                                    <Smile size={14} />
                                  </button>
                                  
                                  {/* Reaction picker */}
                                  {showReactionMenu === message.id && (
                                    <div className='absolute bottom-8 right-0 z-10 flex rounded-full bg-[#2D2D35] p-1'>
                                      <button 
                                        onClick={() => handleAddReaction(message.id, 'like')}
                                        className='rounded-full p-1 hover:bg-[#3C3C46]'
                                      >
                                        <ThumbsUp size={16} className='text-blue-400' />
                                      </button>
                                      <button 
                                        onClick={() => handleAddReaction(message.id, 'love')}
                                        className='rounded-full p-1 hover:bg-[#3C3C46]'
                                      >
                                        <Heart size={16} className='text-red-400' />
                                      </button>
                                      <button 
                                        onClick={() => handleAddReaction(message.id, 'laugh')}
                                        className='rounded-full p-1 hover:bg-[#3C3C46]'
                                      >
                                        <Laugh size={16} className='text-yellow-400' />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Ref for scrolling to bottom */}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className='border-t border-gray-800 bg-[#2D2D35] p-4'>
                  <div className='flex items-center'>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className='mr-3 rounded-full p-2 text-gray-400 hover:bg-[#3C3C46] hover:text-white'
                    >
                      <Smile size={20} />
                    </button>
                    
                    <div className='relative flex-1'>
                      <input
                        type='text'
                        placeholder='Type a message...'
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className='w-full rounded-full bg-[#1C1C1F] py-2 pl-4 pr-10 text-white placeholder-gray-400'
                      />
                      
                      {/* Emoji picker */}
                      {showEmojiPicker && (
                        <div className='absolute bottom-12 left-0 z-20'>
                          <EmojiPicker
                            onEmojiClick={(emojiObject) => {
                              setNewMessage(prev => prev + emojiObject.emoji);
                              setShowEmojiPicker(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className='ml-3 rounded-full bg-[#6374B6] p-2 text-white hover:bg-opacity-90 disabled:bg-opacity-50'
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex h-full items-center justify-center'>
                <div className='text-center'>
                  <h3 className='text-xl font-medium text-gray-400'>Select a chat room or create a new one</h3>
                  <button
                    onClick={() => setShowCreateRoomModal(true)}
                    className='mt-4 rounded-lg bg-[#6374B6] px-4 py-2 text-white'
                  >
                    Create New Chat Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoomModal && (
          <motion.div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='w-full max-w-md rounded-lg bg-[#2D2D35] p-6'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold'>Create New Chat Room</h2>
                <button
                  onClick={() => setShowCreateRoomModal(false)}
                  className='rounded-full p-1 text-gray-400 hover:bg-[#3C3C46] hover:text-white'
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className='mb-4'>
                <label className='mb-2 block text-sm font-medium text-gray-300'>
                  Room Name
                </label>
                <input
                  type='text'
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder='Enter room name'
                  className='w-full rounded-lg bg-[#1C1C1F] p-2 text-white placeholder-gray-400'
                />
              </div>
              
              <div className='mb-4'>
                <label className='mb-2 block text-sm font-medium text-gray-300'>
                  Add Participants
                </label>
                <div className='mb-2 flex'>
                  <input
                    type='text'
                    value={newParticipantField}
                    onChange={(e) => setNewParticipantField(e.target.value)}
                    placeholder='Enter display name'
                    className='flex-1 rounded-l-lg bg-[#1C1C1F] p-2 text-white placeholder-gray-400'
                  />
                  <button
                    onClick={() => {
                      if (newParticipantField.trim()) {
                        setNewRoomParticipants([...newRoomParticipants, newParticipantField.trim()]);
                        setNewParticipantField('');
                      }
                    }}
                    className='rounded-r-lg bg-[#6374B6] px-4 text-white'
                  >
                    Add
                  </button>
                </div>
                
                {/* Participants list */}
                {newRoomParticipants.length > 0 && (
                  <div className='mb-4 flex flex-wrap gap-2'>
                    {newRoomParticipants.map((participant, index) => (
                      <div 
                        key={index}
                        className='flex items-center rounded-full bg-[#3C3C46] px-3 py-1 text-sm'
                      >
                        <span>{participant}</span>
                        <button
                          onClick={() => setNewRoomParticipants(
                            newRoomParticipants.filter((_, i) => i !== index)
                          )}
                          className='ml-2 text-gray-400 hover:text-white'
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowCreateRoomModal(false)}
                  className='rounded-lg border border-gray-600 px-4 py-2 text-white'
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  className='rounded-lg bg-[#6374B6] px-4 py-2 text-white'
                >
                  Create Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && selectedRoom && (
          <motion.div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='w-full max-w-md rounded-lg bg-[#2D2D35] p-6'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold'>Add Participants to {selectedRoom.name}</h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className='rounded-full p-1 text-gray-400 hover:bg-[#3C3C46] hover:text-white'
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className='mb-4'>
                <label className='mb-2 block text-sm font-medium text-gray-300'>
                  Add Participants
                </label>
                <div className='mb-2 flex'>
                  <input
                    type='text'
                    value={newParticipantField}
                    onChange={(e) => setNewParticipantField(e.target.value)}
                    placeholder='Enter display name'
                    className='flex-1 rounded-l-lg bg-[#1C1C1F] p-2 text-white placeholder-gray-400'
                  />
                  <button
                    onClick={() => {
                      if (newParticipantField.trim()) {
                        setNewRoomParticipants([...newRoomParticipants, newParticipantField.trim()]);
                        setNewParticipantField('');
                      }
                    }}
                    className='rounded-r-lg bg-[#6374B6] px-4 text-white'
                  >
                    Add
                  </button>
                </div>
                
                {/* Participants list */}
                {newRoomParticipants.length > 0 && (
                  <div className='mb-4 flex flex-wrap gap-2'>
                    {newRoomParticipants.map((participant, index) => (
                      <div 
                        key={index}
                        className='flex items-center rounded-full bg-[#3C3C46] px-3 py-1 text-sm'
                      >
                        <span>{participant}</span>
                        <button
                          onClick={() => setNewRoomParticipants(
                            newRoomParticipants.filter((_, i) => i !== index)
                          )}
                          className='ml-2 text-gray-400 hover:text-white'
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Current participants */}
                <div className='mt-4'>
                  <h3 className='mb-2 text-sm font-medium text-gray-300'>Current Participants</h3>
                  <div className='max-h-28 overflow-y-auto rounded-lg bg-[#1C1C1F] p-2'>
                    {selectedRoom.participants.map((participant) => (
                      <div 
                        key={participant.id}
                        className='mb-1 flex items-center rounded px-2 py-1 hover:bg-[#3C3C46]'
                      >
                        {participant.photo ? (
                          <Image
                            src={participant.photo}
                            alt={participant.display_name || ''}
                            width={24}
                            height={24}
                            className='mr-2 h-6 w-6 rounded-full'
                          />
                        ) : (
                          <div className='mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#6374B6] text-xs'>
                            {participant.display_name?.substring(0, 2).toUpperCase() || '?'}
                          </div>
                        )}
                        <span className='text-sm text-gray-300'>{participant.display_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className='rounded-lg border border-gray-600 px-4 py-2 text-white'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={newRoomParticipants.length === 0}
                  className='rounded-lg bg-[#6374B6] px-4 py-2 text-white disabled:bg-opacity-50'
                >
                  Add Participants
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Avatar Modal */}
      <AnimatePresence>
        {showEditAvatarModal && selectedRoom && (
          <motion.div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='w-full max-w-md rounded-lg bg-[#2D2D35] p-6'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold'>Change Room Avatar</h2>
                <button
                  onClick={() => {
                    setShowEditAvatarModal(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className='rounded-full p-1 text-gray-400 hover:bg-[#3C3C46] hover:text-white'
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className='mb-4'>
                <div className='mb-4 flex justify-center'>
                  <div className='relative h-32 w-32 overflow-hidden rounded-full'>
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt='Avatar Preview'
                        layout='fill'
                        objectFit='cover'
                      />
                    ) : selectedRoom.avatar ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/media/${selectedRoom.avatar}`}
                        alt={selectedRoom.name}
                        layout='fill'
                        objectFit='cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-[#6374B6] text-4xl font-semibold'>
                        {selectedRoom.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className='flex justify-center'>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='rounded-lg bg-[#3C3C46] px-4 py-2 text-white'
                  >
                    Choose File
                  </button>
                  <input 
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleAvatarChange}
                    className='hidden'
                  />
                </div>
              </div>
              
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => {
                    setShowEditAvatarModal(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className='rounded-lg border border-gray-600 px-4 py-2 text-white'
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAvatar}
                  disabled={!avatarFile}
                  className='rounded-lg bg-[#6374B6] px-4 py-2 text-white disabled:bg-opacity-50'
                >
                  Save Avatar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatPage;