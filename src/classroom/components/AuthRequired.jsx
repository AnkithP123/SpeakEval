import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthRequired = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated (either as student or teacher)
    const teacherToken = localStorage.getItem('token');
    const teacherUsername = localStorage.getItem('username');
    const classroomUser = localStorage.getItem('classroom_user');
    
    // Check teacher authentication
    if (teacherToken && teacherUsername) {
      // Teacher is authenticated - allow access
      return;
    }
    
    // Check classroom authentication (both teachers and students)
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
  const teacherToken = localStorage.getItem('token');
  const teacherUsername = localStorage.getItem('username');
  const classroomUser = localStorage.getItem('classroom_user');
  
  // Check teacher authentication
  if (teacherToken && teacherUsername) {
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