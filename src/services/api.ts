import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  timeout: 30000, // 30 seconds timeout
});

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    console.log('User from localStorage:', user);
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('Parsed user data:', userData);
        if (userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
          console.log('Added token to request:', config.headers.Authorization);
        } else {
          console.log('No token found in user data');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      console.log('No user found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    if (error.response?.status === 401) {
      // Clear user data if unauthorized
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
