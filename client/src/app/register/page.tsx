'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/register/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            display_name: username,
            password,
            password2: password,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Validation errors:', errorData);
        throw new Error('Registration failed');
      }

      router.push('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <form
        onSubmit={handleRegister}
        className='rounded bg-white p-8 shadow-lg'
      >
        <h2 className='mb-6 text-2xl font-bold'>Register</h2>
        <input
          type='text'
          placeholder='Username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className='mb-4 w-full rounded border px-4 py-2'
        />
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='mb-4 w-full rounded border px-4 py-2'
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='mb-6 w-full rounded border px-4 py-2'
        />
        <button
          type='submit'
          className='w-full rounded-lg bg-green-600 py-2 font-semibold text-white hover:bg-green-700'
        >
          Register
        </button>
      </form>
    </div>
  );
}
