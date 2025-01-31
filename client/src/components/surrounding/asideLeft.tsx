'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import {
  FaHome,
  FaServer,
  FaComments,
  FaMicrophone,
  FaBlog,
  FaHeart,
  FaHistory,
  FaList,
  FaDownload,
} from 'react-icons/fa';

interface CompInterface {
  href: string;
  icon: React.ElementType;
  text?: string;
}

const AsideListComponent: React.FC<CompInterface> = ({
  href,
  icon: Icon,
  text,
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <motion.div
      className='relative'
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={href} passHref>
        <div
          data-tooltip-id={text ? `tooltip-${text}` : undefined}
          className={`relative my-1 flex items-center justify-center rounded-lg p-3 transition-all duration-300 ease-in-out ${
            isActive ? 'text-white' : ''
          }`}
        >
          {isActive && (
            <motion.div
              layoutId='active-indicator'
              className='absolute left-0 h-8 w-1 -translate-y-1/2 transform rounded-full bg-[#7289DA]'
            />
          )}
          <Icon
            className={`text-xl ${isActive ? 'text-white opacity-100' : 'text-gray-300 opacity-90'}`}
          />
        </div>
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
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div
        className='m-1 flex w-[62px] flex-col rounded-[20px] border-[1px] border-white border-opacity-10 bg-[#FFFFFF1A] shadow-lg'
        style={{ boxShadow: '0 3px 3px rgba(216, 180, 255, 0.60)' }}
      >
        <div className='mt-2'>
          <AsideListComponent href='/home' icon={FaHome} text='Головна' />
          <AsideListComponent href='/servers' icon={FaServer} text='Сервери' />
          <AsideListComponent href='/chats' icon={FaComments} text='Чати' />
          <AsideListComponent
            href='/voice'
            icon={FaMicrophone}
            text='Голосові канали'
          />
          <AsideListComponent href='/blogs' icon={FaBlog} text='Блоги' />
        </div>
        <div className='mb-96 mt-5 border-t border-gray-700 pt-2'>
          <AsideListComponent
            href='/favorites'
            icon={FaHeart}
            text='Вподобане'
          />
          <AsideListComponent href='/history' icon={FaHistory} text='Історія' />
          <AsideListComponent
            href='/playlists'
            icon={FaList}
            text='Плейлисти'
          />
          <AsideListComponent
            href='/downloads'
            icon={FaDownload}
            text='Завантаження'
          />
        </div>
      </div>
    </motion.aside>
  );
};

export default AsidePanelLeft;
