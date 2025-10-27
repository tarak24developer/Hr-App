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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const PERFORMANCE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
const TASK_COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

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

const ManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teamSize, setTeamSize] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [teamAttendance, setTeamAttendance] = useState<any>(null);
  const [teamPerformanceData, setTeamPerformanceData] = useState<{ name: string; value: number }[]>([]);
  const [taskStatusData, setTaskStatusData] = useState<{ name: string; value: number }[]>([]);
  const [teamSkillsData, setTeamSkillsData] = useState<{ name: string; value: number }[]>([]);

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

      // Fetch pending leave requests and team data
      const teamMemberIds = teamSnapshot.docs.map(doc => doc.id);
      const teamMembers = teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (teamMemberIds.length > 0) {
        const leavesQuery = query(
          collection(db, 'leaves'),
          where('employeeId', 'in', teamMemberIds),
          where('status', '==', 'pending')
        );
        const leavesSnapshot = await getDocs(leavesQuery);
        setPendingLeaves(leavesSnapshot.size);
      }

      // Process performance data from team members
      const performanceCounts: Record<string, number> = {};
      teamMembers.forEach((member: any) => {
        const performance = member.performanceRating || 'Average';
        performanceCounts[performance] = (performanceCounts[performance] || 0) + 1;
      });
      setTeamPerformanceData(
        Object.entries(performanceCounts).map(([name, value]) => ({ name, value }))
      );

      // Fetch tasks if available
      try {
        const tasksQuery = query(collection(db, 'tasks'));
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasks = tasksSnapshot.docs.map(doc => doc.data());
        const taskCounts: Record<string, number> = {};
        tasks.forEach((task: any) => {
          const status = task.status || 'Pending';
          taskCounts[status] = (taskCounts[status] || 0) + 1;
        });
        setTaskStatusData(
          Object.entries(taskCounts).map(([name, value]) => ({ name, value }))
        );
      } catch (error) {
        console.log('Tasks collection not available');
        setTaskStatusData([
          { name: 'Completed', value: 0 },
          { name: 'In Progress', value: 0 },
          { name: 'Pending', value: 0 }
        ]);
      }

      // Process skills data from team members
      const skillsCounts: Record<string, number> = {};
      teamMembers.forEach((member: any) => {
        const skills = member.skills || [];
        skills.forEach((skill: string) => {
          skillsCounts[skill] = (skillsCounts[skill] || 0) + 1;
        });
      });
      setTeamSkillsData(
        Object.entries(skillsCounts).map(([name, value]) => ({ name, value }))
      );

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

      {/* Team Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Performance Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Ratings
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={teamPerformanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                {teamPerformanceData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Task Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Task Status
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                {taskStatusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={TASK_COLORS[index % TASK_COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Team Skills */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team Skills
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={teamSkillsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                {teamSkillsData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
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

