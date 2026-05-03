import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  list:       ()           => api.get('/users'),
  updateRole: (id, role)   => api.patch(`/users/${id}/role`, { role }),
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

export default api;
