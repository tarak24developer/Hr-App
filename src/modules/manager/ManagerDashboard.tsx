/**
 * Manager Dashboard
 * Team management and oversight dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { analyticsEngine } from '@/lib/analytics/analyticsEngine';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Users, CheckCircle, Clock, TrendingUp, Calendar, FileText, Target, Award } from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teamSize, setTeamSize] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [teamAttendance, setTeamAttendance] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user || !db) return;

    try {
      setLoading(true);

      // Fetch team members
      const teamQuery = query(
        collection(db, 'users'),
        where('managerId', '==', user.id),
        where('status', '==', 'active')
      );
      const teamSnapshot = await getDocs(teamQuery);
      setTeamSize(teamSnapshot.size);

      // Fetch pending leave requests
      const teamMemberIds = teamSnapshot.docs.map(doc => doc.id);
      if (teamMemberIds.length > 0) {
        const leavesQuery = query(
          collection(db, 'leaves'),
          where('employeeId', 'in', teamMemberIds),
          where('status', '==', 'pending')
        );
        const leavesSnapshot = await getDocs(leavesQuery);
        setPendingLeaves(leavesSnapshot.size);
      }

      // Get team attendance metrics
      const attMetrics = await analyticsEngine.getAttendanceMetrics({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      });
      setTeamAttendance(attMetrics);
    } catch (error) {
      console.error('Error loading manager dashboard:', error);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Team Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and oversee your team's performance and activities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Team Size"
          value={teamSize}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingLeaves}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Team Attendance"
          value={`${teamAttendance?.presentRate.value.toFixed(0) || 0}%`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Avg Work Hours"
          value={`${teamAttendance?.averageHours.value.toFixed(1) || 0}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ActionCard
          title="Team Overview"
          description="View team members and their details"
          icon={<Users className="w-8 h-8" />}
          href="/team"
          color="blue"
          count={teamSize}
        />
        <ActionCard
          title="Leave Approvals"
          description="Review and approve leave requests"
          icon={<Calendar className="w-8 h-8" />}
          href="/leaves"
          color="orange"
          count={pendingLeaves}
        />
        <ActionCard
          title="Performance Reviews"
          description="Conduct team performance reviews"
          icon={<Target className="w-8 h-8" />}
          href="/performance"
          color="purple"
        />
        <ActionCard
          title="Goals & OKRs"
          description="Track team goals and objectives"
          icon={<Award className="w-8 h-8" />}
          href="/goals"
          color="green"
        />
        <ActionCard
          title="Timesheets"
          description="Review team time tracking"
          icon={<Clock className="w-8 h-8" />}
          href="/timesheets"
          color="indigo"
        />
        <ActionCard
          title="Reports"
          description="Generate team reports"
          icon={<FileText className="w-8 h-8" />}
          href="/reports"
          color="gray"
        />
      </div>

      {/* Recent Activity would be shown here from Firebase */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Team Activity
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Activity feed will display recent team events from Firebase
        </p>
      </div>
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

// Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  count?: number;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, href, color, count }) => {
  return (
    <a
      href={href}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer relative"
    >
      {count !== undefined && count > 0 && (
        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {count}
        </div>
      )}
      <div className={`text-${color}-600 mb-4`}>{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </a>
  );
};

export default ManagerDashboard;

