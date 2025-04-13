import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Play, Pause, Download, ListPlus } from 'lucide-react';
import Image from 'next/image';
import { PlayerContext } from '@/components/surrounding/player';

interface Song {
  id: string;
  task_id: string;
  audio_id?: string;
  model_name: string;
  title: string;
  audio_file: string;
  photo_file: string;
  created_at: string;
  is_public: boolean;
}

interface SongCardProps {
  song: Song;
  isUserSong: boolean;
  onToggleVisibility?: () => void;
  onDownloadWav?: () => void;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isUserSong,
  onToggleVisibility,
  onDownloadWav,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const playerContext = useContext(PlayerContext);
  
  // Check if this song is currently playing
  const isPlaying = playerContext.isPlaying && 
                   playerContext.currentSong?.id === song.id;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Play the song using the global player
  const handlePlayClick = () => {
    const songMetadata = {
      id: song.id,
      title: song.title,
      artist: song.model_name,
      audio_file: song.audio_file,
      photo_file: song.photo_file
    };
    
    playerContext.playSong(songMetadata);
  };
  
  // Add the song to the queue
  const handleAddToQueue = () => {
    const songMetadata = {
      id: song.id,
      title: song.title,
      artist: song.model_name,
      audio_file: song.audio_file,
      photo_file: song.photo_file
    };
    
    playerContext.addToQueue(songMetadata);
  };

  return (
    <motion.div
      className="overflow-hidden rounded-xl bg-[#2D2D35] shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full">
        {song.photo_file ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL}/media/${song.photo_file}`}
            alt={song.title}
            fill
            className="object-cover transition-transform duration-300"
            style={{ 
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-[#3C4B84] to-[#5B6EAE]">
            <span className="text-4xl">🎵</span>
          </div>
        )}
        
        {/* Play/Pause Button Overlay */}
        <motion.button
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered || isPlaying ? 1 : 0 }}
          onClick={handlePlayClick}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6374B6] text-white shadow-lg">
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 pl-1" />
            )}
          </div>
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 text-lg font-bold text-white">{song.title}</h3>
        <p className="text-sm text-gray-400">{song.model_name}</p>
        <p className="mt-1 text-xs text-gray-500">{formatDate(song.created_at)}</p>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-between">
          {isUserSong && onToggleVisibility && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 rounded-lg bg-[#3C4B84] px-3 py-1 text-sm text-white transition-colors hover:bg-[#6374B6]"
              onClick={onToggleVisibility}
            >
              {song.is_public ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Приватна</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Публічна</span>
                </>
              )}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 rounded-lg bg-[#3C4B84] px-3 py-1 text-sm text-white transition-colors hover:bg-[#6374B6]"
            onClick={handleAddToQueue}
          >
            <ListPlus className="h-4 w-4" />
            <span>У чергу</span>
          </motion.button>

          {isUserSong && onDownloadWav && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 rounded-lg bg-[#3C4B84] px-3 py-1 text-sm text-white transition-colors hover:bg-[#6374B6]"
              onClick={onDownloadWav}
            >
              <Download className="h-4 w-4" />
              <span>WAV</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SongCard;