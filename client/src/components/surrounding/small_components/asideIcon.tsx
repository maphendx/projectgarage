const AsideIcon = ({ img_url, text, about } : { img_url : string, text : string, about : string }) => { // чел для блокчів справа
    return (
        <div className="flex items-center mt-4">
            <div className="relative">
                <img src={img_url} className="min-h-12 min-w-12 max-h-12 max-w-12 rounded-full" alt="типо чел"/>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-gray-800"></span>
            </div>
            <div className="ml-3">
                <p className="text-base font-medium text-white">{text}</p>
                <p className="text-sm text-gray-400">{about}</p>
            </div>
        </div>
    )
}

export default AsideIcon