'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Реєстрація...');

    try {
      const response = await fetch('/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password, password2 }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Реєстрація успішна!');
      } else {
        setMessage(`Помилка: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setMessage(`Помилка: ${(error as Error).message}`);
    }
  };

  return (
<div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-black via-gray-500 to-white">
      <div className="bg-white shadow-lg rounded-lg px-10 py-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-black">Реєстрація</h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          {['Email', 'Логін', 'Пароль', 'Підтвердіть пароль'].map((field) => (
            <div key={field} className="mb-4">
              <label className="block text-sm font-medium text-black mb-2" htmlFor={field.toLowerCase().replace(' ', '')}>
                {field}
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type={field === 'Пароль' || field === 'Підтвердіть пароль' ? (showPassword ? 'text' : 'password') : 'text'}
                  required
                  value={field === 'Email' ? email : field === 'Логін' ? displayName : field === 'Пароль' ? password : password2}
                  onChange={(e) => {
                    if (field === 'Email') setEmail(e.target.value);
                    else if (field === 'Логін') setDisplayName(e.target.value);
                    else if (field === 'Пароль') setPassword(e.target.value);
                    else setPassword2(e.target.value);
                  }}
                  placeholder={field}
                  className="focus:ring-black focus:border-black block w-full sm:text-sm border-black rounded-md text-black"
                  id={field.toLowerCase().replace(' ', '')}
                />
                {(field === 'Пароль' || field === 'Підтвердіть пароль') && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash className="h-5 w-5 text-black" /> : <FaEye className="h-5 w-5 text-black" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-black text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
            Зареєструватися
          </button>
        </form>
        {message && (
          <div className="mt-4 p-4 bg-gray-100 text-black rounded text-center">
            {message}
          </div>
        )}
        <p className="mt-4 text-center text-sm text-black">
          Уже маєте обліковий запис? <Link href="/login" className="font-medium text-black hover:text-gray-500">Увійти</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;