import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getToken, saveSession, clearSession } from '../api';

// AuthContext — uses sessionStorage via api/index.js
// Each browser tab is fully independent

const AuthContext = createContext(null);

const getStoredUser = () => {
  try { return JSON.parse(sessionStorage.getItem('tf_user')); } catch { return null; }
};

// One-time: clear old localStorage tokens from previous app version
const clearLegacy = () => {
  try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {}
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => getStoredUser());
  const [loading, setLoading] = useState(!!getToken()); // true only if token exists in THIS tab

  useEffect(() => {
    clearLegacy();

    const token = getToken();
    if (!token) {
      // No token in this tab → no loading needed → show login
      setLoading(false);
      return;
    }

    // Validate token with backend
    api.get('/auth/me')
      .then(res => {
        const freshUser = res.data.user;
        setUser(freshUser);
        sessionStorage.setItem('tf_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []); // ← CRITICAL: empty deps — runs ONCE, never causes re-render loop

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
    window.location.replace('/login');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      sessionStorage.setItem('tf_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
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
