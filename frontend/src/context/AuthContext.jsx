import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ── Per-tab session storage ──────────────────────────────────────────────────
// sessionStorage is ISOLATED per browser tab — fixes all 3 issues:
// Issue 1: Email link opens login page (new tab = empty sessionStorage = login shown)
// Issue 2: App link opens login (new tab = no session = login shown)
// Issue 3: Kyar login in tab 2 doesn't affect Yash in tab 1 (different sessionStorage)

const TOKEN_KEY = 'tf_token';
const USER_KEY  = 'tf_user';

const getToken    = ()          => sessionStorage.getItem(TOKEN_KEY);
const getUser     = ()          => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } };
const saveSession = (token, u)  => { sessionStorage.setItem(TOKEN_KEY, token); sessionStorage.setItem(USER_KEY, JSON.stringify(u)); };
const clearSession = ()         => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); };

// Clear OLD localStorage tokens from previous app versions (one-time migration)
const clearLegacy = () => { try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {} };

// Axios instance — reads token from sessionStorage (per-tab)
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export { api }; // export so api.js can import it

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearLegacy(); // remove old localStorage tokens

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Validate token with backend
    api.get('/auth/me')
      .then(res => {
        const freshUser = res.data.user;
        setUser(freshUser);
        sessionStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token expired/invalid — force login
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data;
    saveSession(token, u);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    const res = await api.post('/auth/signup', { name, email, password, role });
    const { token, user: u } = res.data;
    saveSession(token, u);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
