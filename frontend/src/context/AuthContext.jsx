import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);
const ownerKeyFor = (user) => String(user?.id || user?._id || user?.email || '').trim().toLowerCase() || null;
const announceAccountChange = (user) => {
  window.dispatchEvent(new CustomEvent('skillbridge:account-changed', { detail: { ownerKey: ownerKeyFor(user) } }));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('resume_ai_token');
      const storedUser = localStorage.getItem('user') || localStorage.getItem('resume_ai_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('resume_ai_token');
        localStorage.removeItem('resume_ai_user');
      }
    } catch (error) {
      console.error('Could not restore authentication state:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }

    const handleExpired = (event) => {
      setUser(null);
      setToken(null);
      setSessionNotice(event.detail?.message || 'Your session has expired. Please sign in again.');
      announceAccountChange(null);
    };
    window.addEventListener('auth:session_expired', handleExpired);
    return () => window.removeEventListener('auth:session_expired', handleExpired);
  }, []);

  const acceptAuthResponse = useCallback((data) => {
    if (!data?.token || !data?.user) {
      throw new Error('The server did not return a valid authenticated session. Please try again.');
    }
    const authToken = data.token;
    const authUser = data.user;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    localStorage.removeItem('resume_ai_token');
    localStorage.removeItem('resume_ai_user');
    setToken(authToken);
    setUser(authUser);
    setSessionNotice(null);
    announceAccountChange(authUser);
    return { success: true, user: authUser, token: authToken };
  }, []);

  const login = useCallback(async (email, password) => {
    if (!email?.trim() || !password || !password.trim()) {
      throw new Error('Email and password are required.');
    }
    setIsLoading(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      return acceptAuthResponse(data);
    } finally {
      setIsLoading(false);
    }
  }, [acceptAuthResponse]);

  // Registration creates a pending OTP request only. It must not create a fake JWT or login.
  const register = useCallback(async (name, email, password) => {
    if (!name?.trim() || !email?.trim() || !password) {
      throw new Error('Name, email, and password are required.');
    }
    setIsLoading(true);
    try {
      return await authApi.register({ name: name.trim(), email: email.trim(), password });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('resume_ai_token');
      localStorage.removeItem('resume_ai_user');
      setToken(null);
      setUser(null);
      announceAccountChange(null);
    }
  }, []);

  // Demo login is opt-in only; never manufacture a token in normal operation.
  const loginDemo = useCallback(() => {
    throw new Error('Demo login is disabled. Use a registered, verified account.');
  }, []);

  const clearSessionNotice = useCallback(() => setSessionNotice(null), []);

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: Boolean(token && user), isLoading, sessionNotice,
      login, register, logout, loginDemo, acceptAuthResponse, clearSessionNotice,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
