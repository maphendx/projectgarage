import Image from 'next/image';

const AsideIcon = ({
  img_url,
  text,
  about,
}: {
  img_url?: string;
  text: string;
  about: string;
}) => {
  return (
    <div className='mt-4 flex items-center'>
      <div className='relative'>
        {img_url ? (
          <Image
            src={img_url}
            className='ml-5 h-12 w-12 rounded-[14px] bg-[#D9D9D9]'
            alt='типо чел'
            width={48}
            height={48}
          />
        ) : (
          <div className='ml-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#D9D9D9] text-white'>
            ❔
          </div>
        )}
        <span className='absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-gray-800'></span>
      </div>
      <div className='ml-3 mr-2'>
        <p className='text-[12px] font-medium text-white'>{text}</p>
        <p className='mr-1 text-[12px] text-[#A1A1A1]'>{about}</p>
      </div>
    </div>
  );
};

export default AsideIcon;
