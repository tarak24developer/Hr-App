/**
 * HR Dashboard
 * Human Resources management dashboard
 */

import React, { useEffect, useState } from 'react';
import { analyticsEngine } from '@/lib/analytics/analyticsEngine';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import employeeService from '@/services/employeeService';
import dataService from '@/services/dataService';
import { Users, Calendar, TrendingUp, DollarSign, Clock, FileText, UserPlus, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const LEAVE_COLORS = ['#F59E0B', '#10B981', '#EF4444'];
const ATTENDANCE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];
const GENDER_COLORS = ['#3B82F6', '#EC4899', '#8B5CF6'];

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

const HRDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [employeeMetrics, setEmployeeMetrics] = useState<any>(null);
  const [attendanceMetrics, setAttendanceMetrics] = useState<any>(null);
  const [leaveMetrics, setLeaveMetrics] = useState<any>(null);
  const [leaveTypeData, setLeaveTypeData] = useState<{ name: string; value: number }[]>([]);
  const [leaveStatusData, setLeaveStatusData] = useState<{ name: string; value: number }[]>([]);
  const [attendanceStatusData, setAttendanceStatusData] = useState<{ name: string; value: number }[]>([]);
  const [genderDistributionData, setGenderDistributionData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data
      const [empMetrics, attMetrics, lvMetrics, employeesResponse, leavesResponse, attendanceResponse] = await Promise.all([
        analyticsEngine.getEmployeeMetrics(),
        analyticsEngine.getAttendanceMetrics(),
        analyticsEngine.getLeaveMetrics(),
        employeeService.getEmployees(),
        dataService.fetchData('leaves'),
        dataService.fetchData('attendance')
      ]);

      const employees = Array.isArray(employeesResponse) ? employeesResponse : [];
      const leaves = Array.isArray(leavesResponse) ? leavesResponse : (leavesResponse?.data || []);
      const attendance = Array.isArray(attendanceResponse) ? attendanceResponse : (attendanceResponse?.data || []);

      setEmployeeMetrics(empMetrics);
      setAttendanceMetrics(attMetrics);
      setLeaveMetrics(lvMetrics);

      // Process leave type data
      const leaveTypeCounts: Record<string, number> = {};
      leaves.forEach((leave: any) => {
        const type = leave.leaveType || 'Other';
        leaveTypeCounts[type] = (leaveTypeCounts[type] || 0) + 1;
      });
      setLeaveTypeData(
        Object.entries(leaveTypeCounts).map(([name, value]) => ({ name, value }))
      );

      // Process leave status data
      const leaveStatusCounts: Record<string, number> = {};
      leaves.forEach((leave: any) => {
        const status = leave.status || 'Pending';
        leaveStatusCounts[status] = (leaveStatusCounts[status] || 0) + 1;
      });
      setLeaveStatusData(
        Object.entries(leaveStatusCounts).map(([name, value]) => ({ name, value }))
      );

      // Process today's attendance data
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter((att: any) => 
        att.date?.startsWith(today) || att.checkInTime?.startsWith(today)
      );
      const attStatusCounts: Record<string, number> = {};
      todayAttendance.forEach((att: any) => {
        const status = att.status || 'Present';
        attStatusCounts[status] = (attStatusCounts[status] || 0) + 1;
      });
      setAttendanceStatusData(
        Object.entries(attStatusCounts).map(([name, value]) => ({ name, value }))
      );

      // Process gender distribution data
      const genderCounts: Record<string, number> = {};
      employees.forEach((emp: any) => {
        const gender = emp.gender || 'Not Specified';
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      });
      setGenderDistributionData(
        Object.entries(genderCounts).map(([name, value]) => ({ name, value }))
      );
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

      {/* Analytics Charts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          HR Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Types Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Leave Types Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                {leaveTypeData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leave Request Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Leave Request Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                {leaveStatusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Today's Attendance Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                {attendanceStatusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gender Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                {genderDistributionData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
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

