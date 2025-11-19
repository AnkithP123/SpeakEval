import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Updated AuthRequired component using centralized AuthContext
 * 
 * Industry standard approach:
 * - Uses centralized auth state (no race conditions)
 * - Shows loading state while auth is being verified
 * - Only redirects after auth check is complete
 */
const AuthRequired = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Also check classroom_user for classroom-specific auth
  const classroomUser = typeof window !== 'undefined' 
    ? localStorage.getItem('classroom_user') 
    : null;

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Check teacher authentication via AuthContext
  if (isAuthenticated) {
    return children;
  }

  // Check classroom authentication (for students/teachers in classroom)
  if (classroomUser) {
    try {
      const user = JSON.parse(classroomUser);
      if (user.isAuthenticated && (user.userType === 'student' || user.userType === 'teacher')) {
        return children;
      }
    } catch (error) {
      // Invalid JSON - redirect to login
      return <Navigate to="/classroom/login" replace />;
    }
  }

  // No valid authentication - redirect to login
  return <Navigate to="/classroom/login" replace />;
};

export default AuthRequired;