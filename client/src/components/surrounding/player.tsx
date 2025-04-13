'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Shuffle,
  ChevronUp,
  ChevronDown, 
  Clock
} from 'lucide-react';
import Image from 'next/image';

// Types for player
interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  audio_file: string;
  photo_file: string;
  duration?: number;
}

// Enhanced player context to include volume control
export const PlayerContext = React.createContext<{
  currentSong: SongMetadata | null;
  isPlaying: boolean;
  queue: SongMetadata[];
  volume: number;
  isMuted: boolean;
  playSong: (song: SongMetadata) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  addToQueue: (song: SongMetadata) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}>({
  currentSong: null,
  isPlaying: false,
  queue: [],
  volume: 0.7,
  isMuted: false,
  playSong: () => {},
  togglePlay: () => {},
  nextSong: () => {},
  prevSong: () => {},
  addToQueue: () => {},
  setVolume: () => {},
  toggleMute: () => {},
  audioRef: { current: null },
});

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<SongMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<SongMetadata[]>([]);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Load saved state from localStorage
    const savedSong = localStorage.getItem('currentSong');
    if (savedSong) {
      try {
        const parsedSong = JSON.parse(savedSong);
        setCurrentSong(parsedSong);
        if (audioRef.current) {
          audioRef.current.src = `${process.env.NEXT_PUBLIC_API_URL}/media/${parsedSong.audio_file}`;
          
          // Apply saved volume if exists
          const savedVolume = localStorage.getItem('playerVolume');
          if (savedVolume) {
            const parsedVolume = parseFloat(savedVolume);
            setVolume(parsedVolume);
            audioRef.current.volume = isMuted ? 0 : parsedVolume;
          }
          
          // Apply saved mute state if exists
          const savedMute = localStorage.getItem('playerMuted');
          if (savedMute) {
            const isMuted = savedMute === 'true';
            setIsMuted(isMuted);
            audioRef.current.muted = isMuted;
          }
        }
      } catch (e) {
        console.error("Failed to parse saved song:", e);
      }
    }
    
    const savedQueue = localStorage.getItem('songQueue');
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error("Failed to parse saved queue:", e);
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  // Save volume whenever it changes
  useEffect(() => {
    localStorage.setItem('playerVolume', volume.toString());
    
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Save mute state whenever it changes
  useEffect(() => {
    localStorage.setItem('playerMuted', isMuted.toString());
    
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  useEffect(() => {
    // Save current song to localStorage whenever it changes
    if (currentSong) {
      localStorage.setItem('currentSong', JSON.stringify(currentSong));
    } else {
      localStorage.removeItem('currentSong');
    }
  }, [currentSong]);
  
  useEffect(() => {
    // Save queue to localStorage
    localStorage.setItem('songQueue', JSON.stringify(queue));
  }, [queue]);
  
  const playSong = (song: SongMetadata) => {
    if (audioRef.current) {
      // If we're already playing this song, just toggle play/pause
      if (currentSong && currentSong.id === song.id) {
        togglePlay();
        return;
      }
      
      setCurrentSong(song);
      audioRef.current.src = `${process.env.NEXT_PUBLIC_API_URL}/media/${song.audio_file}`;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      });
    }
  };
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (currentSong) {
          audioRef.current.play().catch(err => {
            console.error("Error playing audio:", err);
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const nextSong = () => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      const newQueue = queue.slice(1);
      
      // Add current song to the end of the queue if it exists
      if (currentSong) {
        newQueue.push(currentSong);
      }
      
      setQueue(newQueue);
      playSong(nextSong);
    }
  };
  
  const prevSong = () => {
    // For simplicity, we just restart the current song
    if (audioRef.current && currentSong) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
      });
      setIsPlaying(true);
    }
  };
  
  const addToQueue = (song: SongMetadata) => {
    setQueue([...queue, song]);
  };
  
  const handleSetVolume = (value: number) => {
    setVolume(value);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      queue,
      volume,
      isMuted,
      playSong,
      togglePlay,
      nextSong,
      prevSong,
      addToQueue,
      setVolume: handleSetVolume,
      toggleMute,
      audioRef
    }}>
      {children}
      <MusicPlayer />
    </PlayerContext.Provider>
  );
};

