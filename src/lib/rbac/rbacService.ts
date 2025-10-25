/**
 * RBAC Service
 * Comprehensive role-based access control with granular permissions
 */

import type {
  Role,
  Permission,
  ResourceType,
  Action,
  PermissionCheckRequest,
  PermissionCheckResult,
  RoleDefinition,
  PermissionScope,
  UserRoleMapping
} from '@/types/rbac';
import type { User } from '@/types';

// Default role definitions with permissions
export const DEFAULT_ROLES: Record<Role, RoleDefinition> = {
  admin: {
    id: 'admin',
    name: 'System Administrator',
    level: 100,
    description: 'Full system access and control',
    subdomain: 'admin',
    permissions: {
      '*': {
        id: 'admin_all',
        resource: 'employees' as ResourceType, // Placeholder
        actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'publish', 'archive', 'restore', 'assign', 'configure', 'execute'],
        scope: 'global'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  hr: {
    id: 'hr',
    name: 'HR Manager',
    level: 80,
    description: 'Human resources management',
    subdomain: 'hr',
    permissions: {
      employees: {
        id: 'hr_employees',
        resource: 'employees',
        actions: ['create', 'read', 'update', 'export'],
        scope: 'global'
      },
      attendance: {
        id: 'hr_attendance',
        resource: 'attendance',
        actions: ['read', 'update', 'export'],
        scope: 'global'
      },
      leaves: {
        id: 'hr_leaves',
        resource: 'leaves',
        actions: ['read', 'approve', 'reject', 'export'],
        scope: 'global'
      },
      payroll: {
        id: 'hr_payroll',
        resource: 'payroll',
        actions: ['create', 'read', 'update', 'export'],
        scope: 'global'
      },
      training: {
        id: 'hr_training',
        resource: 'training',
        actions: ['create', 'read', 'update', 'delete', 'assign'],
        scope: 'global'
      },
      reports: {
        id: 'hr_reports',
        resource: 'reports',
        actions: ['read', 'export'],
        scope: 'global'
      },
      documents: {
        id: 'hr_documents',
        resource: 'documents',
        actions: ['create', 'read', 'update', 'delete'],
        scope: 'global'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  hr_manager: {
    id: 'hr_manager',
    name: 'Senior HR Manager',
    level: 85,
    description: 'Senior HR with additional privileges',
    inherits: ['hr'],
    subdomain: 'hr',
    permissions: {
      users: {
        id: 'hr_manager_users',
        resource: 'users',
        actions: ['create', 'read', 'update'],
        scope: 'department'
      },
      settings: {
        id: 'hr_manager_settings',
        resource: 'settings',
        actions: ['read', 'update'],
        scope: 'department'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  manager: {
    id: 'manager',
    name: 'Team Manager',
    level: 60,
    description: 'Team and department management',
    subdomain: 'manager',
    permissions: {
      employees: {
        id: 'manager_employees',
        resource: 'employees',
        actions: ['read'],
        scope: 'subordinates'
      },
      attendance: {
        id: 'manager_attendance',
        resource: 'attendance',
        actions: ['read', 'update'],
        scope: 'subordinates'
      },
      leaves: {
        id: 'manager_leaves',
        resource: 'leaves',
        actions: ['read', 'approve', 'reject'],
        scope: 'subordinates'
      },
      reports: {
        id: 'manager_reports',
        resource: 'reports',
        actions: ['read', 'export'],
        scope: 'subordinates'
      },
      training: {
        id: 'manager_training',
        resource: 'training',
        actions: ['read', 'assign'],
        scope: 'subordinates'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  employee: {
    id: 'employee',
    name: 'Employee',
    level: 10,
    description: 'Standard employee access',
    subdomain: 'employee',
    permissions: {
      employees: {
        id: 'employee_profile',
        resource: 'employees',
        actions: ['read', 'update'],
        scope: 'own'
      },
      attendance: {
        id: 'employee_attendance',
        resource: 'attendance',
        actions: ['read'],
        scope: 'own'
      },
      leaves: {
        id: 'employee_leaves',
        resource: 'leaves',
        actions: ['create', 'read', 'update'],
        scope: 'own'
      },
      documents: {
        id: 'employee_documents',
        resource: 'documents',
        actions: ['read'],
        scope: 'own'
      },
      training: {
        id: 'employee_training',
        resource: 'training',
        actions: ['read'],
        scope: 'own'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  payroll_admin: {
    id: 'payroll_admin',
    name: 'Payroll Administrator',
    level: 70,
    description: 'Payroll management and processing',
    subdomain: 'hr',
    permissions: {
      payroll: {
        id: 'payroll_admin_payroll',
        resource: 'payroll',
        actions: ['create', 'read', 'update', 'delete', 'export', 'execute'],
        scope: 'global'
      },
      employees: {
        id: 'payroll_admin_employees',
        resource: 'employees',
        actions: ['read'],
        scope: 'global'
      },
      reports: {
        id: 'payroll_admin_reports',
        resource: 'reports',
        actions: ['read', 'export'],
        scope: 'global'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  it_admin: {
    id: 'it_admin',
    name: 'IT Administrator',
    level: 95,
    description: 'IT infrastructure and security management',
    subdomain: 'admin',
    permissions: {
      security: {
        id: 'it_admin_security',
        resource: 'security',
        actions: ['read', 'update', 'configure'],
        scope: 'global'
      },
      users: {
        id: 'it_admin_users',
        resource: 'users',
        actions: ['create', 'read', 'update', 'delete'],
        scope: 'global'
      },
      audit_logs: {
        id: 'it_admin_audit',
        resource: 'audit_logs',
        actions: ['read', 'export'],
        scope: 'global'
      },
      integrations: {
        id: 'it_admin_integrations',
        resource: 'integrations',
        actions: ['create', 'read', 'update', 'delete', 'configure'],
        scope: 'global'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  recruiter: {
    id: 'recruiter',
    name: 'Recruiter',
    level: 50,
    description: 'Recruitment and talent acquisition',
    subdomain: 'hr',
    permissions: {
      employees: {
        id: 'recruiter_employees',
        resource: 'employees',
        actions: ['create', 'read', 'update'],
        scope: 'department'
      },
      documents: {
        id: 'recruiter_documents',
        resource: 'documents',
        actions: ['create', 'read', 'update'],
        scope: 'department'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  training_coordinator: {
    id: 'training_coordinator',
    name: 'Training Coordinator',
    level: 50,
    description: 'Training and development management',
    subdomain: 'hr',
    permissions: {
      training: {
        id: 'training_coord_training',
        resource: 'training',
        actions: ['create', 'read', 'update', 'delete', 'assign'],
        scope: 'global'
      },
      employees: {
        id: 'training_coord_employees',
        resource: 'employees',
        actions: ['read'],
        scope: 'global'
      }
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

class RBACService {
  private roles: Map<Role, RoleDefinition> = new Map();
  private userRoleMappings: Map<string, UserRoleMapping> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles() {
    Object.entries(DEFAULT_ROLES).forEach(([role, definition]) => {
      this.roles.set(role as Role, definition);
    });
  }

  /**
   * Check if user has permission for a specific action
   */
  public async checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResult> {
    try {
      // Get user's roles
      const userMapping = this.userRoleMappings.get(request.userId);
      const userRoles = userMapping?.roles || [];

      if (userRoles.length === 0) {
        return {
          allowed: false,
          reason: 'User has no assigned roles'
        };
      }

      // Admin always has access
      if (userRoles.includes('admin')) {
        return {
          allowed: true,
          reason: 'Admin has full access'
        };
      }

      // Check each role's permissions
      const matchedPermissions: Permission[] = [];
      const appliedPolicies: string[] = [];

      for (const role of userRoles) {
        const roleDefinition = this.roles.get(role);
        if (!roleDefinition || !roleDefinition.isActive) continue;

        // Check if role has wildcard permission
        if (roleDefinition.permissions['*']) {
          return {
            allowed: true,
            reason: `Role ${role} has wildcard access`,
            matchedPermissions: [roleDefinition.permissions['*']]
          };
        }

        // Check specific resource permission
        const permission = roleDefinition.permissions[request.resource];
        if (permission && permission.actions.includes(request.action)) {
          // Check scope
          const scopeAllowed = await this.checkScope(permission.scope, request);
          if (scopeAllowed) {
            matchedPermissions.push(permission);
          }
        }

        // Check inherited permissions
        if (roleDefinition.inherits) {
          for (const inheritedRole of roleDefinition.inherits) {
            const inheritedDefinition = this.roles.get(inheritedRole as Role);
            if (inheritedDefinition) {
              const inheritedPermission = inheritedDefinition.permissions[request.resource];
              if (inheritedPermission && inheritedPermission.actions.includes(request.action)) {
                const scopeAllowed = await this.checkScope(inheritedPermission.scope, request);
                if (scopeAllowed) {
                  matchedPermissions.push(inheritedPermission);
                }
              }
            }
          }
        }
      }

      // Check custom permissions
      if (userMapping?.customPermissions) {
        for (const customPerm of userMapping.customPermissions) {
          if (customPerm.resource === request.resource && 
              customPerm.actions.includes(request.action)) {
            const scopeAllowed = await this.checkScope(customPerm.scope, request);
            if (scopeAllowed) {
              matchedPermissions.push(customPerm);
            }
          }
        }
      }

      // Check denied permissions (these override)
      if (userMapping?.deniedPermissions) {
        for (const deniedPerm of userMapping.deniedPermissions) {
          if (deniedPerm.resource === request.resource && 
              deniedPerm.actions.includes(request.action)) {
            return {
              allowed: false,
              reason: 'Permission explicitly denied',
              matchedPermissions
            };
          }
        }
      }

      if (matchedPermissions.length > 0) {
        return {
          allowed: true,
          reason: 'Permission granted',
          matchedPermissions,
          appliedPolicies
        };
      }

      return {
        allowed: false,
        reason: 'No matching permissions found'
      };
    } catch (error) {
      console.error('Permission check error:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions'
      };
    }
  }

  /**
   * Check if scope allows access
   */
  private async checkScope(scope: PermissionScope | undefined, request: PermissionCheckRequest): Promise<boolean> {
    if (!scope || scope === 'global') return true;

    // Implement scope checks based on context
    const { context, userId, targetId } = request;

    switch (scope) {
      case 'own':
        return userId === targetId;
      
      case 'department':
        // Check if user and target are in same department
        return context?.['userDepartment'] === context?.['targetDepartment'];
      
      case 'team':
        // Check if user and target are in same team
        return context?.['userTeam'] === context?.['targetTeam'];
      
      case 'subordinates':
        // Check if target is user's subordinate
        return context?.['subordinates']?.includes(targetId || '');
      
      case 'custom':
        // Custom scope logic would go here
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Quick permission check helper
   */
  public async can(userId: string, action: Action, resource: ResourceType, context?: Record<string, any>): Promise<boolean> {
    const result = await this.checkPermission({
      userId,
      resource,
      action,
      ...(context && { context })
    });
    return result.allowed;
  }

  /**
   * Check multiple permissions at once
   */
  public async canAll(userId: string, permissions: Array<{action: Action, resource: ResourceType}>): Promise<boolean> {
    const checks = await Promise.all(
      permissions.map(p => this.can(userId, p.action, p.resource))
    );
    return checks.every(result => result === true);
  }

  /**
   * Check if any of the permissions is granted
   */
  public async canAny(userId: string, permissions: Array<{action: Action, resource: ResourceType}>): Promise<boolean> {
    const checks = await Promise.all(
      permissions.map(p => this.can(userId, p.action, p.resource))
    );
    return checks.some(result => result === true);
  }

  /**
   * Assign role to user
   */
  public async assignRole(userId: string, role: Role, assignedBy: string, reason?: string): Promise<void> {
    const mapping = this.userRoleMappings.get(userId) || {
      userId,
      roles: [],
      assignedBy,
      assignedAt: new Date().toISOString()
    };

    if (!mapping.roles.includes(role)) {
      mapping.roles.push(role);
      if (reason) mapping.reason = reason;
      this.userRoleMappings.set(userId, mapping);
    }
  }

  /**
   * Remove role from user
   */
  public async removeRole(userId: string, role: Role): Promise<void> {
    const mapping = this.userRoleMappings.get(userId);
    if (mapping) {
      mapping.roles = mapping.roles.filter(r => r !== role);
      this.userRoleMappings.set(userId, mapping);
    }
  }

  /**
   * Get user's roles
   */
  public getUserRoles(userId: string): Role[] {
    const mapping = this.userRoleMappings.get(userId);
    return mapping?.roles || [];
  }

  /**
   * Get role definition
   */
  public getRole(role: Role): RoleDefinition | undefined {
    return this.roles.get(role);
  }

  /**
   * Get all available roles
   */
  public getAllRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  /**
   * Check if user has specific role
   */
  public hasRole(userId: string, role: Role): boolean {
    const mapping = this.userRoleMappings.get(userId);
    return mapping?.roles.includes(role) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(userId: string, roles: Role[]): boolean {
    const userRoles = this.getUserRoles(userId);
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Get user's highest role level
   */
  public getUserRoleLevel(userId: string): number {
    const userRoles = this.getUserRoles(userId);
    let maxLevel = 0;

    for (const role of userRoles) {
      const definition = this.roles.get(role);
      if (definition && definition.level > maxLevel) {
        maxLevel = definition.level;
      }
    }

    return maxLevel;
  }

  /**
   * Initialize user roles from User object
   */
  public initializeUserRoles(user: User): void {
    if (!this.userRoleMappings.has(user.id)) {
      this.userRoleMappings.set(user.id, {
        userId: user.id,
        roles: [user.role],
        assignedBy: 'system',
        assignedAt: user.createdAt
      });
    }
  }
}

// Singleton instance
export const rbacService = new RBACService();

export default rbacService;


