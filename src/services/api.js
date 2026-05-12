import axios from 'axios';
import { API_URL } from '../config.js';

const TOKEN_KEY = 'pwa.token';
const ROLE_KEY = 'pwa.role';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRole = () => localStorage.getItem(ROLE_KEY);
export const setSession = (token, role) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
};
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

export const api = axios.create({
  baseURL: API_URL,
  // Allow uploads up to ~50MB; matches backend MAX_FILE_SIZE_MB.
  maxBodyLength: 50 * 1024 * 1024,
});

// Attach JWT on every request.
api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Surface backend's { success, message } envelope to callers consistently.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired or revoked — drop session and let the auth context
      // observe via the storage event / next mount.
      clearSession();
    }
    return Promise.reject(err);
  }
);

export const apiMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;
