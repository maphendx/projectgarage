export interface UserData {
  display_name?: string;
  full_name?: string;
  email?: string;
  photo?: string;
  bio?: string;
  hashtags?: string[];
  subscriptions_count?: number;
  subscribers_count?: number;
  total_likes?: number;
}

export interface Post {
  id: number;
  content?: string;
  likes?: number[];
  comments?: number;
  reposts?: string[];
  created_at?: string;
  image?: string;
  audio?: string;
  is_liked?: boolean;
  author?: { display_name?: string; photo?: string };
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
  Photo = "PHOTO",
  Audio = "AUDIO",
  Video = "VIDEO",
}

export interface FileContainer {
  photos : File[],
  videos : File[],
  audios : File[],
}