'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import {
  HomeIcon as HomeSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  MicrophoneIcon as MicrophoneSolidIcon,
  NewspaperIcon as NewsSolidIcon,
  HeartIcon as HeartSolidIcon,
  ClockIcon as ClockSolidIcon,
  QueueListIcon as QueueSolidIcon,
} from '@heroicons/react/24/solid';

import {
  HomeIcon as HomeOutlineIcon,
  ChatBubbleLeftRightIcon as ChatOutlineIcon,
  MicrophoneIcon as MicrophoneOutlineIcon,
  NewspaperIcon as NewsOutlineIcon,
  HeartIcon as HeartOutlineIcon,
  ClockIcon as ClockOutlineIcon,
  QueueListIcon as QueueOutlineIcon,
} from '@heroicons/react/24/outline';

interface CompInterface {
  href: string;
  icon: {
    Solid: React.ElementType;
    Outline: React.ElementType;
  };
  text?: string;
}

const AsideListComponent: React.FC<CompInterface> = ({ href, icon, text }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const IconComponent = isActive ? icon.Solid : icon.Outline;

  return (
    <motion.div
      className='relative'
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={href} passHref>
        <motion.div
          data-tooltip-id={text ? `tooltip-${text}` : undefined}
          className={`relative my-1 flex items-center justify-center rounded-lg p-3 transition-all ${isActive ? 'text-white' : 'hover:text-[#7289DA]'}`}
          whileHover={{
            backgroundColor: 'rgba(114, 137, 218, 0.05)',
            transition: { duration: 0 },
          }}
        >
          {isActive && (
            <motion.div
              layoutId='active-indicator'
              className='absolute left-0 h-8 w-1 -translate-y-1/2 transform rounded-full bg-[#7289DA]'
            />
          )}
          <motion.div>
            <IconComponent
              className={`h-5 w-5 transition-colors ${
                isActive
                  ? 'text-white opacity-100'
                  : 'text-gray-300 opacity-90 hover:opacity-100'
              }`}
            />
          </motion.div>
        </motion.div>
      </Link>
      {text && (
        <Tooltip
          id={`tooltip-${text}`}
          place='right'
          content={text}
          className='z-50'
          style={{
            backgroundColor: '#18191c',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            padding: '8px 12px',
          }}
          offset={12}
        />
      )}
    </motion.div>
  );
};

const AsidePanelLeft: React.FC = () => {
  return (
    <motion.aside
      className='fixed left-0 z-10 ml-3 bg-[#1C1C1F]'
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className='m-1 flex w-[62px] flex-col rounded-[20px] border-b-[0.5px] border-t-[0.5px] border-[#2d2d2d] bg-[#FFFFFF1A] shadow-lg'>
        <div className='mt-2'>
          <AsideListComponent
            href='/'
            icon={{ Solid: HomeSolidIcon, Outline: HomeOutlineIcon }}
            text='Головна'
          />
          <AsideListComponent
            href='/chats'
            icon={{ Solid: ChatSolidIcon, Outline: ChatOutlineIcon }}
            text='Чати'
          />
          <AsideListComponent
            href='/voice'
            icon={{
              Solid: MicrophoneSolidIcon,
              Outline: MicrophoneOutlineIcon,
            }}
            text='Голосові канали'
          />
          <AsideListComponent
            href='/blogs'
            icon={{ Solid: NewsSolidIcon, Outline: NewsOutlineIcon }}
            text='Блоги'
          />
        </div>
        <div className='mb-[440px] mt-5 border-t border-gray-700 pt-2'>
          <AsideListComponent
            href='/favorites'
            icon={{ Solid: HeartSolidIcon, Outline: HeartOutlineIcon }}
            text='Вподобане'
          />
          <AsideListComponent
            href='/history'
            icon={{ Solid: ClockSolidIcon, Outline: ClockOutlineIcon }}
            text='Історія'
          />
          <AsideListComponent
            href='/playlists'
            icon={{ Solid: QueueSolidIcon, Outline: QueueOutlineIcon }}
            text='Плейлисти'
          />
        </div>
      </div>
    </motion.aside>
  );
};

export default AsidePanelLeft;
