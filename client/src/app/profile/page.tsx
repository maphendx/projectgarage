<<<<<<< HEAD
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import AsidePanelLeft from '@/components/surrounding/asideLeft';
import Topbar from '@/components/surrounding/topbar';
import { InfoBlock } from '@/components/other';
import ProfileSettings from '@/components/ProfileSettings';
=======
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

interface UserData {
  display_name?: string;
  email?: string;
  photo?: string;
  bio?: string;
<<<<<<< HEAD
  hashtags?: string[];
  subscriptions_count?: number;
  subscribers_count?: number;
  total_likes?: number;
  posts?: Array<{
    id: number;
    content: string;
    image?: string | null;
    created_at: string;
    likes: number[];
    comments: number;
    is_liked: boolean;
  }>;
=======
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
}

const Profile: React.FC = () => {
  const router = useRouter();
<<<<<<< HEAD
  const params = useParams<{ id?: string }>();
  const userId = params.id || '';
  const isOwnProfile = userId === '';
  const profileUrl = isOwnProfile ? 'profile/' : `profile/${userId}/`;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token && !isOwnProfile) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/users/${profileUrl}`,
        {
          headers: {
            Authorization: token ? `Token ${token}` : '',
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data.');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [router, userId, isOwnProfile]);

  const handleUpdateBio = async (newBio: string) => {
    if (isOwnProfile) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:8000/api/users/profile/`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bio: newBio }),
          },
        );

        if (response.ok) {
          const updatedData = await response.json();
          setUserData((prev) =>
            prev ? { ...prev, bio: updatedData.bio } : null,
          );
        } else {
          console.error('Failed to update bio');
        }
      } catch (err) {
        console.error('Error updating bio:', err);
      }
    }
  };

  const handleUpdateHashtags = async (newHashtags: string[]) => {
    if (isOwnProfile) {
      try {
        const token = localStorage.getItem('token');
        const currentHashtags = userData?.hashtags || [];

        // Remove hashtags
        for (const hashtag of currentHashtags) {
          if (!newHashtags.includes(hashtag)) {
            await fetch(`http://localhost:8000/api/users/hashtags/`, {
              method: 'DELETE',
              headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ hashtag }),
            });
          }
        }

        // Add new hashtags
        for (const hashtag of newHashtags) {
          if (!currentHashtags.includes(hashtag)) {
            await fetch(`http://localhost:8000/api/users/hashtags/`, {
              method: 'POST',
              headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ hashtag }),
            });
          }
        }

        await fetchUserData();
      } catch (err) {
        console.error('Error updating hashtags:', err);
      }
