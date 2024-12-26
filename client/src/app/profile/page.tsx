"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserData {
  display_name?: string;
  email?: string;
  photo?: string;
  bio?: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
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
    }
  };

  if (error) {
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
    </div>
  );
};

export default Profile;
