
const AsideVoiceChannel = () => { // блок войс чатів
    return (
        <div className="bg-[#374151] rounded-lg p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <i className="fas fa-music text-custom mr-3 text-[#1DB954]"></i>
                    <div>
                        <p className="text-sm font-medium text-white">Гей парад</p>
                        <p className="text-xs text-gray-400">10 учасників</p>
                    </div>
                </div>
                <button className="bg-[#1DB954] hover:bg-[#169F46] duration-200 hover:py-2 rounded-xl text-white px-3 py-1 text-sm">
                    Приєднатися
                </button>
            </div>
        </div>
    )
}

export default AsideVoiceChannel;