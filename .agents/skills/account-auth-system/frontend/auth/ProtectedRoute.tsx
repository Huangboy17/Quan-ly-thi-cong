import React from 'react';
import { useAuth } from './useAuth';
// Import UI components: LoginForm, PendingApproval, AccountBlocked

export const ProtectedRoute: React.FC<{ 
  children: React.ReactNode, 
  allowedAccountTypes?: string[],
  LoginComponent: React.ComponentType,
  PendingComponent: React.ComponentType,
  BlockedComponent: React.ComponentType,
  UnauthorizedComponent: React.ComponentType
}> = ({ 
  children, allowedAccountTypes,
  LoginComponent, PendingComponent, BlockedComponent, UnauthorizedComponent
}) => {
  const { session, profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!session) return <LoginComponent />;
  
  if (profile?.status === 'pending') return <PendingComponent />;
  if (profile?.status === 'blocked' || profile?.status === 'rejected') return <BlockedComponent />;
  
  if (allowedAccountTypes && !allowedAccountTypes.includes(profile?.account_type)) {
    return <UnauthorizedComponent />;
  }

  return <>{children}</>;
};
