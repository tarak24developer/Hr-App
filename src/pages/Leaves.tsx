import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Clock, 
  CheckCircle, 
  X,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  FileText,
  UserCheck,
  UserX
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
}

interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annual: number;
  sick: number;
  personal: number;
  maternity: number;
  paternity: number;
  bereavement: number;
  unpaid: number;
}

const Leaves: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'balances' | 'calendar'>('overview');

  // Mock data - in real app this would come from Firebase
  const leaveRequests: LeaveRequest[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      leaveType: 'annual',
      startDate: '2024-03-15',
      endDate: '2024-03-20',
      totalDays: 6,
      reason: 'Family vacation',
      status: 'pending',
      submittedDate: '2024-02-01'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      leaveType: 'sick',
      startDate: '2024-02-05',
      endDate: '2024-02-07',
      totalDays: 3,
      reason: 'Flu',
      status: 'approved',
      submittedDate: '2024-02-04',
      approvedBy: 'Manager',
      approvedDate: '2024-02-04'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Bob Wilson',
      leaveType: 'personal',
      startDate: '2024-02-10',
      endDate: '2024-02-10',
      totalDays: 1,
      reason: 'Doctor appointment',
      status: 'approved',
      submittedDate: '2024-02-08',
      approvedBy: 'Manager',
      approvedDate: '2024-02-08'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: 'Alice Johnson',
      leaveType: 'maternity',
      startDate: '2024-04-01',
      endDate: '2024-07-01',
      totalDays: 90,
      reason: 'Maternity leave',
      status: 'approved',
      submittedDate: '2024-01-15',
      approvedBy: 'HR Manager',
      approvedDate: '2024-01-16'
    },
    {
      id: '5',
      employeeId: 'EMP005',
      employeeName: 'Charlie Brown',
      leaveType: 'annual',
      startDate: '2024-06-01',
      endDate: '2024-06-05',
      totalDays: 5,
      reason: 'Summer vacation',
      status: 'pending',
      submittedDate: '2024-02-01'
    }
  ];

  const leaveBalances: LeaveBalance[] = [
    {
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      annual: 15,
      sick: 10,
      personal: 5,
      maternity: 0,
      paternity: 0,
      bereavement: 3,
      unpaid: 0
    },
    {
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      annual: 12,
      sick: 7,
      personal: 3,
      maternity: 0,
      paternity: 0,
      bereavement: 3,
      unpaid: 0
    },
    {
      employeeId: 'EMP003',
      employeeName: 'Bob Wilson',
      annual: 20,
      sick: 10,
      personal: 5,
      maternity: 0,
      paternity: 0,
      bereavement: 3,
      unpaid: 0
    },
    {
      employeeId: 'EMP004',
      employeeName: 'Alice Johnson',
      annual: 18,
      sick: 10,
      personal: 5,
      maternity: 90,
      paternity: 0,
      bereavement: 3,
      unpaid: 0
    },
    {
      employeeId: 'EMP005',
      employeeName: 'Charlie Brown',
      annual: 22,
      sick: 10,
      personal: 5,
      maternity: 0,
      paternity: 0,
      bereavement: 3,
      unpaid: 0
    }
  ];

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = leaveTypeFilter === 'all' || request.leaveType === leaveTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'maternity': return 'bg-pink-100 text-pink-800';
      case 'paternity': return 'bg-indigo-100 text-indigo-800';
      case 'bereavement': return 'bg-gray-100 text-gray-800';
      case 'unpaid': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return X;
      case 'cancelled': return X;
      default: return Clock;
    }
  };

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;
  const totalRequests = leaveRequests.length;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'requests', name: 'Requests', icon: Calendar },
    { id: 'balances', name: 'Balances', icon: Users },
    { id: 'calendar', name: 'Calendar', icon: Calendar }
  ] as const;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage employee leave requests, approvals, and balances</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Request</span>
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
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedRequests}</p>
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
          {/* Recent Requests */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Leave Requests</h3>
            <div className="space-y-3">
              {leaveRequests.slice(0, 5).map((request) => {
                const StatusIcon = getStatusIcon(request.status);
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {request.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{request.employeeName}</p>
                        <p className="text-xs text-gray-500">
                          {request.leaveType} • {request.startDate} to {request.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getLeaveTypeColor(request.leaveType)
                      )}>
                        {request.leaveType}
                      </span>
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(request.status)
                      )}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {request.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave Type Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Type Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement'].map((type) => {
                const count = leaveRequests.filter(r => r.leaveType === type).length;
                return (
                  <div key={type} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                      getLeaveTypeColor(type)
                    )}>
                      {type}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
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
                <Plus className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">New Request</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <UserCheck className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Approve Requests</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Calendar className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">View Calendar</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Download className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Export Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
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
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by leave type"
                >
                  <option value="all">All Types</option>
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                  <option value="maternity">Maternity</option>
                  <option value="paternity">Paternity</option>
                  <option value="bereavement">Bereavement</option>
                  <option value="unpaid">Unpaid</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by date"
                >
                  <option value="all">All Dates</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="next-month">Next Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const StatusIcon = getStatusIcon(request.status);
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                            <div className="text-sm text-gray-500">{request.employeeId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                            getLeaveTypeColor(request.leaveType)
                          )}>
                            {request.leaveType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>{request.startDate}</div>
                            <div className="text-gray-500">to {request.endDate}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.totalDays} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            getStatusColor(request.status)
                          )}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.submittedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              title="View request details"
                              aria-label="View request details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button 
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve request"
                                  aria-label="Approve request"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject request"
                                  aria-label="Reject request"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button 
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit request"
                              aria-label="Edit request"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria.
              </p>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Create First Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sick
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maternity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paternity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bereavement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveBalances.map((balance) => (
                  <tr key={balance.employeeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {balance.employeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{balance.employeeName}</div>
                          <div className="text-sm text-gray-500">{balance.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.annual}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.sick}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.personal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.maternity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.paternity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {balance.bereavement}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="View balance details"
                          aria-label="View balance details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit balance"
                          aria-label="Edit balance"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Calendar</h3>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
              <p className="text-gray-600 mb-6">
                Interactive calendar showing approved leave dates will be implemented here.
              </p>
              <div className="flex justify-center space-x-4">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Month View
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Week View
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Day View
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Leave</h3>
            <div className="space-y-3">
              {leaveRequests
                .filter(r => r.status === 'approved' && new Date(r.startDate) > new Date())
                .slice(0, 5)
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {request.employeeName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{request.employeeName}</p>
                        <p className="text-xs text-gray-500">
                          {request.startDate} to {request.endDate}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                      getLeaveTypeColor(request.leaveType)
                    )}>
                      {request.leaveType}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
