import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface SearchResult {
  users?: Array<{
    display_name: string;
    full_name: string;
    photo: string;
  }>;
  posts?: Array<{
    id: number;
    content: string;
    author: {
      display_name: string;
    };
  }>;
  metadata: {
    query: string;
    total_users: number;
    total_posts: number;
  };
}

const TopbarSearchField = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  let typingTimeout: NodeJS.Timeout;

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/search/`,
        {
          params: { query },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setIsTyping(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
      handleSearch(query);
    }, 500); // Reduced debounce time to 500ms for better responsiveness
  };

  const handleResultClick = (type: 'user' | 'post', id: number) => {
    setShowResults(false);
    if (type === 'user') {
      router.push(`/profile/${id}`);
    } else {
      router.push(`/post/${id}`);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  return (
    <motion.div
      className='group relative ml-6 flex-1 transition-all duration-300 ease-out'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className='relative'>
        <div className='absolute left-2 top-1/2 -translate-y-1/2 transform'>
          <i
            className='fas fa-search ml-2 mt-[20px] text-[#A1A1A1]'
            style={{ opacity: 0.8, lineHeight: '52px' }}
          ></i>
        </div>
        <motion.input
          type='text'
          value={searchQuery}
          placeholder='Пошук...'
          className='text-ml-4 mt-5 h-[52px] w-[99%] min-w-[300px] rounded-[16px] bg-[rgb(43,45,49)] px-4 pl-10 pr-10 text-[#A1A1A1] placeholder-[#A1A1A1]/60 transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#2B2D31]'
          onChange={handleInputChange}
          animate={{
            boxShadow: isTyping
              ? '0 0 10px rgba(216, 180, 255, 0.9)'
              : '0 0 5px rgba(216, 180, 255, 0.6)',
            borderColor: isTyping ? '#D8B4FF' : 'transparent',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        {/* Search Results Dropdown */}
        {showResults && searchResults && (
          <div className='absolute mt-2 w-full rounded-lg bg-[rgb(43,45,49)] p-4 shadow-lg'>
            {/* Users Section */}
            {searchResults.users && searchResults.users.length > 0 && (
              <div className='mb-4'>
                <h3 className='mb-2 text-[#A1A1A1]'>Користувачі</h3>
                {searchResults.users.map((user, index) => (
                  <div
                    key={index}
                    className='flex cursor-pointer items-center p-2 hover:bg-[rgb(53,55,59)]'
                    onClick={() => handleResultClick('user', index)}
                  >
                    <img
                      src={user.photo || '/default-avatar.png'}
                      alt={user.display_name}
                      className='mr-3 h-8 w-8 rounded-full'
                    />
                    <div>
                      <p className='text-white'>{user.display_name}</p>
                      <p className='text-sm text-[#A1A1A1]'>{user.full_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Posts Section */}
            {searchResults.posts && searchResults.posts.length > 0 && (
              <div>
                <h3 className='mb-2 text-[#A1A1A1]'>Пости</h3>
                {searchResults.posts.map((post, index) => (
                  <div
                    key={index}
                    className='cursor-pointer p-2 hover:bg-[rgb(53,55,59)]'
                    onClick={() => handleResultClick('post', post.id)}
                  >
                    <p className='text-white'>
                      {post.content.substring(0, 100)}...
                    </p>
                    <p className='text-sm text-[#A1A1A1]'>
                      Автор: {post.author.display_name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {!searchResults.users?.length && !searchResults.posts?.length && (
              <p className='text-center text-[#A1A1A1]'>
                Результатів не знайдено
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TopbarSearchField;
