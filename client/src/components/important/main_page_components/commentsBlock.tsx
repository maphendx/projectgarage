import { UserData } from '@/components/not_components';
import { useState } from 'react';

interface compInterface {
  isVisible: boolean;
  userData: UserData | null;
  postId: number;
  commentList: Array<{ content: string; id: number }>;
  updateListOfComments: (commentAdd?: boolean) => Promise<void>;
}

const CommentBlock = ({
  isVisible,
  userData,
  postId,
  commentList,
  updateListOfComments,
}: compInterface) => {
  // компонента з УСІМА коментарами

  const [content, setContent] = useState('');
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const handleClick = async () => {
    // одбробник кнопки створення коментаря
    const token = localStorage.getItem('token');

    try {
      if (content.length <= 5 || content.trim().length <= 3) {
        throw Error('Текст коментара занадто короткий!');
      }

      const postPostResponse = await fetch(
        `http://localhost:8000/api/posts/posts/${postId}/comments/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            content: content,
          }),
        },
      );

      if (!postPostResponse.ok) {
        const data = await postPostResponse.json();
        throw new Error(data.message);
      } else {
        updateListOfComments(true);
        setContent('');
      }
    } catch (Error) {
      console.error(`Публікація не вдалась! ${Error}`);
    }
  };

  return (
    <div
      className={`-translate-y-6 rounded-lg border-2 border-[#101010] bg-[#181717] p-6 shadow-xl ${isVisible ? '' : 'hidden'}`}
    >
      <div className='mb-4 flex'>
        <img
          className='h-12 w-12 rounded-full'
          src={userData ? userData.photo : 'Завантаження...'}
          alt='User'
        />
        <button
          className='ml-3 rounded-l-xl bg-[#2f3846] p-4 text-white duration-300 hover:bg-[#1b1f27]'
          onClick={handleClick}
        >
          <i className='fa fa-paper-plane fs-lg'></i>
        </button>
        <textarea
          rows={2}
          className='w-full rounded-r-xl border-0 bg-[#374151] p-1 text-gray-400 placeholder-[#6B7280]'
          value={content}
          onChange={handleChange}
          placeholder='Додати коментар...'
        ></textarea>
      </div>
      {commentList instanceof Array
        ? commentList.map((comment) => {
            return (
              <div className='mb-4 flex' key={comment.id}>
                <img
                  className='mr-3 h-12 w-12 rounded-full'
                  src={userData ? userData.photo : 'Завантаження...'}
                  alt='User'
                />
                <p className='w-full rounded-xl border-0 bg-[#374151] p-1 text-gray-400 placeholder-[#6B7280]'>
                  {comment.content}
                </p>
              </div>
            );
          })
        : []}
    </div>
  );
};

export default CommentBlock;
