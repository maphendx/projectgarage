'use client';

import React, { useEffect, useState } from 'react';

const ProfilePage = () => {
  const [profile, setProfile] = useState<{ name: string; feed: string[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch profile data (replace with your API endpoint)
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/users/profile/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          setError('Не вдалося завантажити профіль');
        }
      } catch (err) {
  console.error('Fetch error:', err); 
  setError('Помилка під час завантаження профілю');
}
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : profile ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Привіт, {profile.name}!</h1>
          <h2 className="text-xl font-semibold mb-3">Ваші публікації:</h2>
          <ul className="list-disc pl-6">
            {profile.feed.map((item, index) => (
              <li key={index} className="text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Завантаження профілю...</p>
      )}
    </div>
  );
};

export default ProfilePage;