import { useEffect, useState } from "react";
import { UserData } from "../not_components";
import TopbarSearchField from "./small_components/topbarSearchField";
import TopbarButton from "./small_components/topbarButton";
import TopbarSigmaButton from "./small_components/topbarSigmaButton";

export default function Topbar({ paramUserData }: { paramUserData: UserData | null }) {

    const [userData, setUserData] = useState<UserData | null>(paramUserData);

    useEffect(() => {
        setUserData(paramUserData)
    }, [paramUserData])

    return (
    <nav className="fixed min-w-full z-20 bg-black shadow-[0_3px_5px_2px_#000000]">
        <div className="max-w-8xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">

                <TopbarSearchField />

                <div className="flex items-center">
                    <TopbarSigmaButton />
                    <TopbarButton iconClass="fas fa-bell text-gray-300" />
                    <TopbarButton iconClass="fas fa-envelope text-gray-300" />

                    <div className="flex items-center mr-2 duration-300 hover:bg-gray-700 p-1.5 rounded-xl">
                        <img className="h-8 w-8 rounded-full" src={userData? userData.photo : "Завантаження..."} alt="Челік"/>
                        <span className="ml-2 text-sm font-medium">{userData? userData.display_name : "Завантаження..."}</span>
                    </div>
                </div>
            </div>
        </div>
    </nav>
    )
}