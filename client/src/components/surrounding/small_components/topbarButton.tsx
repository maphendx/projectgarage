const TopbarButton = ({iconClass} : {iconClass: string}) => {
    return (
        <button className="p-2 rounded-xl duration-300 hover:bg-gray-700 mr-2">
            <i className={iconClass}></i>
        </button>
    )
}

export default TopbarButton