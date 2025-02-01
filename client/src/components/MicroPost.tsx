import { motion } from "framer-motion"
import dateFormatter, { Post } from "./not_components"

const MicroPost = ({post : post, setRepostPost : setRepostPost} : {post : Post, setRepostPost? : (post : Post | undefined) => void}) => {
    return (
        <motion.div
            key={post.id}
            className='mb-6 rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6 flex place-content-between'
            style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
        <div>
            <p className='text-sm'>{post.content}</p>
            {post.image && (
            <img
                src={post.image}
                alt='Post image'
                width={100}
                height={100}
                className='mt-2 rounded'
            />
            )}
            <div className='mt-2 text-xs text-gray-400'>
            {dateFormatter(post.created_at)}
            <span className='ml-4'>
                Вподобання: {post.likes?.length}
            </span>
            <span className='ml-4'>Коментарі: {post.comments}</span>
            </div>
        </div>
        {setRepostPost && (
        <motion.button
            className='bg-[#ffffff0f] p-3 rounded-md ml-0.5 mr-2'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => setRepostPost(undefined)}
            >
            <i className="fas fa-times text-[#97A7E7]"></i>
        </motion.button>
        )}
        </motion.div>
    )
}

export default MicroPost;