=======
  const [userData, setUserData] = useState<UserData | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newHashtag, setNewHashtag] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const profileResponse = await fetch(
          "http://localhost:8000/api/users/profile/",
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!profileResponse.ok) {
          throw new Error(
            `HTTP error! status: ${profileResponse.status}`
          );
        }
        const profileData = await profileResponse.json();
        setUserData(profileData);
        setError(null);

        const hashtagResponse = await fetch(
          "http://localhost:8000/api/users/hashtags/",
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        if (!hashtagResponse.ok) {
          console.error(
            "Не вдалося отримати хештеги:",
            hashtagResponse.status
          );
        } else {
          const hashtagData = await hashtagResponse.json();
          setHashtags(hashtagData.map((tag: any) => tag.name));
        }
      } catch (error) {
        console.error("Не вдалося отримати дані користувача:", error);
        setError(
          "Не вдалося завантажити дані профілю. Будь ласка, спробуйте ще раз."
        );
        if (error instanceof Error && error.message.includes("401")) {
          localStorage.removeItem("token");
          router.push("/");
        }
      }
    };
    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch("http://localhost:8000/api/users/logout/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
        localStorage.removeItem("token");
        router.push("/");
      } catch (error) {
        console.error("Не вдалося вийти з системи:", error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("token");
    if (
      token &&
      confirm("Ви впевнені, що хочете видалити свій акаунт?")
    ) {
      try {
        await fetch("http://localhost:8000/api/users/delete/", {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
        localStorage.removeItem("token");
        router.push("/");
      } catch (error) {
        console.error("Не вдалося видалити акаунт:", error);
      }
    }
  };

  const addNewHashtag = async () => {
    const token = localStorage.getItem("token");
    if (!token || !newHashtag.trim()) return;

    try {
      const response = await fetch(
        "http://localhost:8000/api/users/hashtags/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hashtag: newHashtag.trim() }),
        }
      );

      if (response.ok) {
        setHashtags([...hashtags, newHashtag.trim()]);
        setNewHashtag("");
      } else {
        const data = await response.json();
        console.error("Не вдалося додати хештег:", data);
      }
    } catch (error) {
      console.error("Помилка при додаванні хештегу:", error);
    }
  };

  const removeHashtag = async (hashtag: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:8000/api/users/hashtags/",
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hashtag: hashtag }),
        }
      );

      if (response.ok) {
        // Remove the hashtag from the state
        setHashtags(hashtags.filter((tag) => tag !== hashtag));
      } else {
        const data = await response.json();
        console.error("Не вдалося видалити хештег:", data);
      }
    } catch (error) {
      console.error("Помилка при видаленні хештегу:", error);
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
    }
  };

  if (error) {
<<<<<<< HEAD
    return (
      <div className='fixed bottom-0 left-0 right-0 p-4 text-center text-white'>
        <InfoBlock
          getMessage={`Error! ${error}`}
          getClasses='text-sm'
          getIconClasses='fa fa-times-circle'
          isAlive={true}
        />
      </div>
    );
  }

  if (!userData) {
    return <div className='mt-20 text-center text-white'>Loading...</div>;
  }

  return (
    <div className='flex min-h-screen flex-col bg-[#1C1C1F] text-white'>
      <header className='sticky top-0 z-30 h-[92px] bg-[#1C1C1F]'>
        <Topbar paramUserData={userData} />
      </header>

      <div className='flex flex-1 overflow-hidden'>
        <aside className='sticky top-0 z-20 h-screen w-20 flex-shrink-0 bg-[#1C1C1F]'>
          <AsidePanelLeft />
        </aside>

        <main className='flex-1 overflow-auto p-6'>
          <div className='space-y-6'>
            <div className='flex items-center space-x-5'>
              <Image
                src={userData.photo || '/default-profile.jpg'}
                alt='Profile Photo'
                width={100}
                height={100}
                style={{ width: '100px', height: '100px' }}
                className='rounded-[20px]'
              />
              <div>
                <h3 className='inline-block text-xl font-semibold'>
                  {userData.display_name || 'User'}
                </h3>
                <div className='ml-4 inline-block text-sm'>
                  <span>{userData.subscribers_count || 0} підписників</span>
                  <span className='ml-4'>
                    {userData.subscriptions_count || 0} підписок
                  </span>
                  <span className='ml-4'>
                    {userData.total_likes || 0} вподобань
                  </span>
                </div>
                <p className='text-sm text-gray-400'>
                  @{userData.email?.split('@')[0]}
                </p>
                <p className='text-sm'>{userData.bio || 'No description'}</p>
                {userData.hashtags && userData.hashtags.length > 0 && (
                  <div className='mt-2'>
                    {userData.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className='mr-2 inline-block rounded-full bg-gray-700 px-2 py-1 text-xs'
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className='h-12 rounded-[20px] bg-[#6374B6] px-4 py-2 text-white'
              >
                Редагувати профіль
              </button>
            )}
            <div className='mx-auto min-h-[85vh] w-[100%] max-w-[100%] rounded-[30px] border-[1px] border-white border-opacity-10 bg-opacity-70 bg-gradient-to-r from-[#414164] to-[#97A7E7] p-6 shadow-2xl backdrop-blur-xl'>
              <h4 className='text-lg font-semibold'>Публікації</h4>
              {userData.posts && userData.posts.length > 0 ? (
                <div className='space-y-4'>
                  {userData.posts.map((post) => (
                    <div
                      key={post.id}
                      className='mb-6 rounded-[30px] border-[1px] border-white border-opacity-10 bg-gradient-to-r from-[#2D2F3AB3] to-[#1A1A2EB3] p-6'
                      style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
                    >
                      <p className='text-sm'>{post.content}</p>
                      {post.image && (
                        <Image
                          src={post.image}
                          alt='Post image'
                          width={100}
                          height={100}
                          className='mt-2 rounded'
                        />
                      )}
                      <div className='mt-2 text-xs text-gray-400'>
                        {new Date(post.created_at).toLocaleString()}
                        <span className='ml-4'>
                          Вподобання: {post.likes.length}
                        </span>
                        <span className='ml-4'>Коментарі: {post.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-400'>Немає публікацій</p>
              )}
            </div>
            {isSettingsOpen && (
              <div className='fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75'>
                <div className='w-full max-w-md rounded-lg bg-[#2B2D31] p-6'>
                  <ProfileSettings
                    onUpdateBio={handleUpdateBio}
                    onUpdateHashtags={handleUpdateHashtags}
                    onClose={() => setIsSettingsOpen(false)}
                    initialHashtags={userData?.hashtags || []}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
=======
    return <div>Помилка: {error}</div>;
  }
  if (!userData) {
    return <div>Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 to-rose-200 text-gray-900">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            DO RE DO
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Профіль
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Ця інформація буде відображатися публічно, тому
                    будьте обережні, що ви ділитеся.
                  </p>
                </div>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div className="flex items-center space-x-5">
                      <div className="flex-shrink-0">
                        <Image
                          src={
                            userData.photo || "/default-profile.jpg"
                          }
                          alt="Фото профілю"
                          width={100}
                          height={100}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {userData.display_name}
                        </h3>
                        <p className="text-sm font-medium text-gray-500">
                          @
                          {userData.email
                            ? userData.email.split("@")[0]
                            : "Без імені користувача"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userData.bio}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Хештеги
                      </label>
                      <ul className="list-inside list-disc">
                        {hashtags.map((tag, index) => (
                          <li
                            key={index}
                            className="flex items-center"
                          >
                            <a
                              href={`/hashtag/${tag}`}
                              className="text-blue-600 hover:underline"
                            >
                              #{tag}
                            </a>
                            <button
                              onClick={() => removeHashtag(tag)}
                              className="ml-2 text-sm text-red-600 hover:text-red-800"
                            >
                              Видалити
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2">
                        <input
                          type="text"
                          value={newHashtag}
                          onChange={(e) =>
                            setNewHashtag(e.target.value)
                          }
                          placeholder="Додати новий хештег"
                          className="w-full py-3 bg-gray-800 text-white rounded-lg px-4"
                        />
                        <button
                          onClick={addNewHashtag}
                          className="mt-2 w-full py-3 bg-red-800 text-white rounded-full hover:bg-red-700"
                        >
                          Додати хештег
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                      <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-red-800 text-white rounded-full hover:bg-red-700"
                      >
                        Вийти
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="mt-3 w-full py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                      >
                        Видалити акаунт
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
    </div>
  );
};

export default Profile;
