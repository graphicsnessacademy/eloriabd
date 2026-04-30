import axios, { InternalAxiosRequestConfig } from 'axios';

// Change this to your live Vercel URL if different
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://eloriabd.vercel.app'),
  withCredentials: true,
});

// Interceptor to add JWT token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('eloria_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);