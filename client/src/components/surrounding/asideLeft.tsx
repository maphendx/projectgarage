import React from 'react';
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
  activePage?: boolean;
  icon: React.ElementType;
  text?: string;
}

const AsideListComponent: React.FC<CompInterface> = ({
  activePage = false,
  icon: Icon,
  text,
}) => {
  const baseClass =
    'flex items-center justify-center p-3 my-1 rounded-lg transition-all duration-300 ease-in-out relative';

  const selector = activePage ? (
    <div className='absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 transform rounded-full bg-[#7289DA]' />
  ) : null;

  return (
    <div className='relative'>
      <a
        href='#'
        data-tooltip-id={text ? `tooltip-${text}` : undefined}
        className={`${baseClass}`}
      >
        {selector}
        <Icon className='text-xl' />
      </a>
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
    </div>
  );
};

const AsidePanelLeft: React.FC = () => {
  return (
    <aside className='fixed left-0 z-10 ml-3 bg-[#1C1C1F]'>
      <div
        className='m-1 flex w-[62px] flex-col rounded-[20px] border-[1px] border-white border-opacity-10 bg-[#FFFFFF1A] shadow-lg'
        style={{ boxShadow: '0 3px 3px rgba(216, 180, 255, 0.60)' }}
      >
        <div className='mt-2'>
          <AsideListComponent activePage={true} icon={FaHome} text='Головна' />
          <AsideListComponent icon={FaServer} text='Сервери' />
          <AsideListComponent icon={FaComments} text='Чати' />
          <AsideListComponent icon={FaMicrophone} text='Голосові канали' />
          <AsideListComponent icon={FaBlog} text='Блоги' />
        </div>
        <div className='mb-96 mt-5 border-t border-gray-700 pt-2'>
          <AsideListComponent icon={FaHeart} text='Вподобане' />
          <AsideListComponent icon={FaHistory} text='Історія' />
          <AsideListComponent icon={FaList} text='Плейлисти' />
          <AsideListComponent icon={FaDownload} text='Завантаження' />
        </div>
      </div>
    </aside>
  );
};

export default AsidePanelLeft;
