import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/backend',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'Something went wrong. Please try again.';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);
