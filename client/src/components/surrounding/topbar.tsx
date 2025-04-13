import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiRobot2Fill } from 'react-icons/ri';
import { UserData } from '../not_components';
import TopbarSearchField from './small_components/topbarSearchField';
import TopbarButton from './small_components/topbarButton';
import Image from 'next/image';

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

  const handleNotificationsNavigation = () => {
    router.push('/notifications');
  };

  const handleAiNavigation = () => {
    router.push('/ai');
  };

  return (
    <nav className='fixed-topbar'>
      <div className='max-w-8xl mx-auto'>
        <div className='flex h-16 items-center justify-between gap-2'>
          {/* Logo */}
          <Image
            src='/logo.svg'
            alt='Logo'
            className='ml-5 mt-5 h-[52px] w-auto cursor-pointer'
            width={50}
            height={50}
            onClick={() => router.push('/')}
          />
          {/* Search Field */}
          <TopbarSearchField />
          {/* User Information */}
          <div className='mr-4 mt-5 flex items-center'>
            <div className='flex h-[52px] w-[300px] items-center gap-3 rounded-[16px] border-b-[0.5px] border-t-[0.5px] border-[#2d2d2d] bg-[#2B2D31] px-3 text-[#A1A1A1] duration-300'>
              {userData ? (
                <>
                  {/* Notification, Message, and AI Icons*/}
                  <TopbarButton
                    onClick={handleNotificationsNavigation}
                    iconClass='fas fa-bell text-gray-300'
                  />
                  <TopbarButton iconClass='fas fa-envelope text-gray-300' />
                  <TopbarButton onClick={handleAiNavigation}>
                    <RiRobot2Fill size={20} className='text-gray-300' />
                  </TopbarButton>
                  {/* User Name and Avatar */}
                  <div className='flex flex-1 items-center justify-end gap-3'>
                    <span
                      className='cursor-pointer text-sm font-medium text-gray-300 hover:text-white hover:underline'
                      onClick={handleProfileNavigation}
                    >
                      {userData.display_name}
                    </span>
                    <Image
                      className='h-10 w-10 cursor-pointer rounded-[12px] transition-transform hover:scale-105'
                      src={userData.photo}
                      alt='Фото профілю'
                      width={40}
                      height={40}
                      onClick={handleProfileNavigation}
                    />
                  </div>
                </>
              ) : (
                <button
                  onClick={() => router.push('/auth')}
                  className='flex-1 rounded-[12px] bg-gradient-to-r from-[#7289DA] to-[#5B6EAE] py-2.5 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:opacity-90 hover:shadow-md active:scale-[0.98]'
                >
                  Увійти
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
