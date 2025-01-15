import { InfoBlock } from "@/components/other";
import PostButton from "./postButton";
import { ReactElement, useState } from "react";
import { UserData } from "@/components/not_components";

interface compInterface {
    userData : UserData | null,
    handlePostsListTrigger : () => void // чел, який по ієрархії передається вниз, щоб, при створенні нового поста, ще раз одержати (оновити?) їх список і новий поц динамічно з'явився
}

const NewPostBlock = ({userData, handlePostsListTrigger} : compInterface) => {

    const [content, setContent] = useState("");
    const [messageControl, setMessageControl] = useState<boolean>(true); // ці два поца для загального повідомлення (infoblock) про щось вдалий або невдалий пост
    const [messageBlock, setMessageBlock] = useState<any>(null);

    const updateMessage = (message : ReactElement) => { // цей теж для для того повідомлення
        if (messageBlock !== null) {
            setMessageControl(false);
            setTimeout(() => {
                setMessageControl(true)
                setMessageBlock(message)
            }, 1010)
        }
        else {
            setMessageControl(true)
            setMessageBlock(message)
        }
    }

    const handleClick = async () => { // обробник кнопки створення поста
        const token = localStorage.getItem("token");

        if (content.length <= 5 || content.trim().length <= 3) {
            //console.error(`Публікація не вдалась!`);
            updateMessage(<InfoBlock key={Date.now()} getClasses="bg-red-600" getMessage="Текст посту занадто короткий!" getIconClasses="fa fa-times-circle" isAlive={messageControl} />);
            return;
        }
        
        try {
            const postPostResponse = await fetch("http://localhost:8000/api/posts/posts/",
                {
                    headers: {
                        "Authorization": `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        "content": content,
                        "hashtags": [1],
                    })
                }
            )
    
            if (!postPostResponse.ok) {
                const data = await postPostResponse.json();
                throw new Error(data.message)
                //console.error(`Публікація не вдалась! ${JSON.stringify(data)}`);
            }
            else {
                handlePostsListTrigger();
                setContent("");
                updateMessage(<InfoBlock key={Date.now()} isAlive={messageControl} getClasses="bg-green-600" getIconClasses="fa fa-check-circle" getMessage="Пост успішно опубліковано!" />);
            }
        }
        catch (Error) {
            updateMessage(<InfoBlock key={Date.now()} getClasses="bg-red-600" getMessage={`Публікація не вдалась! ${Error}`} getIconClasses="fa fa-times-circle" isAlive={messageControl} />);
        }
    }

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(event.target.value);
    };

    return (
        <div className="bg-[#1E1E1E] rounded-lg p-6 mb-6 shadow-xl border-[#101010] border-2">
            <div className="flex items-center mb-4">
                <img className="h-10 w-10 rounded-full" src={userData? userData.photo : "Завантаження..."} alt="User"/>
                <div className="ml-3 flex-1">
                    <textarea rows={1} className="w-full border-0 bg-[#374151] text-gray-400 placeholder-[#6B7280] p-1 rounded" onChange={handleChange} value={content} placeholder="Що нового у світі музики?"></textarea>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                    <PostButton text="Фото" iconClass="fas fa-image mr-2" />
                    <PostButton text="Відео" iconClass="fas fa-video mr-2" />
                    <PostButton text="Аудіо" iconClass="fas fa-music mr-2" />
                </div>
                <button className="bg-[#1DB954] rounded-lg text-white px-4 py-2 duration-300 hover:bg-[#169F46]" onClick={handleClick}>
                    Опублікувати
                </button>
            </div>
            { messageBlock }
        </div>
    )
}

export default NewPostBlock