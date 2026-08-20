import apiClient from './client';

/**
 * Authentication API Service
 */

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ token: string, user: Object }>}
 */
export const login = async ({ email, password }) => {
  const response = await apiClient.post('/api/login', { email, password });
  return response.data;
};

/**
 * Register new user
 * @param {Object} userData - { name, email, password }
 * @returns {Promise<{ token: string, user: Object }>}
 */
export const register = async ({ name, email, password }) => {
  const response = await apiClient.post('/api/register', { name, email, password });
  return response.data;
};

/**
 * Get current authenticated user profile
 * @returns {Promise<Object>}
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/me');
  return response.data;
};

/**
 * Logout user (client-side cleanup + optional server notification)
 */
export const logout = async () => {
  try {
    await apiClient.post('/api/logout');
  } catch (err) {
    // Ignore error on logout if offline
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
