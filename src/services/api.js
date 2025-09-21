// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
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
export const updateUser = async(id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData, {
      
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};

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
export const getSkillByName = (name) => api.get(`/skills/name/${name}`);
export const getSkillsByCategory = (category) => api.get(`/skills/category/${category}`);
export const getSkillCategories = () => api.get('/skills/categories');
export const createSkill = (skill) => api.post('/skills', skill);
export const updateSkill = (id, skill) => api.put(`/skills/${id}`, skill);
export const deleteSkill = (id) => api.delete(`/skills/${id}`);

// User-Skill relationships - Updated for your database schema
export const getUserSkills = async (userId) => {
  try {
    console.log('Getting skills for user:', userId);
    const response = await api.get(`/users/${userId}/skills`);
    return response;
  } catch (error) {
    console.error('Error in getUserSkills:', error.response?.data || error.message);
    // Return a default empty response structure instead of throwing
    // This allows the UI to gracefully handle backend failures
    return { 
      data: { OFFERED: [], DESIRED: [] },
      status: error.response?.status || 500
    };
  }
};

export const addSkillToUser = async (userId, skillData) => {
  try {
    console.log('Adding skill to user:', userId, skillData);
    // The backend expects { skillName: "name", type: "OFFERED/DESIRED" }
    const response = await api.post(`/users/${userId}/skills`, skillData);
    return response;
  } catch (error) {
    console.error('Error in addSkillToUser:', error.response?.data || error.message);
    throw error;
  }
};
export const removeSkillFromUser = async (userId, skillId, type) => {
  try {
    // Log what we're trying to do
    console.log('Removing skill:', { userId, skillId, type });
    
    // Send the delete request with the type in the request body
    const response = await api.delete(`/users/${userId}/skills/${skillId}`, { 
      data: { type }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in removeSkillFromUser:', error.response?.data || error.message);
    throw error;
  }
};

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
  getSkillByName,
  getSkillsByCategory,
  getSkillCategories,
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