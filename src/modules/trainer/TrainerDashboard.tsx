/**
 * Training Coordinator Dashboard
 * Training and development management dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import dataService from '@/services/dataService';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { GraduationCap, BookOpen, Users, TrendingUp, Award, Target } from 'lucide-react';
import PieChartCard from '@/components/PieChartCard';

const TrainerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activeTrainees: 0,
    completionRate: 0,
    upcomingCourses: 0
  });
  const [courseStatusData, setCourseStatusData] = useState<{ name: string; value: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [certificationData, setCertificationData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch training data
      const trainingResponse = await dataService.fetchData('training');
      const trainings = Array.isArray(trainingResponse) ? trainingResponse : (trainingResponse?.data || []);

      // Calculate stats
      const totalPrograms = trainings.length;
      const activeTrainees = trainings.reduce((sum: number, training: any) => 
        sum + (training.participants?.length || 0), 0);
      const completedCount = trainings.filter((t: any) => t.status === 'completed').length;
      const completionRate = totalPrograms > 0 ? Math.round((completedCount / totalPrograms) * 100) : 0;
      const upcomingCourses = trainings.filter((t: any) => t.status === 'scheduled').length;

      setStats({
        totalPrograms,
        activeTrainees,
        completionRate,
        upcomingCourses
      });

      // Process course status data
      const statusCounts: Record<string, number> = {};
      trainings.forEach((training: any) => {
        const status = training.status || 'Upcoming';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      setCourseStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({ 
          name: name.charAt(0).toUpperCase() + name.slice(1), 
          value 
        }))
      );

      // Process category data
      const categoryCounts: Record<string, number> = {};
      trainings.forEach((training: any) => {
        const category = training.category || 'General';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      setCategoryData(
        Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
      );

      // Process certification data
      const certCounts: Record<string, number> = { 'Certified': 0, 'Pending': 0, 'Not Certified': 0 };
      trainings.forEach((training: any) => {
        if (training.hasCertification) {
          if (training.status === 'completed') {
            certCounts['Certified'] = (certCounts['Certified'] || 0) + 1;
          } else {
            certCounts['Pending'] = (certCounts['Pending'] || 0) + 1;
          }
        } else {
          certCounts['Not Certified'] = (certCounts['Not Certified'] || 0) + 1;
        }
      });
      setCertificationData(
        Object.entries(certCounts).map(([name, value]) => ({ name, value }))
      );
    } catch (error) {
      console.error('Error loading trainer dashboard:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Training Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {user?.firstName}! Manage training and development programs.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Programs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalPrograms}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Trainees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.activeTrainees}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.completionRate}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.upcomingCourses}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Training Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Training Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChartCard
            title="Course Status"
            data={courseStatusData}
            colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444']}
          />
          <PieChartCard
            title="Training Categories"
            data={categoryData}
            colors={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']}
          />
          <PieChartCard
            title="Certification Status"
            data={certificationData}
            colors={['#10B981', '#3B82F6', '#EF4444']}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Create Program</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set up new training programs
          </p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            New Program
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Assign Training</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Assign courses to employees
          </p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Assign
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">View Reports</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Track training progress
          </p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;

