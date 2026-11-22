import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401s and HTML SPA rewrites
api.interceptors.response.use(
  (response) => {
    // If the server returned an HTML SPA page (from a catch-all rewrite), treat it as an unavailable API endpoint
    if (
      typeof response.data === 'string' &&
      (response.data.trim().toLowerCase().startsWith('<!doctype html') ||
        response.data.trim().toLowerCase().startsWith('<html'))
    ) {
      const err = new Error('API route not served by static host');
      err.isSpaFallback = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentToken = localStorage.getItem('token');
      // If user is running with mock auth or demo mode, do NOT log them out
      // Allow the service layer to seamlessly catch and fallback to appStore
      if (currentToken && !currentToken.startsWith('mock-')) {
        console.warn('Session expired. Logging out.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
