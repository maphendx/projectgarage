'use client';

import React, { useEffect, useState } from 'react';

const ProfilePage = () => {
  const [profile, setProfile] = useState<{
    display_name: string;
    full_name?: string;
    bio?: string;
    photo?: string;
    feed: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch('http://localhost:8000/api/users/profile/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile({
          ...data,
          feed: data.feed || [], 
        });
        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Error loading profile');
        } else {
          setError('An unexpected error occurred');
        }
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="text-center py-20">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-white text-black">
      {error ? (
        <p className="text-red-500 text-center p-4">{error}</p>
      ) : profile ? (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start py-4">
            <img 
              src={profile.photo || '/default-profile.svg'} 
              alt={`${profile.display_name}'s profile`}
              className="w-48 h-48 rounded-full object-cover mb-4 sm:mb-0 sm:mr-4"
            />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.display_name}</h1>
              {profile.full_name && (
                <p className="text-gray-500">{profile.full_name}</p>
              )}
              {profile.bio && (
                <p className="text-gray-700 mt-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* пости профіля */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Your Posts:</h2>
            {profile.feed.length > 0 ? (
              <ul className="space-y-4">
                {profile.feed.map((item, index) => (
                  <li 
                    key={index}
                    className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-300"
                  >
                    <p className="text-black">{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No posts yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProfilePage; 