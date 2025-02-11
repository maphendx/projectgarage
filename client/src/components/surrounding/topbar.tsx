import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserData } from '../not_components';
import TopbarSearchField from './small_components/topbarSearchField';
import TopbarButton from './small_components/topbarButton';

export default function Topbar({
  paramUserData,
}: {
  paramUserData: UserData | null;
}) {
  const [userData, setUserData] = useState<UserData | null>(paramUserData);
  const router = useRouter();

  useEffect(() => {
    setUserData(paramUserData);
  }, [paramUserData]);

  const handleProfileNavigation = () => {
    router.push('/profile');
  };

  return (
    <nav className='fixed-topbar'>
      <div className='max-w-8xl mx-auto'>
        <div className='flex h-16 items-center justify-between gap-2'>
          {/* Logo */}
          <img
            src='/logo.svg'
            alt='Logo'
            className='ml-5 mt-5 h-[52px] w-auto cursor-pointer'
            onClick={() => router.push('/')}
          />
          {/* Search Field */}
          <TopbarSearchField />
          {/* User Information */}
          <div className='mr-4 mt-5 flex items-center'>
            <div
              className='flex h-[52px] w-[300px] items-center gap-2.5 rounded-[16px] border-b-[0.5px] border-t-[0.5px] border-[#2d2d2d] bg-[#2B2D31] p-1 pl-1 text-[#A1A1A1] duration-300'
              // style={{
              //   boxShadow: '0 0 5px rgba(216, 180, 255, 0.6)',
              // }}
            >
              {/* Notification and Message Icons - Only show when user is logged in */}
              {userData && (
                <>
                  <TopbarButton iconClass='fas fa-bell text-gray-300' />
                  <TopbarButton iconClass='fas fa-envelope text-gray-300' />
                </>
              )}
              {/* User Name and Avatar */}
              <div className='flex flex-1 items-center justify-between pr-2'>
                {userData ? (
                  <>
                    <span
                      className='ml-8 cursor-pointer text-sm font-medium hover:text-white hover:underline'
                      onClick={handleProfileNavigation}
                    >
                      {userData.display_name}
                    </span>
                    <img
                      className='h-12 w-12 cursor-pointer rounded-[14px]'
                      src={userData.photo}
                      alt='Фото профілю'
                      onClick={handleProfileNavigation}
                    />
                  </>
                ) : (
                  <button
                    onClick={() => router.push('/auth')}
                    className='ml-28 rounded-lg bg-[#7289DA] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B6EAE]'
                  >
                    Увійти
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
