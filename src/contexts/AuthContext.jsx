import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API_BASE from '../lib/api';

const AuthContext = createContext(null);

const BACKEND_URL = `${API_BASE}/api/auth`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    const token = localStorage.getItem('dayflow_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid or expired
        localStorage.removeItem('dayflow_token');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize from JWT
  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  const login = useCallback(async (loginIdOrEmail, password) => {
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdOrEmail.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      localStorage.setItem('dayflow_token', data.token);
      setLoading(false);
      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const signup = useCallback(async (email, password, role, name, companyName, phone) => {
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          name,
          companyName,
          phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      if (data.token) {
        setUser(data.user);
        localStorage.setItem('dayflow_token', data.token);
      }
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('dayflow_token');
  }, []);

  const value = {
    user,
    role: user?.role || null,
    loading,
    login,
    signup,
    logout,
    reloadUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
