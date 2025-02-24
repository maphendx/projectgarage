import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Post, UserData } from './not_components';
import dateFormatter from './not_components';
import fetchClient from '@/other/fetchClient';
import { useError } from '@/context/ErrorContext';
import Image from 'next/image';

interface FullPostProps {
  post: Post;
  userData: UserData | null;
  onClose: () => void;
}

interface Comment {
  author: {
    display_name: string;
    photo: string;
  };
  content: string;
  id: number;
}

const FullPost: React.FC<FullPostProps> = ({ post, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError } = useError();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${post.id}/comments/`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.reverse());
    } catch {
      showError('Не вдалося завантажити коментарі', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [post.id, showError]);

  useEffect(() => {
    fetchComments();
  }, [post.id, fetchComments]);

  const handleCommentSubmit = async () => {
    if (newComment.trim().length < 3) {
      showError('Коментар занадто короткий', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${post.id}/comments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newComment }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      await fetchComments();
      setNewComment('');
    } catch {
      showError('Не вдалося додати коментар', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={modalRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className='relative mx-auto max-w-2xl rounded-xl bg-[#2D2F3A] p-6 shadow-xl'
    >
      <button
        onClick={onClose}
        className='absolute right-4 top-4 text-white hover:text-gray-300'
      >
        <i className='fas fa-times text-xl'></i>
      </button>

      <div className='mb-4 flex items-center'>
        <Image
          src={post.author?.photo || '/default-avatar.png'} // Provide a default image if photo is undefined
          alt={post.author?.display_name || 'Невідомий автор'} // Provide a default alt text if display_name is undefined
          className='mr-4 h-12 w-12 rounded-full'
          width={48}
          height={48}
        />
        /{'>'}
        <div>
          <h2 className='text-xl font-bold text-white'>
            {post.author?.display_name || 'Невідомий автор'}
          </h2>
          <p className='text-gray-400'>{dateFormatter(post.created_at)}</p>
        </div>
      </div>

      <div className='mb-4 whitespace-pre-wrap text-white'>{post.content}</div>

      {/* Image gallery */}
      {post.images && post.images.length > 0 && (
        <div className='mb-4 grid grid-cols-2 gap-4'>
          {post.images.map((img, index) => (
            <Image
              key={index}
              src={img.image}
              alt={`Post image ${index + 1}`}
              className='h-64 w-full rounded-lg object-cover'
              width={640}
              height={480}
            />
          ))}
        </div>
      )}

      {/* Post Interactions */}
      <div className='mb-4 flex justify-between text-gray-400'>
        <span>❤️ {post.likes.length} Лайк</span>
        <span>💬 {comments.length} Коментар</span>
      </div>

      {/* Comments section */}
      <div className='mt-6'>
        <h3 className='mb-4 text-lg font-semibold'>Коментарі</h3>

        {isLoading ? (
          <div className='flex justify-center py-4'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
          </div>
        ) : (
          <div className='max-h-64 overflow-y-auto'>
            {comments.length === 0 ? (
              <p className='text-center text-gray-400'>Немає коментарів</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className='mb-3 rounded-lg bg-[#363847] p-3'
                >
                  <div className='flex flex-col'>
                    <p className='font-semibold text-white'>
                      {comment.author.display_name}
                    </p>
                    <p className='text-gray-300'>{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Comment input */}
        <div className='mt-4 flex gap-2'>
          <input
            type='text'
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder='Додати коментар...'
            className='flex-1 rounded-lg bg-[#1A1A2E] p-2 text-white'
            onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
          />
          <button
            onClick={handleCommentSubmit}
            disabled={isSubmitting}
            className='rounded-lg bg-[#6374B6] px-4 py-2 text-white transition-colors hover:bg-[#4F5D9E] disabled:opacity-50'
          >
            {isSubmitting ? 'Надсилання...' : 'Надіслати'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FullPost;
