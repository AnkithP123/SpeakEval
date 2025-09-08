import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://server.speakeval.org';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || localStorage.getItem('classroom_token'));
  const [loading, setLoading] = useState(true);

  // Set axios authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/verify-token');
        setUser({
          email: response.data.email,
          username: response.data.username,
          subscription: response.data.subscription
        });
      } catch (error) {
        console.error('Token verification failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/login', { username, password });
      
      const { token: newToken, username: userUsername, subscription } = response.data;
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      setUser({
        username: userUsername,
        subscription: subscription
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const response = await axios.post('/login-google', {
        googleId: { credential }
      });
      
      const { token: newToken, username, subscription } = response.data;
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      setUser({
        username: username,
        subscription: subscription
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Google login failed';
      return { success: false, error: message };
    }
  };

  const register = async (email, username, password, fullName) => {
    try {
      const response = await axios.post('/register', {
        email,
        username,
        password,
        fullName
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Clear classroom authentication
    localStorage.removeItem('classroom_token');
    localStorage.removeItem('classroom_user');
    localStorage.removeItem('token');
    
    // Also clear main site authentication
    localStorage.removeItem('username');
    localStorage.removeItem('pin');
    localStorage.removeItem('gold');
    localStorage.removeItem('ultimate');
    
    delete axios.defaults.headers.common['Authorization'];
  };

  const checkUserRole = async () => {
    if (!user) return { isTeacher: false, isStudent: false };
    
    try {
      // Check if user is teacher verified by trying to access subscription endpoint
      const response = await axios.get('/subscription');
      const subscription = response.data.subscription;
      
      // For now, assume all verified users can be teachers or students
      // This could be expanded with more sophisticated role checking
      return {
        isTeacher: true, // All authenticated users can create classes
        isStudent: true,  // All authenticated users can join classes
        subscription: subscription
      };
    } catch (error) {
      return { isTeacher: false, isStudent: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    checkUserRole,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};