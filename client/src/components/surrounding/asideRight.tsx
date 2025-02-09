import AsideIcon from './small_components/asideIcon';
import AsideVoiceChannel from './small_components/asideVoiceChannel';

export function AsidePanelRight() {
  // права панель
  return (
    <aside className='fixed right-0 z-10'>
      <div
        className='m-1 mr-4 flex w-[300px] flex-col overflow-hidden rounded-[20px] border-[1px] border-white border-opacity-10 bg-[#FFFFFF1A]'
        style={{ boxShadow: '0 4px 4px rgba(216, 180, 255, 0.60)' }}
      >
        <div className='ml-5 mr-3'>
          <nav className='z-10 mt-5 px-2'>
            <div
              className='mb-5 rounded-[20px] border-[1px] border-white border-opacity-10 bg-[#FFFFFF1A]'
              style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
            >
              <h3 className='px-5 pt-5 text-[12px] font-semibold tracking-wider text-[#ffffff]'>
                Рекомендовані виконавці
              </h3>

              <AsideIcon
                text='Борат Саґдієв'
                about='Я Борат, журналіст з Казахстан'
                img_url=''
              />
              <AsideIcon
                text='Юрко Рибка'
                about='Я Юкро, журналіст з Казахстан'
                img_url=''
              />
              <AsideIcon
                text='Патріотична Бджілка'
                about='Я Бджілка, просто бджілка'
                img_url=''
              />
              <div className='mt-5 px-5 pb-5 font-sans text-[10px] font-medium tracking-wider text-[#A1A1A1]'>
                Показати більше...
              </div>
            </div>

            <div
              className='mb-5 rounded-[20px] border-[1px] border-white border-opacity-10 bg-[#FFFFFF1A] pb-5'
              style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
            >
              <h3 className='px-5 pt-5 text-[12px] font-semibold tracking-wider text-[#ffffff]'>
                Активні чати
              </h3>

              <AsideIcon
                text='Патріотичний гурток'
                about='15 учасників'
                img_url=''
              />
              <AsideIcon
                text='Третій Рейх'
                about='1933 учасників '
                img_url=''
              />
            </div>

            <div
              className='mb-5 rounded-[20px] border-[1px] border-white border-opacity-10 bg-[#FFFFFF1A]'
              style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
            >
              <h3 className='px-5 pt-5 text-[12px] font-semibold tracking-wider text-[#ffffff]'>
                Активні голосові канали
              </h3>{' '}
              <AsideVoiceChannel />
            </div>

            <div className='mb-96'></div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
