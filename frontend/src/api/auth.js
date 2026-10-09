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
 * Register new user (Triggers OTP sending to email)
 * @param {Object} userData - { name, email, password }
 * @returns {Promise<{ success: boolean, message: string, email: string }>}
 */
export const register = async ({ name, email, password }) => {
  const response = await apiClient.post('/api/register', { name, email, password });
  return response.data;
};

/**
 * Verify Email OTP code (Completes registration & returns JWT)
 * @param {Object} payload - { email, otp }
 * @returns {Promise<{ token: string, user: Object, success: boolean }>}
 */
export const verifyOtp = async ({ email, otp }) => {
  const response = await apiClient.post('/api/verify-otp', { email, otp });
  return response.data;
};

/**
 * Resend OTP code
 * @param {Object} payload - { email }
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resendOtp = async ({ email }) => {
  const response = await apiClient.post('/api/resend-otp', { email });
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
    localStorage.removeItem('resume_ai_token');
    localStorage.removeItem('resume_ai_user');
  }
};
