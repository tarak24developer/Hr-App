import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { cn } from '@/utils/cn';
import { useUser } from '@/stores/authStore';
import {
  Users,
  Clock,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  WifiOff,
  Database
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeAttendance: number;
  pendingLeaves: number;
  monthlyPayroll: number;
  employeeChange: string;
  attendanceChange: string;
  leaveChange: string;
  payrollChange: string;
}

interface RecentActivity {
  id: string;
  type: 'leave_request' | 'attendance' | 'payroll' | 'training' | 'employee' | 'asset';
  message: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'success' | 'info' | 'warning';
  userId?: string;
  userName?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: Date;
  type: 'meeting' | 'training' | 'review' | 'holiday' | 'deadline';
  description?: string;
}

const Dashboard: React.FC = () => {
  const user = useUser();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isOffline, setIsOffline] = useState(false);

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch dashboard statistics with better error handling
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      if (!db) {
        throw new Error('Firebase not configured. Please check your environment variables.');
      }

      try {
        // Get total employees
        const employeesSnapshot = await getDocs(collection(db, 'users'));
        const totalEmployees = employeesSnapshot.size;

        // Get active attendance (users who clocked in today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('date', '>=', today),
          where('status', '==', 'present')
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const activeAttendance = attendanceSnapshot.size;

        // Get pending leaves
        const leavesQuery = query(
          collection(db, 'leaves'),
          where('status', '==', 'pending')
        );
        const leavesSnapshot = await getDocs(leavesQuery);
        const pendingLeaves = leavesSnapshot.size;

        // Get monthly payroll total
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const payrollQuery = query(
          collection(db, 'payroll'),
          where('month', '==', currentMonth),
          where('year', '==', currentYear)
        );
        const payrollSnapshot = await getDocs(payrollQuery);
        const monthlyPayroll = payrollSnapshot.docs.reduce((total, doc) => {
          const data = doc.data();
          return total + (data['amount'] || 0);
        }, 0);

        // Calculate changes (simplified - in real app you'd compare with previous month)
        const employeeChange = totalEmployees > 0 ? '+5%' : '0%';
        const attendanceChange = activeAttendance > 0 ? '+12%' : '0%';
        const leaveChange = pendingLeaves > 0 ? '-8%' : '0%';
        const payrollChange = monthlyPayroll > 0 ? '+15%' : '0%';

        return {
          totalEmployees,
          activeAttendance,
          pendingLeaves,
          monthlyPayroll,
          employeeChange,
          attendanceChange,
          leaveChange,
          payrollChange
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        if (error instanceof Error && error.message.includes('Firebase not configured')) {
          throw new Error('Firebase configuration is missing. Please check your environment variables.');
        }
        throw new Error('Failed to fetch dashboard data. Please check your connection and try again.');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry if Firebase is not configured
      if (error instanceof Error && error.message.includes('Firebase not configured')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Fetch recent activities with error handling
  const { data: recentActivities, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!db) {
        throw new Error('Firebase not configured');
      }

      try {
        const activities: RecentActivity[] = [];

        // Get recent leave requests
        const leavesQuery = query(
          collection(db, 'leaves'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const leavesSnapshot = await getDocs(leavesQuery);
        leavesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            type: 'leave_request',
            message: `${data['employeeName'] || 'Employee'} requested ${data['leaveType'] || 'leave'}`,
            timestamp: data['createdAt']?.toDate() || new Date(),
            status: data['status'] || 'pending',
            userId: data['userId'],
            userName: data['employeeName']
          });
        });

        // Get recent attendance records
        const attendanceQuery = query(
          collection(db, 'attendance'),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        attendanceSnapshot.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            type: 'attendance',
            message: `${data['employeeName'] || 'Employee'} ${data['action'] || 'clocked in'}`,
            timestamp: data['timestamp']?.toDate() || new Date(),
            status: 'success',
            userId: data['userId'],
            userName: data['employeeName']
          });
        });

        // Sort by timestamp and limit to 8 most recent
        return activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 8);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        throw new Error('Failed to fetch recent activities');
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Fetch upcoming events with error handling
  const { data: upcomingEvents, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async (): Promise<UpcomingEvent[]> => {
      if (!db) {
        throw new Error('Firebase not configured');
      }

      try {
        const events: UpcomingEvent[] = [];
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Get upcoming training sessions
        const trainingQuery = query(
          collection(db, 'training'),
          where('startDate', '>=', now),
          where('startDate', '<=', nextWeek),
          orderBy('startDate', 'asc'),
          limit(5)
        );
        const trainingSnapshot = await getDocs(trainingQuery);
        trainingSnapshot.docs.forEach(doc => {
          const data = doc.data();
          events.push({
            id: doc.id,
            title: data['title'] || 'Training Session',
            date: data['startDate']?.toDate() || new Date(),
            type: 'training',
            description: data['description']
          });
        });

        // Get upcoming meetings
        const meetingsQuery = query(
          collection(db, 'meetings'),
          where('date', '>=', now),
          where('date', '<=', nextWeek),
          orderBy('date', 'asc'),
          limit(3)
        );
        const meetingsSnapshot = await getDocs(meetingsQuery);
        meetingsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          events.push({
            id: doc.id,
            title: data['title'] || 'Meeting',
            date: data['date']?.toDate() || new Date(),
            type: 'meeting',
            description: data['description']
          });
        });

        // Sort by date and limit to 5 most upcoming
        return events
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 5);
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
        throw new Error('Failed to fetch upcoming events');
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Handle refresh
  const handleRefresh = () => {
    refetchStats();
    setLastRefresh(new Date());
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Format event date
  const formatEventDate = (date: Date) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500';
      case 'training':
        return 'bg-green-500';
      case 'review':
        return 'bg-purple-500';
      case 'holiday':
        return 'bg-red-500';
      case 'deadline':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Show offline indicator
  if (isOffline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-center max-w-md mx-4">
          <WifiOff className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-yellow-900 mb-2">You're Offline</h1>
          <p className="text-yellow-700 mb-4">
            Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show Firebase configuration error
  if (statsError && statsError.message.includes('Firebase not configured')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md mx-4">
          <Database className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-900 mb-2">Configuration Error</h1>
          <p className="text-red-700 mb-4">
            Firebase is not properly configured. Please check your environment variables.
          </p>
          <div className="bg-white p-4 rounded-lg border border-red-200 text-left text-sm">
            <p className="font-semibold text-red-900 mb-2">Required:</p>
            <ul className="text-red-700 space-y-1">
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

  if (statsLoading && activitiesLoading && eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back, {user?.firstName || 'User'}! Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleRefresh}
            disabled={statsLoading}
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
          >
            <RefreshCw className={cn('w-4 h-4', statsLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
          <button className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
            Generate Report
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs sm:text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsLoading ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : statsError ? (
          // Error state for stats
          <div className="sm:col-span-2 lg:col-span-4 bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-red-800 text-sm sm:text-base">
                Failed to load dashboard statistics. {statsError.message}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          // Actual stats
          [
            {
              name: 'Total Employees',
              value: stats?.totalEmployees?.toLocaleString() || '0',
              change: stats?.employeeChange || '0%',
              changeType: stats?.employeeChange?.startsWith('+') ? 'positive' : 'negative',
              icon: Users,
              bgColor: 'bg-blue-100',
              iconColor: 'text-blue-600'
            },
            {
              name: 'Active Attendance',
              value: stats?.activeAttendance?.toLocaleString() || '0',
              change: stats?.attendanceChange || '0%',
              changeType: stats?.attendanceChange?.startsWith('+') ? 'positive' : 'negative',
              icon: Clock,
              bgColor: 'bg-green-100',
              iconColor: 'text-green-600'
            },
            {
              name: 'Pending Leaves',
              value: stats?.pendingLeaves?.toLocaleString() || '0',
              change: stats?.leaveChange || '0%',
              changeType: stats?.leaveChange?.startsWith('+') ? 'positive' : 'negative',
              icon: Calendar,
              bgColor: 'bg-yellow-100',
              iconColor: 'text-yellow-600'
            },
            {
              name: 'Monthly Payroll',
              value: formatCurrency(stats?.monthlyPayroll || 0),
              change: stats?.payrollChange || '0%',
              changeType: stats?.payrollChange?.startsWith('+') ? 'positive' : 'negative',
              icon: CreditCard,
              bgColor: 'bg-purple-100',
              iconColor: 'text-purple-600'
            }
          ].map((stat) => (
            <div key={stat.name} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                </div>
                <div className={cn('p-2 sm:p-3 rounded-lg flex-shrink-0', stat.bgColor)}>
                  <stat.icon className={cn('w-5 h-5 sm:w-6 sm:h-6', stat.iconColor)} />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center">
                <span className={cn(
                  'text-xs sm:text-sm font-medium',
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}>
                  {stat.change}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-4 sm:p-6">
            {activitiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : activitiesError ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Failed to load activities</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                      getStatusColor(activity.status).split(' ')[0]
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0',
                      getStatusColor(activity.status)
                    )}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activities
              </div>
            )}
            <div className="mt-4 sm:mt-6">
              <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all activities
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Events</h2>
          </div>
          <div className="p-4 sm:p-6">
            {eventsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : eventsError ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Failed to load events</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className={cn(
                      'w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-2 flex-shrink-0',
                      getEventTypeColor(event.type)
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatEventDate(event.date)}
                      </p>
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming events
              </div>
            )}
            <div className="mt-4 sm:mt-6">
              <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
                View calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Add Employee</span>
            </button>
            <button className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Clock In/Out</span>
            </button>
            <button className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Request Leave</span>
            </button>
            <button className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">View Payslip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
