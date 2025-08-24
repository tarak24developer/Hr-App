import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  TrendingUp, 
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  CreditCard,
  Banknote,
  Calculator,
  PieChart,
  BarChart3,
  LineChart,
  Minus,
  Equal,
  Clock,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  payPeriod: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid' | 'cancelled';
  paymentMethod: 'bank' | 'check' | 'cash';
  paymentDate?: string;
  notes?: string;
}

interface PayrollSummary {
  totalEmployees: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
  averageSalary: number;
}

const Payroll: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [payPeriodFilter, setPayPeriodFilter] = useState<string>('current');
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'processing' | 'reports'>('overview');

  // Mock data - in real app this would come from Firebase
  const payrollRecords: PayrollRecord[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'Engineering',
      position: 'Senior Developer',
      payPeriod: 'February 2024',
      basicSalary: 8000,
      allowances: 1200,
      deductions: 800,
      netSalary: 8400,
      status: 'paid',
      paymentMethod: 'bank',
      paymentDate: '2024-02-28'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      department: 'Marketing',
      position: 'Marketing Manager',
      payPeriod: 'February 2024',
      basicSalary: 7500,
      allowances: 1000,
      deductions: 750,
      netSalary: 7750,
      status: 'paid',
      paymentMethod: 'bank',
      paymentDate: '2024-02-28'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Bob Wilson',
      department: 'Sales',
      position: 'Sales Representative',
      payPeriod: 'February 2024',
      basicSalary: 6000,
      allowances: 800,
      deductions: 600,
      netSalary: 6200,
      status: 'processed',
      paymentMethod: 'bank'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: 'Alice Johnson',
      department: 'HR',
      position: 'HR Specialist',
      payPeriod: 'February 2024',
      basicSalary: 6500,
      allowances: 900,
      deductions: 650,
      netSalary: 6750,
      status: 'pending',
      paymentMethod: 'bank'
    },
    {
      id: '5',
      employeeId: 'EMP005',
      employeeName: 'Charlie Brown',
      department: 'Finance',
      position: 'Accountant',
      payPeriod: 'February 2024',
      basicSalary: 7000,
      allowances: 1000,
      deductions: 700,
      netSalary: 7300,
      status: 'pending',
      paymentMethod: 'bank'
    }
  ];

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank': return Banknote;
      case 'check': return FileText;
      case 'cash': return CreditCard;
      default: return Banknote;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'bank': return 'bg-blue-100 text-blue-800';
      case 'check': return 'bg-green-100 text-green-800';
      case 'cash': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const payrollSummary: PayrollSummary = {
    totalEmployees: payrollRecords.length,
    totalBasicSalary: payrollRecords.reduce((sum, record) => sum + record.basicSalary, 0),
    totalAllowances: payrollRecords.reduce((sum, record) => sum + record.allowances, 0),
    totalDeductions: payrollRecords.reduce((sum, record) => sum + record.deductions, 0),
    totalNetSalary: payrollRecords.reduce((sum, record) => sum + record.netSalary, 0),
    averageSalary: payrollRecords.reduce((sum, record) => sum + record.netSalary, 0) / payrollRecords.length
  };

  const pendingPayroll = payrollRecords.filter(r => r.status === 'pending').length;
  const processedPayroll = payrollRecords.filter(r => r.status === 'processed').length;
  const paidPayroll = payrollRecords.filter(r => r.status === 'paid').length;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'records', name: 'Records', icon: FileText },
    { id: 'processing', name: 'Processing', icon: Calculator },
    { id: 'reports', name: 'Reports', icon: BarChart3 }
  ] as const;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Process salaries, generate payslips, and manage financial reports</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Process Payroll</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{payrollSummary.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Net Salary</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(payrollSummary.totalNetSalary)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calculator className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingPayroll}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Average Salary</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(payrollSummary.averageSalary)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Payroll Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Summary - February 2024</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(payrollSummary.totalBasicSalary)}</p>
                <p className="text-sm text-blue-700">Basic Salary</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Plus className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{formatCurrency(payrollSummary.totalAllowances)}</p>
                <p className="text-sm text-green-700">Allowances</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Minus className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{formatCurrency(payrollSummary.totalDeductions)}</p>
                <p className="text-sm text-red-700">Deductions</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Equal className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(payrollSummary.totalNetSalary)}</p>
                <p className="text-sm text-purple-700">Net Salary</p>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Status Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{pendingPayroll}</p>
                <p className="text-sm text-yellow-700">Pending</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{processedPayroll}</p>
                <p className="text-sm text-blue-700">Processed</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{paidPayroll}</p>
                <p className="text-sm text-green-700">Paid</p>
              </div>
            </div>
          </div>

          {/* Recent Payroll Records */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payroll Records</h3>
            <div className="space-y-3">
              {payrollRecords.slice(0, 5).map((record) => {
                const PaymentMethodIcon = getPaymentMethodIcon(record.paymentMethod);
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {record.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.employeeName}</p>
                        <p className="text-xs text-gray-500">
                          {record.department} • {record.payPeriod}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(record.netSalary)}
                      </span>
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(record.status)
                      )}>
                        {record.status}
                      </span>
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getPaymentMethodColor(record.paymentMethod)
                      )}>
                        <PaymentMethodIcon className="w-3 h-3 mr-1" />
                        {record.paymentMethod}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Calculator className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Process Payroll</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <FileText className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Generate Payslips</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Download className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Export Report</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <BarChart3 className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by department"
                >
                  <option value="all">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>

                <select
                  value={payPeriodFilter}
                  onChange={(e) => setPayPeriodFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by pay period"
                >
                  <option value="current">Current Period</option>
                  <option value="previous">Previous Period</option>
                  <option value="all">All Periods</option>
                </select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Basic Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allowances
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                          <div className="text-sm text-gray-500">{record.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.payPeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.basicSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.allowances)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(record.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(record.status)
                        )}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title="View record details"
                            aria-label="View record details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit record"
                            aria-label="Edit record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            title="Delete record"
                            aria-label="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll records found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria.
              </p>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Process First Payroll
              </button>
            </div>
          )}
        </div>
      )}

      {/* Processing Tab */}
      {activeTab === 'processing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Processing</h3>
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payroll Processing</h3>
              <p className="text-gray-600 mb-6">
                Automated payroll processing system will be implemented here.
              </p>
              <div className="flex justify-center space-x-4">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Start Processing
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  View Schedule
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Queue</h3>
            <div className="space-y-3">
              {payrollRecords
                .filter(r => r.status === 'pending')
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {record.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.employeeName}</p>
                        <p className="text-xs text-gray-500">{record.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(record.netSalary)}
                      </span>
                      <button className="px-3 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors">
                        Process
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Distribution</h3>
              <div className="space-y-3">
                {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'].map((dept) => {
                  const deptRecords = payrollRecords.filter(r => r.department === dept);
                  const totalSalary = deptRecords.reduce((sum, r) => sum + r.netSalary, 0);
                  return (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{dept}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(totalSalary / payrollSummary.totalNetSalary) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(totalSalary)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
              <div className="space-y-3">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(Math.floor(Math.random() * 50000) + 30000)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Generation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <FileText className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Payroll Summary</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <BarChart3 className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Department Report</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <LineChart className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Trend Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
