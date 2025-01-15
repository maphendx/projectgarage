const TopbarSearchField = () => {
    return (
        <div className="ml-10 flex-1 max-w-80 relative focus-within:max-w-lg ease-out duration-500">
            <input type="text" className="w-full bg-[#939497] focus:bg-slate-300 focus:outline-none py-2 pr-5 pl-3 text-[#514d4d] placeholder-[#BCBCBC]" placeholder="Пошук музикантів, груп, блогів..."/>
            <div className="absolute inset-y-0 right-0 mr-3 flex items-center">
                <i className="fas fa-search text-[#BCBCBC]"></i>
            </div>
        </div>
    )
}

export default TopbarSearchField