import axios from 'axios';

// ── Token stored in sessionStorage (per-tab) ─────────────────────────────────
// Each browser tab has its own independent session
// New tab = empty sessionStorage = login page shown
// Tab 1 (Yash) and Tab 2 (Kyar) never interfere with each other

const TOKEN_KEY = 'tf_token';
const USER_KEY  = 'tf_user';

export const getToken     = ()       => sessionStorage.getItem(TOKEN_KEY);
export const saveSession  = (t, u)   => {
  sessionStorage.setItem(TOKEN_KEY, t);
  sessionStorage.setItem(USER_KEY, JSON.stringify(u));
};
export const clearSession = ()       => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Attach token from sessionStorage on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearSession();
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login:  (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  invite: (data) => api.post('/auth/invite', data),
  me:     ()     => api.get('/auth/me'),
};

// Users
export const usersAPI = {
  list:         ()                  => api.get('/users'),
  updateRole:   (id, role)          => api.patch(`/users/${id}/role`, { role }),
  invite:       (data)              => api.post('/auth/invite', data),
  delete:       (id)                => api.delete(`/users/${id}`),
  leaveProject: (userId, projectId) => api.delete(`/users/${userId}/leave/${projectId}`),
};

// Projects
export const projectsAPI = {
  list:   ()         => api.get('/projects'),
  get:    (id)       => api.get(`/projects/${id}`),
  create: (data)     => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id)       => api.delete(`/projects/${id}`),
};

// Tasks
export const tasksAPI = {
  list:   (params)   => api.get('/tasks', { params }),
  get:    (id)       => api.get(`/tasks/${id}`),
  create: (data)     => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id)       => api.delete(`/tasks/${id}`),
};

// Dashboard
export const dashboardAPI = {
  stats: () => api.get('/dashboard'),
};

// AI
export const aiAPI = {
  chat: (messages, system) => api.post('/ai/chat', { messages, system }),
};

export default api;
