import AsideIcon from "./small_components/asideIcon";
import AsideVoiceChannel from "./small_components/asideVoiceChannel";


export function AsidePanelRight() { // права панель
    return (
        <div className="fixed z-10 mt-16 right-0">
            <aside className="flex flex-col w-72 bg-black">
                <div className="bg-[#232323] shadow-[0_3px_5px_5px_#232323] flex-grow ml-5 mr-3">
                    <nav className="mt-5 px-2 z-10">
                        <h3 className="my-5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Рекомендовані музиканти
                        </h3>

                        <AsideIcon text="Борат Саґдієв" about="Я Борат, журналіст з Казахстан" img_url="https://cdn.discordapp.com/attachments/1171496921660137504/1317951505734832230/image.png?ex=678425fd&is=6782d47d&hm=ba603b0e057a55abd7b69a76ca6bcc7b04b523c24ccba2bc725a11f3fa50886e&" />
                        <AsideIcon text="Борат Саґдієв" about="Я тоже є Борат, журналіст з Казахстан" img_url="https://cdn.discordapp.com/attachments/1171496921660137504/1317951505734832230/image.png?ex=678425fd&is=6782d47d&hm=ba603b0e057a55abd7b69a76ca6bcc7b04b523c24ccba2bc725a11f3fa50886e&" />
                        
                        <h3 className="my-5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Активні чати
                        </h3>

                        <AsideIcon text="Патріотичний гурток" about="Обговорення думок та уподобань біля теплого багаття" img_url="https://images.squarespace-cdn.com/content/v1/53345a30e4b0e0212de83d1a/1573490956531-9N7ZM01J64LMZZJW56VX/image-asset.jpeg" />

                        <h3 className="my-5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Активні голосові канали
                        </h3>

                        <AsideVoiceChannel />
                        <div className="mb-96"></div>
                    </nav>
                </div>
            </aside>
        </div>
    )
}




