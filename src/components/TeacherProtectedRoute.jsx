import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Teacher-only protected route.
 * Same behavior as ProtectedRoute for unauthenticated users (redirect to login).
 * Additionally redirects authenticated students to home (or optional redirect).
 */
const TeacherProtectedRoute = ({ children, redirectTo = '/login', studentRedirectTo = '/' }) => {
  const { isAuthenticated, isLoading, userType } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Authenticated but not a teacher (e.g. student) -> redirect
  if (userType !== 'teacher') {
    return <Navigate to={studentRedirectTo} replace />;
  }

  return children;
};

export default TeacherProtectedRoute;
