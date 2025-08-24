import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  X,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Time
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  location: string;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  lastClockIn?: string;
  currentStatus: 'clocked-in' | 'clocked-out' | 'on-break';
}

const Attendance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'employees' | 'reports'>('overview');

  // Mock data - in real app this would come from Firebase
  const attendanceRecords: AttendanceRecord[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      date: '2024-02-01',
      clockIn: '09:00 AM',
      clockOut: '05:30 PM',
      totalHours: 8.5,
      status: 'present',
      location: 'Main Office',
      notes: 'Regular day'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      date: '2024-02-01',
      clockIn: '08:45 AM',
      clockOut: '05:15 PM',
      totalHours: 8.5,
      status: 'present',
      location: 'Main Office',
      notes: 'Early arrival'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Bob Wilson',
      date: '2024-02-01',
      clockIn: '09:30 AM',
      clockOut: '06:00 PM',
      totalHours: 8.5,
      status: 'late',
      location: 'Main Office',
      notes: 'Traffic delay'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: 'Alice Johnson',
      date: '2024-02-01',
      clockIn: '09:00 AM',
      status: 'present',
      location: 'Main Office'
    },
    {
      id: '5',
      employeeId: 'EMP005',
      employeeName: 'Charlie Brown',
      date: '2024-02-01',
      status: 'absent',
      location: 'N/A',
      notes: 'Called in sick'
    }
  ];

  const employees: Employee[] = [
    {
      id: 'EMP001',
      name: 'John Doe',
      department: 'Engineering',
      position: 'Senior Developer',
      status: 'active',
      lastClockIn: '2024-02-01 09:00 AM',
      currentStatus: 'clocked-in'
    },
    {
      id: 'EMP002',
      name: 'Jane Smith',
      department: 'Marketing',
      position: 'Marketing Manager',
      status: 'active',
      lastClockIn: '2024-02-01 08:45 AM',
      currentStatus: 'clocked-out'
    },
    {
      id: 'EMP003',
      name: 'Bob Wilson',
      department: 'Sales',
      position: 'Sales Representative',
      status: 'active',
      lastClockIn: '2024-02-01 09:30 AM',
      currentStatus: 'clocked-in'
    },
    {
      id: 'EMP004',
      name: 'Alice Johnson',
      department: 'HR',
      position: 'HR Specialist',
      status: 'active',
      lastClockIn: '2024-02-01 09:00 AM',
      currentStatus: 'clocked-in'
    },
    {
      id: 'EMP005',
      name: 'Charlie Brown',
      department: 'Finance',
      position: 'Accountant',
      status: 'active',
      currentStatus: 'clocked-out'
    }
  ];

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half-day': return 'bg-orange-100 text-orange-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentStatusColor = (status: string) => {
    switch (status) {
      case 'clocked-in': return 'bg-green-100 text-green-800';
      case 'clocked-out': return 'bg-gray-100 text-gray-800';
      case 'on-break': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentStatusIcon = (status: string) => {
    switch (status) {
      case 'clocked-in': return CheckCircle;
      case 'clocked-out': return X;
      case 'on-break': return Clock;
      default: return X;
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(record => record.date === today);
  const presentToday = todayRecords.filter(record => record.status === 'present').length;
  const absentToday = todayRecords.filter(record => record.status === 'absent').length;
  const lateToday = todayRecords.filter(record => record.status === 'late').length;
  const totalEmployees = employees.length;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'records', name: 'Records', icon: Clock },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'reports', name: 'Reports', icon: Download }
  ] as const;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track employee attendance, clock in/out, and generate reports</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
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
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{presentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Absent Today</p>
              <p className="text-2xl font-bold text-red-600">{absentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Late Today</p>
              <p className="text-2xl font-bold text-yellow-600">{lateToday}</p>
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
          {/* Today's Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Attendance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{presentToday}</p>
                <p className="text-sm text-green-700">Present</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{absentToday}</p>
                <p className="text-sm text-red-700">Absent</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{lateToday}</p>
                <p className="text-sm text-yellow-700">Late</p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Employee Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => {
                const StatusIcon = getCurrentStatusIcon(employee.currentStatus);
                return (
                  <div key={employee.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                      <p className="text-xs text-gray-500">{employee.department}</p>
                    </div>
                    <div className="ml-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getCurrentStatusColor(employee.currentStatus)
                      )}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {employee.currentStatus.replace('-', ' ')}
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
                <Clock className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Clock In/Out</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Calendar className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">View Calendar</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Download className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Export Report</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <AlertCircle className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">View Alerts</span>
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
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by date"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half-day">Half Day</option>
                  <option value="leave">Leave</option>
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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
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
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.clockIn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.clockOut || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.totalHours ? `${record.totalHours}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(record.status)
                        )}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          {record.location}
                        </div>
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
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria.
              </p>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Add First Record
              </button>
            </div>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const StatusIcon = getCurrentStatusIcon(employee.currentStatus);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.lastClockIn || 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getCurrentStatusColor(employee.currentStatus)
                        )}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {employee.currentStatus.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title="View employee details"
                            aria-label="View employee details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900"
                            title="Clock in/out"
                            aria-label="Clock in/out"
                          >
                            <Clock className="w-4 h-4" />
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
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Trends</h3>
              <div className="space-y-3">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(Math.random() * 20) + 80}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h3>
              <div className="space-y-3">
                {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'].map((dept) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{dept}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(Math.random() * 20) + 80}%
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
                <Calendar className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Daily Report</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <TrendingUp className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Weekly Report</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Download className="w-8 h-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">Monthly Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
