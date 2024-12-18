'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Вхід...');

    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "email": email, "password": password })
      });

      const data = await response.json();
    if (response.ok) {
      setMessage(`Вітаємо, ${data.display_name}!`);
      localStorage.setItem('token', data.access); // Store token
      router.push('/profile'); // Redirect to profile page
    } else {
      setMessage(`Помилка: ${JSON.stringify(data)}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      setMessage(`Помилка: ${error.message}`);
    } else {
      setMessage('Помилка: Невідома помилка');
    }
  }
};

  return (
<div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-black via-gray-500 to-white">
      <div className="bg-white shadow-lg rounded-lg px-10 py-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-black">Вхід</h1>
        <form onSubmit={handleLogin} className="space-y-6">
            <div className="mb-4 relative rounded-md shadow-sm">
            <label className="block text-sm font-medium text-black mb-2" htmlFor="email">
              Електронна пошта
            </label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
             className="focus:ring-black focus:border-black block w-full sm:text-sm border-black rounded-md"
              id="email"
            />
          </div>
          <div className="mb-4 relative rounded-md shadow-sm">
            <label className="block text-sm font-medium text-black mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus:ring-black focus:border-black block w-full sm:text-sm border-black rounded-md"
              id="password"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash className="h-5 w-5 text-black" /> : <FaEye className="h-5 w-5 text-black" />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-black text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
            Увійти
          </button>
        </form>
        {message && (
          <div className="mt-4 p-4 bg-gray-100 text-black rounded text-center">
            {message}
          </div>
        )}
        <p className="mt-4 text-center text-sm text-black">
          Новий користувач? <Link href="/signup" className="font-medium text-black hover:text-gray-500">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
}