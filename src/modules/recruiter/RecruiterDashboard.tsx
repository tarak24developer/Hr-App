/**
 * Recruiter Dashboard
 * Recruitment and onboarding dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import firebaseService from '@/services/firebaseService';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { UserPlus, Users, Briefcase, Calendar } from 'lucide-react';

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    recentHires: 0,
    activeJobs: 0,
    interviewsScheduled: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const usersResult = await firebaseService.getCollection('users');
      const totalEmployees = usersResult?.success && usersResult.data ? usersResult.data.length : 0;
      
      // Calculate recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentHires = usersResult?.success && usersResult.data
        ? usersResult.data.filter((emp: any) => {
            const hireDate = new Date(emp.hireDate);
            return hireDate >= thirtyDaysAgo;
          }).length
        : 0;

      setStats({
        totalEmployees,
        recentHires,
        activeJobs: 5, // This would come from a jobs collection
        interviewsScheduled: 12 // This would come from an interviews collection
      });
    } catch (error) {
      console.error('Error loading recruiter dashboard:', error);
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
          Recruiter Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {user?.firstName}! Manage recruitment and onboarding.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalEmployees}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent Hires</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.recentHires}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.activeJobs}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Interviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.interviewsScheduled}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Add New Employee</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Onboard new hires to the system
          </p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Employee
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Briefcase className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Post New Job</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create and publish job openings
          </p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Create Job
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Schedule Interview</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Schedule candidate interviews
          </p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;

