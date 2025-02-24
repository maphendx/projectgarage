import PlayerButton from './small_components/playerButton';
import Image from 'next/image';

export default function MusicPlayer() {
  // програвач: наразі приховав, бо зочем
  return (
    <footer className='fixed bottom-0 z-20 hidden min-w-full bg-black shadow-[0_-3px_5px_2px_#000000]'>
      <div className='max-w-8xl mx-auto h-20 px-4'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex items-center'>
            <Image
              src='/path/to/image'
              alt='description'
              width={500}
              height={300}
            />
            <div className='ml-3'>
              <p className='text-sm font-medium text-white'>Літній дощ</p>
              <p className='text-xs text-gray-400'>Віктор Павлік</p>
            </div>
          </div>
          <div className='flex items-center space-x-6'>
            <PlayerButton iconClass='fas fa-backward' />
            <button className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 hover:bg-gray-200'>
              <i className='fas fa-play'></i>
            </button>
            <PlayerButton iconClass='fas fa-forward' />
          </div>
          <div className='mr-4 flex items-center space-x-4'>
            <PlayerButton iconClass='fas fa-volume-up' />
            <PlayerButton iconClass='fas fa-random' />
            <PlayerButton iconClass='fas fa-redo' />
          </div>
        </div>
      </div>
    </footer>
  );
}
