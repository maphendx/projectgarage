import PlayerButton from './small_components/playerButton';

export default function MusicPlayer() {
  // програвач: наразі приховав, бо зочем
  return (
    <footer className='fixed bottom-0 z-20 hidden min-w-full bg-black shadow-[0_-3px_5px_2px_#000000]'>
      <div className='max-w-8xl mx-auto h-20 px-4'>
        <div className='flex h-full items-center justify-between'>
          <div className='flex items-center'>
            <img
              className='h-10 w-10 rounded'
              src='https://creatie.ai/ai/api/search-image?query=album cover art with rain theme, electronic music style&width=100&height=100&orientation=squarish&flag=bcacfaf1-de9b-45fd-acdb-ffdb6a4f9eca&flag=b3bee361-39f1-4f2f-ae11-e40815d17f57&flag=b95c750c-a083-48ba-9d84-8d53d9ac379a&flag=3ed28cd2-fae6-46af-8434-bef494f0ec73&flag=19888a9c-eb35-43dc-ac0b-7061b976775a'
              alt='Album'
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
