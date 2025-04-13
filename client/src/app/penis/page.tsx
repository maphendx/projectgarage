
"use client"
import { useEffect } from "react";

const aboba = () => {
    useEffect(() => {
        const audio = new Audio("https://c260-188-163-113-175.ngrok-free.app/media/posts/audio/b6e5e86c5d51af123e36e9604bc2360e_5a766c4f4c554126a1893c3a271a9c12.mp3");
        audio.play();
        
        return () => {
          audio.pause(); // Зупиняємо пісню, коли компонент буде демонтований
          audio.currentTime = 0; // Скидаємо час на початок
        };
      }, []);
    
      return <div>Грає пісня...</div>;
}

export default aboba