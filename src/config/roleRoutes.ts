/**
 * Role-Based Route Configuration
 * Defines which pages each role can access and their module paths
 * 
 * This configuration enables:
 * 1. Easy subdomain deployment (each role can be deployed separately)
 * 2. Dynamic routing based on user role
 * 3. Clear separation of concerns
 */

export interface RouteConfig {
  path: string;
  name: string;
  component: string; // Path to component relative to src/
  roles: string[];
  exact?: boolean;
}

/**
 * Role-specific route configurations
 * Each role has its own set of allowed routes
 */
export const ROLE_ROUTES: Record<string, RouteConfig[]> = {
  // ========================================
  // ADMIN ROUTES
  // ========================================
  admin: [
    { path: '/dashboard', name: 'Dashboard', component: 'modules/admin/AdminDashboard', roles: ['admin', 'it_admin'] },
    { path: '/employee-directory', name: 'Employee Directory', component: 'pages/EmployeeDirectory', roles: ['admin', 'it_admin'] },
    { path: '/employee-management', name: 'Employee Management', component: 'pages/Employees', roles: ['admin', 'it_admin'] },
    { path: '/exit-process', name: 'Exit Process', component: 'pages/ExitProcess', roles: ['admin', 'it_admin'] },
    { path: '/attendance', name: 'Attendance', component: 'pages/Attendance', roles: ['admin', 'it_admin'] },
    { path: '/leaves', name: 'Leave Management', component: 'pages/Leaves', roles: ['admin', 'it_admin'] },
    { path: '/holidays', name: 'Holidays', component: 'pages/Holidays', roles: ['admin', 'it_admin'] },
    { path: '/training', name: 'Training', component: 'pages/Training', roles: ['admin', 'it_admin'] },
    { path: '/feedback-surveys', name: 'Feedback Surveys', component: 'pages/FeedbackSurveys', roles: ['admin', 'it_admin'] },
    { path: '/request-portal', name: 'Request Portal', component: 'pages/RequestPortal', roles: ['admin', 'it_admin'] },
    { path: '/payroll', name: 'Payroll', component: 'pages/Payroll', roles: ['admin', 'it_admin'] },
    { path: '/expense-management', name: 'Expense Management', component: 'pages/ExpenseManagement', roles: ['admin', 'it_admin'] },
    { path: '/assets', name: 'Asset Management', component: 'pages/AssetManagement', roles: ['admin', 'it_admin'] },
    { path: '/inventory', name: 'Inventory', component: 'pages/Inventory', roles: ['admin', 'it_admin'] },
    { path: '/advanced-analytics', name: 'Advanced Analytics', component: 'pages/AdvancedAnalytics', roles: ['admin', 'it_admin'] },
    { path: '/reports', name: 'Reports', component: 'pages/Reports', roles: ['admin', 'it_admin'] },
    { path: '/user-tracking', name: 'User Tracking', component: 'pages/UserTracking', roles: ['admin', 'it_admin'] },
    { path: '/users', name: 'Users', component: 'pages/Users', roles: ['admin', 'it_admin'] },
    { path: '/live-tracking-map', name: 'Live Tracking Map', component: 'pages/LiveTrackingMap', roles: ['admin', 'it_admin'] },
    { path: '/security', name: 'Security', component: 'pages/Security', roles: ['admin', 'it_admin'] },
    { path: '/enhanced-access-control', name: 'Access Control', component: 'pages/EnhancedAccessControl', roles: ['admin', 'it_admin'] },
    { path: '/incident-management', name: 'Incident Management', component: 'pages/IncidentManagement', roles: ['admin', 'it_admin'] },
    { path: '/document-management', name: 'Document Management', component: 'pages/DocumentManagement', roles: ['admin', 'it_admin'] },
    { path: '/announcements', name: 'Announcements', component: 'pages/Announcements', roles: ['admin', 'it_admin'] },
    { path: '/notifications', name: 'Notifications', component: 'pages/Notifications', roles: ['admin', 'it_admin'] },
    { path: '/profile', name: 'Profile', component: 'pages/Profile', roles: ['admin', 'it_admin'] },
    { path: '/settings', name: 'Settings', component: 'pages/Settings', roles: ['admin', 'it_admin'] },
  ],

  // ========================================
  // HR ROUTES
  // ========================================
  hr: [
    { path: '/dashboard', name: 'Dashboard', component: 'modules/hr/HRDashboard', roles: ['hr', 'hr_manager'] },
    { path: '/employee-directory', name: 'Employee Directory', component: 'pages/EmployeeDirectory', roles: ['hr', 'hr_manager'] },
    { path: '/employee-management', name: 'Employee Management', component: 'pages/Employees', roles: ['hr', 'hr_manager'] },
    { path: '/exit-process', name: 'Exit Process', component: 'pages/ExitProcess', roles: ['hr', 'hr_manager'] },
    { path: '/attendance', name: 'Attendance', component: 'pages/Attendance', roles: ['hr', 'hr_manager'] },
    { path: '/leaves', name: 'Leave Management', component: 'pages/Leaves', roles: ['hr', 'hr_manager'] },
    { path: '/holidays', name: 'Holidays', component: 'pages/Holidays', roles: ['hr', 'hr_manager'] },
    { path: '/training', name: 'Training', component: 'pages/Training', roles: ['hr', 'hr_manager'] },
    { path: '/feedback-surveys', name: 'Feedback Surveys', component: 'pages/FeedbackSurveys', roles: ['hr', 'hr_manager'] },
    { path: '/request-portal', name: 'Request Portal', component: 'pages/RequestPortal', roles: ['hr', 'hr_manager'] },
    { path: '/payroll', name: 'Payroll', component: 'pages/Payroll', roles: ['hr', 'hr_manager'] },
    { path: '/expense-management', name: 'Expense Management', component: 'pages/ExpenseManagement', roles: ['hr', 'hr_manager'] },
    { path: '/advanced-analytics', name: 'Advanced Analytics', component: 'pages/AdvancedAnalytics', roles: ['hr', 'hr_manager'] },
    { path: '/reports', name: 'Reports', component: 'pages/Reports', roles: ['hr', 'hr_manager'] },
    { path: '/incident-management', name: 'Incident Management', component: 'pages/IncidentManagement', roles: ['hr', 'hr_manager'] },
    { path: '/live-tracking-map', name: 'Live Tracking Map', component: 'pages/LiveTrackingMap', roles: ['hr', 'hr_manager'] },
    { path: '/document-management', name: 'Document Management', component: 'pages/DocumentManagement', roles: ['hr', 'hr_manager'] },
    { path: '/announcements', name: 'Announcements', component: 'pages/Announcements', roles: ['hr', 'hr_manager'] },
    { path: '/notifications', name: 'Notifications', component: 'pages/Notifications', roles: ['hr', 'hr_manager'] },
    { path: '/profile', name: 'Profile', component: 'pages/Profile', roles: ['hr', 'hr_manager'] },
    { path: '/settings', name: 'Settings', component: 'pages/Settings', roles: ['hr', 'hr_manager'] },
  ],

  // ========================================
  // MANAGER ROUTES
  // ========================================
  manager: [
    { path: '/dashboard', name: 'Dashboard', component: 'modules/manager/ManagerDashboard', roles: ['manager'] },
    { path: '/employee-directory', name: 'Employee Directory', component: 'pages/EmployeeDirectory', roles: ['manager'] },
    { path: '/attendance', name: 'Team Attendance', component: 'pages/Attendance', roles: ['manager'] },
    { path: '/leaves', name: 'Team Leaves', component: 'pages/Leaves', roles: ['manager'] },
    { path: '/holidays', name: 'Holidays', component: 'pages/Holidays', roles: ['manager'] },
    { path: '/training', name: 'Training', component: 'pages/Training', roles: ['manager'] },
    { path: '/feedback-surveys', name: 'Feedback Surveys', component: 'pages/FeedbackSurveys', roles: ['manager'] },
    { path: '/request-portal', name: 'Request Portal', component: 'pages/RequestPortal', roles: ['manager'] },
    { path: '/expense-management', name: 'Expense Management', component: 'pages/ExpenseManagement', roles: ['manager'] },
    { path: '/reports', name: 'Team Reports', component: 'pages/Reports', roles: ['manager'] },
    { path: '/document-management', name: 'Document Management', component: 'pages/DocumentManagement', roles: ['manager'] },
    { path: '/announcements', name: 'Announcements', component: 'pages/Announcements', roles: ['manager'] },
    { path: '/notifications', name: 'Notifications', component: 'pages/Notifications', roles: ['manager'] },
    { path: '/profile', name: 'Profile', component: 'pages/Profile', roles: ['manager'] },
    { path: '/settings', name: 'Settings', component: 'pages/Settings', roles: ['manager'] },
  ],

  // ========================================
  // EMPLOYEE ROUTES
  // ========================================
  employee: [
    { path: '/dashboard', name: 'Dashboard', component: 'modules/employee/EmployeeDashboard', roles: ['employee'] },
    { path: '/employee-directory', name: 'Employee Directory', component: 'pages/EmployeeDirectory', roles: ['employee'] },
    { path: '/attendance', name: 'My Attendance', component: 'pages/Attendance', roles: ['employee'] },
    { path: '/leaves', name: 'My Leaves', component: 'pages/Leaves', roles: ['employee'] },
    { path: '/holidays', name: 'Holidays', component: 'pages/Holidays', roles: ['employee'] },
    { path: '/training', name: 'My Training', component: 'pages/Training', roles: ['employee'] },
    { path: '/feedback-surveys', name: 'Feedback Surveys', component: 'pages/FeedbackSurveys', roles: ['employee'] },
    { path: '/request-portal', name: 'Request Portal', component: 'pages/RequestPortal', roles: ['employee'] },
    { path: '/expense-management', name: 'My Expenses', component: 'pages/ExpenseManagement', roles: ['employee'] },
    { path: '/document-management', name: 'My Documents', component: 'pages/DocumentManagement', roles: ['employee'] },
    { path: '/announcements', name: 'Announcements', component: 'pages/Announcements', roles: ['employee'] },
    { path: '/notifications', name: 'Notifications', component: 'pages/Notifications', roles: ['employee'] },
    { path: '/profile', name: 'Profile', component: 'pages/Profile', roles: ['employee'] },
    { path: '/settings', name: 'Settings', component: 'pages/Settings', roles: ['employee'] },
  ],

  // ========================================
  // PAYROLL ADMIN ROUTES
  // ========================================
  payroll_admin: [
    { path: '/dashboard', name: 'Dashboard', component: 'modules/admin/AdminDashboard', roles: ['payroll_admin'] },
    { path: '/payroll', name: 'Payroll Management', component: 'pages/Payroll', roles: ['payroll_admin'] },
    { path: '/reports', name: 'Payroll Reports', component: 'pages/Reports', roles: ['payroll_admin'] },
    { path: '/announcements', name: 'Announcements', component: 'pages/Announcements', roles: ['payroll_admin'] },
    { path: '/notifications', name: 'Notifications', component: 'pages/Notifications', roles: ['payroll_admin'] },
    { path: '/profile', name: 'Profile', component: 'pages/Profile', roles: ['payroll_admin'] },
    { path: '/settings', name: 'Settings', component: 'pages/Settings', roles: ['payroll_admin'] },
  ],

  // ========================================
  // RECRUITER ROUTES
  // ========================================
  recruiter: [
    { path: '/dashboard', name: 'Dashboard', component: 'modules/admin/AdminDashboard', roles: ['recruiter'] },
    { path: '/employee-directory', name: 'Employee Directory', component: 'pages/EmployeeDirectory', roles: ['recruiter'] },
    { path: '/employee-management', name: 'Employee Onboarding', component: 'pages/Employees', roles: ['recruiter'] },
    { path: '/announcements', name: 'Announcements', component: 'pages/Announcements', roles: ['recruiter'] },
    { path: '/notifications', name: 'Notifications', component: 'pages/Notifications', roles: ['recruiter'] },
    { path: '/profile', name: 'Profile', component: 'pages/Profile', roles: ['recruiter'] },
    { path: '/settings', name: 'Settings', component: 'pages/Settings', roles: ['recruiter'] },
  ],

  // ========================================
  // TRAINING COORDINATOR ROUTES
  // ========================================
  training_coordinator: [
    { path: '/dashboard', name: 'Dashboard', component: 'modules/admin/AdminDashboard', roles: ['training_coordinator'] },
    { path: '/training', name: 'Training Management', component: 'pages/Training', roles: ['training_coordinator'] },
    { path: '/feedback-surveys', name: 'Feedback Surveys', component: 'pages/FeedbackSurveys', roles: ['training_coordinator'] },
    { path: '/announcements', name: 'Announcements', component: 'pages/Announcements', roles: ['training_coordinator'] },
    { path: '/notifications', name: 'Notifications', component: 'pages/Notifications', roles: ['training_coordinator'] },
    { path: '/profile', name: 'Profile', component: 'pages/Profile', roles: ['training_coordinator'] },
    { path: '/settings', name: 'Settings', component: 'pages/Settings', roles: ['training_coordinator'] },
  ],
};

/**
 * Get routes for a specific role
 */
export function getRoutesForRole(role: string): RouteConfig[] {
  return ROLE_ROUTES[role] || ROLE_ROUTES['employee'] || []; // Default to employee routes or empty array
}

/**
 * Check if a role has access to a specific path
 */
export function canAccessRoute(role: string, path: string): boolean {
  const routes = getRoutesForRole(role);
  return routes.some(route => route.path === path);
}

/**
 * Get default redirect path for a role
 */
export function getDefaultPathForRole(role: string): string {
  const routes = getRoutesForRole(role);
  return routes && routes.length > 0 && routes[0] ? routes[0].path : '/dashboard';
}

/**
 * Subdomain to role mapping (for subdomain-based deployment)
 */
export const SUBDOMAIN_ROLES: Record<string, string> = {
  'admin': 'admin',
  'hr': 'hr',
  'manager': 'manager',
  'app': 'employee',
  'employee': 'employee',
  'payroll': 'payroll_admin',
  'recruit': 'recruiter',
  'training': 'training_coordinator',
};

/**
 * Get role from subdomain
 */
export function getRoleFromSubdomain(subdomain: string): string | null {
  return SUBDOMAIN_ROLES[subdomain] || null;
}

