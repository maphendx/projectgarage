import { motion } from 'framer-motion';
import dateFormatter, { Post } from './not_components';
import Image from 'next/image';

const MicroPost = ({
  post: post,
  setRepostPost: setRepostPost,
}: {
  post: Post;
  setRepostPost?: (post: Post | undefined) => void;
}) => {
  return (
    <motion.div
      key={post.id}
      className='mb-6 flex place-content-between rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6'
      style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div>
        <p className='text-sm'>{post.content}</p>
        {post.images.length > 0 && (
          <div className='flex flex-wrap'>
            {post.images.map((element, key) => (
              <Image
                key={key}
                src={element.image}
                alt='Post image'
                width={100}
                height={100}
                className='ml-1 mt-2 rounded'
              />
            ))}
          </div>
        )}
        <div className='mt-2 text-xs text-gray-400'>
          {dateFormatter(post.created_at)}
          <span className='ml-4'>Вподобання: {post.likes?.length}</span>
          <span className='ml-4'>Коментарі: {post.comments}</span>
          <span className='ml-4'>
            Автор: {post.author ? post.author.display_name : 'Невідомий'}
          </span>
        </div>
      </div>
      {setRepostPost && (
        <motion.button
          className='ml-0.5 mr-2 h-12 w-12 rounded-md bg-[#ffffff0f] p-3'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => setRepostPost(undefined)}
        >
          <i className='fas fa-times text-[#97A7E7]'></i>
        </motion.button>
      )}
    </motion.div>
  );
};

export default MicroPost;
