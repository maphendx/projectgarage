'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Topbar from '@/components/surrounding/topbar';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

type UserData = {
  id: number;
  username: string;
  display_name?: string;
  email: string;
};

type BlogPost = {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  image?: string;
  tags?: string[];
  readTime?: string;
  likes?: number;
};

const categories = [
  'Всі',
  'Музичні жанри',
  'Інструменти',
  'Музиканти',
  'Композитори',
  'Музична теорія',
];

export default function BlogDiscover() {
  const [userData] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  const [blogPosts] = useState<BlogPost[]>([
    {
      id: 1,
      title: 'Еволюція Джазу',
      content:
        'Досліджуємо розвиток джазу від його народження в Новому Орлеані до сучасних форм, аналізуючи ключові фігури та моменти, що визначили цей жанр.',
      author: 'Олена Сорока',
      date: '1 листопада 2023',
      image: '/api/placeholder/800/400',
      tags: ['джаз', 'музичні жанри'],
      readTime: '5 хв',
      likes: 345,
    },
    {
      id: 2,
      title: 'Мистецтво Гри на Гітарі',
      content:
        'Відкриваємо секрети майстерності гри на гітарі, від акустичних мелодій до електричних соло, розглядаючи техніки та історію цього улюбленого інструменту.',
      author: 'Михайло Коваль',
      date: '2 листопада 2023',
      image: '/api/placeholder/800/400',
      tags: ['інструменти', 'гітара'],
      readTime: '7 хв',
      likes: 567,
    },
    {
      id: 3,
      title: 'Сучасні Композитори',
      content:
        'Огляд сучасних композиторів, які змінюють звучання класичної музики, поєднуючи традиції з експериментальним підходом до композиції.',
      author: 'Ірина Лисенко',
      date: '3 листопада 2023',
      image: '/api/placeholder/800/400',
      tags: ['композитори', 'сучасна музика'],
      readTime: '10 хв',
      likes: 890,
    },
  ]);

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Всі' ||
      post.tags?.some(
        (tag) =>
          categories.includes(selectedCategory) &&
          tag.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header
        className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <Topbar paramUserData={userData} />
      </motion.header>

      <div className='flex flex-1 overflow-hidden'>
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 border-r border-gray-800 bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        <main className='flex-1 overflow-y-auto'>
          <div className='mx-auto max-w-7xl px-4 py-8'>
            <div className='mb-8 space-y-6'>
              <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>
                  Відкрийте для себе історії
                </h1>
                <button className='flex items-center gap-2 rounded-full bg-[#6374B6] px-4 py-2 text-sm font-medium hover:bg-opacity-70'>
                  <AdjustmentsHorizontalIcon className='h-5 w-5 text-white' />
                  Фільтр
                </button>
              </div>

              <div className='relative'>
                <MagnifyingGlassIcon className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Пошук статей...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full rounded-full bg-[#2D2D35] py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6374B6]'
                />
              </div>

              <div className='flex gap-2 overflow-x-auto pb-2'>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-[#6374B6] text-white'
                        : 'bg-[#2D2D35] text-gray-300 hover:bg-[#35353D]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              <AnimatePresence>
                {filteredPosts.map((post) => (
                  <motion.article
                    key={post.id}
                    className='group relative overflow-hidden rounded-xl bg-[#25252B] transition-all hover:shadow-lg'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link href={`/blog/${encodeURIComponent(post.title)}`}>
                      <div className='cursor-pointer'>
                        {post.image && (
                          <div className='relative h-48 overflow-hidden'>
                            <Image
                              src={post.image}
                              alt={post.title}
                              layout='fill'
                              objectFit='cover'
                              className='transition-transform duration-300 group-hover:scale-105'
                            />
                            <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
                          </div>
                        )}

                        <div className='p-6'>
                          <div className='flex items-center gap-2 text-sm text-gray-400'>
                            <span>{post.date}</span>
                            <span>•</span>
                            <span>{post.readTime} читання</span>
                          </div>

                          <h2 className='mt-2 text-xl font-bold text-white group-hover:text-[#6374B6]'>
                            {post.title}
                          </h2>

                          <p className='mt-2 line-clamp-2 text-sm text-gray-400'>
                            {post.content}
                          </p>

                          <div className='mt-4 flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <div className='h-8 w-8 rounded-full bg-[#6374B6]' />
                              <span className='text-sm font-medium'>
                                {post.author}
                              </span>
                            </div>
                            <button className='rounded-full p-2 hover:bg-white/10'>
                              <BookmarkIcon className='h-5 w-5 text-[#6374B6]' />
                            </button>
                          </div>

                          <div className='mt-4 flex flex-wrap gap-2'>
                            {post.tags?.map((tag, index) => (
                              <span
                                key={index}
                                className='rounded-full bg-[#6374B6]/20 px-3 py-1 text-xs font-medium text-[#6374B6]'
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  );
}
