/**
 * Employee Dashboard
 * Self-service employee portal dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Calendar, Clock, FileText, Award, Book, Bell, User, DollarSign } from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingTraining, setUpcomingTraining] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user || !db) return;

    try {
      setLoading(true);

      // Fetch leave balance (calculate from approved leaves)
      const leavesQuery = query(
        collection(db, 'leaves'),
        where('employeeId', '==', user.id),
        where('status', '==', 'approved')
      );
      const leavesSnapshot = await getDocs(leavesQuery);
      const totalLeaveDays = leavesSnapshot.docs.reduce((sum, doc) => sum + (doc.data()['days'] || 0), 0);
      setLeaveBalance(30 - totalLeaveDays); // Assuming 30 days annual leave

      // Fetch pending leaves
      const pendingQuery = query(
        collection(db, 'leaves'),
        where('employeeId', '==', user.id),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      setPendingLeaves(pendingSnapshot.size);

      // Fetch recent announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('isPublished', '==', true),
        orderBy('publishDate', 'desc'),
        limit(5)
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      setRecentAnnouncements(
        announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch upcoming training
      const trainingQuery = query(
        collection(db, 'training'),
        where('participants', 'array-contains', user.id),
        where('status', '==', 'scheduled'),
        orderBy('startDate', 'asc'),
        limit(3)
      );
      const trainingSnapshot = await getDocs(trainingQuery);
      setUpcomingTraining(
        trainingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error('Error loading employee dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your personal dashboard overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Leave Balance"
          value={`${leaveBalance} days`}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={pendingLeaves}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Training Courses"
          value={upcomingTraining.length}
          icon={<Book className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="New Announcements"
          value={recentAnnouncements.length}
          icon={<Bell className="w-6 h-6" />}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickAction
          title="My Profile"
          description="View and update your profile"
          icon={<User className="w-8 h-8" />}
          href="/profile"
          color="blue"
        />
        <QuickAction
          title="Request Leave"
          description="Submit a new leave request"
          icon={<Calendar className="w-8 h-8" />}
          href="/leaves"
          color="green"
        />
        <QuickAction
          title="View Payslips"
          description="Access your salary information"
          icon={<DollarSign className="w-8 h-8" />}
          href="/payroll"
          color="emerald"
        />
        <QuickAction
          title="My Attendance"
          description="View attendance history"
          icon={<Clock className="w-8 h-8" />}
          href="/attendance"
          color="orange"
        />
        <QuickAction
          title="Training"
          description="Access training materials"
          icon={<Book className="w-8 h-8" />}
          href="/training"
          color="purple"
        />
        <QuickAction
          title="Documents"
          description="Access your documents"
          icon={<FileText className="w-8 h-8" />}
          href="/documents"
          color="indigo"
        />
      </div>

      {/* Recent Announcements */}
      {recentAnnouncements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Announcements
          </h2>
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="border-l-4 border-blue-500 pl-4 py-2"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {announcement.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {announcement.summary}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(announcement.publishDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Training */}
      {upcomingTraining.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Book className="w-5 h-5 mr-2" />
            Upcoming Training
          </h2>
          <div className="space-y-4">
            {upcomingTraining.map((training) => (
              <div
                key={training.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {training.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {training.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Starts: {new Date(training.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className={`${colorClasses[color]} text-white p-3 rounded-lg inline-block mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

// Quick Action Component
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, href, color }) => {
  return (
    <a
      href={href}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className={`text-${color}-600 mb-4`}>{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </a>
  );
};

export default EmployeeDashboard;

