/**
 * Subdomain Router
 * Handles multi-tenant subdomain routing for role-based access
 */

import type { Role } from '@/types/rbac';

export interface SubdomainConfig {
  subdomain: string;
  role: Role;
  displayName: string;
  description: string;
  defaultRoute: string;
  allowedRoles: Role[];
  theme?: string;
  features?: string[];
}

// Subdomain configuration for different roles
export const SUBDOMAIN_CONFIG: Record<string, SubdomainConfig> = {
  admin: {
    subdomain: 'admin',
    role: 'admin',
    displayName: 'Admin Portal',
    description: 'Full system administration and control',
    defaultRoute: '/admin/dashboard',
    allowedRoles: ['admin', 'it_admin'],
    theme: 'enterprise',
    features: [
      'user_management',
      'system_settings',
      'security_management',
      'audit_logs',
      'analytics',
      'integrations',
      'workflow_automation',
      'compliance',
      'backup_restore'
    ]
  },
  hr: {
    subdomain: 'hr',
    role: 'hr',
    displayName: 'HR Portal',
    description: 'Human Resources management and operations',
    defaultRoute: '/hr/dashboard',
    allowedRoles: ['admin', 'hr', 'hr_manager', 'recruiter', 'payroll_admin'],
    theme: 'professional',
    features: [
      'employee_management',
      'recruitment',
      'onboarding',
      'payroll',
      'benefits',
      'performance_reviews',
      'training_development',
      'compliance',
      'reports'
    ]
  },
  manager: {
    subdomain: 'manager',
    role: 'manager',
    displayName: 'Manager Portal',
    description: 'Team management and oversight',
    defaultRoute: '/manager/dashboard',
    allowedRoles: ['admin', 'hr', 'manager', 'hr_manager'],
    theme: 'modern',
    features: [
      'team_overview',
      'leave_approvals',
      'performance_management',
      'timesheet_review',
      'goal_tracking',
      'team_reports',
      'feedback',
      'resource_allocation'
    ]
  },
  employee: {
    subdomain: 'employee',
    role: 'employee',
    displayName: 'Employee Portal',
    description: 'Self-service employee portal',
    defaultRoute: '/employee/dashboard',
    allowedRoles: ['admin', 'hr', 'manager', 'employee'],
    theme: 'friendly',
    features: [
      'my_profile',
      'attendance',
      'leave_requests',
      'payslips',
      'benefits',
      'training',
      'documents',
      'announcements',
      'help_desk'
    ]
  },
  app: {
    subdomain: 'app',
    role: 'employee',
    displayName: 'Main Portal',
    description: 'Main application portal',
    defaultRoute: '/dashboard',
    allowedRoles: ['admin', 'hr', 'manager', 'employee'],
    theme: 'default',
    features: []
  }
};

class SubdomainRouter {
  /**
   * Extract subdomain from hostname
   */
  public getSubdomain(hostname: string = window.location.hostname): string | null {
    // Handle localhost and IP addresses
    if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return 'app'; // Default to main app for localhost
    }

    const parts = hostname.split('.');
    
    // If only one part (e.g., localhost) or two parts (e.g., domain.com), no subdomain
    if (parts.length <= 2) {
      return 'app';
    }

    // First part is the subdomain
    const subdomain = parts[0];
    
    // Check if it's a valid configured subdomain
    if (subdomain && SUBDOMAIN_CONFIG[subdomain]) {
      return subdomain;
    }

