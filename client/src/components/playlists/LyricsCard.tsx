import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, FileText } from 'lucide-react';

interface Lyrics {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_public: boolean;
}

interface LyricsCardProps {
  lyrics: Lyrics;
  isUserLyrics: boolean;
  onView: () => void;
  onToggleVisibility?: () => void;
}

const LyricsCard: React.FC<LyricsCardProps> = ({
  lyrics,
  isUserLyrics,
  onView,
  onToggleVisibility,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
      {/* Header with gradient background */}
      <div className="relative h-28 bg-gradient-to-r from-[#3C4B84] to-[#6374B6] p-4">
        <div className="absolute left-4 top-4">
          <FileText className="h-6 w-6 text-white opacity-80" />
        </div>
        <div className="flex h-full items-center justify-center">
          <h3 className="text-center text-xl font-bold text-white">{lyrics.title}</h3>
        </div>
      </div>

      {/* Content Preview */}
      <div className="p-4">
        <div className="mb-4 min-h-[60px] rounded-md bg-[#25252B] p-3 text-sm text-gray-300">
          {truncateContent(lyrics.content)}
        </div>
        
        <p className="text-xs text-gray-500">{formatDate(lyrics.created_at)}</p>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 rounded-lg bg-[#3C4B84] px-3 py-1 text-sm text-white transition-colors hover:bg-[#6374B6]"
            onClick={onView}
          >
            <FileText className="h-4 w-4" />
            <span>Перегляд</span>
          </motion.button>

          {isUserLyrics && onToggleVisibility && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 rounded-lg bg-[#3C4B84] px-3 py-1 text-sm text-white transition-colors hover:bg-[#6374B6]"
              onClick={onToggleVisibility}
            >
              {lyrics.is_public ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Приватний</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Публічний</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LyricsCard;