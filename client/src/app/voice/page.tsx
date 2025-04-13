'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import { AsidePanelRight } from '@/components/surrounding/asideRight';
import { usePathname, useRouter } from 'next/navigation';
import {
  MicrophoneIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  PlusIcon,
  HashtagIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/solid';
import fetchClient, { refreshAccessToken } from '@/other/fetchClient';
import { useError } from '@/context/ErrorContext';
import { UserData } from '@/components/not_components';
import { PiPhoneDisconnectFill } from 'react-icons/pi';
import { PhoneIcon } from '@heroicons/react/20/solid';

type Channel = {
  id: number;
  name: string;
  participants?: string[];
  participants_list?: UserData[];
  creator?: UserData;
};

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export default function VoiceChatPage() {
  // ПОЧАТОК ВОЙСІВ
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [globalPeers, setGlobalPeers] = useState<{
    [key: string]: RTCPeerConnection;
  }>({});
  const [signalingChannel, setSignalingChannel] = useState<WebSocket | null>(
    null,
  );

  // рефи для закриття проги
  const localStreamRef = useRef<MediaStream | null>(null);
  const globalPeersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const signalingChannelRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    localStreamRef.current = localStream;
    globalPeersRef.current = globalPeers;
    signalingChannelRef.current = signalingChannel;
  }, [signalingChannel, globalPeers, localStream]);

  const endCall = () => {
    console.log('Закінчуємо дзвінок ❌');
    signalingChannelRef.current?.send(JSON.stringify({ type: 'leave' }));
    Object.values(globalPeersRef.current).forEach((elementus) => {
      elementus.onicecandidate = null;
      elementus.ontrack = null;
      elementus.oniceconnectionstatechange = null;
      elementus.close();
    });
    setGlobalPeers({});
    localStreamRef.current?.getTracks().forEach((track) => {
      if (track.kind === 'audio') track.stop();
    });
    setLocalStream(null);
    signalingChannelRef.current?.close();
    setSignalingChannel(null);
    setSelectedChannel(null);
    setIsMuted(false);
  };

  const startCall = async () => {
    playSound('start');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log(`НАШ СІГМА МІКРОФОН Є ${stream}`);
      setLocalStream(stream);

      ///
      console.log('🎤 Мікрофон отримано');
    } catch (error) {
      console.error('❌ Помилка отримання мікрофона:', error);
    }
  };

  const createPeerConnection = (userId: string, isInitiator: boolean) => {
    console.log('ПРОБУЮ З');
    console.log(`ЙОГО ВЕЛИЧ localStream зараз се є ${localStream}`);
    console.log(`ЙОГО ВЕЛИЧ signalingChannel зараз се є ${signalingChannel}`);

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302', // Безкоштовний STUN-сервер від Google
        },
        {
          urls: 'turn:turn.server.com:3478', // Це приклад TURN-сервера. Для Google STUN не потрібен TURN.
          username: 'user',
          credential: 'password',
        },
      ],
    });

    const peers = { ...globalPeers };
    peers[userId] = peerConnection;
    setGlobalPeers(peers);

    localStream
      ?.getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`В моменті канал є ${signalingChannel}`);
        signalingChannel?.send(
          JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
            to: userId,
          }),
        );
        console.log('📨 Надіслано кандидата');
      }
    };

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();

    peerConnection.ontrack = (event) => {
      const remoteAudio = document.createElement('audio');
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
      console.log('🔊 Відтворюємо аудіо від:', userId);
      playSound('happiness');

      const source = audioContext.createMediaStreamSource(event.streams[0]);
      source.connect(analyser);

      // Перевіряємо рівень звуку кожні 100 мс
      const checkAudioLevel = () => {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buffer);

        const volume =
          buffer.reduce((sum, val) => sum + val, 0) / buffer.length;
        if (!volume) return;

        console.log(`🎚️ Гучність користувача ${userId}:`, volume);
        setParticipants((prevParticipants) => {
          return prevParticipants.map((participant) => {
            if (`${participant.id}` === `${userId}`) {
              return { ...participant, talks: volume }; // Оновлюємо лише цей об'єкт
            }
            return participant; // Інші залишаються незмінними
          });
        });
      };

      setInterval(checkAudioLevel, 50);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('В пірах трапилось лайно');

      if (
        peerConnection.iceConnectionState === 'disconnected' ||
        peerConnection.iceConnectionState === 'failed' ||
        peerConnection.iceConnectionState === 'closed'
      ) {
        console.log(`❌ Користувач ${userId} відключився`);
        playSound('lost');
        peerConnection.close(); // Закриваємо підключення
        const peers = { ...globalPeers };
        delete peers[userId]; // Видаляємо користувача з мапи
        setGlobalPeers(peers);
      }
    };

    if (isInitiator) {
      peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          signalingChannel?.send(
            JSON.stringify({
              type: 'offer',
              offer: peerConnection.localDescription,
              to: userId,
            }),
          );
          console.log('📨 Надіслано offer');
        });
    }

    return peerConnection;
  };

  useEffect(() => {
    console.log('ПОТОЧНИЙ СТАН ПІДКЛЮЧЕНЬ:', JSON.stringify(globalPeers));
    updateUsers();
  }, [globalPeers]);

  useEffect(() => {
    if (!signalingChannel) {
      console.log('Канал веб-сокетів наразі не ініціалізовано...');
      return;
    }
    console.log(
      'Канал веб-сокетів успішно ініціалізовано. Ініціалізація обробників...',
    );

    signalingChannel.onopen = () => {
      signalingChannel.send(JSON.stringify({ type: 'join' }));
    };

    signalingChannel.onclose = () => {
      console.log('Сокет закрився');
    };
    // Обробка повідомлень WebSocket
    signalingChannel.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      console.log('📩 Отримане повідомлення:', data);

      if (data.type === 'user-list') {
        console.log('👥 Список користувачів:', data.users);

        // Видаляємо тих, кого більше немає в списку
        const peers: { [key: string]: RTCPeerConnection } = { ...globalPeers };
        Object.keys(peers).forEach((userId) => {
          if (!data.users.includes(userId)) {
            console.log(`❌ Користувач ${userId} зник, видаляємо`);
            peers[userId].close();
            delete peers[userId];
            setGlobalPeers(peers);
          }
        });

        data.users.forEach((userId: string) => {
          if (!peers[userId]) {
            createPeerConnection(userId, true);
          } else {
            console.log(`🔄 Користувач ${userId} вже є, перевіряємо стан...`);

            if (
              peers[userId].iceConnectionState === 'disconnected' ||
              peers[userId].iceConnectionState === 'failed' ||
              peers[userId].iceConnectionState === 'closed'
            ) {
              console.log(`♻️ Перестановлюємо з'єднання з ${userId}`);
              peers[userId].close();
              delete peers[userId];
              createPeerConnection(userId, true);
            }
          }
        });
      } else if (data.type === 'offer') {
        const newPeer = await createPeerConnection(data.from, false);
        await newPeer.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );
        const answer = await newPeer.createAnswer();
        await newPeer.setLocalDescription(answer);
        signalingChannel.send(
          JSON.stringify({ type: 'answer', answer, to: data.from }),
        );
        console.log('📨 Надіслано answer');
      } else if (data.type === 'answer') {
        await globalPeers[data.from].setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
        console.log('✅ Отримано answer');
      } else if (data.type === 'candidate') {
        await globalPeers[data.from].addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
        console.log('🎯 Отримано кандидата');
      } else if (data.type === 'request-status') {
        signalingChannel?.send(
          JSON.stringify({ type: 'mute-status', isMuted: isMuted }),
        );
      } else if (data.type === 'mute-status') {
        // Оновлюємо статус mute для конкретного користувача
        setParticipants((prevParticipants) => {
          return prevParticipants.map((participant) => {
            if (`${participant.id}` === `${data.from}`) {
              return { ...participant, muted: data.isMuted }; // Оновлюємо лише цей об'єкт
            }
            return participant; // Інші залишаються незмінними
          });
        });

        console.log(
          `Пацан під кодовим номером ${data.from} мікро перемкнув на ${data.isMuted}`,
        );
      } else if (data.type === 'leave') {
        console.log(
          `❌ Користувач ${data.from} вийшов (сам сказав), закриваємо з'єднання`,
        );
        playSound('goodbye');
        if (globalPeers[data.from]) {
          globalPeers[data.from].close();
          const peers = { ...globalPeers };
          delete peers[data.from];
          setGlobalPeers(peers);
        }
      }
    };
  }, [signalingChannel, globalPeers]);

  useEffect(() => {
    if (localStream) {
      console.log(
        'localStream успішно ініціалізовано! Запускаєм підключення до сокетів',
      );
      init();
      return () => signalingChannel?.close();
    } else {
      console.log('localStream не ініціалізовано...');
    }
  }, [localStream]);

  const init = async () => {
    if (selectedChannel) {
      const token = await refreshAccessToken();
      const abobaUrl = `${process.env.NEXT_PUBLIC_API_URL}`;
      const wsUrl = `${abobaUrl.replace(/^http/, 'ws').replace(/^https/, 'wss')}/ws/voice/${selectedChannel.id}/?token=${token}`;
      const webSocket = new WebSocket(wsUrl);
      setSignalingChannel(webSocket);
    } else {
      console.log('Канал не обрано, не можемо підключатись!');
    }
  };

  /*
    Порядок виконання при запуску такий:
    1. бомж клікає на кнопку, викликається startCall, 
    створюється аудіопотік і записується у стан.
    2. Щойно він проініціалізувався, викликається до нього хук,
    і якщо той звуковий потік записався ("if (localStream)"),
    то викликається функція init()
    3. Функція init створює підключення до веб-сокетів і записує у стан
    4. Щойно стан з підключенням до веб сокетів signalingChannel
    успішно записався туди, йому присвоюються обробники.
    ---
    При початку триндіння такий:
    1. Коли записувались обробники, обробник onopen надіслав пусте
    повідомлення з типом "join"
    2. Сервак, при такому повідомленні, назад нам же присилає
    список з id інших підключених дегенератів (окрім нас)
    (це є з типом "user-list")
    3. Ми, по одержанню такого типу, для кожного айді викликаємо
    createPeerConnection = (userId: string, isInitiator: boolean)
    де другий параметр відповідає за те, чи це ми то з'єднання почали
    встановлювати (true), чи це ми вже відповідаємо на чийсь offer
    (false)
    4. Далі між нами та іншими челами йде просто обмін offer, answer,
    та кандидатами (сервер з веб-сокетами - це просто пересильщик, він
    тільки надсилає повідомлення від одного до іншого, єдине що уточнюючи
    поле "from")
  */

  // КІНЕЦЬ ВОЙСІВ

  const router = useRouter();
  const { showError } = useError();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelParticipantsField, setNewChannelParticipantsField] =
    useState('');
  const [newChannelParticipants, setNewChannelParticipants] = useState<
    string[]
  >([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  const [participants, setParticipants] = useState<UserData[]>([]);

  // useEffect(() => {
  //   console.log(`Моніторимо бомжів: ${JSON.stringify(participants)}`)
  // }, [participants])

  const updateUsers = async () => {
    const existingUsersMap = new Map(
      participants.map((user) => [user.id, user]),
    );

    const users = await Promise.all(
      Object.keys(globalPeers).map(async (key) => {
        const data = await apiRequest(`/users/profile/${key}/`);
        data.id = +key;
        const existingUser = existingUsersMap.get(+key);
        if (existingUser) {
          return existingUser;
        } else {
          return data;
        }
      }),
    );
    setParticipants(users);
    signalingChannel?.send(JSON.stringify({ type: 'request-status' }));
  };

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
          ...(body && { body: body }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw Error(JSON.stringify(result));
        }
        return result;
      } catch (err) {
        if (err instanceof Error) {
          try {
            const obj = JSON.parse(err.message);
            if (typeof obj === 'object' && obj !== null) {
              const result = Object.values(obj).flat().join('\n');
              showError(result, 'error');
            } else {
              showError('Невідома помилка формату', 'error');
            }
          } catch (parseErr) {
            showError(err.message, 'error');
          }
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedChannel) {
      startCall();
    }
  }, [selectedChannel]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await apiRequest('/users/profile/');
      if (data) setUserData(data);
    };
    const fetchMyVoices = async () => {
      const data = await apiRequest('/voice_channels/my-channels/');
      if (data) setChannels(data);
    };
    fetchProfile();
    fetchMyVoices();
  }, [apiRequest]);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((element) => {
      element.enabled = isMuted;
    });
    signalingChannel?.send(
      JSON.stringify({ type: 'mute-status', isMuted: !isMuted }),
    );
    setIsMuted(!isMuted);
  };

  const handleAddUser = useCallback(() => {
    if (newChannelParticipantsField.trim()) {
      setNewChannelParticipants((prev) => {
        if (prev.includes(newChannelParticipantsField)) {
          showError('Користувач вже доданий!', 'warning');
          return prev;
        }
        if (
          userData &&
          userData.display_name &&
          userData.display_name === newChannelParticipantsField
        ) {
          showError(
            'Ви автоматично станете учасником, як отець войсу!',
            'warning',
          );
          return prev;
        }
        return [...prev, newChannelParticipantsField];
      });
      setNewChannelParticipantsField('');
    } else {
      showError("Вкажіть ім'я користувача для додавання!", 'warning');
    }
  }, [newChannelParticipantsField, showError]);

  const handleCreateChannel = async () => {
    if (newChannelName.trim()) {
      const newChannel = {
        name: newChannelName.trim(),
        participants: newChannelParticipants,
      };

      const createChannelRequest = await apiRequest(
        '/voice_channels/voice_channels/',
        'POST',
        JSON.stringify(newChannel),
      );
      if (createChannelRequest) {
        setChannels([...channels, createChannelRequest]);
        setNewChannelName('');
        setNewChannelParticipants([]);
        setIsCreatingChannel(false);
        showError('Голосовий канал успішно створено!', 'success');
      }
    } else {
      showError('Вкажіть назву для голосового каналу!', 'error');
    }
  };

  const handleDeleteChannel = async (id: number) => {
    const deleteChannelRequest = await apiRequest(
      `/voice_channels/voice_channels/${id}/`,
      'DELETE',
    );
    if (deleteChannelRequest) {
      setChannels((prev) => prev.filter((elementus) => id !== elementus.id));
      showError('Голосовий канал успішно видалено!', 'success');
      if (selectedChannel && selectedChannel.id === id) {
        setSelectedChannel(null);
      }
    }
  };

  function numberToGrayHex(num: number, other: string) {
    // Перетворюємо в ціле число та обмежуємо межами від 0 до 255
    num = Math.min(255, Math.max(0, Math.round(Number(num))));

    // Перетворюємо число в HEX і додаємо "0" спереду, якщо потрібно
    const hexValue = num.toString(16).padStart(2, '0');

    // Формуємо сірий колір, де всі компоненти (R, G, B) однакові
    return `#${other}${hexValue}${other}`;
  }

  const playSound = (name: string) => {
    const audio = new Audio(`/sounds/${name}.mp3`); // Вказуємо шлях до звуку
    audio.play(); // Відтворюємо звук
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
                <div className='flex'>
                  <input
                    type='text'
                    value={newChannelParticipantsField}
                    onChange={(e) =>
                      setNewChannelParticipantsField(e.target.value)
                    }
                    placeholder='Користувач'
                    className='mb-2 w-full rounded bg-[#25252B] p-2 text-white'
                  />
                  <button
                    onClick={handleAddUser}
                    className='mb-2 ml-2 flex-1 rounded bg-[#6374B6] p-1 hover:bg-opacity-70'
                  >
                    <i className='fa-solid fa-plus text-[#25252B]'></i>
                  </button>
                </div>
                {newChannelParticipants.map((participant, key) => (
                  <div
                    key={key}
                    className='mb-2 flex w-full rounded bg-[#25252B] p-2 text-white'
                  >
                    <p className='w-full'>{participant}</p>
                    <button
                      onClick={() =>
                        setNewChannelParticipants((prev) =>
                          prev.filter((elmt, elmt_key) => elmt_key !== key),
                        )
                      }
                    >
                      <i className='fas fa-times text-[#6374B6]'></i>
                    </button>
                  </div>
                ))}
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
              {channels.map((channel, key) => (
                <div className='flex' key={key}>
                  <motion.button
                    onClick={() => setSelectedChannel(channel)}
                    className={`flex w-full items-center justify-between rounded-lg p-3 ${
                      selectedChannel &&
                      selectedChannel.id &&
                      selectedChannel.id === channel.id
                        ? 'bg-[#6374B6]'
                        : 'bg-[#25252B] hover:bg-[#2D2D35]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className='flex items-center gap-2'>
                      <HashtagIcon className='h-4 w-4 text-[#6374B6]' />
                      <span>{channel?.name}</span>
                    </div>
                  </motion.button>
                  {userData &&
                    channel.creator &&
                    channel.id &&
                    userData.display_name === channel.creator.display_name && (
                      <button
                        onClick={(e) => handleDeleteChannel(channel.id)}
                        className='ml-2 rounded bg-[#6374B6] p-2 hover:bg-opacity-70'
                      >
                        <i className='fas fa-times text-[#2D2D35]'></i>
                      </button>
                    )}
                </div>
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
                {selectedChannel.participants_list?.length} загалом
              </p>
              <p className='text-green-600'>
                {participants.length + 1} підключено
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
              {participants.map((user, key) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className='relative flex flex-col items-center rounded-2xl bg-[#1E1E24] p-4'
                >
                  <div className='relative'>
                    <div
                      style={{
                        borderColor: user.talks
                          ? numberToGrayHex(user.talks * 10, '00')
                          : '#000000',
                        boxShadow: `0 4px 20px rgba(0, ${user.talks ? user.talks * 10 : 0}, 0, 0.75)`,
                      }}
                      className={`h-20 w-20 overflow-hidden rounded-full border-4 bg-[#2D2D35]`}
                    >
                      {user.photo && (
                        <img
                          src={user.photo}
                          className='h-full w-full object-cover'
                        />
                      )}
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
                    {user.display_name}
                  </h3>
                  {user.photo && (
                    <motion.div
                      style={{
                        borderColor: `${user.talks ? numberToGrayHex(user.talks * 10, 'AA') : '#4A004A'}`,
                      }}
                      className='absolute inset-0 rounded-2xl border-2'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {selectedChannel && (
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
                  className='rounded-full bg-red-500 p-4 transition-colors'
                  onClick={() => {
                    endCall();
                    playSound('end');
                  }}
                >
                  Вийти
                </motion.button>

                {/* <motion.button
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
              </motion.button> */}
              </div>
            </div>
          )}
        </main>

        <aside className='sticky top-0 hidden h-screen w-80 flex-shrink-0 border-l border-[#2D2D35] bg-[#1C1C1F] lg:block'>
          <AsidePanelRight />
        </aside>
      </div>
    </motion.div>
  );
}
