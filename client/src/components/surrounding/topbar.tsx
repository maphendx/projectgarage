import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { useRouter } from 'next/navigation'; // For navigation
=======
import { useRouter } from 'next/navigation';
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
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
<<<<<<< HEAD
    <nav className='fixed z-30 min-w-full rounded-[16px] bg-[#1C1C1F]'>
      <div className='max-w-8xl mx-auto px-4'>
=======
    <nav className='fixed-topbar'>
      <div className='max-w-8xl mx-auto'>
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
        <div className='flex h-16 items-center justify-between gap-2'>
          {/* Logo */}
          <img
            src='/logo.svg'
            alt='Logo'
<<<<<<< HEAD
            className='ml-0 mr-0 mt-5 h-[52px] w-auto cursor-pointer'
=======
            className='ml-5 mt-5 h-[52px] w-auto cursor-pointer'
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
            onClick={() => router.push('/home')} // Navigate to home on logo click
          />
          {/* Search Field */}
          <TopbarSearchField />
          {/* User Information */}
<<<<<<< HEAD
          <div className='flex items-center'>
            <div
              className='mt-5 flex h-[52px] w-[300px] items-center gap-2.5 rounded-[16px] bg-[#2B2D31] p-1 pl-1 text-[#A1A1A1] duration-300'
=======
          <div className='mr-5 mt-5 flex items-center'>
            <div
              className='flex h-[52px] w-[300px] items-center gap-2.5 rounded-[16px] bg-[#2B2D31] p-1 pl-1 text-[#A1A1A1] duration-300'
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
              style={{
                boxShadow: '0 0 5px rgba(216, 180, 255, 0.6)',
              }}
            >
              {/* Notification and Message Icons */}
              <TopbarButton iconClass='fas fa-bell text-gray-300' />
              <TopbarButton iconClass='fas fa-envelope text-gray-300' />
              {/* User Name and Avatar */}
<<<<<<< HEAD
              <div className='ml-6 flex flex-1 items-center justify-between pr-2'>
                <span
                  className='cursor-pointer text-sm font-medium hover:text-white'
=======
              <div className='flex flex-1 items-center justify-between pr-2'>
                <span
                  className='ml-8 cursor-pointer text-sm font-medium hover:text-white'
>>>>>>> 98e67a1 (попрацював з анімаціями та бібліотеко framer animaiton додав анімацію на головну сторінку та профіль)
                  onClick={handleProfileNavigation}
                >
                  {userData ? userData.display_name : 'Завантаження...'}
                </span>
                <img
                  className='h-12 w-12 cursor-pointer rounded-[14px]'
                  src={userData ? userData.photo : '/default-profile.jpg'}
                  alt='Фото профілю'
                  onClick={handleProfileNavigation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
