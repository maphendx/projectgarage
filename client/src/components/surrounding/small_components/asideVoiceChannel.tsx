import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import fetchClient from '@/other/fetchClient';
import { SpeakerWaveIcon } from '@heroicons/react/24/solid';

type Channel = {
  id: number;
  name: string;
  participants_list?: {
    id: number;
    display_name: string;
    photo?: string;
  }[];
};

export default function AsideVoiceChannel() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetchClient(
          `${process.env.NEXT_PUBLIC_API_URL}/api/voice_channels/my-channels/`,
        );
        const data = await response.json();
        setChannels(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching voice channels:', error);
        setChannels([]);
      }
    };

    fetchChannels();
    const interval = setInterval(fetchChannels, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinChannel = (channelId: number) => {
    router.push('/voice');
  };

  return (
    <div className='space-y-2 p-2'>
      {Array.isArray(channels) &&
        channels.slice(0, 2).map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleJoinChannel(channel.id)}
            className='flex cursor-pointer items-center justify-between rounded-lg bg-[#FFFFFF0D] p-3 transition-all hover:bg-[#FFFFFF1A]'
          >
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[#6374B6]'>
                <SpeakerWaveIcon className='h-4 w-4 text-white' />
              </div>
              <div>
                <h4 className='text-sm font-medium text-white'>
                  {channel.name}
                </h4>
                <p className='text-xs text-gray-400'>
                  {channel.participants_list?.length || 0} учасників
                </p>
              </div>
            </div>

            {channel.participants_list &&
              channel.participants_list.length > 0 && (
                <div className='flex -space-x-2'>
                  {channel.participants_list
                    .slice(0, 3)
                    .map((participant, index) => (
                      <div
                        key={`participant-${channel.id}-${participant.id}`}
                        className='h-6 w-6 overflow-hidden rounded-full border-2 border-[#1C1C1F]'
                      >
                        {participant.photo ? (
                          <img
                            src={participant.photo}
                            alt={participant.display_name}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center bg-[#6374B6] text-[10px] text-white'>
                            {participant.display_name[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  {channel.participants_list.length > 3 && (
                    <div className='flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1C1C1F] bg-[#25252B] text-[10px] text-white'>
                      +{channel.participants_list.length - 3}
                    </div>
                  )}
                </div>
              )}
          </div>
        ))}

      {channels.length === 0 ? (
        <div className='text-center text-sm text-gray-400'>
          Немає доступних каналів
        </div>
      ) : (
        <button
          onClick={() => router.push('/voice')}
          className='mt-2 w-full rounded-lg bg-[#FFFFFF0D] p-2 text-sm text-gray-400 transition-all hover:bg-[#FFFFFF1A]'
        >
          {channels.length > 2
            ? `Показати ще ${channels.length - 2} каналів...`
            : 'Перейти до голосових каналів...'}
        </button>
      )}
    </div>
  );
}
