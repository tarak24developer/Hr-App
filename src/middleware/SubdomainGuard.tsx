/**
 * Subdomain Guard Middleware
 * Ensures users are on the correct subdomain for their role
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { subdomainRouter } from '@/lib/subdomain/subdomainRouter';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

interface SubdomainGuardProps {
  children: React.ReactNode;
  requiredSubdomain?: string;
  fallbackPath?: string;
}

export const SubdomainGuard: React.FC<SubdomainGuardProps> = ({
  children,
  requiredSubdomain,
  fallbackPath = '/dashboard'
}) => {
  const { user, loading } = useAuthStore();
  const [isValidating, setIsValidating] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setIsValidating(false);
      return;
    }

    const currentSubdomain = subdomainRouter.getSubdomain();
    
    // If specific subdomain is required, check against it
    if (requiredSubdomain) {
      const hasAccess = subdomainRouter.hasAccess(user.role, requiredSubdomain);
      if (!hasAccess || currentSubdomain !== requiredSubdomain) {
        setShouldRedirect(true);
      }
    } else {
      // Check if user is on appropriate subdomain for their role
      const isCorrect = subdomainRouter.isOnCorrectSubdomain(user.role);
      if (!isCorrect) {
        // Auto-redirect to correct subdomain
        subdomainRouter.redirectToRoleSubdomain(user.role, false);
        return;
      }
    }

    setIsValidating(false);
  }, [user, loading, requiredSubdomain]);

  if (loading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Validating access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (shouldRedirect) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default SubdomainGuard;


