/**
 * Payroll Administrator Dashboard
 * Specialized dashboard for payroll management
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import firebaseService from '@/services/firebaseService';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { DollarSign, Users, TrendingUp, FileText, Calendar, CreditCard } from 'lucide-react';
import PieChartCard from '@/components/PieChartCard';

const PayrollDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    currentMonthPayroll: 0,
    pendingPayments: 0,
    processedPayments: 0
  });
  const [salaryDistribution, setSalaryDistribution] = useState<{ name: string; value: number }[]>([]);
  const [deductionsBreakdown, setDeductionsBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch payroll statistics
      const [usersResult, payrollResult] = await Promise.all([
        firebaseService.getCollection('users'),
        firebaseService.getCollection('payroll')
      ]);

      const totalEmployees = usersResult?.success && usersResult.data ? usersResult.data.length : 0;
      
      // Calculate current month payroll
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthPayroll = payrollResult?.success && payrollResult.data
        ? payrollResult.data
            .filter((record: any) => {
              const recordDate = new Date(record.month);
              return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
            })
            .reduce((sum: number, record: any) => sum + (record.netSalary || 0), 0)
        : 0;

      const pending = payrollResult?.success && payrollResult.data
        ? payrollResult.data.filter((r: any) => r.status === 'pending').length
        : 0;

      const processed = payrollResult?.success && payrollResult.data
        ? payrollResult.data.filter((r: any) => r.status === 'processed').length
        : 0;

      setStats({
        totalEmployees,
        currentMonthPayroll,
        pendingPayments: pending,
        processedPayments: processed
      });

      // Process salary distribution data from payroll records
      if (payrollResult?.success && payrollResult.data) {
        let totalBasic = 0, totalAllowances = 0, totalBonuses = 0, totalOther = 0;
        payrollResult.data.forEach((record: any) => {
          totalBasic += record.basicSalary || 0;
          totalAllowances += record.allowances || 0;
          totalBonuses += record.bonuses || 0;
          totalOther += (record.netSalary || 0) - (record.basicSalary || 0) - (record.allowances || 0) - (record.bonuses || 0);
        });
        setSalaryDistribution([
          { name: 'Basic Salary', value: totalBasic },
          { name: 'Allowances', value: totalAllowances },
          { name: 'Bonuses', value: totalBonuses },
          { name: 'Other', value: Math.max(0, totalOther) }
        ]);

        // Process deductions data
        let totalTax = 0, totalPF = 0, totalInsurance = 0, totalOtherDeductions = 0;
        payrollResult.data.forEach((record: any) => {
          totalTax += record.tax || 0;
          totalPF += record.pf || 0;
          totalInsurance += record.insurance || 0;
          totalOtherDeductions += record.otherDeductions || 0;
        });
        setDeductionsBreakdown([
          { name: 'Tax', value: totalTax },
          { name: 'PF', value: totalPF },
          { name: 'Insurance', value: totalInsurance },
          { name: 'Other', value: totalOtherDeductions }
        ]);
      }
    } catch (error) {
      console.error('Error loading payroll dashboard:', error);
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
          Payroll Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {user?.firstName}! Manage payroll and salary processing.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Employees */}
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

        {/* Current Month Payroll */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{(stats.currentMonthPayroll / 100000).toFixed(2)}L
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.pendingPayments}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Processed Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Processed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.processedPayments}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Payroll Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChartCard
            title="Payment Status"
            data={[
              { name: 'Processed', value: stats.processedPayments },
              { name: 'Pending', value: stats.pendingPayments },
              { name: 'Failed', value: 2 },
            ]}
            colors={['#10B981', '#F59E0B', '#EF4444']}
          />
          <PieChartCard
            title="Salary Distribution"
            data={salaryDistribution}
            colors={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']}
          />
          <PieChartCard
            title="Deductions Breakdown"
            data={deductionsBreakdown}
            colors={['#EF4444', '#F59E0B', '#3B82F6', '#6B7280']}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Process Payroll</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Generate and process monthly payroll for all employees
          </p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Start Processing
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Generate Reports</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create detailed payroll reports and analytics
          </p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            View Reports
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Tax Management</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manage tax deductions and compliance
          </p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Manage Taxes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollDashboard;

