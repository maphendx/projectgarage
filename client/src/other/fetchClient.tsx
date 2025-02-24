const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Отримання токенів
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

// Функція для оновлення `access`-токена
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  return data.access;
};

// Головна `fetch`-функція
const fetchClient = async (url: string, options?: RequestInit) => {
  const accessToken = getAccessToken();

  // Додаємо токен в заголовки
  const headers = {
    ...(options && options.headers && options.headers),
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  let response = await fetch(`${url}`, { ...options, headers });

  // Якщо токен протух – оновлюємо його і повторюємо запит
  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      headers.Authorization = `Bearer ${newAccessToken}`;

      response = await fetch(`${url}`, { ...options, headers });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  return response;
};

export default fetchClient;

export { refreshAccessToken };
