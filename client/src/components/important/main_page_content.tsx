import { useEffect, useState } from 'react';
import { Post, UserData } from '../not_components';
import { PostBlock } from './main_page_components/postBlock';
import NewPostBlock from './main_page_components/newPostBlock';

interface compInterface {
  userData: UserData | null;
  postsList: Post[] | null;
  handlePostsListTrigger: () => void;
}

const MainContent = ({
  userData,
  postsList,
  handlePostsListTrigger,
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
        </div>
      </div>
    </main>
  );
};

export default MainContent;
