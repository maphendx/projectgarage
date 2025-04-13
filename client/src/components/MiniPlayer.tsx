import React, { useState, useEffect, useRef } from 'react';
import { useError } from '@/context/ErrorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1,
  Music,
  Settings
} from 'lucide-react';

interface AudioPlayerProps {
  audioSrc: string;
}

const MiniPlayer: React.FC<AudioPlayerProps> = ({ audioSrc }) => {
  // State for player functionality
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { showError } = useError();

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(audioSrc);
    
    // Extract filename from URL
    const getFileName = (url: string) => {
      // Try to get the filename from the path
      const pathParts = url.split('/');
      let name = pathParts[pathParts.length - 1];
      
      // Remove query parameters if any
      name = name.split('?')[0];
      
      // Decode URI components
      try {
        name = decodeURIComponent(name);
      } catch (e) {
        // If decoding fails, use the original name
      }
      
      // Remove file extension
      const nameParts = name.split('.');
      if (nameParts.length > 1) {
        nameParts.pop(); // Remove the last part (extension)
      }
      
      return nameParts.join('.');
    };
    
    setFileName(getFileName(audioSrc));
    
    // Setup event listeners
    const audio = audioRef.current;
    
    const handleLoadedData = () => {
      setDuration(audio.duration);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      showError('Помилка відтворення аудіо', 'error');
      setIsPlaying(false);
    };
    
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      if (audio) {
        audio.pause();
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      }
      
      // Clear any existing timers
      if (volumeTimerRef.current) {
        clearTimeout(volumeTimerRef.current);
      }
    };
  }, [audioSrc, showError]);

  // Apply volume and playback speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed]);

  // Toggle play/pause
  const togglePlayPause = async () => {
    try {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotSupportedError') {
        showError(`Формат аудіо не підтримується браузером`, 'error');
      } else if (error instanceof DOMException && error.name === 'NotAllowedError') {
        showError(`Відтворення аудіо заблоковано браузером. Спробуйте взаємодіяти зі сторінкою`, 'warning');
      } else {
        showError(`Помилка відтворення: ${error}`, 'error');
      }
    }
  };

  // Handle volume changes
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle volume control visibility
  const handleVolumeMouseEnter = () => {
    // Clear any previous timer
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }
    setShowVolumeSlider(true);
  };
  
  const handleVolumeMouseLeave = () => {
    // Set a timer to hide the volume slider after 3 seconds
    volumeTimerRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 3000);
  };

  // Handle seeking in the progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Change playback speed
  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedOptions(false);
  };

  // Format time in mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress width as percentage
  const progressWidth = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get volume icon based on current state
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="h-5 w-5" />;
    if (volume < 0.5) return <Volume1 className="h-5 w-5" />;
    return <Volume2 className="h-5 w-5" />;
  };

  return (
    <motion.div
      className="my-3 w-full rounded-lg bg-[#2D2D35] p-3 shadow-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* File name and info */}
      <div className="flex items-center mb-2">
        <Music className="h-5 w-5 text-[#6374B6] mr-2" />
        <p className="text-sm font-medium text-gray-200 truncate">{fileName || "Аудіо файл"}</p>
        <span className="ml-auto text-xs text-gray-400">{playbackSpeed}x</span>
      </div>
      
      {/* Progress bar */}
      <div 
        className="relative h-2 w-full cursor-pointer rounded-full bg-gray-700 mb-3"
        onClick={handleProgressBarClick}
        ref={progressBarRef}
      >
        <div 
          className="absolute h-full rounded-full bg-[#6374B6]" 
          style={{ width: `${progressWidth}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center">
        {/* Playback controls */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={togglePlayPause}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6374B6] text-white hover:bg-[#5766a0] transition-colors"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          
          {/* Time display */}
          <div className="ml-2 text-sm text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Volume controls */}
        <div className="flex items-center relative">
          {/* Volume slider with AnimatePresence for smooth transitions */}
          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 100 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="mr-2"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-2 w-full appearance-none rounded-lg bg-gray-700 outline-none"
                  style={{
                    background: `linear-gradient(to right, #6374B6 0%, #6374B6 ${(isMuted ? 0 : volume) * 100}%, #4B5563 ${(isMuted ? 0 : volume) * 100}%, #4B5563 100%)`,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Volume icon */}
          <button 
            onClick={toggleMute}
            onMouseEnter={handleVolumeMouseEnter}
            onMouseLeave={handleVolumeMouseLeave}
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-[#3C3C46] transition-colors"
          >
            {getVolumeIcon()}
          </button>
          
          {/* Playback speed */}
          <div className="relative ml-2">
            <button 
              onClick={() => setShowSpeedOptions(!showSpeedOptions)}
              className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-[#3C3C46] transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            {/* Speed options dropdown */}
            <AnimatePresence>
              {showSpeedOptions && (
                <motion.div 
                  className="absolute right-0 bottom-10 z-10 w-24 rounded-md bg-[#1C1C1F] shadow-lg p-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changePlaybackSpeed(speed)}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                        playbackSpeed === speed ? 'bg-[#6374B6] text-white' : 'text-gray-300 hover:bg-[#3C3C46]'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;