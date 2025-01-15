import { useEffect, useState } from "react";
import { Post, UserData } from "../not_components";
import { PostBlock } from "./main_page_components/postBlock";
import NewPostBlock from "./main_page_components/newPostBlock";

interface compInterface {
    userData : UserData | null,
    postsList : Post[] | null,
    handlePostsListTrigger : () => void // знову ж чел для того, щоб перезавантажити список постів
}

const MainContent = ({userData, postsList, handlePostsListTrigger} : compInterface) => {

    const [localPostsList, setLocalPostsList] = useState<Post[] | null>(postsList); 

    useEffect(() => {
        setLocalPostsList(postsList);
    },
    [postsList]);

    return (
        <main className="flex-1 relative overflow-y-auto focus:outline-none mt-16">
            <div className="py-6">
                <div className="max-w-3xl mx-auto px-4 min-h-screen">
                    <NewPostBlock userData={userData} handlePostsListTrigger={handlePostsListTrigger} />
                    {localPostsList? localPostsList.map((post: Post) => {
                        return (
                            <PostBlock getUser={userData} key={post.id} getPost={post} />
                        )
                    }) : []}
                </div>
            </div>
        </main>
    )
}

export default MainContent