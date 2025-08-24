import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { useFontSizeStore } from './stores/fontSizeStore';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { authService } from './services/authService';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Employees = React.lazy(() => import('./pages/Employees'));
const EmployeeDirectory = React.lazy(() => import('./pages/EmployeeDirectory'));
const EmployeePage = React.lazy(() => import('./pages/EmployeePage'));
const ExitProcess = React.lazy(() => import('./pages/ExitProcess'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Leaves = React.lazy(() => import('./pages/Leaves'));
const Holidays = React.lazy(() => import('./pages/Holidays'));
const Training = React.lazy(() => import('./pages/Training'));
const FeedbackSurveys = React.lazy(() => import('./pages/FeedbackSurveys'));
const RequestPortal = React.lazy(() => import('./pages/RequestPortal'));
const Payroll = React.lazy(() => import('./pages/Payroll'));
const EnhancedPayroll = React.lazy(() => import('./pages/EnhancedPayroll'));
const ExpenseManagement = React.lazy(() => import('./pages/ExpenseManagement'));
const Assets = React.lazy(() => import('./pages/Assets'));
const AssetManagement = React.lazy(() => import('./pages/AssetManagement'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const AdvancedAnalytics = React.lazy(() => import('./pages/AdvancedAnalytics'));
const Reports = React.lazy(() => import('./pages/Reports'));
const UserTracking = React.lazy(() => import('./pages/UserTracking'));
const Users = React.lazy(() => import('./pages/Users'));
const DocumentManagement = React.lazy(() => import('./pages/DocumentManagement'));
const Security = React.lazy(() => import('./pages/Security'));
const EnhancedAccessControl = React.lazy(() => import('./pages/EnhancedAccessControl'));
const IncidentManagement = React.lazy(() => import('./pages/IncidentManagement'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Announcements = React.lazy(() => import('./pages/Announcements'));
const LiveTrackingMap = React.lazy(() => import('./pages/LiveTrackingMap'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));

// Layout components
const Layout = React.lazy(() => import('./components/Layout/Layout'));
const Sidebar = React.lazy(() => import('./components/Layout/Sidebar'));
const Header = React.lazy(() => import('./components/Layout/Header'));

function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { isDark } = useThemeStore();
  const { fontSize } = useFontSizeStore();
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    console.log('App: Initializing authentication state...');
    
    const unsubscribe = authService.subscribeToAuthState((state) => {
      console.log('App: Auth state changed:', { 
        user: state.user ? `authenticated (${state.user.email})` : 'not authenticated', 
        loading: state.loading, 
        error: state.error,
        userId: state.user?.id || 'none'
      });
      
      // Only update if the state actually changed
      setUser(state.user);
      setLoading(state.loading);
    });

    // Check Firebase availability
    try {
      // This will throw an error if Firebase is not properly configured
      if (!import.meta.env.VITE_FIREBASE_API_KEY || 
          import.meta.env.VITE_FIREBASE_API_KEY === 'your_actual_api_key_here' ||
          import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key') {
        setFirebaseError('Firebase configuration is missing. Please check your environment variables.');
      }
    } catch (error) {
      setFirebaseError('Firebase initialization failed. Please check your configuration.');
    }

    return unsubscribe;
  }, []); // Empty dependency array to prevent re-initialization

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

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

  // If authenticated, show main app
  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
        <div className={`flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 text-${fontSize}`}>
          <Suspense fallback={<LoadingSpinner />}>
            <Sidebar />
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
                      <Route path="/dashboard" element={<Dashboard />} />
                      
                      {/* Employee Management Routes */}
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/employee-directory" element={<EmployeeDirectory />} />
                      <Route path="/employee-page" element={<EmployeePage />} />
                      <Route path="/exit-process" element={<ExitProcess />} />
                      
                      {/* HR Operations Routes */}
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/leaves" element={<Leaves />} />
                      <Route path="/holidays" element={<Holidays />} />
                      <Route path="/training" element={<Training />} />
                      <Route path="/feedback-surveys" element={<FeedbackSurveys />} />
                      <Route path="/request-portal" element={<RequestPortal />} />
                      
                      {/* Financial Management Routes */}
                      <Route path="/payroll" element={<Payroll />} />
                      <Route path="/enhanced-payroll" element={<EnhancedPayroll />} />
                      <Route path="/expense-management" element={<ExpenseManagement />} />
                      
                      {/* Asset & Inventory Routes */}
                      <Route path="/assets" element={<Assets />} />
                      <Route path="/asset-management" element={<AssetManagement />} />
                      <Route path="/inventory" element={<Inventory />} />
                      
                      {/* Analytics & Reports Routes */}
                      <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/user-tracking" element={<UserTracking />} />
                      
                      {/* System Management Routes */}
                      <Route path="/users" element={<Users />} />
                      <Route path="/document-management" element={<DocumentManagement />} />
                      <Route path="/security" element={<Security />} />
                      <Route path="/enhanced-access-control" element={<EnhancedAccessControl />} />
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
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
