import { useState } from 'react';
import { motion } from 'framer-motion';
import dateFormatter, { Post, UserData } from '@/components/not_components';
import CommentBlock from './commentsBlock';
import MiniPlayer from '@/components/MiniPlayer';

export const PostBlock = ({
  getPost,
  getUser,
  getRepostHandler,
}: {
  getPost: Post;
  getUser: UserData | null;
  getRepostHandler: (post : Post) => void;
}) => {
  const [showComments, setShowComments] = useState<boolean>(false);
  const [post, setPost] = useState<Post>(getPost);
  const [commentList, setCommentList] = useState([]);

  const token = localStorage.getItem('token');

  const updateListOfComments = async (commentsAdd?: boolean) => {
    try {
      const dataResponse = await fetch(
        `http://localhost:8000/api/posts/posts/${post.id}/comments/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!dataResponse.ok) {
        const error_text = await dataResponse.text();
        throw new Error(`HTTP error! status: ${error_text}`);
      }
      const data = await dataResponse.json();
      setCommentList(data.reverse());
      setShowComments(true);
      if (commentsAdd && post.comments)
        setPost({ ...post, comments: post.comments + 1 });
    } catch (error) {
      if (error instanceof Error) console.error(`${error.message}`);
    }
  };

  const performCommentButton = async () => {
    if (showComments) {
      setShowComments(false);
    } else {
      updateListOfComments();
    }
  };

  const performLikeButton = async () => {
    try {
      const dataResponse = await fetch(
        `http://localhost:8000/api/posts/posts/${post.id}/like/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!dataResponse.ok) {
        const error_text = await dataResponse.text();
        throw new Error(`HTTP error! status: ${error_text}`);
      }
      const data = await dataResponse.json();
      setPost({ ...post, likes: [data.likes_count], is_liked: !post.is_liked });
    } catch (error) {
      if (error instanceof Error) console.error(`${error.message}`);
    }
  };

  return (
    <motion.div
      className='post-block'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div
        className='mb-6 rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6'
        style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
      >
        <div className='flex'>
          <img
            className='h-10 w-10 rounded-[14px]'
            src={'http://localhost:8000' + post.author?.photo}
            alt='User'
          />
          <div className='ml-3'>
            <p className='text-sm font-medium text-white'>
              {post.author?.display_name}
            </p>
            <p className='text-sm text-gray-400'>
              {dateFormatter(post.created_at)}
            </p>
          </div>
        </div>
        <p className='mt-4 whitespace-pre-wrap break-words text-white'>
          {post.content}
        </p>
        <div className='flex flex-col items-start justify-start'>
          <img
            className={
              post.image
                ? 'mt-3 min-h-[200px] min-w-[200px] rounded shadow-[0_3px_5px_2px_#101010] duration-300 hover:shadow-[0_1px_5px_2px_#000000]'
                : 'hidden'
            }
            src={post.image}
          />
          {post.audio && <MiniPlayer audioSrc={post.audio} />}
          {post.video && <div>
            <video src={post.video}>

            </video>
          </div> }
          {post.hashtag_objects.length > 0 ? 
          <div className='flex flex-wrap'>
            {post.hashtag_objects.map((element, key) => (
            <div key={key} className='flex mr-2 mt-2 bg-[#ffffff0f] p-1 rounded-md'>
              <p>{element.name}</p>
            </div>
            ))}
          </div> : <></>}
        </div>
        <div className='mt-4 flex items-center space-x-4'>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PostButton
              text={post.likes?.length === 1 ? `${post.likes[0]}` : '0'}
              onClick={performLikeButton}
              iconClass='fas fa-heart mr-1'
              additionClasses={post.is_liked ? 'font-bold text-white' : ''}
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PostButton
              text={post.comments?.toString()}
              onClick={performCommentButton}
              iconClass='fas fa-comment mr-1'
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PostButton
              text={post.reposts?.length}
              onClick={() => getRepostHandler(post)}
              iconClass='fas fa-share mr-1'
            />
          </motion.div>
        </div>
      </div>
      <CommentBlock
        isVisible={showComments}
        userData={getUser}
        postId={post.id}
        commentList={commentList}
        updateListOfComments={updateListOfComments}
      />
    </motion.div>
  );
};

const PostButton = ({
  iconClass,
  text,
  onClick,
  additionClasses,
}: {
  iconClass?: string;
  text?: any;
  onClick?: any;
  additionClasses?: string;
}) => {
  return (
    <button
      className={`flex items-center text-gray-400 hover:text-gray-300 ${additionClasses}`}
      onClick={onClick}
    >
      <i className={iconClass}></i>
      {text}
    </button>
  );
};
