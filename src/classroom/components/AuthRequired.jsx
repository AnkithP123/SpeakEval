import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthRequired = ({ children }) => {
  const navigate = useNavigate();

  const decodeUserTypeFromToken = (jwt) => {
    try {
      const base64Url = jwt.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      return payload.userType;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    // Check if user is authenticated (either as student or teacher)
    const token = localStorage.getItem('token') || localStorage.getItem('classroom_token');
    const userType = token ? decodeUserTypeFromToken(token) : undefined;
    const classroomUser = localStorage.getItem('classroom_user');
    
    // If token has a valid userType, allow
    if (userType === 'teacher' || userType === 'student') {
      return;
    }

    // Else check legacy classroom_user blob
    if (classroomUser) {
      try {
        const user = JSON.parse(classroomUser);
        if (user.isAuthenticated && (user.userType === 'student' || user.userType === 'teacher')) {
          // User is authenticated - allow access
          return;
        }
      } catch (error) {
        // Invalid JSON - redirect to login
        navigate('/classroom/login');
        return;
      }
    }
    
    // No valid authentication found - redirect to login
    navigate('/classroom/login');
  }, [navigate]);

  // Check authentication on render
  const token = localStorage.getItem('token') || localStorage.getItem('classroom_token');
  const userType = token ? (function() {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).userType;
    } catch { return undefined; }
  })() : undefined;
  const classroomUser = localStorage.getItem('classroom_user');
  
  // Prefer token with userType
  if (userType === 'teacher' || userType === 'student') {
    return children;
  }
  
  // Check classroom authentication (both teachers and students)
  if (classroomUser) {
    try {
      const user = JSON.parse(classroomUser);
      if (user.isAuthenticated && (user.userType === 'student' || user.userType === 'teacher')) {
        return children;
      }
    } catch (error) {
      // Invalid JSON - don't render
      return null;
    }
  }
  
  // No valid authentication - don't render (will redirect in useEffect)
  return null;
};

export default AuthRequired;