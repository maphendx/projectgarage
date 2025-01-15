import { UserData } from "@/components/not_components";
import { useState } from "react";

interface compInterface {
    isVisible : boolean,
    userData : UserData | null,
    postId : number,
    commentList : Array<{ content : string, id : number }>,
    updateListOfComments : (commentAdd? : boolean) => Promise<void>
}

const CommentBlock = ({isVisible, userData, postId, commentList, updateListOfComments} : compInterface) => { // компонента з УСІМА коментарами

    const [content, setContent] = useState("");
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(event.target.value);
    };

    const handleClick = async () => { // одбробник кнопки створення коментаря
        const token = localStorage.getItem("token");

        try {
            if (content.length <= 5 || content.trim().length <= 3) {
                throw Error("Текст коментара занадто короткий!")
            }

            const postPostResponse = await fetch(`http://localhost:8000/api/posts/posts/${postId}/comments/`,
                {
                    headers: {
                        "Authorization": `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        "content": content,
                    })
                }
            )
    
            if (!postPostResponse.ok) {
                const data = await postPostResponse.json();
                throw new Error(data.message)
            }
            else {
                updateListOfComments(true);
                setContent("");
            }
        }
        catch (Error) {
            console.error(`Публікація не вдалась! ${Error}`)
        }
    }

    return (
        <div className={`bg-[#181717] rounded-lg p-6 shadow-xl border-[#101010] -translate-y-6 border-2 ${isVisible? "" : "hidden"}`}>
            <div className="flex mb-4">
                <img className="h-12 w-12 rounded-full" src={userData? userData.photo : "Завантаження..."} alt="User"/>
                <button className="bg-[#2f3846] rounded-l-xl text-white p-4 ml-3 duration-300 hover:bg-[#1b1f27]" onClick={handleClick}>
                    <i className="fa fa-paper-plane fs-lg"></i>
                </button>
                <textarea rows={2} className="w-full border-0 bg-[#374151] text-gray-400 placeholder-[#6B7280] p-1 rounded-r-xl" value={content} onChange={handleChange} placeholder="Додати коментар..."></textarea>
            </div>
            {commentList instanceof Array? commentList.map((comment) => {
                return (
                    <div className="flex mb-4" key={comment.id}>
                        <img className="h-12 w-12 rounded-full mr-3" src={userData? userData.photo : "Завантаження..."} alt="User"/>
                        <p className="w-full border-0 bg-[#374151] text-gray-400 placeholder-[#6B7280] p-1 rounded-xl">
                            {comment.content}
                        </p>
                    </div>
                )
            }) : []}
        </div>
    )
}

export default CommentBlock