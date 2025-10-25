/**
 * HR Dashboard
 * Human Resources management dashboard
 */

import React, { useEffect, useState } from 'react';
import { analyticsEngine } from '@/lib/analytics/analyticsEngine';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Users, Calendar, TrendingUp, DollarSign, Clock, FileText, UserPlus, Briefcase } from 'lucide-react';

const HRDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [employeeMetrics, setEmployeeMetrics] = useState<any>(null);
  const [attendanceMetrics, setAttendanceMetrics] = useState<any>(null);
  const [leaveMetrics, setLeaveMetrics] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [empMetrics, attMetrics, lvMetrics] = await Promise.all([
        analyticsEngine.getEmployeeMetrics(),
        analyticsEngine.getAttendanceMetrics(),
        analyticsEngine.getLeaveMetrics()
      ]);

      setEmployeeMetrics(empMetrics);
      setAttendanceMetrics(attMetrics);
      setLeaveMetrics(lvMetrics);
    } catch (error) {
      console.error('Error loading HR dashboard data:', error);
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
          HR Management Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete overview of your workforce and HR operations
        </p>
      </div>

      {/* Employee Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Workforce Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Employees"
            value={employeeMetrics?.totalEmployees.value || 0}
            icon={<Users className="w-6 h-6" />}
            color="blue"
            change={employeeMetrics?.totalEmployees.changePercentage}
          />
          <MetricCard
            title="Active Employees"
            value={employeeMetrics?.activeEmployees.value || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
            change={employeeMetrics?.activeEmployees.changePercentage}
          />
          <MetricCard
            title="New Hires (30d)"
            value={employeeMetrics?.newHires.value || 0}
            icon={<UserPlus className="w-6 h-6" />}
            color="purple"
            change={employeeMetrics?.newHires.changePercentage}
          />
          <MetricCard
            title="Avg Tenure"
            value={`${employeeMetrics?.averageTenure.value.toFixed(1) || 0} yrs`}
            icon={<Clock className="w-6 h-6" />}
            color="indigo"
          />
        </div>
      </div>

      {/* Attendance Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Attendance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Present Rate"
            value={`${attendanceMetrics?.presentRate.value.toFixed(1) || 0}%`}
            icon={<Calendar className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Absent Rate"
            value={`${attendanceMetrics?.absentRate.value.toFixed(1) || 0}%`}
            icon={<Calendar className="w-6 h-6" />}
            color="red"
          />
          <MetricCard
            title="Late Rate"
            value={`${attendanceMetrics?.lateRate.value.toFixed(1) || 0}%`}
            icon={<Clock className="w-6 h-6" />}
            color="orange"
          />
          <MetricCard
            title="Avg Hours/Day"
            value={attendanceMetrics?.averageHours.value.toFixed(1) || 0}
            icon={<Clock className="w-6 h-6" />}
            color="blue"
          />
        </div>
      </div>

      {/* Leave Management */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Leave Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Requests"
            value={leaveMetrics?.totalLeaves.value || 0}
            icon={<FileText className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title="Pending Approval"
            value={leaveMetrics?.pendingLeaves.value || 0}
            icon={<Clock className="w-6 h-6" />}
            color="yellow"
          />
          <MetricCard
            title="Approved"
            value={leaveMetrics?.approvedLeaves.value || 0}
            icon={<Calendar className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Avg Days"
            value={leaveMetrics?.averageLeaveDays.value.toFixed(1) || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickAction
          title="Employee Directory"
          description="View and manage all employees"
          icon={<Users className="w-8 h-8" />}
          href="/employee-directory"
          color="blue"
        />
        <QuickAction
          title="Recruitment"
          description="Manage hiring and onboarding"
          icon={<UserPlus className="w-8 h-8" />}
          href="/recruitment"
          color="green"
        />
        <QuickAction
          title="Payroll"
          description="Process and manage payroll"
          icon={<DollarSign className="w-8 h-8" />}
          href="/payroll"
          color="emerald"
        />
        <QuickAction
          title="Performance Reviews"
          description="Manage employee performance"
          icon={<TrendingUp className="w-8 h-8" />}
          href="/performance"
          color="purple"
        />
        <QuickAction
          title="Training & Development"
          description="Manage training programs"
          icon={<Briefcase className="w-8 h-8" />}
          href="/training"
          color="indigo"
        />
        <QuickAction
          title="Reports"
          description="Generate HR reports"
          icon={<FileText className="w-8 h-8" />}
          href="/reports"
          color="orange"
        />
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, change }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    emerald: 'bg-emerald-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </div>
        )}
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

export default HRDashboard;

