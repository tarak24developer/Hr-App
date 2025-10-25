/**
 * Enhanced RBAC (Role-Based Access Control) Type Definitions
 * Provides granular permission management and role-based access control
 */

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export type BaseRole = 'admin' | 'hr' | 'manager' | 'employee';
export type ExtendedRole = BaseRole | 'hr_manager' | 'payroll_admin' | 'it_admin' | 'recruiter' | 'training_coordinator';
export type Role = BaseRole | ExtendedRole;

export interface RoleDefinition {
  id: string;
  name: string;
  level: number; // Hierarchy level (higher = more privileges)
  description: string;
  inherits?: string[]; // Roles this role inherits permissions from
  permissions: PermissionSet;
  subdomain: string; // Default subdomain for this role
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export type ResourceType = 
  | 'employees' 
  | 'attendance' 
  | 'leaves' 
  | 'payroll' 
  | 'assets' 
  | 'training'
  | 'reports'
  | 'users'
  | 'settings'
  | 'documents'
  | 'incidents'
  | 'announcements'
  | 'notifications'
  | 'analytics'
  | 'workflows'
  | 'integrations'
  | 'audit_logs'
  | 'security'
  | 'compliance';

export type Action = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'approve' 
  | 'reject'
  | 'export'
  | 'import'
  | 'publish'
  | 'archive'
  | 'restore'
  | 'assign'
  | 'configure'
  | 'execute';

export interface Permission {
  id: string;
  resource: ResourceType;
  actions: Action[];
  conditions?: PermissionCondition[];
  scope?: PermissionScope;
  priority?: number; // Higher priority overrides lower
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export type PermissionScope = 
  | 'global'      // All records
  | 'department'  // Only records in user's department
  | 'team'        // Only records in user's team
  | 'own'         // Only own records
  | 'subordinates' // Only subordinates' records
  | 'custom';     // Custom scope defined by conditions

export interface PermissionSet {
  [resource: string]: Permission;
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  roles: string[];
  permissions: Permission[];
  restrictions?: AccessRestriction[];
  timeBasedAccess?: TimeBasedAccess;
  ipWhitelist?: string[];
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRestriction {
  type: 'time' | 'location' | 'device' | 'ip' | 'custom';
  rule: any;
  message?: string;
}

export interface TimeBasedAccess {
  allowedDays?: number[]; // 0-6 (Sunday-Saturday)
  allowedTimeStart?: string; // HH:mm format
  allowedTimeEnd?: string; // HH:mm format
  timezone?: string;
}

// ============================================================================
// USER ROLE MAPPING
// ============================================================================

export interface UserRoleMapping {
  userId: string;
  roles: Role[];
  customPermissions?: Permission[]; // Additional permissions beyond role
  deniedPermissions?: Permission[]; // Explicitly denied permissions
  effectiveFrom?: string;
  effectiveUntil?: string;
  assignedBy: string;
  assignedAt: string;
  reason?: string;
}

// ============================================================================
// PERMISSION CHECK
// ============================================================================

export interface PermissionCheckRequest {
  userId: string;
  resource: ResourceType;
  action: Action;
  context?: Record<string, any>; // Additional context for conditional permissions
  targetId?: string; // ID of the target resource
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedPermissions?: Permission[];
  appliedPolicies?: string[];
  restrictions?: AccessRestriction[];
}

// ============================================================================
// AUDIT & LOGGING
// ============================================================================

export interface AccessLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: Role;
  resource: ResourceType;
  action: Action;
  result: 'allowed' | 'denied';
  reason?: string;
  context?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  duration?: number; // milliseconds
}

// ============================================================================
// ROLE HIERARCHY
// ============================================================================

export interface RoleHierarchy {
  roles: Map<Role, RoleDefinition>;
  hierarchy: Map<Role, Role[]>; // Role -> Parent Roles
}

// ============================================================================
// DELEGATION
// ============================================================================

export interface PermissionDelegation {
  id: string;
  fromUserId: string;
  toUserId: string;
  permissions: Permission[];
  reason: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// TEMPORARY ACCESS
// ============================================================================

export interface TemporaryAccess {
  id: string;
  userId: string;
  grantedBy: string;
  permissions: Permission[];
  reason: string;
  startDate: string;
  endDate: string;
  autoRevoke: boolean;
  isActive: boolean;
  createdAt: string;
}


