import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, Permission } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: Permission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { user, isAuthenticated, isLoading, checkPermission } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  // If user is logged in but pending approval, redirect to pending page
  if (user && user.approvalStatus === 'pending') {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!checkPermission(requiredPermission)) {
    return <Navigate to="/acesso-negado" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
