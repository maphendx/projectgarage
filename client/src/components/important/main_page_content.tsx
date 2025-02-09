import { useEffect, useState } from 'react';
import { FileContainer, FileType, Post, UserData } from '../not_components';
import { PostBlock } from './main_page_components/postBlock';
import NewPostBlock from './main_page_components/newPostBlock';
import { motion, useAnimation } from 'framer-motion';
import { useError } from '@/context/ErrorContext';

interface CompInterface {
  userData: UserData | null;
  postsList: Post[] | null;
  handlePostsListTrigger: () => Promise<void>;
  showAddFile: (type: FileType) => void;
  addFileStorage: FileContainer;
  resetAddFileStorage: (fileType: FileType) => void;
}

const MainContent = ({
  userData,
  postsList,
  handlePostsListTrigger,
  showAddFile,
  addFileStorage,
  resetAddFileStorage,
}: CompInterface) => {
  const [localPostsList, setLocalPostsList] = useState<Post[] | null>(
    postsList,
  );
  const [repostPost, setRepostPost] = useState<Post | undefined>(undefined);
  const { showError } = useError();
  const controls = useAnimation();

  useEffect(() => {
    setLocalPostsList(postsList);
    // Scroll to top when postsList is updated
    const container = document.querySelector('.posts-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [postsList]);

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.post-block');
      elements.forEach((element) => {
        if (isElementInViewport(element)) {
          controls.start({
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' },
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controls]);

  const isElementInViewport = (el: Element) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  const refreshPosts = async () => {
    await handlePostsListTrigger();
  };

  const performRepostButton = (post: Post) => {
    if (post.original_post) {
      showError('Робити репост репосту не можна!', 'error');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setRepostPost(post);
    }
  };

  return (
    <main>
      <div className='flex min-h-screen justify-center'>
        <div className='posts-container mx-auto min-h-[85vh] w-[100%] max-w-[100%] rounded-[30px] border-[1px] border-white border-opacity-10 bg-opacity-70 bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
          {userData && (
            <NewPostBlock
              userData={userData}
              onPostCreated={refreshPosts}
              showAddFile={showAddFile}
              addFileStorage={addFileStorage}
              resetAddFileStorage={resetAddFileStorage}
              repostPost={repostPost}
              setRepostPost={setRepostPost}
            />
          )}
          {localPostsList ? (
            localPostsList.map((post: Post) => (
              <motion.div
                className='post-block'
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={controls}
                viewport={{ once: true }}
              >
                <PostBlock
                  getUser={userData}
                  getPost={post}
                  getRepostHandler={performRepostButton}
                />
              </motion.div>
            ))
          ) : (
            <div>Завантаження...</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContent;
