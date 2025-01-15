interface compInterface {
    iconClass? : string, // клас для іконки
    text? : any, 
    onClick? : any, // обробник натискання
    additionClasses? : string // додатково докинути класів, щоб стилізувати конкретну кнопку
}

const PostButton = ({iconClass, text, onClick, additionClasses} : compInterface) => {
    return ( // маленька кнопочка мімімі, яка тусується в постах
        <button className={`flex items-center text-gray-400 hover:text-gray-300 ${additionClasses}`} onClick={onClick}>
            <i className={iconClass}></i>
            {text}
        </button>
    )
}

export default PostButton