'use client';

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Auth: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('refresh-token');
    if (token) router.push('/');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Входимо до облікового запису...');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/login/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(`Вітаємо, ${data.display_name}!`);
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        setIsSignInOpen(false);
        router.push('/');
      } else {
        setMessage(`Помилка: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setMessage(`Помилка: ${(error as Error).message}`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Реєстрація...');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/register/`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Ngrok-Skip-Browser-Warning': "true"
          },
          body: JSON.stringify({
            email,
            password,
            password2,
            display_name: displayName,
          }),
          mode: 'cors'  
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('Реєстрація, успішна!');
        setIsSignUpOpen(false);
      } else {
        setMessage(`Error: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#B5BFE7] to-[#B5D6E7] text-[#2B2D31]'>
      <Head>
        <title>Do Re Do - Your Musical Journey Begins</title>
        <meta
          name='description'
          content='Приєднуйтесь до великої музичної спільноти Do Re Do вже сьогодні та розпочніть свою музичну подорож!'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <motion.main
        className='flex min-h-screen flex-col md:flex-row'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className='flex flex-1 items-center justify-center p-8'
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src='/logo.svg'
            alt='Do Re Do Logo'
            width={320}
            height={320}
            className='hidden w-full max-w-sm md:block'
            priority
          />
        </motion.div>

        <motion.div
          className='flex flex-1 items-center justify-center px-6'
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className='w-full max-w-md'>
            <div className='mb-6'>
              <h2 className='text-4xl font-bold text-[#1C1C1F]'>Do Re Do</h2>
              <p className='mt-2 text-xl text-[#3C4B84]'>
                Знаходь спільні музичні інтереси та ділися своєю музикою з
                іншими.
              </p>
              <p className='mt-1 text-base text-[#444C6C]'>
                Почни свою музичну подорож вже сьогодні!
              </p>
            </div>

            <div className='space-y-3'>
              <motion.button
                className='flex w-full transform items-center justify-center space-x-2 rounded-full bg-[#B5BFE7] py-3 text-[#1C1C1F] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#6374B6]'
                onClick={() => true}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Увійти з Google</span>
              </motion.button>

              <motion.button
                className='w-full transform rounded-full bg-[#3C4B84] py-3 text-[#B5D6E7] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#444C6C]'
                onClick={() => setIsSignUpOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Створити обліковий запис
              </motion.button>

              <div className='relative py-2'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-[#444C6C]'></div>
                </div>
                <div className='relative flex justify-center'>
                  <span className='bg-[#B5BFE7] px-4 text-[#3C4B84]'>або</span>
                </div>
              </div>

              <motion.button
                className='w-full transform rounded-full bg-[#B5D6e2]/80 py-3 text-[#1C1C1F] shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#B5D6E7]/90'
                onClick={() => setIsSignInOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Увійти до облікового запису
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.main>

      <Modal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)}>
        <form onSubmit={handleSignUp}>
          <h2 className='mb-4 text-xl font-bold text-[#B5D6E7]'>
            Створити обліковий запис
          </h2>
          <div className='space-y-4'>
            <input
              type='text'
              placeholder="Ім'я користувача"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className='w-full rounded-lg bg-[#1C1C1F] px-4 py-3 text-[#B5D6E7]'
            />
            <input
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full rounded-lg bg-[#1C1C1F] px-4 py-3 text-[#B5D6E7]'
            />
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Пароль'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full rounded-lg bg-[#1C1C1F] px-4 py-3 pr-10 text-[#B5D6E7]'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-3 text-[#B5BFE7] hover:text-[#6374B6]'
                aria-label='Toggle Password Visibility'
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Підтвердіть пароль'
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                className='w-full rounded-lg bg-[#1C1C1F] px-4 py-3 pr-10 text-[#B5D6E7]'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-3 text-[#B5BFE7] hover:text-[#6374B6]'
                aria-label='Toggle Password Visibility'
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button className='w-full rounded-full bg-[#3C4B84] py-3 text-[#B5D6E7] hover:bg-[#444C6C]'>
              Зареєструватися
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)}>
        <form onSubmit={handleLogin}>
          <h2 className='mb-4 text-xl font-bold text-[#B5D6E7]'>
            Увійти в Do Re Do
          </h2>
          <div className='space-y-4'>
            <input
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full rounded-lg bg-[#1C1C1F] px-4 py-3 text-[#B5D6E7]'
            />
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Пароль'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full rounded-lg bg-[#1C1C1F] px-4 py-3 pr-10 text-[#B5D6E7]'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-3 text-[#B5BFE7] hover:text-[#6374B6]'
                aria-label='Toggle Password Visibility'
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button className='w-full rounded-full bg-[#3C4B84] py-3 text-[#B5D6E7] hover:bg-[#444C6C]'>
              Увійти
            </button>
          </div>
        </form>
      </Modal>

      {message && (
        <motion.div
          className='absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-lg bg-[#2B2D31] p-4 text-[#B5D6E7] shadow-lg'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {message}
        </motion.div>
      )}
    </div>
  );
};

export default Auth;