    return 'app'; // Default to main app
  }

  /**
   * Get subdomain configuration
   */
  public getSubdomainConfig(subdomain: string): SubdomainConfig | null {
    return SUBDOMAIN_CONFIG[subdomain] || null;
  }

  /**
   * Check if user has access to subdomain
   */
  public hasAccess(userRole: Role, subdomain: string): boolean {
    const config = SUBDOMAIN_CONFIG[subdomain];
    if (!config) return false;
    
    return config.allowedRoles.includes(userRole);
  }

  /**
   * Get appropriate subdomain for user role
   */
  public getSubdomainForRole(role: Role): string {
    // Admin gets admin portal
    if (role === 'admin' || role === 'it_admin') return 'admin';
    
    // HR roles get HR portal
    if (role === 'hr' || role === 'hr_manager' || role === 'recruiter' || role === 'payroll_admin') {
      return 'hr';
    }
    
    // Manager gets manager portal
    if (role === 'manager') return 'manager';
    
    // Employee gets employee portal
    return 'employee';
  }

  /**
   * Build subdomain URL
   */
  public buildSubdomainUrl(subdomain: string, path: string = '/', protocol?: string): string {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const usedProtocol = protocol || window.location.protocol;

    // Handle localhost
    if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      // For localhost, use query parameter instead of subdomain
      const portPart = port ? `:${port}` : '';
      return `${usedProtocol}//${hostname}${portPart}${path}?subdomain=${subdomain}`;
    }

    // Extract base domain (remove existing subdomain if present)
    const parts = hostname.split('.');
    const baseDomain = parts.length > 2 ? parts.slice(1).join('.') : hostname;
    
    // Build new URL with subdomain
    const portPart = port ? `:${port}` : '';
    return `${usedProtocol}//${subdomain}.${baseDomain}${portPart}${path}`;
  }

  /**
   * Redirect to appropriate subdomain based on user role
   */
  public redirectToRoleSubdomain(role: Role, preservePath: boolean = false): void {
    const targetSubdomain = this.getSubdomainForRole(role);
    const currentSubdomain = this.getSubdomain();

    // If already on correct subdomain, do nothing
    if (currentSubdomain === targetSubdomain) {
      return;
    }

    // Get target config
    const config = SUBDOMAIN_CONFIG[targetSubdomain];
    if (!config) return;

    // Determine target path
    const targetPath = preservePath ? window.location.pathname : config.defaultRoute;

    // Build and redirect to new URL
    const targetUrl = this.buildSubdomainUrl(targetSubdomain, targetPath);
    window.location.href = targetUrl;
  }

  /**
   * Check if current subdomain matches user role
   */
  public isOnCorrectSubdomain(role: Role): boolean {
    const currentSubdomain = this.getSubdomain();
    if (!currentSubdomain) return false;

    return this.hasAccess(role, currentSubdomain);
  }

  /**
   * Get available subdomains for user role
   */
  public getAvailableSubdomains(role: Role): SubdomainConfig[] {
    return Object.values(SUBDOMAIN_CONFIG).filter(config =>
      config.allowedRoles.includes(role)
    );
  }

  /**
   * Get current subdomain config
   */
  public getCurrentSubdomainConfig(): SubdomainConfig | null {
    const subdomain = this.getSubdomain();
    return subdomain ? this.getSubdomainConfig(subdomain) : null;
  }

  /**
   * Check if feature is enabled for current subdomain
   */
  public hasFeature(feature: string): boolean {
    const config = this.getCurrentSubdomainConfig();
    if (!config) return false;
    
    return config.features?.includes(feature) || false;
  }

  /**
   * Get all configured subdomains
   */
  public getAllSubdomains(): SubdomainConfig[] {
    return Object.values(SUBDOMAIN_CONFIG);
  }
}

// Singleton instance
export const subdomainRouter = new SubdomainRouter();

// Export utility functions
export const getSubdomain = () => subdomainRouter.getSubdomain();
export const getSubdomainConfig = (subdomain: string) => subdomainRouter.getSubdomainConfig(subdomain);
export const hasSubdomainAccess = (role: Role, subdomain: string) => subdomainRouter.hasAccess(role, subdomain);
export const redirectToRoleSubdomain = (role: Role, preservePath?: boolean) => 
  subdomainRouter.redirectToRoleSubdomain(role, preservePath);
export const getCurrentSubdomainConfig = () => subdomainRouter.getCurrentSubdomainConfig();

export default subdomainRouter;


