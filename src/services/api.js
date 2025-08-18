// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Add these headers if your backend expects them
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// User endpoints
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (user) => api.post('/users', user);
export const updateUser = (id, user) => api.put(`/users/${id}`, user);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Authentication endpoints - Updated for Spring Boot
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => {
  return api.post('/auth/register', userData);
};
export const logoutUser = () => api.post('/auth/logout');

// Skills endpoints
export const getSkills = () => api.get('/skills');
export const getSkill = (id) => api.get(`/skills/${id}`);
export const createSkill = (skill) => api.post('/skills', skill);
export const updateSkill = (id, skill) => api.put(`/skills/${id}`, skill);
export const deleteSkill = (id) => api.delete(`/skills/${id}`);

// User-Skill relationships - Updated for your database schema
export const getUserSkills = (userId) => api.get(`/users/${userId}/skills`);
export const addSkillToUser = (userId, skillId, type) => {
  // type can be: 'general', 'offered', 'desired'
  return api.post(`/users/${userId}/skills`, { skillId, type });
};
export const removeSkillFromUser = (userId, skillId, type) => 
  api.delete(`/users/${userId}/skills/${skillId}`, { data: { type } });

// Search and matching
export const searchUsers = (query) => api.get(`/users/search?q=${query}`);
export const findSkillMatches = (userId) => api.get(`/users/${userId}/matches`);

// Swap requests - New endpoints for your database schema
export const getSwapRequests = () => api.get('/swap-requests');
export const getSwapRequest = (id) => api.get(`/swap-requests/${id}`);
export const createSwapRequest = (swapData) => api.post('/swap-requests', swapData);
export const updateSwapRequest = (id, swapData) => api.put(`/swap-requests/${id}`, swapData);
export const deleteSwapRequest = (id) => api.delete(`/swap-requests/${id}`);

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  registerUser,
  logoutUser,
  getSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  getUserSkills,
  addSkillToUser,
  removeSkillFromUser,
  searchUsers,
  findSkillMatches,
  getSwapRequests,
  getSwapRequest,
  createSwapRequest,
  updateSwapRequest,
  deleteSwapRequest,
};