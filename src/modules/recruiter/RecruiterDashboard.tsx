/**
 * Recruiter Dashboard
 * Recruitment and onboarding dashboard
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import firebaseService from '@/services/firebaseService';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { UserPlus, Users, Briefcase, Calendar } from 'lucide-react';
import PieChartCard from '@/components/PieChartCard';

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    recentHires: 0,
    activeJobs: 0,
    interviewsScheduled: 0
  });
  const [pipelineData, setPipelineData] = useState<{ name: string; value: number }[]>([
    { name: 'Applied', value: 0 },
    { name: 'Screening', value: 0 },
    { name: 'Interview', value: 0 },
    { name: 'Offer', value: 0 },
    { name: 'Hired', value: 0 },
  ]);
  const [sourcesData, setSourcesData] = useState<{ name: string; value: number }[]>([
    { name: 'Job Portals', value: 0 },
    { name: 'Referrals', value: 0 },
    { name: 'LinkedIn', value: 0 },
    { name: 'Campus', value: 0 },
  ]);
  const [positionTypesData, setPositionTypesData] = useState<{ name: string; value: number }[]>([
    { name: 'Full-time', value: 0 },
    { name: 'Part-time', value: 0 },
    { name: 'Contract', value: 0 },
    { name: 'Intern', value: 0 },
  ]);

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

      // Try to fetch candidates data
      try {
        const candidatesResult = await firebaseService.getCollection('candidates');
        if (candidatesResult?.success && candidatesResult.data) {
          const candidates = candidatesResult.data;
          
          // Process pipeline data
          const pipelineCounts: Record<string, number> = {};
          candidates.forEach((candidate: any) => {
            const stage = candidate.stage || 'Applied';
            pipelineCounts[stage] = (pipelineCounts[stage] || 0) + 1;
          });
          setPipelineData([
            { name: 'Applied', value: pipelineCounts['Applied'] || 0 },
            { name: 'Screening', value: pipelineCounts['Screening'] || 0 },
            { name: 'Interview', value: pipelineCounts['Interview'] || 0 },
            { name: 'Offer', value: pipelineCounts['Offer'] || 0 },
            { name: 'Hired', value: pipelineCounts['Hired'] || 0 },
          ]);

          // Process sources data
          const sourcesCounts: Record<string, number> = {};
          candidates.forEach((candidate: any) => {
            const source = candidate.source || 'Other';
            sourcesCounts[source] = (sourcesCounts[source] || 0) + 1;
          });
          setSourcesData(Object.entries(sourcesCounts).map(([name, value]) => ({ name, value })));
        }
      } catch (error) {
        console.log('Candidates collection not available');
      }

      // Try to fetch positions data
      try {
        const positionsResult = await firebaseService.getCollection('positions');
        if (positionsResult?.success && positionsResult.data) {
          const positions = positionsResult.data;
          const typeCounts: Record<string, number> = {};
          positions.forEach((position: any) => {
            const type = position.type || 'Full-time';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          setPositionTypesData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));
        }
      } catch (error) {
        console.log('Positions collection not available');
      }

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

      {/* Recruitment Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recruitment Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChartCard
            title="Candidate Pipeline"
            data={pipelineData}
            colors={['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#059669']}
          />
          <PieChartCard
            title="Hiring Sources"
            data={sourcesData}
            colors={['#3B82F6', '#10B981', '#0EA5E9', '#8B5CF6']}
          />
          <PieChartCard
            title="Position Types"
            data={positionTypesData}
            colors={['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']}
          />
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

