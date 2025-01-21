<<<<<<< HEAD
'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
=======
"use client";

import React, { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Modal from "./components/Modal";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

const Home: React.FC = () => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
<<<<<<< HEAD
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
=======
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    setMessage('Входимо до облікового запису...');

    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
=======
    setMessage("Входимо до облікового запису...");

    try {
      const response = await fetch(
        "http://localhost:8000/api/users/login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

      const data = await response.json();

      if (response.ok) {
        setMessage(`Вітаємо, ${data.display_name}!`);
<<<<<<< HEAD
        localStorage.setItem('token', data.token);
        setIsSignInOpen(false);
        router.push('/home');
=======
        localStorage.setItem("token", data.token); // Changed from data.access to data.token
        setIsSignInOpen(false);
        router.push("/profile"); // Changed from "/pages/profile" to "/profile"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
      } else {
        setMessage(`Помилка: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setMessage(`Помилка: ${(error as Error).message}`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    setMessage('Реєстрація...');

    try {
      const response = await fetch(
        'http://localhost:8000/api/users/register/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
=======
    setMessage("Реєстрація...");

    try {
      const response = await fetch(
        "http://localhost:8000/api/users/register/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
          body: JSON.stringify({
            email,
            password,
            password2,
            display_name: displayName,
          }),
<<<<<<< HEAD
        },
=======
        }
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
      );

      const data = await response.json();

      if (response.ok) {
<<<<<<< HEAD
        setMessage('Реєстрація, успішна!');
=======
        setMessage("Реєстрація, успішна!");
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
        setIsSignUpOpen(false);
      } else {
        setMessage(`Error: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  return (
<<<<<<< HEAD
    <div className='min-h-screen bg-gradient-to-br from-[#B5BFE7] to-[#B5D6E7] text-[#2B2D31]'>
      <Head>
        <title>Do Re Do - Your Musical Journey Begins</title>
        <meta
          name='description'
          content='Приєднуйтесь до великої музичної спільноти Do Re Do вже сьогодні та розпочніть свою музичну подорож!'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className='flex min-h-screen flex-col md:flex-row'>
        <div className='flex flex-1 items-center justify-center p-8'>
          <Image
            src='/logo.svg'
            alt='Do Re Do Logo'
            width={320}
            height={320}
            className='hidden w-full max-w-sm md:block'
=======
    <div className="min-h-screen bg-gradient-to-br from-rose-100 to-rose-200 text-gray-900">
      <Head>
        <title>Do Re Do - Your Musical Journey Begins</title>
        <meta
          name="description"
          content="Приєднуйтесь до великої музичної спільноти Do Re Do вже сьогодні та розпочніть свою музичну подорож!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col md:flex-row">
        <div className="flex-1 flex items-center justify-center p-8">
          <Image
            src="/logo.svg"
            alt="Do Re Do Logo"
            width={320}
            height={320}
            className="max-w-sm w-full hidden md:block"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
            priority
          />
        </div>

<<<<<<< HEAD
        <div className='flex flex-1 items-center justify-center px-6'>
          <div className='w-full max-w-md'>
            <div className='mb-6'>
              <h2 className='text-4xl font-bold text-[#1C1C1F]'>Do Re Do</h2>
              <p className='mt-2 text-xl text-[#3C4B84]'>
                Знаходь спільні музичні інтереси та ділися своєю музикою з
                іншими.
              </p>
              <p className='mt-1 text-base text-[#444C6C]'>
=======
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h2 className="text-4xl font-bold text-gray-800">
                Do Re Do
              </h2>
              <p className="text-xl mt-2 text-gray-800">
                Знаходь спільні музичні інтереси та ділися своєю
                музикою з іншими.
              </p>
              <p className="text-base mt-1 text-gray-700">
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
                Почни свою музичну подорож вже сьогодні!
              </p>
            </div>

<<<<<<< HEAD
            <div className='space-y-3'>
              <button
                className='flex w-full transform items-center justify-center space-x-2 rounded-full bg-[#B5BFE7] py-3 text-[#1C1C1F] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#6374B6]'
=======
            <div className="space-y-3">
              <button
                className="w-full py-3 bg-white text-gray-800 rounded-full hover:bg-gray-50 transform hover:scale-[1.02] transition-all duration-200 shadow-md flex items-center justify-center space-x-2"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
                onClick={() => true}
              >
                <span>Увійти з Google</span>
              </button>

              <button
<<<<<<< HEAD
                className='w-full transform rounded-full bg-[#3C4B84] py-3 text-[#B5D6E7] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#444C6C]'
=======
                className="w-full py-3 bg-red-800 text-white rounded-full hover:bg-red-700 transform hover:scale-[1.02] transition-all duration-200 shadow-md"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
                onClick={() => setIsSignUpOpen(true)}
              >
                Створити обліковий запис
              </button>

<<<<<<< HEAD
              <div className='relative py-2'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-[#444C6C]'></div>
                </div>
                <div className='relative flex justify-center'>
                  <span className='bg-[#B5BFE7] px-4 text-[#3C4B84]'>або</span>
=======
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-400"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-rose-100 text-gray-600">
                    або
                  </span>
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
                </div>
              </div>

              <button
<<<<<<< HEAD
                className='w-full transform rounded-full bg-[#B5D6E7]/80 py-3 text-[#1C1C1F] shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#B5D6E7]/90'
=======
                className="w-full py-3 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full hover:bg-white/90 transform hover:scale-[1.02] transition-all duration-200 shadow-md"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
                onClick={() => setIsSignInOpen(true)}
              >
                Увійти до облікового запису
              </button>
            </div>
          </div>
        </div>
      </main>

<<<<<<< HEAD
      <Modal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)}>
        <form onSubmit={handleSignUp}>
          <h2 className='mb-4 text-xl font-bold text-[#B5D6E7]'>
            Створити обліковий запис
          </h2>
          <div className='space-y-4'>
            <input
              type='text'
=======
      <Modal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
      >
        <form onSubmit={handleSignUp}>
          <h2 className="text-xl font-bold mb-4">
            Створити обліковий запис
          </h2>
          <div className="space-y-4">
            <input
              type="text"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
              placeholder="Ім'я користувача"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
<<<<<<< HEAD
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
=======
              className="w-full py-3 bg-gray-800 text-white rounded-lg px-4"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-3 bg-gray-800 text-white rounded-lg px-4"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full py-3 bg-gray-800 text-white rounded-lg px-4 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                aria-label="Toggle Password Visibility"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
<<<<<<< HEAD
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
=======
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Підтвердіть пароль"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                className="w-full py-3 bg-gray-800 text-white rounded-lg px-4 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                aria-label="Toggle Password Visibility"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
<<<<<<< HEAD
            <button className='w-full rounded-full bg-[#3C4B84] py-3 text-[#B5D6E7] hover:bg-[#444C6C]'>
=======
            <button className="w-full py-3 bg-red-800 text-white rounded-full hover:bg-red-700">
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
              Зареєструватися
            </button>
          </div>
        </form>
      </Modal>

<<<<<<< HEAD
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
=======
      <Modal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      >
        <form onSubmit={handleLogin}>
          <h2 className="text-xl font-bold mb-4">
            Увійти в Do Re Do
          </h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-3 bg-gray-800 text-white rounded-lg px-4"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full py-3 bg-gray-800 text-white rounded-lg px-4 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                aria-label="Toggle Password Visibility"
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
<<<<<<< HEAD
            <button className='w-full rounded-full bg-[#3C4B84] py-3 text-[#B5D6E7] hover:bg-[#444C6C]'>
=======
            <button className="w-full py-3 bg-red-800 text-white rounded-full hover:bg-red-700">
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
              Увійти
            </button>
          </div>
        </form>
      </Modal>

      {message && (
<<<<<<< HEAD
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-lg bg-[#2B2D31] p-4 text-[#B5D6E7] shadow-lg'>
=======
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-4 bg-gray-800 text-white rounded-lg shadow-lg">
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
          {message}
        </div>
      )}
    </div>
  );
};

export default Home;
