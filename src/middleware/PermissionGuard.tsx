/**
 * Permission Guard Middleware
 * Protects routes and components based on RBAC permissions
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { rbacService } from '@/lib/rbac/rbacService';
import type { ResourceType, Action } from '@/types/rbac';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

interface PermissionGuardProps {
  children: React.ReactNode;
  resource: ResourceType;
  action: Action;
  fallbackPath?: string;
  fallbackComponent?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  fallbackPath,
  fallbackComponent
}) => {
  const { user, loading } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (loading || !user) {
        setIsChecking(false);
        return;
      }

      try {
        // Initialize user roles if not already done
        rbacService.initializeUserRoles(user);

        // Check permission
        const allowed = await rbacService.can(user.id, action, resource);
        setHasPermission(allowed);
      } catch (error) {
        console.error('Permission check error:', error);
        setHasPermission(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, [user, loading, resource, action]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }

    // Redirect to dashboard instead of showing "Access Denied"
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Hook to check permissions
 */
export const usePermission = (resource: ResourceType, action: Action) => {
  const { user } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setHasPermission(false);
        setIsChecking(false);
        return;
      }

      try {
        rbacService.initializeUserRoles(user);
        const allowed = await rbacService.can(user.id, action, resource);
        setHasPermission(allowed);
      } catch (error) {
        console.error('Permission check error:', error);
        setHasPermission(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, [user, resource, action]);

  return { hasPermission, isChecking };
};

export default PermissionGuard;


