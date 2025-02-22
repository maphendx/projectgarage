// components/AudioPlayer.tsx
import { useError } from '@/context/ErrorContext';
import { useState } from 'react';

interface AudioPlayerProps {
  audioSrc: string; // Джерело аудіофайлу (URL)
  key?: number;
}

const MiniPlayer: React.FC<AudioPlayerProps> = ({ audioSrc, key }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useState(new Audio(audioSrc))[0]; // Створюємо аудіо-елемент
  const { showError } = useError();

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        audioRef.pause();
      } else {
        await audioRef.play();
      }
      setIsPlaying(!isPlaying); // Перемикаємо стан плеєра
    } catch (ex) {
      if (ex instanceof DOMException && ex.name === 'NotSupportedError') {
        showError(`Помилка відтворення: ${ex}`);
      } else {
        throw ex;
      }
    }
  };

  return (
    <div key={key} className='audio-player'>
      <button onClick={togglePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <div>
        <span>{isPlaying ? 'Playing' : 'Paused'}</span>
      </div>
    </div>
  );
};

export default MiniPlayer;
