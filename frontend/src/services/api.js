import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me')
};

// Cases endpoints
export const casesAPI = {
  list: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  updateStatus: (id, payload) => api.patch(`/cases/${id}/status`, payload),
  addComment: (id, text) => api.post(`/cases/${id}/comments`, { text }),
  reassign: (id, payload) => api.post(`/cases/${id}/reassign`, payload)
};

// Documents endpoints
export const documentsAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getById: (id) => api.get(`/documents/${id}`),
  getDownloadUrl: (id) => `/api/documents/${id}/download`
};

// AI endpoints
export const aiAPI = {
  extract: (payload) => api.post('/ai/extract', payload),
  summarize: (payload) => api.post('/ai/summarize', payload),
  crossValidate: (payload) => api.post('/ai/cross-validate', payload),
  submitFeedback: (payload) => api.post('/ai/feedback', payload),
  getMetrics: () => api.get('/ai/metrics')
};

// Exceptions endpoints
export const exceptionsAPI = {
  list: (params) => api.get('/exceptions', { params }),
  resolve: (id, payload) => api.post(`/exceptions/${id}/resolve`, payload)
};

// Validation endpoints
export const validationAPI = {
  run: (caseId) => api.post(`/validation/run/${caseId}`),
  overrideField: (payload) => api.post('/validation/override-field', payload)
};

// Supervisor endpoints
export const supervisorAPI = {
  getWorkload: () => api.get('/supervisor/workload'),
  getAgeing: () => api.get('/supervisor/ageing')
};

// Reports endpoints
export const reportsAPI = {
  getAnalytics: () => api.get('/reports/analytics'),
  exportCsvUrl: '/api/reports/export'
};

// Notifications endpoints
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all')
};

// Users endpoints
export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data)
};

// Audit and Settings endpoints
export const auditAPI = {
  getLogs: (params) => api.get('/audit/logs', { params }),
  getSettings: () => api.get('/audit/settings'),
  updateSettings: (data) => api.patch('/audit/settings', data)
};

export default api;

