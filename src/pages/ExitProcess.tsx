import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, 
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
  Clock,
  Play,
  FileText,
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import DashboardCard from '../components/DashboardCard';
// import type { User } from '../types';

interface ExitChecklistItem {
  id: string;
  task: string;
  category: 'hr' | 'it' | 'finance' | 'operations' | 'security';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo: string;
  dueDate: Date;
  notes?: string;
  completedAt?: Date;
}

interface ExitProcess {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeDepartment: string;
  exitDate: Date;
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  checklist: ExitChecklistItem[];
  notes?: string | undefined;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date | undefined;
  lastUpdated: Date;
}

// Employee interface not needed in this page after UI simplification

const ExitProcess: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'employees' | 'reports'>('overview');
  const [exitProcesses, setExitProcesses] = useState<ExitProcess[]>([]);
  // const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<ExitProcess | null>(null);

  // Form data
  const [formData, setFormData] = useState<Partial<ExitProcess>>({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    employeeDepartment: '',
    exitDate: new Date(),
    reason: '',
    priority: 'medium',
    notes: '',
    checklist: []
  });

  const isFormValid = useMemo(() => {
    const email = (formData.employeeEmail || '').trim();
    const requiredFilled = Boolean(
      (formData.employeeId || '').trim() &&
      (formData.employeeName || '').trim() &&
      email
    );
    const emailOk = /.+@.+\..+/.test(email);
    return requiredFilled && emailOk;
  }, [formData.employeeId, formData.employeeName, formData.employeeEmail]);

  // Load data
  useEffect(() => {
    loadExitProcesses();
    // loadEmployees();
  }, []);

  const loadExitProcesses = async () => {
    setLoading(true);
    try {
      const response = await firebaseService.getCollection('exitProcesses');
      if (response.success && response.data) {
        const processes: ExitProcess[] = response.data.map((doc: any) => {
          const safeDate = (dateValue: any): Date => {
            if (!dateValue) return new Date();
            try {
              const date = new Date(dateValue);
              return isNaN(date.getTime()) ? new Date() : date;
            } catch {
              return new Date();
            }
          };

          const base: Omit<ExitProcess, 'completedAt'> & { completedAt?: Date } = {
            id: doc.id || doc['id'],
            employeeId: doc.employeeId || '',
            employeeName: doc.employeeName || '',
            employeeEmail: doc.employeeEmail || '',
            employeeDepartment: doc.employeeDepartment || '',
            exitDate: safeDate(doc.exitDate),
            reason: doc.reason || '',
            status: doc.status || 'pending',
            priority: doc.priority || 'medium',
            checklist: (doc.checklist || []).map((item: any) => ({
              id: item.id,
              task: item.task,
              category: item.category,
              status: item.status,
              assignedTo: item.assignedTo,
              dueDate: safeDate(item.dueDate),
              ...(item.completedAt ? { completedAt: safeDate(item.completedAt) } : {}),
              ...(item.notes ? { notes: item.notes } : {})
            })),
            ...(doc.notes ? { notes: doc.notes } : {}),
            initiatedBy: doc.initiatedBy || '',
            initiatedAt: safeDate(doc.initiatedAt),
            ...(doc.completedAt ? { completedAt: safeDate(doc.completedAt) } : {}),
            lastUpdated: safeDate(doc.lastUpdated)
          };

          return base as ExitProcess;
        });
        setExitProcesses(processes);
      } else {
        setExitProcesses([]);
      }
    } catch (error) {
      console.error('Error loading exit processes:', error);
      setError('Failed to load exit processes');
    } finally {
      setLoading(false);
    }
  };

  // const loadEmployees = async () => {
  //   try {
  //     const response = await firebaseService.getCollection<User>('users');
  //     if (response.success && response.data) {
  //       const employeeList: Employee[] = response.data.map(user => ({
  //         id: user.id,
  //         name: `${user.firstName} ${user.lastName}`.trim() || user.displayName || user.email || 'Employee',
  //         email: user.email,
  //         department: user.department || 'General',
  //         position: user.position || 'Employee'
  //       }));
  //       setEmployees(employeeList);
  //     }
  //   } catch (error) {
  //     console.error('Error loading employees:', error);
  //   }
  // };

  // Filtered processes
  const filteredProcesses = useMemo(() => {
    let filtered = [...exitProcesses];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(process =>
        process.employeeName.toLowerCase().includes(searchLower) ||
        process.employeeEmail.toLowerCase().includes(searchLower) ||
        process.reason.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(process => process.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(process => process.priority === priorityFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(process => process.employeeDepartment === departmentFilter);
    }

    return filtered;
  }, [exitProcesses, searchQuery, statusFilter, priorityFilter, departmentFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = exitProcesses.length;
    const pending = exitProcesses.filter(p => p.status === 'pending').length;
    const inProgress = exitProcesses.filter(p => p.status === 'in_progress').length;
    const completed = exitProcesses.filter(p => p.status === 'completed').length;
    const urgent = exitProcesses.filter(p => p.priority === 'urgent').length;

    return { total, pending, inProgress, completed, urgent };
  }, [exitProcesses]);

  // Action handlers
  const handleCreateProcess = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      employeeEmail: '',
      employeeDepartment: '',
      exitDate: new Date(),
      reason: '',
      priority: 'medium',
      notes: '',
      checklist: []
    });
    setShowCreateModal(true);
  };

  const handleViewProcess = (process: ExitProcess) => {
    setSelectedProcess(process);
    setShowViewModal(true);
  };

  const handleEditProcess = (process: ExitProcess) => {
    setSelectedProcess(process);
    setFormData(process);
    setShowEditModal(true);
  };

  const handleDeleteProcess = (process: ExitProcess) => {
    setSelectedProcess(process);
    setShowDeleteModal(true);
  };

  const confirmDeleteProcess = async () => {
    if (!selectedProcess) return;
    
    try {
      await firebaseService.deleteDocument('exitProcesses', selectedProcess.id);
      setExitProcesses(prev => prev.filter(p => p.id !== selectedProcess.id));
      setShowDeleteModal(false);
      setSuccessMessage('Exit process deleted successfully');
    } catch (error) {
      setError('Failed to delete exit process');
    }
  };

  const handleSaveProcess = async () => {
    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const processData: ExitProcess = {
        id: selectedProcess?.id || '',
        employeeId: formData.employeeId || '',
        employeeName: formData.employeeName || '',
        employeeEmail: formData.employeeEmail || '',
        employeeDepartment: formData.employeeDepartment || '',
        exitDate: formData.exitDate || new Date(),
        reason: formData.reason || '',
        status: (formData.status as ExitProcess['status']) || 'pending',
        priority: (formData.priority as ExitProcess['priority']) || 'medium',
        checklist: formData.checklist || [],
        ...(formData.notes ? { notes: formData.notes } : {}),
        initiatedBy: 'current-user', // Replace with actual user
        initiatedAt: new Date(),
        lastUpdated: new Date(),
        ...(formData.completedAt ? { completedAt: formData.completedAt } : {})
      };

      if (selectedProcess) {
        // Update existing process
        await firebaseService.updateDocument('exitProcesses', selectedProcess.id, processData);
        setExitProcesses(prev => prev.map(p => p.id === selectedProcess.id ? processData : p));
        setShowEditModal(false);
        setSuccessMessage('Exit process updated successfully');
      } else {
        // Create new process
        const response = await firebaseService.addDocument('exitProcesses', processData);
        if (response.success && response.data) {
          setExitProcesses(prev => [...prev, response.data as ExitProcess]);
          setShowCreateModal(false);
          setSuccessMessage('Exit process created successfully');
        }
      }
    } catch (error) {
      setError('Failed to save exit process');
    }
  };

  const handleStartProcess = async (processId: string) => {
    try {
      await firebaseService.updateDocument('exitProcesses', processId, {
        status: 'in_progress',
        lastUpdated: new Date()
      });
        setExitProcesses(prev => prev.map(process =>
          process.id === processId
            ? { ...process, status: 'in_progress', lastUpdated: new Date() }
            : process
        ));
      setSuccessMessage('Exit process started successfully');
    } catch (error) {
      setError('Failed to start exit process');
    }
  };

  const handleCompleteProcess = async (processId: string) => {
    try {
      await firebaseService.updateDocument('exitProcesses', processId, {
        status: 'completed',
        completedAt: new Date(),
        lastUpdated: new Date()
      });
        setExitProcesses(prev => prev.map(process =>
          process.id === processId
            ? { ...process, status: 'completed', completedAt: new Date(), lastUpdated: new Date() }
            : process
        ));
      setSuccessMessage('Exit process completed successfully');
    } catch (error) {
      setError('Failed to complete exit process');
    }
  };

  // confirmDeleteProcess removed (replaced by inline delete)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return X;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChecklistProgress = (checklist: ExitChecklistItem[]) => {
    const totalItems = checklist.length;
    const completedItems = checklist.filter(item => item.status === 'completed').length;
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'processes', name: 'Processes', icon: FileText },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'reports', name: 'Reports', icon: Download }
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exit processes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exit Process Management</h1>
          <p className="text-gray-600">Manage employee exit processes, checklists, and documentation</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
          onClick={handleCreateProcess}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Exit Process</span>
          </button>
          <button 
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard
          name="Total Processes"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <DashboardCard
          name="Pending"
          value={stats.pending}
          icon={AlertCircle}
          color="yellow"
        />
        <DashboardCard
          name="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="indigo"
        />
        <DashboardCard
          name="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="Urgent"
          value={stats.urgent}
          icon={AlertCircle}
          color="red"
        />
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Processes (table format) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Exit Processes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProcesses.slice(0, 5).map((process, index) => {
                    const StatusIcon = getStatusIcon(process.status);
                    return (
                      <tr key={process.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 font-semibold text-xs">
                                  {process.employeeName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{process.employeeName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{process.employeeDepartment || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {process.exitDate instanceof Date ? process.exitDate.toLocaleDateString() : new Date(process.exitDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getStatusColor(process.status))}>
                            {process.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getPriorityColor(process.priority))}>
                            {process.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                          <StatusIcon className="w-4 h-4 text-gray-400" />
                          {Math.round(getChecklistProgress(process.checklist))}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleViewProcess(process)} className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEditProcess(process)} className="text-green-600 hover:text-green-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            {process.status === 'pending' && (
                              <button onClick={() => handleStartProcess(process.id)} className="text-green-600 hover:text-green-900" title="Start Process">
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {process.status === 'in_progress' && (
                              <button onClick={() => handleCompleteProcess(process.id)} className="text-green-600 hover:text-green-900" title="Complete Process">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Processes Tab */}
      {activeTab === 'processes' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search processes by employee name, email, or reason"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="all">All Departments</option>
                  {[...new Set(exitProcesses.map(p => p.employeeDepartment))].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Processes Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredProcesses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No exit processes found</h3>
                <p className="text-gray-600 mb-4">
                        {exitProcesses.length === 0 
                          ? 'No exit processes have been created yet. Click "Initiate Exit Process" to get started.'
                          : 'No processes match the current filters. Try adjusting your search criteria.'
                        }
                </p>
                {exitProcesses.length === 0 && (
                  <button
                    onClick={handleCreateProcess}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Initiate Exit Process</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProcesses.map((process, index) => {
                      const StatusIcon = getStatusIcon(process.status);
                      return (
                        <tr key={process.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="text-primary-600 font-semibold text-xs">
                        {process.employeeName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{process.employeeName}</div>
                                <div className="text-xs text-gray-500">{process.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{process.employeeDepartment || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {process.exitDate instanceof Date ? process.exitDate.toLocaleDateString() : new Date(process.exitDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getStatusColor(process.status))}>
                              {process.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getPriorityColor(process.priority))}>
                              {process.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                            <StatusIcon className="w-4 h-4 text-gray-400" />
                          {Math.round(getChecklistProgress(process.checklist))}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleViewProcess(process)} className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditProcess(process)} className="text-green-600 hover:text-green-900">
                                <Edit className="w-4 h-4" />
                              </button>
                      {process.status === 'pending' && (
                                <button onClick={() => handleStartProcess(process.id)} className="text-green-600 hover:text-green-900" title="Start Process">
                                  <Play className="w-4 h-4" />
                                </button>
                      )}
                      {process.status === 'in_progress' && (
                                <button onClick={() => handleCompleteProcess(process.id)} className="text-green-600 hover:text-green-900" title="Complete Process">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteProcess(process)} className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other tabs content will be added later */}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create Exit Process</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.employeeId || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
                    <input
                      type="text"
                      value={formData.employeeName || ''}
                      onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.employeeName || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter employee name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Email *</label>
                    <input
                      type="email"
                      value={formData.employeeEmail || ''}
                      onChange={(e) => setFormData({ ...formData, employeeEmail: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        /.+@.+\..+/.test((formData.employeeEmail || '').trim()) ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter employee email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.employeeDepartment || ''}
                      onChange={(e) => setFormData({ ...formData, employeeDepartment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter department"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exit Date</label>
                    <input
                      type="date"
                      value={formData.exitDate ? (formData.exitDate instanceof Date ? formData.exitDate.toISOString().split('T')[0] : new Date(formData.exitDate).toISOString().split('T')[0]) : ''}
                      onChange={(e) => setFormData({ ...formData, exitDate: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority || 'medium'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter exit reason"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProcess}
                disabled={!isFormValid}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  isFormValid
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                )}
              >
                Create Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - grouped sections, read-only */}
      {showViewModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <Eye className="w-5 h-5 text-primary-600" />
                </div>
                  <h3 className="text-base font-semibold text-gray-900">Exit Process Details</h3>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                  <X className="w-4 h-4" />
              </button>
            </div>
              {/* Process Details Content */}
              <div className="space-y-6">
                {/* Process Header */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-xl">
                      {selectedProcess.employeeName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900">{selectedProcess.employeeName}</h4>
                    <p className="text-gray-600">{selectedProcess.employeeId}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        selectedProcess.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                        selectedProcess.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                        selectedProcess.status === 'completed' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {selectedProcess.status.charAt(0).toUpperCase() + selectedProcess.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">{selectedProcess.employeeDepartment}</span>
                      <span className="text-sm text-gray-500">{selectedProcess.priority}</span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h5>
                    <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-gray-900">Employee Name</p>
                          <p className="text-sm text-gray-600">{selectedProcess.employeeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-gray-900">Employee ID</p>
                          <p className="text-sm text-gray-600">{selectedProcess.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{selectedProcess.employeeEmail || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-gray-900">Department</p>
                          <p className="text-sm text-gray-600">{selectedProcess.employeeDepartment || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Process Information */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Process Information</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Process ID</span>
                        <span className="text-sm text-gray-900">{selectedProcess.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedProcess.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                          selectedProcess.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                          selectedProcess.status === 'completed' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {selectedProcess.status.charAt(0).toUpperCase() + selectedProcess.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Priority</span>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedProcess.priority === 'urgent' ? "bg-red-100 text-red-800" :
                          selectedProcess.priority === 'high' ? "bg-orange-100 text-orange-800" :
                          selectedProcess.priority === 'medium' ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                        )}>
                          {selectedProcess.priority.charAt(0).toUpperCase() + selectedProcess.priority.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Exit Date</span>
                        <span className="text-sm text-gray-900">
                          {selectedProcess.exitDate instanceof Date 
                            ? selectedProcess.exitDate.toLocaleDateString() 
                            : new Date(selectedProcess.exitDate).toLocaleDateString()}
                        </span>
                    </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Initiated By</span>
                        <span className="text-sm text-gray-900">{selectedProcess.initiatedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Initiated At</span>
                        <span className="text-sm text-gray-900">
                          {selectedProcess.initiatedAt instanceof Date 
                            ? selectedProcess.initiatedAt.toLocaleDateString() 
                            : new Date(selectedProcess.initiatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                  <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Additional Information</h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Exit Reason</p>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">{selectedProcess.reason}</p>
                      </div>
                    </div>
                    {selectedProcess.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-900">{selectedProcess.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checklist Progress */}
                {selectedProcess.checklist && selectedProcess.checklist.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Checklist Progress</h5>
                    <div className="space-y-2">
                      {selectedProcess.checklist.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center",
                              item.status === 'completed' ? "bg-green-100" : 
                              item.status === 'in_progress' ? "bg-yellow-100" : "bg-gray-100"
                            )}>
                              {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-600" />}
                              {item.status === 'in_progress' && <Clock className="w-3 h-3 text-yellow-600" />}
                              {item.status === 'pending' && <div className="w-2 h-2 bg-gray-400 rounded-full" />}
              </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.task}</p>
                              <p className="text-xs text-gray-500">{item.category} • {item.assignedTo}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            item.status === 'completed' ? "bg-green-100 text-green-800" :
                            item.status === 'in_progress' ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                          )}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Exit Process</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.employeeId || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
                    <input
                      type="text"
                      value={formData.employeeName || ''}
                      onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.employeeName || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter employee name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Email *</label>
                    <input
                      type="email"
                      value={formData.employeeEmail || ''}
                      onChange={(e) => setFormData({ ...formData, employeeEmail: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        /.+@.+\..+/.test((formData.employeeEmail || '').trim()) ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter employee email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.employeeDepartment || ''}
                      onChange={(e) => setFormData({ ...formData, employeeDepartment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter department"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exit Date</label>
                    <input
                    type="date"
                      value={formData.exitDate ? (formData.exitDate instanceof Date ? formData.exitDate.toISOString().split('T')[0] : new Date(formData.exitDate).toISOString().split('T')[0]) : ''}
                      onChange={(e) => setFormData({ ...formData, exitDate: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority || 'medium'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter exit reason"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProcess}
                disabled={!isFormValid}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  isFormValid
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                )}
              >
                Update Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the exit process for <strong>{selectedProcess.employeeName}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
              </button>
              <button
                onClick={confirmDeleteProcess}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitProcess;
