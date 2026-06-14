import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// ── Per-tab session keys ──────────────────────────────────────────────────────
const TOKEN_KEY = 'tf_token';
const USER_KEY  = 'tf_user';

export const getToken  = ()         => sessionStorage.getItem(TOKEN_KEY);
export const getUser   = ()         => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } };
export const saveSession  = (t, u)  => { sessionStorage.setItem(TOKEN_KEY, t); sessionStorage.setItem(USER_KEY, JSON.stringify(u)); };
export const clearSession = ()      => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); };

// Clear old localStorage tokens (one-time migration)
const clearLegacy = () => {
  try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {}
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => getUser());
  const [loading, setLoading] = useState(!!getToken()); // only load if token exists

  useEffect(() => {
    clearLegacy();
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Validate token — use fetch directly to avoid circular imports with api.js
    const baseURL = process.env.REACT_APP_API_URL || '/api';
    fetch(`${baseURL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        const freshUser = data.user;
        setUser(freshUser);
        sessionStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []); // runs ONCE on mount only

  const login = useCallback(async (email, password) => {
    const baseURL = process.env.REACT_APP_API_URL || '/api';
    const res = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw { response: { data } };
    const { token, user: u } = data;
    saveSession(token, u);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    const baseURL = process.env.REACT_APP_API_URL || '/api';
    const res = await fetch(`${baseURL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw { response: { data } };
    const { token, user: u } = data;
    saveSession(token, u);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    // Use replace to prevent back-button issues
    window.location.replace('/login');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
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
