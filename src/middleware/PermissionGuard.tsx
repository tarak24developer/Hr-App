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

    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this resource.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
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


