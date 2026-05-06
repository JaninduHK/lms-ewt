import axios from 'axios';

// In dev: VITE_API_URL is unset → `/api` is proxied to the backend by Vite.
// In prod: set VITE_API_URL to e.g. https://ewt-api.vercel.app/api
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let queue = [];

const processQueue = (error) => {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(() => api(original))
          .catch(Promise.reject);
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(original);
      } catch (e) {
        processQueue(e);
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    throw err;
  }
);

export default api;
