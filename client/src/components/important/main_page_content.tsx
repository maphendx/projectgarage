import { useEffect, useState } from 'react';
import { Post, UserData } from '../not_components';
import { PostBlock } from './main_page_components/postBlock';
import NewPostBlock from './main_page_components/newPostBlock';
<<<<<<< HEAD

interface compInterface {
  userData: UserData | null;
  postsList: Post[] | null;
  handlePostsListTrigger: () => void;
=======
import { motion, useAnimation } from 'framer-motion';

interface CompInterface {
  userData: UserData | null;
  postsList: Post[] | null;
  handlePostsListTrigger: () => Promise<void>;
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
}

const MainContent = ({
  userData,
  postsList,
  handlePostsListTrigger,
<<<<<<< HEAD
}: compInterface) => {
  const [localPostsList, setLocalPostsList] = useState<Post[] | null>(
    postsList,
  );

  useEffect(() => {
    setLocalPostsList(postsList);
  }, [postsList]);

  return (
    <main>
      <div className='flex min-h-screen items-center justify-center'>
        {/* Main Rounded Content */}
        <div className='mx-auto min-h-[85vh] w-[100%] max-w-[100%] rounded-[30px] border-[1px] border-white border-opacity-10 bg-opacity-70 bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
          <NewPostBlock
            userData={userData}
            handlePostsListTrigger={handlePostsListTrigger}
          />
          {localPostsList
            ? localPostsList.map((post: Post) => (
                <PostBlock getUser={userData} key={post.id} getPost={post} />
              ))
            : []}
=======
}: CompInterface) => {
  const [localPostsList, setLocalPostsList] = useState<Post[] | null>(
    postsList,
  );
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

  return (
    <main>
      <div className='flex min-h-screen items-center justify-center'>
        <div className='posts-container mx-auto min-h-[85vh] w-[100%] max-w-[100%] rounded-[30px] border-[1px] border-white border-opacity-10 bg-opacity-70 bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
          <NewPostBlock userData={userData} onPostCreated={refreshPosts} />
          {localPostsList ? (
            localPostsList.map((post: Post) => (
              <motion.div
                className='post-block'
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={controls}
                viewport={{ once: true }}
              >
                <PostBlock getUser={userData} getPost={post} />
              </motion.div>
            ))
          ) : (
            <div>Завантаження...</div>
          )}
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
        </div>
      </div>
    </main>
  );
};

export default MainContent;