// Waveform component
const AudioWaveform: React.FC<{ audioUrl: string, isPlaying: boolean }> = ({ audioUrl, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const playerContext = React.useContext(PlayerContext);
  
  useEffect(() => {
    // Generate some fake waveform data if we don't have real analysis
    if (waveformData.length === 0) {
      const fakeData = Array(50).fill(0).map(() => Math.random() * 0.8 + 0.2);
      setWaveformData(fakeData);
    }
    
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      } catch (e) {
        console.error("Web Audio API is not supported in this browser", e);
      }
    }
    
    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [waveformData]);
  
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const drawFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Use real audio data if available, otherwise use fake data
      let dataToUse = [...waveformData];
      
      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Normalize between 0 and 1
        dataToUse = Array.from(dataArray).map(val => val / 255);
        
        // Only use a subset if we have too many points
        if (dataToUse.length > 50) {
          const step = Math.floor(dataToUse.length / 50);
          dataToUse = dataToUse.filter((_, i) => i % step === 0).slice(0, 50);
        }
      }
      
      // Draw bars
      const barWidth = width / dataToUse.length;
      const barMargin = 2;
      
      ctx.fillStyle = isPlaying ? '#6374B6' : '#4A5483';
      
      dataToUse.forEach((value, i) => {
        // When playing, we want the bars to animate
        let amplitude = value;
        if (isPlaying) {
          // Add some randomness for a more dynamic effect
          amplitude = value * (0.8 + Math.random() * 0.4);
        }
        
        const barHeight = height * amplitude;
        
        // Each bar is actually two mirrored bars for a symmetrical waveform
        ctx.fillRect(
          i * barWidth + barMargin/2, 
          height/2 - barHeight/2, 
          barWidth - barMargin, 
          barHeight
        );
      });
      
      setAnimationFrame(requestAnimationFrame(drawFrame));
    };
    
    setAnimationFrame(requestAnimationFrame(drawFrame));
    
    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, waveformData]);
  
  useEffect(() => {
    // Set up audio analysis for the current audio file
    if (!audioUrl || !audioContextRef.current || !analyserRef.current) return;
    
    // Clean up any existing connections
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    
    // Try to use the player's existing audio element
    if (playerContext.audioRef.current && !sourceRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(playerContext.audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error("Error connecting to audio context:", e);
        // Fall back to fake data if we can't connect
      }
    }
  }, [audioUrl, playerContext.audioRef]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={40} 
      className="w-full h-10"
    />
  );
};

const MusicPlayer: React.FC = () => {
  const playerContext = React.useContext(PlayerContext);
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    nextSong, 
    prevSong, 
    volume, 
    setVolume, 
    isMuted, 
    toggleMute,
    audioRef
  } = playerContext;
  
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const progressRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!audioRef.current) return;
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };
    
    const handleMetadataLoaded = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };
    
    const handleEnded = () => {
      nextSong();
    };
    
    // Set up event listeners
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
    audioRef.current.addEventListener('ended', handleEnded);
    
    // Update playback rate
    audioRef.current.playbackRate = playbackRate;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioRef, nextSong, playbackRate]);
  
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Update playback rate when it changes
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate, audioRef]);
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    // Set new current time
    audioRef.current.currentTime = pos * duration;
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  if (!currentSong) {
    return null; // Don't render player if no song is selected
  }
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1F] shadow-[0_-3px_10px_rgba(0,0,0,0.3)]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Expand/Collapse Button */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <button 
            className="flex items-center justify-center w-16 h-8 bg-[#1C1C1F] rounded-t-lg text-gray-400 hover:text-white"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
        
        {/* Progress bar - always visible at the top of the player */}
        <div 
          ref={progressRef}
          className="h-1 w-full bg-gray-700 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-[#6374B6]" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
        
        <div className={`max-w-8xl mx-auto transition-all duration-300 ease-in-out ${isExpanded ? 'h-56' : 'h-20'}`}>
          <div className="flex h-full items-center p-4">
            {/* Basic player (always visible) */}
            <div className="flex w-full items-center justify-between">
              {/* Song info */}
              <div className="flex items-center">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                  {currentSong.photo_file ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/media/${currentSong.photo_file}`}
                      alt={currentSong.title}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#2D2D35]">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{currentSong.title}</p>
                  <p className="text-xs text-gray-400">{currentSong.artist || "Невідомий виконавець"}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-6">
                {/* Time indicator */}
                <div className="hidden md:flex items-center space-x-2 text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
                
                {/* Play controls */}
                <div className="flex items-center space-x-4">
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={prevSong}
                  >
                    <SkipBack size={18} />
                  </button>
                  
                  <button 
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6374B6] text-white hover:bg-[#5B6EAE] transition-colors"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </button>
                  
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={nextSong}
                  >
                    <SkipForward size={18} />
                  </button>
                </div>
                
                {/* Volume control (visible on medium screens and up) */}
                <div className="hidden md:flex items-center space-x-2">
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 accent-[#6374B6]"
                  />
                </div>
                
                {/* Additional controls */}
                <div className="hidden lg:flex items-center space-x-4">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <Shuffle size={18} />
                  </button>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expanded view */}
          {isExpanded && (
            <motion.div 
              className="px-4 pb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Waveform visualization */}
              <div className="mb-6">
                <AudioWaveform 
                  audioUrl={`${process.env.NEXT_PUBLIC_API_URL}/media/${currentSong.audio_file}`}
                  isPlaying={isPlaying}
                />
              </div>
              
              {/* Additional controls */}
              <div className="flex justify-between">
                {/* Playback speed control */}
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400">Швидкість</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="rounded bg-[#2D2D35] px-2 py-1 text-sm text-white"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2.0x</option>
                  </select>
                </div>
                
                {/* Volume control (visible on small screens in expanded view) */}
                <div className="flex items-center space-x-2 md:hidden">
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 accent-[#6374B6]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicPlayer;