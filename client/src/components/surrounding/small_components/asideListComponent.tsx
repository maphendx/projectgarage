interface compInterface {
    activePage?: string, // чи ця вкладка (сторінка) зараз обрана (ми на ній ща)
    iconClass: string, // клас для іконки
    text: string
}

const AsideListComponent = ({ activePage, iconClass, text } : compInterface) => { // чел для блочків зліва
    return (
        <a href="#" className={activePage === 'true'?
             'bg-gray-700 cursor-default group flex items-center p-2 text-base font-medium my-1 text-gray-300 hover:bg-gray-700' :
              'bg-[#080808] group flex items-center p-2 text-base duration-300 font-medium my-1 text-gray-300 hover:bg-gray-600 hover:text-white'}>
            <i className={iconClass}></i>
            {text}
        </a>
    )
}

export default AsideListComponent;