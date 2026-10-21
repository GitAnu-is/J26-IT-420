import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { screenPaths } from '../data/routes';

export function ProtectedRoute({ children }: {children: React.ReactNode;}) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={screenPaths.login} replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}