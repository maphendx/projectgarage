const AsideVoiceChannel = () => {
  // блок войс чатів
  return (
    <div className='px-5 py-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <i className='fas fa-music mr-3 text-[#1DB954]'></i>
          <div>
            <p className='text-sm font-medium text-[#ffffff]'>Гей парад</p>
            <p className='text-xs text-[#A1A1A1]'>10 учасників</p>
          </div>
        </div>
        <button className='rounded-[20px] bg-[#6374B6] px-3 py-1 text-sm text-[#ffffff] duration-200 hover:py-2'>
          Приєднатися
        </button>
      </div>
    </div>
  );
};

export default AsideVoiceChannel;
