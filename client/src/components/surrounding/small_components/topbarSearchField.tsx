const TopbarSearchField = () => {
  return (
    <div className='group relative ml-10 flex-1 transition-all duration-300 ease-out'>
      <div className='relative'>
        <div className='absolute left-2 top-1/2 -translate-y-1/2 transform'>
          <i
            className='fas fa-search ml-2 mt-[20px] text-[#A1A1A1]'
            style={{ opacity: 0.6, lineHeight: '52px' }}
          ></i>
        </div>
        <input
          type='text'
          placeholder='Пошук...'
          className='text-ml-4 mt-5 h-[52px] w-[1190px] rounded-[16px] bg-[rgb(43,45,49)] px-4 pr-10 text-[#A1A1A1] placeholder-[#A1A1A1]/60 transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#2B2D31]'
          style={{
            boxShadow: '0 0 5px rgba(216, 180, 255, 0.6)',
            paddingLeft: '40px',
          }}
        />
      </div>
    </div>
  );
};

export default TopbarSearchField;
