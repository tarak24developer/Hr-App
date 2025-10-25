/**
 * Admin Dashboard
 * Comprehensive system administration dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { analyticsEngine } from '@/lib/analytics/analyticsEngine';
import { rbacService } from '@/lib/rbac/rbacService';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import type { AnalyticsMetric, AnalyticsInsight } from '@/lib/analytics/analyticsEngine';
import { BarChart3, Users, Shield, Activity, AlertTriangle, TrendingUp, Settings, Database } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    totalEmployees: AnalyticsMetric;
    activeEmployees: AnalyticsMetric;
    newHires: AnalyticsMetric;
    turnoverRate: AnalyticsMetric;
  } | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Initialize RBAC for user
      if (user) {
        rbacService.initializeUserRoles(user);
      }

      // Fetch metrics
      const employeeMetrics = await analyticsEngine.getEmployeeMetrics();
      setMetrics({
        totalEmployees: employeeMetrics.totalEmployees,
        activeEmployees: employeeMetrics.activeEmployees,
        newHires: employeeMetrics.newHires,
        turnoverRate: employeeMetrics.turnoverRate
      });

      // Fetch AI insights
      const generatedInsights = await analyticsEngine.generateInsights();
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
          System Administration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete control and oversight of your HR system
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          value={metrics?.totalEmployees.value || 0}
          icon={<Users className="w-6 h-6" />}
          trend={metrics?.totalEmployees.trend || 'stable'}
          change={metrics?.totalEmployees.changePercentage}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={metrics?.activeEmployees.value || 0}
          icon={<Activity className="w-6 h-6" />}
          trend={metrics?.activeEmployees.trend || 'stable'}
          change={metrics?.activeEmployees.changePercentage}
          color="green"
        />
        <StatCard
          title="New Hires"
          value={metrics?.newHires.value || 0}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={metrics?.newHires.trend || 'stable'}
          change={metrics?.newHires.changePercentage}
          color="purple"
        />
        <StatCard
          title="Turnover Rate"
          value={`${metrics?.turnoverRate.value.toFixed(1) || 0}%`}
          icon={<BarChart3 className="w-6 h-6" />}
          trend={metrics?.turnoverRate.trend || 'stable'}
          change={metrics?.turnoverRate.changePercentage}
          color="orange"
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            AI-Powered Insights
          </h2>
          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ActionCard
          title="User Management"
          description="Manage users, roles, and permissions"
          icon={<Users className="w-8 h-8" />}
          href="/users"
          color="blue"
        />
        <ActionCard
          title="Security Settings"
          description="Configure security and access controls"
          icon={<Shield className="w-8 h-8" />}
          href="/security"
          color="red"
        />
        <ActionCard
          title="System Settings"
          description="Configure system-wide settings"
          icon={<Settings className="w-8 h-8" />}
          href="/settings"
          color="gray"
        />
        <ActionCard
          title="Audit Logs"
          description="View system activity and audit trails"
          icon={<Database className="w-8 h-8" />}
          href="/audit-logs"
          color="indigo"
        />
        <ActionCard
          title="Analytics"
          description="Advanced analytics and reporting"
          icon={<BarChart3 className="w-8 h-8" />}
          href="/advanced-analytics"
          color="green"
        />
        <ActionCard
          title="Integrations"
          description="Manage third-party integrations"
          icon={<Activity className="w-8 h-8" />}
          href="/integrations"
          color="purple"
        />
      </div>

      {/* System Health */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthMetric
            label="Database"
            status="healthy"
            value="99.9%"
            description="Uptime"
          />
          <HealthMetric
            label="API"
            status="healthy"
            value="< 50ms"
            description="Response Time"
          />
          <HealthMetric
            label="Storage"
            status="warning"
            value="78%"
            description="Usage"
          />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
  change: number | undefined;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, change, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
        {trend && change !== undefined && (
          <div className={`flex items-center text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

// Insight Card Component
interface InsightCardProps {
  insight: AnalyticsInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const severityColors = {
    info: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    critical: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  };

  return (
    <div className={`border rounded-lg p-4 ${severityColors[insight.severity]}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
          insight.severity === 'critical' ? 'text-red-600' :
          insight.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
        }`} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {insight.title}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
            {insight.description}
          </p>
          {insight.suggestedActions && insight.suggestedActions.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Suggested Actions:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {insight.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
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
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, href, color }) => {
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

// Health Metric Component
interface HealthMetricProps {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  description: string;
}

const HealthMetric: React.FC<HealthMetricProps> = ({ label, status, value, description }) => {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  return (
    <div className="text-center">
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${statusColors[status]}`}>
        {status.toUpperCase()}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label} - {description}</p>
    </div>
  );
};

export default AdminDashboard;

