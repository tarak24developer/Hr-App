/**
 * Employee Dashboard
 * Self-service employee portal dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import dataService from '@/services/dataService';
import { Calendar, Clock, FileText, Award, Book, Bell, User, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const LEAVE_COLORS = ['#10B981', '#3B82F6', '#F59E0B'];
const TRAINING_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

// Remove mock data - will be fetched from Firebase

// Custom label renderer
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingTraining, setUpcomingTraining] = useState<any[]>([]);
  const [myLeaveData, setMyLeaveData] = useState<{ name: string; value: number }[]>([]);
  const [myAttendanceData, setMyAttendanceData] = useState<{ name: string; value: number }[]>([]);
  const [myTrainingData, setMyTrainingData] = useState<{ name: string; value: number }[]>([]);

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

      // Process my leave data
      const myLeaves = leavesSnapshot.docs.map(doc => doc.data());
      const leaveStatusCounts: Record<string, number> = {};
      myLeaves.forEach((leave: any) => {
        const status = leave.status === 'approved' ? 'Used' : leave.status === 'pending' ? 'Pending' : 'Rejected';
        leaveStatusCounts[status] = (leaveStatusCounts[status] || 0) + (leave.days || 1);
      });
      leaveStatusCounts['Remaining'] = leaveBalance;
      setMyLeaveData(
        Object.entries(leaveStatusCounts).map(([name, value]) => ({ name, value }))
      );

      // Fetch and process my attendance data (last month)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const attendanceResponse = await dataService.fetchData('attendance');
      const allAttendance = Array.isArray(attendanceResponse) ? attendanceResponse : (attendanceResponse?.data || []);
      const attendanceData = allAttendance.filter((att: any) => 
        att.employeeId === user.id && 
        att.date && 
        new Date(att.date) >= oneMonthAgo
      );
      const attStatusCounts: Record<string, number> = {};
      attendanceData.forEach((att: any) => {
        const status = att.status || 'Present';
        attStatusCounts[status] = (attStatusCounts[status] || 0) + 1;
      });
      setMyAttendanceData(
        Object.entries(attStatusCounts).map(([name, value]) => ({ name, value }))
      );

      // Fetch and process my training data
      const allTrainingQuery = query(
        collection(db, 'training'),
        where('participants', 'array-contains', user.id)
      );
      const allTrainingSnapshot = await getDocs(allTrainingQuery);
      const trainings = allTrainingSnapshot.docs.map(doc => doc.data());
      const trainingStatusCounts: Record<string, number> = {};
      trainings.forEach((training: any) => {
        const status = training.status || 'Upcoming';
        trainingStatusCounts[status] = (trainingStatusCounts[status] || 0) + 1;
      });
      setMyTrainingData(
        Object.entries(trainingStatusCounts).map(([name, value]) => ({ name, value }))
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

      {/* Personal Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          My Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Leave Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Leave Status
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={myLeaveData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                {myLeaveData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* My Attendance (Last Month) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Attendance (Last Month)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={myAttendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                {myAttendanceData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* My Training Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Training Progress
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={myTrainingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                {myTrainingData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={TRAINING_COLORS[index % TRAINING_COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
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

