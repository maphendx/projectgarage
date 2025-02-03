import React from 'react';

// Регулярний вираз для пошуку YouTube URL в тексті
const youtubeUrlRegex =
  /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:[^\/]+\/.*\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

interface Props {
  content: string; // Текст, який може містити URL відео
}

const VideoEmbed = ({ content }: Props) => {
  // Функція для обробки тексту і заміни YouTube URL на плеєр
  const renderContent = (text: string) => {
    const parts = text.split(youtubeUrlRegex); // Розділяємо текст на частини за допомогою регулярного виразу

    return parts.map((part, index) => {
      // Якщо частина - це ID відео, то створюємо плеєр
      if (index % 2 !== 0) {
        const videoId = part; // це буде ID відео
        return (
          <iframe
            key={videoId}
            width='560'
            height='315'
            src={`https://www.youtube.com/embed/${videoId}`}
            className='my-3 rounded-xl shadow-[0_3px_5px_2px_#101010] duration-300 hover:shadow-[0_1px_5px_2px_#000000]'
            title='YouTube video player'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        );
      }
      // В іншому випадку просто відображаємо текст
      return <span key={index}>{part}</span>;
    });
  };

  return <>{renderContent(content)}</>;
};

export default VideoEmbed;
