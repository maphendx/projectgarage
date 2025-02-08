import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dateFormatter, { Post, UserData } from '@/components/not_components';
import CommentBlock from './commentsBlock';
import MiniPlayer from '@/components/MiniPlayer';
import { useError } from '@/context/ErrorContext';
import MicroPost from '@/components/MicroPost';
import VideoEmbed from '@/components/VideoEmbed';
import fetchClient from '@/other/fetchClient';


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
  const [repostedPost, setRepostedPost] = useState<Post | null>(null);
  const [commentList, setCommentList] = useState([]);
  const {showError} = useError();

  useEffect(() => {
    if (post.original_post) {
      loadRepostedPost(post.original_post);
    }
  },[post])

  const loadRepostedPost = async (id : number) => {
    try {
      const dataResponse = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${id}/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const data = await dataResponse.json();

      if (!dataResponse.ok) {
        throw new Error(`Помилка: ${JSON.stringify(data)}`);
      }
      
      setRepostedPost(data);
    } catch (error) {
      showError(`${error}`,"error");
    }
  }

  const updateListOfComments = async (commentsAdd?: boolean) => {
    try {
      const dataResponse = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${post.id}/comments/`,
        {
          headers: {
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
      const dataResponse = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/posts/${post.id}/like/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!dataResponse.ok) {
        const error_text = await dataResponse.json();
        throw new Error(JSON.stringify(error_text));
      }
      const data = await dataResponse.json();
      if (!post.is_liked) {
        setPost({ ...post, likes: [...post.likes, post.author.id], is_liked: !post.is_liked });
      }
      else {
        setPost({ ...post, likes: post.likes.filter(i => i !== post.author.id), is_liked: !post.is_liked });
      }
    } catch (error) {
      showError(`${error}`, "error");
    }
  };

  return (
    <motion.div
      className='post-block'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      key={post.id}
    >
      <div
        className='mb-6 rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6'
        style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
      >
        <div className='flex'>
          <img
            className='h-10 w-10 rounded-[14px]'
            src={post.author?.photo}
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
          {/* {post.content} */}
          {post.content && <VideoEmbed content={post.content} />}
        </p>
        <div className='flex flex-col items-start justify-start mb-4'>
          {/* Блок фотографій */}
          <div className='flex'>
            {post.images.length > 0 && 
            <img
            className='m-3 min-h-[200px] min-w-[200px] rounded shadow-[0_3px_5px_2px_#101010] duration-300 hover:shadow-[0_1px_5px_2px_#000000]'
            src={post.images[0].image}
            />}

            {post.images.length > 1 && <div className='flex flex-wrap justify-center'>
              {post.images.slice(1).map((element, key) => 
            <img
            key={key}
            className='m-1 max-h-[200px] max-w-[200px] rounded shadow-[0_3px_5px_2px_#101010] duration-300 hover:shadow-[0_1px_5px_2px_#000000]'
            src={element.image}
            />
            )}
          </div>}
          </div>
          {/* Блок аудіо */}
          {post.audios.length > 0 && post.audios.map((element, key) => (<MiniPlayer key={key} audioSrc={element.audio} />))}
          {/* Блок відео */}
          {post.videos.length > 0 && post.videos.map((element, key) => (<div key={key} 
            className='mt-2 shadow-[0_3px_5px_2px_#101010] duration-300 hover:shadow-[0_1px_5px_2px_#000000] rounded-xl'>
            <video controls className='rounded-xl'>
              <source src={element.video} ></source>
            </video>
          </div>)) }
          {post.hashtag_objects.length > 0 ? 
          <div className='flex flex-wrap'>
            {post.hashtag_objects.map((element, key) => (
            <div key={key} className='flex mr-2 mt-2 bg-[#ffffff0f] p-1 rounded-md'>
              <p>{element.name}</p>
            </div>
            ))}
          </div> : <></>}
        </div>
        {/* Блок репосту */}
        {repostedPost && (<MicroPost post={repostedPost} />)}
        {/* Блок з кнопками */}
        <div className='mt-4 flex items-center space-x-4'>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <PostButton
              text={post.likes.length}
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
