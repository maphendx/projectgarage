// components/AudioPlayer.tsx
import { useState } from 'react';

interface AudioPlayerProps {
  audioSrc: string;  // Джерело аудіофайлу (URL)
}

const MiniPlayer: React.FC<AudioPlayerProps> = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useState(new Audio(audioSrc))[0]; // Створюємо аудіо-елемент

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(!isPlaying);  // Перемикаємо стан плеєра
  };

  return (
    <div className="audio-player">
      <button onClick={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div>
        <span>{isPlaying ? 'Playing' : 'Paused'}</span>
      </div>
    </div>
  );
};

export default MiniPlayer;
