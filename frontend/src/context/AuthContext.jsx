import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';
import { mockUser } from '../api/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState(null);

  // Restore token and user from localStorage on initialization
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            setUser({ email: 'user@example.com', name: 'Developer' });
          }
        }
      }
    } catch (err) {
      console.error('Error restoring auth state from localStorage:', err);
    } finally {
      setIsLoading(false);
    }

    // Listen for 401 session expiration event from Axios interceptor
    const handleSessionExpired = (event) => {
      setUser(null);
      setToken(null);
      setSessionNotice(event.detail?.message || 'Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    // Basic validation
    if (!email || !email.trim() || !password || !password.trim()) {
      throw new Error('Email and password cannot be empty or whitespace only.');
    }

    setIsLoading(true);
    try {
      const data = await authApi.login({ email: email.trim(), password: password.trim() });
      const authToken = data.token || 'jwt_' + Date.now();
      const authUser = data.user || {
        id: `usr_${Date.now()}`,
        email: email.trim(),
        name: email.split('@')[0],
        avatar: mockUser.avatar
      };

      // Persist to localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);
      setSessionNotice(null);
      return { success: true, user: authUser };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    if (!name || !name.trim() || !email || !email.trim() || !password || !password.trim()) {
      throw new Error('All fields are required and cannot be whitespace only.');
    }

    setIsLoading(true);
    try {
      const data = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      const authToken = data.token || 'jwt_' + Date.now();
      const authUser = data.user || {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        avatar: mockUser.avatar
      };

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);
      setSessionNotice(null);
      return { success: true, user: authUser };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  const loginDemo = useCallback(() => {
    localStorage.setItem('token', mockUser.token);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setToken(mockUser.token);
    setUser(mockUser);
    setSessionNotice(null);
    return mockUser;
  }, []);

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    sessionNotice,
    login,
    register,
    logout,
    loginDemo,
    clearSessionNotice,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
