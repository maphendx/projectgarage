// app/signup/page.tsx
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
    setMessage('Registering...');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password, password2 }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful!');
        // Note: Use useRouter for navigation in a client component if needed.
      } else {
        setMessage(`Error: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg px-10 py-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">Sign Up</h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          {['Email', 'Display Name', 'Password', 'Confirm Password'].map((field) => (
            <div key={field} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={field.toLowerCase().replace(' ', '')}>
                {field}
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type={field === 'Password' || field === 'Confirm Password' ? (showPassword ? 'text' : 'password') : 'text'}
                  required
                  value={field === 'Email' ? email : field === 'Display Name' ? displayName : field === 'Password' ? password : password2}
                  onChange={(e) => {
                    if (field === 'Email') setEmail(e.target.value);
                    else if (field === 'Display Name') setDisplayName(e.target.value);
                    else if (field === 'Password') setPassword(e.target.value);
                    else setPassword2(e.target.value);
                  }}
                  placeholder={field}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-700"
                  id={field.toLowerCase().replace(' ', '')}
                />
                {(field === 'Password' || field === 'Confirm Password') && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash className="h-5 w-5 text-gray-400" /> : <FaEye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Sign Up
          </button>
        </form>
        {message && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded text-center">
            {message}
          </div>
        )}
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;