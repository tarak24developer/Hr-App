import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService, type AuthState } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

// Layout Components
import Layout from './Layout/Layout';
import Sidebar from './Layout/Sidebar';
import Header from './Layout/Header';

// Page Components
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import EmployeeDirectory from '../pages/EmployeeDirectory';
import EmployeePage from '../pages/EmployeePage';
import ExitProcess from '../pages/ExitProcess';
import Attendance from '../pages/Attendance';
import Leaves from '../pages/Leaves';
import Holidays from '../pages/Holidays';
import Payroll from '../pages/Payroll';
import ExpenseManagement from '../pages/ExpenseManagement';
import AssetManagement from '../pages/AssetManagement';
import Inventory from '../pages/Inventory';
import Training from '../pages/Training';
import FeedbackSurveys from '../pages/FeedbackSurveys';
import RequestPortal from '../pages/RequestPortal';
import AdvancedAnalytics from '../pages/AdvancedAnalytics';
import Reports from '../pages/Reports';
import UserTracking from '../pages/UserTracking';
import Users from '../pages/Users';
import DocumentManagement from '../pages/DocumentManagement';
import Security from '../pages/Security';
import EnhancedAccessControl from '../pages/EnhancedAccessControl';
import IncidentManagement from '../pages/IncidentManagement';
import Notifications from '../pages/Notifications';
import Announcements from '../pages/Announcements';
import LiveTrackingMap from '../pages/LiveTrackingMap';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';

// UI Components
import LoadingSpinner from './UI/LoadingSpinner';
import ErrorBoundary from './UI/ErrorBoundary';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, setUser, clearAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribeToAuthState((authState: AuthState) => {
      if (authState.user) {
        setUser(authState.user);
      } else {
        clearAuth();
      }
      setIsInitialized(true);
    });

    return unsubscribe;
  }, [setUser, clearAuth]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: theme === 'dark' ? '#1f2937' : '#ffffff',
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                },
              }}
            />
            
            {user ? (
              <Layout>
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-6">
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
                      <Route path="/expense-management" element={<ExpenseManagement />} />
                      
                      {/* Asset & Inventory Routes */}
                      <Route path="/assets" element={<AssetManagement />} />
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
                  </main>
                </div>
              </Layout>
            ) : (
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
          </div>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
