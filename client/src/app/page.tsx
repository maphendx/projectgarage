"use client"

import MainContent from "@/components/important/main_page_content";
import { Post, UserData } from "@/components/not_components";
import { InfoBlock } from "@/components/other";
import AsidePanelLeft from "@/components/surrounding/asideLeft";
import { AsidePanelRight } from "@/components/surrounding/asideRight";
import MusicPlayer from "@/components/surrounding/player";
import Topbar from "@/components/surrounding/topbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {

    const [router, setRouter] = useState(useRouter());
    const [userData, setUserData] = useState<UserData | null>(null); // авторизований юзер
    const [postsListToShow, setPostsListToShow] = useState<Post[] | null>(null); // список постів, який показується
    const [error, setError] = useState<string | null>(null);
    const [postsListTrigger, setPostsListTrigger] = useState<boolean>(false) // перемикання цього тригера ще раз прогружає пости
    const handlePostsListTrigger = () => { setPostsListTrigger(!postsListTrigger) } // цей чел якраз перемикає

    const fetchData = async (url: string) => { // загальна функція для одеражання json даних по url 
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }
  
        try {
          const dataResponse = await fetch(
            url,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
  
          if (!dataResponse.ok) {
            throw new Error(
              `HTTP error! status: ${dataResponse.status}`
            );
          }
          const data = await dataResponse.json();
          return data;
          
        } catch (error) {
          //console.error(`Не вдалося отримати дані за "${url}":`, error);
          setError(
            `Не вдалося отримати дані за "${url}":` + error
          );
          if (error instanceof Error && error.message.includes("401")) {
            localStorage.removeItem("token");
            router.push("/");
          }
        }
    }

    useEffect(() => { // поставиш свій токен
        localStorage.setItem("token", "09510aabf8c4a8006650e09af19489323c10805e")
    }, [])

    useEffect(() => { // хук для даних користувача : тільки при переходах між сторінками
        const loadData = async () => {
            const userDataResponse = await fetchData("http://localhost:8000/api/users/profile/");
            if (userDataResponse) {
              setUserData(userDataResponse);
            }
        };
        loadData();
    }, [router])

    useEffect(() => { // хук для списку постів : при переходах між сторінками + при додаванні нового поста через панельку
        const loadData = async () => {
            const postsListResponse: Post[] = await fetchData("http://localhost:8000/api/posts/posts/");
            if (postsListResponse) {
                const reversed = postsListResponse.reverse();
                setPostsListToShow(reversed);
            }
        };
        
        loadData();
    }, [router, postsListTrigger])

    return (
        <div className="bg-gradient-to-b from-[#1E1E48] to-[#121212]  text-white min-h-screen flex flex-col">
            <div className="bg-[radial-gradient(circle,_rgba(0,_0,_0,_0.3),_rgba(0,_99,_54,_0.4))]">
                <Topbar paramUserData={userData} />
                <div className="flex-1 flex">
                    <AsidePanelLeft />
                    <MainContent userData={userData} postsList={postsListToShow} handlePostsListTrigger={handlePostsListTrigger} />
                    <AsidePanelRight />
                </div>
                <MusicPlayer />
            </div>
            {error && <InfoBlock getMessage={`Помилка! ${error}`} getClasses="bg-red-600" getIconClasses="fa fa-times-circle" isAlive={true}/>}
        </div>
    );
}

