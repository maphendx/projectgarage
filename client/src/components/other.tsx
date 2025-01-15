import { useState, useEffect } from "react";

/*

    Цей чел працює вельми містично

*/

export const InfoBlock = ({ getClasses, getIconClasses, getMessage, isAlive } : { getClasses : string, getIconClasses? : string, getMessage : string, isAlive : boolean}) => {

    const [visible, setVisible] = useState<boolean>(false)
    const [suicide, doSuicide] = useState<boolean>(false)
    
    useEffect(() => {
        if (!isAlive) {
            setVisible(false)
            doSuicide(true)

        }
    }, [isAlive]);

    useEffect(() => {
        const timeout = setTimeout(() => setVisible(true), 10); // для появи
        setTimeout(() => { // для зникнення і подальшого самогубства
            setVisible(false)
            setTimeout(() => { doSuicide(true) }, 1001)
        }, 10000 )
        return () => clearTimeout(timeout);
    })

    return suicide? null : (
        <div className={`${getClasses} fixed z-20 flex flex-row items-center text-white
         p-3 ${visible? "-translate-y-5" : "translate-y-96"}
        transition-all -translate-x-1/2 left-1/2 
        rounded-xl bottom-0 duration-1000 ease-in`}>
            {getIconClasses && <i className={`${getIconClasses} mr-3 fa-lg`} aria-hidden="true"></i>}
            <p className="">
                {getMessage}
            </p>
        </div>
    )
}