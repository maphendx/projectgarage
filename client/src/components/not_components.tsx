export interface UserData {
  id: number;
  display_name?: string;
  full_name?: string;
  email?: string;
  photo?: string;
  bio?: string;
  hashtags?: { name: string }[];
  subscriptions_count?: number;
  subscribers_count?: number;
  total_likes?: number;
  posts?: Post[];
  muted?: boolean;
  talks?: number;
}

export interface Post {
  id: number;
  content?: string;
  likes: number[];
  comments?: number;
  original_post?: number;
  created_at?: string;
  images: { id: number; image: string }[];
  audios: { id: number; audio: string }[];
  videos: { id: number; video: string }[];
  is_liked?: boolean;
  hashtag_objects: { id: number; name: string }[];
  author: { display_name?: string; photo?: string; id: number };
}

const dateFormatter = (get: string | undefined) => {
  if (!get) {
    return 'Де дата? Нема дати!';
  }
  const date = new Date(get);

  const formatter = new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return formatter.format(date);
};

export default dateFormatter;

export enum FileType {
  Photo = 'PHOTO',
  Audio = 'AUDIO',
  Video = 'VIDEO',
}

export interface FileContainer {
  photos: File[];
  videos: File[];
  audios: File[];
}
