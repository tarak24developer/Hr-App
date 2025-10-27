/**
 * Main App Component
 * Enhanced with subdomain routing, RBAC, and advanced security features
 */

import { Suspense, useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { useFontSizeStore } from './stores/fontSizeStore';
import { subdomainRouter } from './lib/subdomain/subdomainRouter';
import { rbacService } from './lib/rbac/rbacService';
import { sessionManager } from './lib/security/sessionManager';
import { auditLogger } from './lib/security/auditLogger';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/UI/ErrorBoundary';
import SubdomainGuard from './middleware/SubdomainGuard';
import PermissionGuard from './middleware/PermissionGuard';
import { authService } from './services/authService';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { RealtimeProvider } from './contexts/RealtimeContext';
import RealtimeStatusContainer from './components/RealtimeStatusContainer';

// Lazy load pages with retry logic for better reliability
const Login = lazyWithRetry(() => import('./pages/Login'));
const Layout = lazyWithRetry(() => import('./components/Layout/Layout'));
const Sidebar = lazyWithRetry(() => import('./components/Layout/Sidebar'));
const Header = lazyWithRetry(() => import('./components/Layout/Header'));

// Role-specific dashboards - preload based on user role
const AdminDashboard = lazyWithRetry(() => import('./modules/admin/AdminDashboard'));
const HRDashboard = lazyWithRetry(() => import('./modules/hr/HRDashboard'));
const ManagerDashboard = lazyWithRetry(() => import('./modules/manager/ManagerDashboard'));
const EmployeeDashboard = lazyWithRetry(() => import('./modules/employee/EmployeeDashboard'));
const PayrollDashboard = lazyWithRetry(() => import('./modules/payroll/PayrollDashboard'));
const RecruiterDashboard = lazyWithRetry(() => import('./modules/recruiter/RecruiterDashboard'));
const TrainerDashboard = lazyWithRetry(() => import('./modules/trainer/TrainerDashboard'));

// Core pages - load on demand
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Employees = lazyWithRetry(() => import('./pages/Employees'));
const EmployeeDirectory = lazyWithRetry(() => import('./pages/EmployeeDirectory'));
const ExitProcess = lazyWithRetry(() => import('./pages/ExitProcess'));

// Large pages - separate chunks with retry
const Attendance = lazyWithRetry(() => import(/* webpackChunkName: "attendance" */ './pages/Attendance'));
const Payroll = lazyWithRetry(() => import(/* webpackChunkName: "payroll" */ './pages/Payroll'));
const Reports = lazyWithRetry(() => import(/* webpackChunkName: "reports" */ './pages/Reports'));
const AdvancedAnalytics = lazyWithRetry(() => import(/* webpackChunkName: "analytics" */ './pages/AdvancedAnalytics'));
const LiveTrackingMap = lazyWithRetry(() => import(/* webpackChunkName: "tracking" */ './pages/LiveTrackingMap'));

// Standard pages
const Leaves = lazyWithRetry(() => import('./pages/Leaves'));
const Holidays = lazyWithRetry(() => import('./pages/Holidays'));
const Training = lazyWithRetry(() => import('./pages/Training'));
const FeedbackSurveys = lazyWithRetry(() => import('./pages/FeedbackSurveys'));
const RequestPortal = lazyWithRetry(() => import('./pages/RequestPortal'));
const ExpenseManagement = lazyWithRetry(() => import('./pages/ExpenseManagement'));
const AssetManagement = lazyWithRetry(() => import('./pages/AssetManagement'));
const Inventory = lazyWithRetry(() => import('./pages/Inventory'));
const UserTracking = lazyWithRetry(() => import('./pages/UserTracking'));
const Users = lazyWithRetry(() => import('./pages/Users'));
const DocumentManagement = lazyWithRetry(() => import('./pages/DocumentManagement'));
const Security = lazyWithRetry(() => import('./pages/Security'));
const EnhancedAccessControl = lazyWithRetry(() => import('./pages/EnhancedAccessControl'));
const IncidentManagement = lazyWithRetry(() => import('./pages/IncidentManagement'));
const Notifications = lazyWithRetry(() => import('./pages/Notifications'));
const Announcements = lazyWithRetry(() => import('./pages/Announcements'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));

function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { isDark } = useThemeStore();
  const { fontSize } = useFontSizeStore();
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const initializedUserRef = useRef<string | null>(null);

  // Initialize authentication, subdomain routing, and security
  useEffect(() => {
    // Get subdomain configuration (for future use)
    // const config = subdomainRouter.getCurrentSubdomainConfig();
    
    const unsubscribe = authService.subscribeToAuthState((state) => {
      // Update both user and loading state together
      setUser(state.user);
      setLoading(state.loading);

      // Handle authenticated user - only run initialization once per user
      if (state.user && !state.loading && state.user.id !== initializedUserRef.current) {
        initializedUserRef.current = state.user.id;
        
        // Initialize RBAC for user
        rbacService.initializeUserRoles(state.user);
        
        // Create session (run in background, don't await)
        sessionManager.createSession(state.user.id).catch((error) => {
          console.error('Error creating session:', error);
        });
        
        // Log successful authentication (run in background, don't await)
        auditLogger.logLogin(
          state.user.id,
          state.user.email,
          `${state.user.firstName} ${state.user.lastName}`,
          true
        ).catch((error) => {
          console.error('Error logging authentication:', error);
        });

        // Check if user is on correct subdomain
        const isCorrect = subdomainRouter.isOnCorrectSubdomain(state.user.role);
        if (!isCorrect) {
          // Uncomment below to enable subdomain redirection
          // subdomainRouter.redirectToRoleSubdomain(state.user.role, false);
        }
      }
      
      // Reset initialized user when logging out
      if (!state.user && initializedUserRef.current) {
        initializedUserRef.current = null;
      }
    });

    // Check Firebase availability
    try {
      if (!import.meta.env.VITE_FIREBASE_API_KEY || 
          import.meta.env.VITE_FIREBASE_API_KEY === 'your_actual_api_key_here' ||
          import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key') {
        setFirebaseError('Firebase configuration is missing. Please check your environment variables.');
      }
    } catch (error) {
      setFirebaseError('Firebase initialization failed. Please check your configuration.');
    }

    return unsubscribe;
  }, [setUser, setLoading]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Preload critical components based on user role
  // Must be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (user) {
      // Preload dashboard for current role
      const preloadDashboard = async () => {
        switch (user.role) {
          case 'admin':
          case 'it_admin':
            import('./modules/admin/AdminDashboard');
            break;
          case 'hr':
          case 'hr_manager':
            import('./modules/hr/HRDashboard');
            break;
          case 'recruiter':
            import('./modules/recruiter/RecruiterDashboard');
            break;
          case 'payroll_admin':
            import('./modules/payroll/PayrollDashboard');
            break;
          case 'training_coordinator':
            import('./modules/trainer/TrainerDashboard');
            break;
          case 'manager':
            import('./modules/manager/ManagerDashboard');
            break;
          case 'employee':
            import('./modules/employee/EmployeeDashboard');
            break;
        }
      };
      preloadDashboard();
    }
  }, [user]);

  // Show Firebase configuration error
  if (firebaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-900 mb-2">Firebase Configuration Error</h1>
          <p className="text-red-700 mb-4">{firebaseError}</p>
          <div className="bg-white p-4 rounded-lg border border-red-200 text-left">
            <h2 className="font-semibold text-red-900 mb-2">Required Environment Variables:</h2>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• VITE_FIREBASE_API_KEY</li>
              <li>• VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>• VITE_FIREBASE_PROJECT_ID</li>
              <li>• VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>• VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>• VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!user) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" />
      </ErrorBoundary>
    );
  }

  // Get role-specific dashboard
  const getRoleDashboard = () => {
    switch (user.role) {
      case 'admin':
      case 'it_admin':
        return <AdminDashboard />;
      case 'hr':
      case 'hr_manager':
        return <HRDashboard />;
      case 'recruiter':
        return <RecruiterDashboard />;
      case 'payroll_admin':
        return <PayrollDashboard />;
      case 'training_coordinator':
        return <TrainerDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
      default:
        return <Dashboard />;
    }
  };

  // If authenticated, show main app
  return (
    <ErrorBoundary>
      <RealtimeProvider>
        <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
          <div className={`flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 text-${fontSize}`}>
            <Suspense fallback={<LoadingSpinner />}>
              <SubdomainGuard>
                <Sidebar />
              </SubdomainGuard>
            </Suspense>
            <div className="flex-1 flex flex-col overflow-hidden">
              <Suspense fallback={<LoadingSpinner />}>
                <Header />
              </Suspense>
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <Suspense fallback={<LoadingSpinner />}>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={getRoleDashboard()} />
                      
                      {/* Employee Management - Protected by RBAC */}
                      <Route 
                        path="/employee-management" 
                        element={
                          <PermissionGuard resource="employees" action="read">
                            <Employees />
                          </PermissionGuard>
                        } 
                      />
                      <Route path="/employee-directory" element={<EmployeeDirectory />} />
                      <Route 
                        path="/exit-process" 
                        element={
                          <PermissionGuard resource="employees" action="update">
                            <ExitProcess />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* HR Operations */}
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/leaves" element={<Leaves />} />
                      <Route path="/holidays" element={<Holidays />} />
                      <Route path="/training" element={<Training />} />
                      <Route path="/feedback-surveys" element={<FeedbackSurveys />} />
                      <Route path="/request-portal" element={<RequestPortal />} />
                      
                      {/* Financial Management - Protected */}
                      <Route 
                        path="/payroll" 
                        element={
                          <PermissionGuard resource="payroll" action="read">
                            <Payroll />
                          </PermissionGuard>
                        } 
                      />
                      <Route path="/expense-management" element={<ExpenseManagement />} />
                      
                      {/* Asset & Inventory */}
                      <Route path="/assets" element={<AssetManagement />} />
                      <Route path="/inventory" element={<Inventory />} />
                      
                      {/* Analytics & Reports - Protected */}
                      <Route 
                        path="/advanced-analytics" 
                        element={
                          <PermissionGuard resource="analytics" action="read">
                            <AdvancedAnalytics />
                          </PermissionGuard>
                        } 
                      />
                      <Route path="/reports" element={<Reports />} />
                      <Route 
                        path="/user-tracking" 
                        element={
                          <PermissionGuard resource="security" action="read">
                            <UserTracking />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* System Management - Admin Only */}
                      <Route 
                        path="/users" 
                        element={
                          <PermissionGuard resource="users" action="read">
                            <Users />
                          </PermissionGuard>
                        } 
                      />
                      <Route path="/document-management" element={<DocumentManagement />} />
                      <Route 
                        path="/security" 
                        element={
                          <PermissionGuard resource="security" action="read">
                            <Security />
                          </PermissionGuard>
                        } 
                      />
                      <Route 
                        path="/enhanced-access-control" 
                        element={
                          <PermissionGuard resource="security" action="configure">
                            <EnhancedAccessControl />
                          </PermissionGuard>
                        } 
                      />
                      <Route path="/incident-management" element={<IncidentManagement />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/announcements" element={<Announcements />} />
                      <Route path="/live-tracking-map" element={<LiveTrackingMap />} />
                      
                      {/* Profile Route */}
                      <Route path="/profile" element={<Profile />} />
                      
                      {/* Settings Route */}
                      <Route path="/settings" element={<Settings />} />
                      
                      {/* Fallback Route */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </Suspense>
            </main>
          </div>
        </div>
      </div>
      {/* Real-time connection status indicator - will show/hide automatically */}
      <RealtimeStatusContainer />
      <Toaster position="top-right" />
      </RealtimeProvider>
    </ErrorBoundary>
  );
}

export default App;
