const fetchClient = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  return fetch(url, config);
};

export default fetchClient;
