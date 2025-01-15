import AsideListComponent from "./small_components/asideListComponent"

const AsidePanelLeft = () => { // ліва панель
    return (
        <aside className="fixed z-10 mt-16">
            <div className="flex flex-col w-64 bg-black">
                <div className="bg-[#232323] shadow-[0_3px_5px_5px_#232323] flex-grow mr-5 px-2">
                        <div className="bg-black mt-5">
                            <AsideListComponent text="Головна" activePage="true" iconClass="fas fa-home mr-4" />
                            <AsideListComponent text="Сервери" iconClass="fas fa-server mr-4" />
                            <AsideListComponent text="Чати" iconClass="fas fa-comments mr-4" />
                            <AsideListComponent text="Голосові канали" iconClass="fas fa-microphone mr-4" />
                            <AsideListComponent text="Блоги" iconClass="fas fa-blog mr-4" />
                        </div>

                        <h3 className="my-5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Моя музика
                        </h3>

                        <div className="bg-black">
                            <AsideListComponent text="Вподобане" iconClass="fas fa-heart mr-4" />
                            <AsideListComponent text="Історія" iconClass="fas fa-history mr-4" />
                            <AsideListComponent text="Плейлисти" iconClass="fas fa-list mr-4" />
                            <AsideListComponent text="Завантаження" iconClass="fas fa-download mr-4" />
                        </div> 
                        <div className="mb-96"></div>
                </div>
            </div>
        </aside>
    )
}

export default AsidePanelLeft