import React from 'react';
import { Navigate } from 'react-router-dom';

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

export const UserProtectedRoute: React.FC<UserProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('guestToken');

  if (!token) {
    return <Navigate to="/user/login" replace />;
  }

  return <>{children}</>;
};
