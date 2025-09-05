import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  CheckCircle, 
  X,
  AlertCircle,
  Eye,
  Edit,
  Download,
  FileText,
  UserCheck,
  Settings,
  UserPlus,
  Trash2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import firebaseService from '@/services/firebaseService';
import { useUser } from '@/stores/authStore';
import { showNotification } from '@/utils/notification';
import { showCustomConfirmDialog } from '@/utils/customConfirmDialog';

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
  id: string;
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

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  status: string;
}

interface LeaveTemplate {
  id: string;
  name: string;
  description: string;
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

  // State for Firebase data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Modal states
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showViewBalanceModal, setShowViewBalanceModal] = useState(false);
  
  // Get current user for admin checks
  const user = useUser();

  // Form state for new leave request
  const [newRequest, setNewRequest] = useState({
    employeeId: '',
    employeeName: '',
    leaveType: 'annual' as const,
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Form state for leave balance management (admin only)
  const [newBalance, setNewBalance] = useState({
    employeeId: '',
    employeeName: '',
    annual: 25,
    sick: 10,
    personal: 5,
    maternity: 0,
    paternity: 0,
    bereavement: 0,
    unpaid: 0
  });

  // Admin modal states
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);
  const [balanceToDelete, setBalanceToDelete] = useState<LeaveBalance | null>(null);
  const [showDeleteBalanceDialog, setShowDeleteBalanceDialog] = useState(false);
  const [viewingBalance, setViewingBalance] = useState<LeaveBalance | null>(null);

  // Leave template state
  const [leaveTemplates] = useState<LeaveTemplate[]>([
    {
      id: 'standard',
      name: 'Standard Employee',
      description: 'Standard leave allocation for new employees',
      annual: 25,
      sick: 10,
      personal: 5,
      maternity: 0,
      paternity: 0,
      bereavement: 0,
      unpaid: 0
    },
    {
      id: 'senior',
      name: 'Senior Employee (5+ years)',
      description: 'Enhanced leave allocation for senior employees',
      annual: 30,
      sick: 12,
      personal: 7,
      maternity: 0,
      paternity: 0,
      bereavement: 0,
      unpaid: 0
    },
    {
      id: 'executive',
      name: 'Executive Level',
      description: 'Premium leave allocation for executive positions',
      annual: 35,
      sick: 15,
      personal: 10,
      maternity: 0,
      paternity: 0,
      bereavement: 0,
      unpaid: 0
    }
  ]);

  // Selected template for application
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Employee fetching function
  const fetchEmployees = async () => {
    try {
      const result = await firebaseService.getCollection<any>('users');
      if (result.success && result.data) {
        const emps = result.data.map((u: any) => ({
          id: u.employeeId || u.id,
          employeeId: u.employeeId || u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName || u.email || 'Employee',
          department: u.department || 'General',
          position: u.position || '',
          status: u.status || 'active'
        })) as Employee[];
        setEmployees(emps);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

     // Template application function
   const applyTemplateToEmployees = async () => {
     if (!selectedTemplate || selectedEmployees.length === 0) {
       alert('Please select a template and employees');
       return;
     }

     const template = leaveTemplates.find(t => t.id === selectedTemplate);
     if (!template) return;

     try {
       let updatedCount = 0;
       let createdCount = 0;

       for (const employeeId of selectedEmployees) {
         const employee = employees.find(emp => emp.id === employeeId);
         if (employee) {
           const balanceData = {
             employeeId: employee.employeeId,
             employeeName: employee.name,
             annual: template.annual,
             sick: template.sick,
             personal: template.personal,
             maternity: template.maternity,
             paternity: template.paternity,
             bereavement: template.bereavement,
             unpaid: template.unpaid,
             updatedAt: new Date().toISOString()
           };

                       // Check if balance already exists - must match BOTH employeeId AND employeeName exactly
            const existingBalance = leaveBalances.find(b => 
              b.employeeId === employee.employeeId && b.employeeName === employee.name
            );
           if (existingBalance) {
             // Update existing balance
             await firebaseService.updateDocument('leaveBalances', existingBalance.id, balanceData);
             updatedCount++;
           } else {
             // Create new balance
             await firebaseService.addDocument('leaveBalances', {
               ...balanceData,
               createdAt: new Date().toISOString()
             });
             createdCount++;
           }
         }
       }

       // Refresh balances and close modal
       fetchLeaveBalances();
       setShowEmployeeModal(false);
       setSelectedTemplate('');
       setSelectedEmployees([]);
       
               const message = `Template Applied Successfully!\n\n✅ Updated: ${updatedCount} employee(s)\n✅ Created: ${createdCount} new balance(s)`;
        showNotification(message, 'success');
     } catch (error) {
       console.error('Error applying template:', error);
       alert('Error applying template');
     }
   };

  // Admin functions for leave balance management
  const handleCreateLeaveBalance = async () => {
    if (!newBalance.employeeId || !newBalance.employeeName) return;
    
    try {
      // Check if balance already exists for this employee
      const existingBalance = leaveBalances.find(b => 
        b.employeeId === newBalance.employeeId && b.employeeName === newBalance.employeeName
      );
      
      if (existingBalance) {
        // Show custom confirmation dialog instead of basic confirm()
        const shouldUpdate = await showCustomConfirmDialog(
          `A leave balance already exists for ${newBalance.employeeName} (${newBalance.employeeId})`,
          `Current balance:\n` +
          `Annual: ${existingBalance.annual} days\n` +
          `Sick: ${existingBalance.sick} days\n` +
          `Personal: ${existingBalance.personal} days\n` +
          `Maternity: ${existingBalance.maternity} days\n` +
          `Paternity: ${existingBalance.paternity} days\n` +
          `Bereavement: ${existingBalance.bereavement} days\n` +
          `Unpaid: ${existingBalance.unpaid} days\n\n` +
          `Do you want to update the existing balance instead of creating a duplicate?`
        );

        if (shouldUpdate) {
          // Update existing balance
          const updatedData = {
            ...newBalance,
            updatedAt: new Date().toISOString()
          };

          const result = await firebaseService.updateDocument('leaveBalances', existingBalance.id, updatedData);
          if (result.success) {
            showNotification(`Successfully updated leave balance for ${newBalance.employeeName}`, 'success');
            setNewBalance({
              employeeId: '',
              employeeName: '',
              annual: 25,
              sick: 10,
              personal: 5,
              maternity: 0,
              paternity: 0,
              bereavement: 0,
              unpaid: 0
            });
            setShowBalanceModal(false);
            // Refresh balances
            fetchLeaveBalances();
          }
        }
        return; // Exit function
      }
      
      // No existing balance found, create new one
      const balanceData = {
        ...newBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const result = await firebaseService.addDocument('leaveBalances', balanceData);
      if (result.success) {
        alert(`Successfully created new leave balance for ${newBalance.employeeName}`);
        setNewBalance({
          employeeId: '',
          employeeName: '',
          annual: 25,
          sick: 10,
          personal: 5,
          maternity: 0,
          paternity: 0,
          bereavement: 0,
          unpaid: 0
        });
        setShowBalanceModal(false);
        // Refresh balances
        fetchLeaveBalances();
      }
    } catch (error) {
      console.error('Error creating/updating leave balance:', error);
      alert('Error creating/updating leave balance');
    }
  };

     const handleEditBalance = (balance: LeaveBalance) => {
     setEditingBalance(balance);
     setNewBalance({
       employeeId: balance.employeeId,
       employeeName: balance.employeeName,
       annual: balance.annual,
       sick: balance.sick,
       personal: balance.personal,
       maternity: balance.maternity,
       paternity: balance.paternity,
       bereavement: balance.bereavement,
       unpaid: balance.unpaid
     });
     setShowBalanceModal(true);
   };

   const handleViewBalance = (balance: LeaveBalance) => {
     // For view, use the separate view modal
     setViewingBalance(balance);
     setShowViewBalanceModal(true);
   };

  // Handle employee selection change in balance modal
  const handleEmployeeSelectionChange = (employeeId: string) => {
    const selectedEmp = employees.find(emp => emp.employeeId === employeeId);
    if (selectedEmp) {
      setNewBalance({
        ...newBalance,
        employeeId: selectedEmp.employeeId,
        employeeName: selectedEmp.name
      });
    }
  };

  const handleUpdateBalance = async () => {
    if (!editingBalance) return;
    
    try {
      const updatedData = {
        ...newBalance,
        updatedAt: new Date().toISOString()
      };
      
      const result = await firebaseService.updateDocument('leaveBalances', editingBalance.id, updatedData);
      if (result.success) {
        setEditingBalance(null);
        setShowBalanceModal(false);
        setNewBalance({
          employeeId: '',
          employeeName: '',
          annual: 25,
          sick: 10,
          personal: 5,
          maternity: 0,
          paternity: 0,
          bereavement: 0,
          unpaid: 0
        });
        // Refresh balances
        fetchLeaveBalances();
      }
    } catch (error) {
      console.error('Error updating leave balance:', error);
    }
  };

  const handleDeleteBalance = async (balanceId: string) => {
    const balance = leaveBalances.find(b => b.id === balanceId);
    if (balance) {
      setBalanceToDelete(balance);
      setShowDeleteBalanceDialog(true);
    }
  };

  // Utility functions
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

  const generateCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Submitted Date', 'Reason'];
    const rows = leaveRequests.map(request => [
      request.employeeId,
      request.employeeName,
      request.leaveType,
      request.startDate,
      request.endDate,
      request.totalDays,
      request.status,
      request.submittedDate,
      request.reason
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  const handleCreateLeaveRequest = async () => {
    if (!newRequest.employeeId || !newRequest.employeeName || !newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const startDate = new Date(newRequest.startDate);
      const endDate = new Date(newRequest.endDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const leaveRequest = {
        employeeId: newRequest.employeeId,
        employeeName: newRequest.employeeName,
        leaveType: newRequest.leaveType,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        totalDays,
        reason: newRequest.reason,
        status: 'pending' as const,
        submittedDate: new Date().toISOString().split('T')[0]
      };

      const result = await firebaseService.addDocument('leaveRequests', leaveRequest);
      if (result.success) {
        // Reset form and close modal
        setNewRequest({
          employeeId: '',
          employeeName: '',
          leaveType: 'annual',
          startDate: '',
          endDate: '',
          reason: ''
        });
        setShowNewRequestModal(false);
        
        // Refresh the leave requests
        const updatedResult = await firebaseService.getCollection('leaveRequests');
        if (updatedResult.success && updatedResult.data) {
          const requests: LeaveRequest[] = updatedResult.data.map((doc: any) => ({
            id: doc.id || doc['id'],
            employeeId: doc.employeeId || '',
            employeeName: doc.employeeName || '',
            leaveType: doc.leaveType || 'annual',
            startDate: doc.startDate || '',
            endDate: doc.endDate || '',
            totalDays: doc.totalDays || 0,
            reason: doc.reason || '',
            status: doc.status || 'pending',
            submittedDate: doc.submittedDate || '',
            approvedBy: doc.approvedBy,
            approvedDate: doc.approvedDate,
            notes: doc.notes
          }));
          setLeaveRequests(requests);
        }
      } else {
        alert('Failed to create leave request');
      }
    } catch (error) {
      console.error('Error creating leave request:', error);
      alert('Error creating leave request');
    }
  };

  // Data fetching functions
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const result = await firebaseService.getCollection('leaveRequests');
      if (result.success && result.data) {
        const requests: LeaveRequest[] = result.data.map((doc: any) => ({
          id: doc.id || doc['id'],
          employeeId: doc.employeeId || '',
          employeeName: doc.employeeName || '',
          leaveType: doc.leaveType || 'annual',
          startDate: doc.startDate || '',
          endDate: doc.endDate || '',
          totalDays: doc.totalDays || 0,
          reason: doc.reason || '',
          status: doc.status || 'pending',
          submittedDate: doc.submittedDate || '',
          approvedBy: doc.approvedBy,
          approvedDate: doc.approvedDate,
          notes: doc.notes
        }));
        setLeaveRequests(requests);
      }
    } catch (err) {
      setError('Failed to fetch leave requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);
      const result = await firebaseService.getCollection('leaveBalances');
      if (result.success && result.data) {
        const balances: LeaveBalance[] = result.data.map((doc: any) => ({
          id: doc.id || doc['id'],
          employeeId: doc.employeeId || '',
          employeeName: doc.employeeName || '',
          annual: doc.annual || 0,
          sick: doc.sick || 0,
          personal: doc.personal || 0,
          maternity: doc.maternity || 0,
          paternity: doc.paternity || 0,
          bereavement: doc.bereavement || 0,
          unpaid: doc.unpaid || 0
        }));
        setLeaveBalances(balances);
      }
    } catch (err) {
      setError('Failed to fetch leave balances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Data fetching
  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveBalances();
    fetchEmployees();
  }, []);

  // Computed values
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(request => {
      const matchesSearch = searchQuery === '' || 
        request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = leaveTypeFilter === 'all' || request.leaveType === leaveTypeFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        const startDate = new Date(request.startDate);
        
        switch (dateFilter) {
          case 'this-week': {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            matchesDate = startDate >= weekStart && startDate <= weekEnd;
            break;
          }
          case 'this-month': {
            matchesDate = startDate.getMonth() === today.getMonth() && 
                        startDate.getFullYear() === today.getFullYear();
            break;
          }
          case 'next-month': {
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            matchesDate = startDate.getMonth() === nextMonth.getMonth() && 
                        startDate.getFullYear() === nextMonth.getFullYear();
            break;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [leaveRequests, searchQuery, statusFilter, leaveTypeFilter, dateFilter]);

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

  const confirmDeleteBalance = async () => {
    if (!balanceToDelete) return;
    
    try {
      const result = await firebaseService.deleteDocument('leaveBalances', balanceToDelete.id);
      if (result.success) {
        // Refresh the data
        fetchLeaveBalances();
        setShowDeleteBalanceDialog(false);
        setBalanceToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting balance:', error);
      alert('Error deleting balance');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage employee leave requests, approvals, and balances</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => setShowNewRequestModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          {/* Admin-only header buttons */}
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={() => setShowBalanceModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Manage Balances</span>
              </button>
              <button 
                onClick={() => setShowEmployeeModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Leave Templates</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leave data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Content - only show when not loading and no errors */}
      {!loading && !error && (
        <>
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
                  {leaveRequests.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No leave requests found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setShowNewRequestModal(true)}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <Plus className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 text-center">New Request</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowApprovalModal(true)}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <UserCheck className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 text-center">Approve Requests</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowCalendarModal(true)}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <Calendar className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 text-center">View Calendar</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <Download className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 text-center">Export Report</span>
                  </button>

                  {/* Admin-only Quick Actions */}
                  {user?.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => setShowBalanceModal(true)}
                        className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <UserPlus className="w-8 h-8 text-green-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900 text-center">Manage Balances</span>
                      </button>
                      
                      <button 
                        onClick={() => setShowEmployeeModal(true)}
                        className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <Settings className="w-8 h-8 text-purple-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900 text-center">Leave Templates</span>
                      </button>
                    </>
                  )}
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
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
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
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
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
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                       aria-label="Filter by date"
                     >
                       <option value="all">All Dates</option>
                       <option value="this-week">This Week</option>
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
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Employees</p>
                      <p className="text-2xl font-bold text-gray-900">{leaveBalances.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Avg Annual Days</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {leaveBalances.length > 0 
                          ? Math.round(leaveBalances.reduce((sum, b) => sum + b.annual, 0) / leaveBalances.length)
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Avg Sick Days</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {leaveBalances.length > 0 
                          ? Math.round(leaveBalances.reduce((sum, b) => sum + b.sick, 0) / leaveBalances.length)
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Leave Days</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {leaveBalances.reduce((sum, b) => 
                          sum + b.annual + b.sick + b.personal + b.maternity + b.paternity + b.bereavement, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Management Header */}
              {user?.role === 'admin' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Leave Balance Management</h3>
                      <p className="text-sm text-gray-600">Manage employee leave allocations and balances</p>
                    </div>
                    <div className="flex space-x-3">
                                             <button
                         onClick={() => setShowBalanceModal(true)}
                         className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                       >
                         <UserPlus className="w-4 h-4 mr-2" />
                         Add New Balance
                       </button>
                      <button
                        onClick={() => setShowEmployeeModal(true)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Templates
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Balances Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Leave Balances</h3>
                  <p className="text-sm text-gray-600">Current leave balances for all employees</p>
                </div>
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
                                 onClick={() => handleViewBalance(balance)}
                                 className="text-blue-600 hover:text-blue-900"
                                 title="View balance details"
                                 aria-label="View balance details"
                               >
                                 <Eye className="w-4 h-4" />
                               </button>
                              {user?.role === 'admin' && (
                                <>
                                  <button 
                                    onClick={() => handleEditBalance(balance)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Edit balance"
                                    aria-label="Edit balance"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteBalance(balance.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete balance"
                                    aria-label="Delete balance"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Empty State */}
                {leaveBalances.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leave balances found</h3>
                    <p className="text-gray-600">
                      Employee leave balances will appear here once they are added to the system.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Calendar</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calendar Navigation */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Calendar Controls</h4>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors">
                        Month View
                      </button>
                      <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                        Week View
                      </button>
                      <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                        Day View
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>• Click on any date to view leave details</p>
                      <p>• Hover over dates to see employee names</p>
                      <p>• Use filters to show specific leave types</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">This Month</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-600">Approved Leave</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {leaveRequests.filter(r => r.status === 'approved' && 
                            new Date(r.startDate).getMonth() === new Date().getMonth()).length}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-600">Pending Requests</p>
                        <p className="text-lg font-semibold text-yellow-900">
                          {leaveRequests.filter(r => r.status === 'pending').length}
                        </p>
                      </div>
                    </div>
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
                  {leaveRequests.filter(r => r.status === 'approved' && new Date(r.startDate) > new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming leave scheduled.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Action Modals */}
      
      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">New Leave Request</h3>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close new request modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateLeaveRequest(); }} className="space-y-4">
              <div>
                <label htmlFor="employeeSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee *
                </label>
                                 <select
                   id="employeeSelect"
                   value={newRequest.employeeId}
                   onChange={(e) => {
                     const selectedEmp = employees.find(emp => emp.id === e.target.value);
                     if (selectedEmp) {
                       setNewRequest({
                         ...newRequest,
                         employeeId: selectedEmp.employeeId,
                         employeeName: selectedEmp.name
                       });
                     }
                   }}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                   required
                 >
                   <option value="" className="text-gray-500">Select an employee...</option>
                   {employees.map((emp) => (
                     <option key={emp.id} value={emp.id} className="text-gray-900 bg-white">
                       {emp.employeeId} - {emp.name} ({emp.department})
                     </option>
                   ))}
                 </select>
              </div>

              <div>
                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type *
                </label>
                                 <select
                   id="leaveType"
                   value={newRequest.leaveType}
                   onChange={(e) => setNewRequest({...newRequest, leaveType: e.target.value as any})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                   required
                 >
                   <option value="annual">Annual Leave</option>
                   <option value="sick">Sick Leave</option>
                   <option value="personal">Personal Leave</option>
                   <option value="maternity">Maternity Leave</option>
                   <option value="paternity">Paternity Leave</option>
                   <option value="bereavement">Bereavement Leave</option>
                   <option value="unpaid">Unpaid Leave</option>
                 </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({...newRequest, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <textarea
                  id="reason"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Please provide a reason for your leave request..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Other modals placeholder */}
      <div className="text-gray-600 text-center py-4">
        <p>Other modals (Approval, Calendar, Export) will be implemented next...</p>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Approve Requests</h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close approval modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Pending Leave Requests</h4>
              
              {leaveRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending leave requests at the moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.filter(r => r.status === 'pending').map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{request.employeeName}</h5>
                          <p className="text-sm text-gray-500">ID: {request.employeeId}</p>
                        </div>
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                          getLeaveTypeColor(request.leaveType)
                        )}>
                          {request.leaveType}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Start Date: {request.startDate}</p>
                          <p className="text-sm text-gray-600">End Date: {request.endDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Days: {request.totalDays}</p>
                          <p className="text-sm text-gray-600">Submitted: {request.submittedDate}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600"><strong>Reason:</strong></p>
                        <p className="text-sm text-gray-800">{request.reason}</p>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              const result = await firebaseService.updateDocument('leaveRequests', request.id, {
                                status: 'approved',
                                approvedBy: 'Admin',
                                approvedDate: new Date().toISOString().split('T')[0] || ''
                              });
                              if (result.success) {
                                // Refresh the data
                                const updatedResult = await firebaseService.getCollection('leaveRequests');
                                if (updatedResult.success && updatedResult.data) {
                                  const requests: LeaveRequest[] = updatedResult.data.map((doc: any) => ({
                                    id: doc.id || doc['id'],
                                    employeeId: doc.employeeId || '',
                                    employeeName: doc.employeeName || '',
                                    leaveType: doc.leaveType || 'annual',
                                    startDate: doc.startDate || '',
                                    endDate: doc.endDate || '',
                                    totalDays: doc.totalDays || 0,
                                    reason: doc.reason || '',
                                    status: doc.status || 'pending',
                                    submittedDate: doc.submittedDate || '',
                                    approvedBy: doc.approvedBy,
                                    approvedDate: doc.approvedDate,
                                    notes: doc.notes
                                  }));
                                  setLeaveRequests(requests);
                                }
                              }
                            } catch (error) {
                              console.error('Error approving request:', error);
                              alert('Error approving request');
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const result = await firebaseService.updateDocument('leaveRequests', request.id, {
                                status: 'rejected'
                              });
                              if (result.success) {
                                // Refresh the data
                                const updatedResult = await firebaseService.getCollection('leaveRequests');
                                if (updatedResult.success && updatedResult.data) {
                                  const requests: LeaveRequest[] = updatedResult.data.map((doc: any) => ({
                                    id: doc.id || doc['id'],
                                    employeeId: doc.employeeId || '',
                                    employeeName: doc.employeeName || '',
                                    leaveType: doc.leaveType || 'annual',
                                    startDate: doc.startDate || '',
                                    endDate: doc.endDate || '',
                                    totalDays: doc.totalDays || 0,
                                    reason: doc.reason || '',
                                    status: doc.status || 'pending',
                                    submittedDate: doc.submittedDate || '',
                                    approvedBy: doc.approvedBy,
                                    approvedDate: doc.approvedDate,
                                    notes: doc.notes
                                  }));
                                  setLeaveRequests(requests);
                                }
                              }
                            } catch (error) {
                              console.error('Error rejecting request:', error);
                              alert('Error rejecting request');
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Leave Calendar</h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close calendar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Leave Schedule</h4>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors">
                    Month View
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                    Week View
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                    Day View
                  </button>
                </div>
              </div>

              {/* Approved Leave List */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">Approved Leave Requests</h5>
                {leaveRequests.filter(r => r.status === 'approved').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No approved leave requests found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.filter(r => r.status === 'approved').map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h6 className="font-medium text-gray-900">{request.employeeName}</h6>
                            <p className="text-sm text-gray-500">
                              {request.startDate} to {request.endDate} ({request.totalDays} days)
                            </p>
                          </div>
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                            getLeaveTypeColor(request.leaveType)
                          )}>
                            {request.leaveType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Leave */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">Upcoming Leave</h5>
                {leaveRequests
                  .filter(r => r.status === 'approved' && new Date(r.startDate) > new Date())
                  .length === 0 ? (
                  <p className="text-gray-600">No upcoming leave scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {leaveRequests
                      .filter(r => r.status === 'approved' && new Date(r.startDate) > new Date())
                      .slice(0, 5)
                      .map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm text-gray-900">{request.employeeName}</span>
                          <span className="text-sm text-gray-600">
                            {request.startDate} ({request.leaveType})
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Export Report</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close export modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <Download className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Export Leave Data</h4>
                <p className="text-gray-600 mb-6">
                  Download leave reports in various formats and date ranges.
                </p>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                                     <select 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                     aria-label="Select report type"
                   >
                     <option value="all">All Leave Requests</option>
                     <option value="pending">Pending Requests</option>
                     <option value="approved">Approved Requests</option>
                     <option value="rejected">Rejected Requests</option>
                     <option value="balances">Leave Balances</option>
                   </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                     <select 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                     aria-label="Select date range"
                   >
                     <option value="all">All Time</option>
                     <option value="this-month">This Month</option>
                     <option value="last-month">Last Month</option>
                     <option value="this-quarter">This Quarter</option>
                     <option value="this-year">This Year</option>
                   </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <div className="flex space-x-3">
                    <label className="flex items-center">
                      <input type="radio" name="format" value="csv" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-700">CSV</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="format" value="pdf" className="mr-2" />
                      <span className="text-sm text-gray-700">PDF</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="format" value="excel" className="mr-2" />
                      <span className="text-sm text-gray-700">Excel</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Generate and download CSV
                    const csvContent = generateCSV();
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `leave-report-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    setShowExportModal(false);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Leave Balance Management Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingBalance ? 'Edit Leave Balance' : 'Add New Leave Balance'}
              </h3>
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setEditingBalance(null);
                  setNewBalance({
                    employeeId: '',
                    employeeName: '',
                    annual: 25,
                    sick: 10,
                    personal: 5,
                    maternity: 0,
                    paternity: 0,
                    bereavement: 0,
                    unpaid: 0
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close balance modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <UserPlus className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {editingBalance ? 'Update Employee Leave Balance' : 'Set Employee Leave Allocation'}
                </h4>
                <p className="text-gray-600">
                  {editingBalance 
                    ? 'Modify the leave balance for this employee.' 
                    : 'Define the initial leave allocation for a new employee.'
                  }
                </p>
              </div>

                             {/* Balance Form */}
               <form onSubmit={(e) => { e.preventDefault(); editingBalance ? handleUpdateBalance() : handleCreateLeaveBalance(); }} className="space-y-4">
                 <div>
                   <label htmlFor="balanceEmployeeSelect" className="block text-sm font-medium text-gray-700 mb-1">
                     Select Employee *
                   </label>
                   <select
                     id="balanceEmployeeSelect"
                     value={newBalance.employeeId}
                     onChange={(e) => handleEmployeeSelectionChange(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                     required
                     disabled={!!editingBalance}
                   >
                     <option value="" className="text-gray-500">Select an employee...</option>
                     {employees.map((emp) => (
                       <option key={emp.id} value={emp.employeeId} className="text-gray-900 bg-white">
                         {emp.employeeId} - {emp.name} ({emp.department})
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* Current Balance Display (when editing) */}
                 {editingBalance && (
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                     <h5 className="font-medium text-blue-900 mb-3">Current Leave Balance</h5>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                       <div><span className="font-medium">Annual:</span> {editingBalance.annual} days</div>
                       <div><span className="font-medium">Sick:</span> {editingBalance.sick} days</div>
                       <div><span className="font-medium">Personal:</span> {editingBalance.personal} days</div>
                       <div><span className="font-medium">Maternity:</span> {editingBalance.maternity} days</div>
                       <div><span className="font-medium">Paternity:</span> {editingBalance.paternity} days</div>
                       <div><span className="font-medium">Bereavement:</span> {editingBalance.bereavement} days</div>
                       <div><span className="font-medium">Unpaid:</span> {editingBalance.unpaid} days</div>
                     </div>
                   </div>
                 )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="annual" className="block text-sm font-medium text-gray-700 mb-1">Annual</label>
                    <input
                      type="number"
                      id="annual"
                      value={newBalance.annual}
                      onChange={(e) => setNewBalance({...newBalance, annual: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="sick" className="block text-sm font-medium text-gray-700 mb-1">Sick</label>
                    <input
                      type="number"
                      id="sick"
                      value={newBalance.sick}
                      onChange={(e) => setNewBalance({...newBalance, sick: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="personal" className="block text-sm font-medium text-gray-700 mb-1">Personal</label>
                    <input
                      type="number"
                      id="personal"
                      value={newBalance.personal}
                      onChange={(e) => setNewBalance({...newBalance, personal: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="maternity" className="block text-sm font-medium text-gray-700 mb-1">Maternity</label>
                    <input
                      type="number"
                      id="maternity"
                      value={newBalance.maternity}
                      onChange={(e) => setNewBalance({...newBalance, maternity: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="paternity" className="block text-sm font-medium text-gray-700 mb-1">Paternity</label>
                    <input
                      type="number"
                      id="paternity"
                      value={newBalance.paternity}
                      onChange={(e) => setNewBalance({...newBalance, paternity: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="bereavement" className="block text-sm font-medium text-gray-700 mb-1">Bereavement</label>
                    <input
                      type="number"
                      id="bereavement"
                      value={newBalance.bereavement}
                      onChange={(e) => setNewBalance({...newBalance, bereavement: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="unpaid" className="block text-sm font-medium text-gray-700 mb-1">Unpaid</label>
                    <input
                      type="number"
                      id="unpaid"
                      value={newBalance.unpaid}
                      onChange={(e) => setNewBalance({...newBalance, unpaid: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                                 <div className="flex justify-end space-x-3 pt-4">
                   <button
                     type="button"
                     onClick={() => {
                       setShowBalanceModal(false);
                       setEditingBalance(null);
                       setNewBalance({
                         employeeId: '',
                         employeeName: '',
                         annual: 25,
                         sick: 10,
                         personal: 5,
                         maternity: 0,
                         paternity: 0,
                         bereavement: 0,
                         unpaid: 0
                       });
                     }}
                     className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 shadow-sm"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border border-blue-700 shadow-sm font-medium"
                   >
                     {editingBalance ? 'Update Balance' : 'Create Balance'}
                   </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Employee Management Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Employee Leave Management</h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close employee modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <Settings className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Leave Balance Templates</h4>
                <p className="text-gray-600">Manage standard leave allocation templates for different employee levels</p>
              </div>

              {/* Template Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                                     <select
                     value={selectedTemplate}
                     onChange={(e) => setSelectedTemplate(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                     aria-label="Select leave template"
                   >
                     <option value="" className="text-gray-500">Choose a template...</option>
                     {leaveTemplates.map((template) => (
                       <option key={template.id} value={template.id} className="text-gray-900 bg-white">
                         {template.name}
                       </option>
                     ))}
                   </select>
                </div>

                {/* Template Details */}
                {selectedTemplate && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-3">
                      {leaveTemplates.find(t => t.id === selectedTemplate)?.name}
                    </h5>
                    <p className="text-sm text-blue-700 mb-3">
                      {leaveTemplates.find(t => t.id === selectedTemplate)?.description}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div><span className="font-medium">Annual:</span> {leaveTemplates.find(t => t.id === selectedTemplate)?.annual} days</div>
                      <div><span className="font-medium">Sick:</span> {leaveTemplates.find(t => t.id === selectedTemplate)?.sick} days</div>
                      <div><span className="font-medium">Personal:</span> {leaveTemplates.find(t => t.id === selectedTemplate)?.personal} days</div>
                      <div><span className="font-medium">Other:</span> 0 days</div>
                    </div>
                  </div>
                )}

                                 {/* Employee Selection */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Employees <span className="text-gray-500 text-xs">(Hold Ctrl/Cmd to select multiple)</span>
                  </label>
                  <select
                    multiple
                    value={selectedEmployees}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedEmployees(selectedOptions);
                    }}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm min-h-[140px] max-h-[200px] overflow-y-auto"
                    aria-label="Select employees for template application"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id} className="text-gray-900 bg-white py-2 px-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 cursor-pointer">
                        {emp.name} ({emp.employeeId}) - {emp.department}
                      </option>
                    ))}
                  </select>
                  {selectedEmployees.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedEmployees.length} employee(s)
                    </p>
                  )}
                 </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                                 <button
                   onClick={applyTemplateToEmployees}
                   disabled={!selectedTemplate || selectedEmployees.length === 0}
                   className="px-4 py-2 bg-blue-600 text-white !text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:text-white disabled:opacity-90 disabled:cursor-not-allowed relative border border-blue-700 shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                   title={!selectedTemplate || selectedEmployees.length === 0 ? "Please select a template and employees first" : "Apply the selected template to selected employees"}
                 >
                   Apply Template to Selected
                   {(!selectedTemplate || selectedEmployees.length === 0) && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                       !
                     </span>
                   )}
                 </button>
                {(!selectedTemplate || selectedEmployees.length === 0) && (
                  <p className="text-sm text-amber-600 mt-2 text-center">
                    ⚠️ Please select a template and at least one employee to enable this button
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Balance Confirmation Dialog */}
      {showDeleteBalanceDialog && balanceToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Delete Leave Balance</h3>
              <button
                onClick={() => setShowDeleteBalanceDialog(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close delete dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Are you sure?</h4>
              <p className="text-gray-600">
                You are about to delete the leave balance for <span className="font-medium">{balanceToDelete.employeeName}</span>.
              </p>
              <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteBalanceDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBalance}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Balance Modal */}
      {showViewBalanceModal && viewingBalance && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">View Leave Balance</h3>
              <button
                onClick={() => setShowViewBalanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close view balance modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Leave Balance Details</h4>
                <p className="text-gray-600">
                  {viewingBalance.employeeName}&apos;s current leave balance.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="font-medium">Annual:</span> {viewingBalance.annual} days</div>
                <div><span className="font-medium">Sick:</span> {viewingBalance.sick} days</div>
                <div><span className="font-medium">Personal:</span> {viewingBalance.personal} days</div>
                <div><span className="font-medium">Maternity:</span> {viewingBalance.maternity} days</div>
                <div><span className="font-medium">Paternity:</span> {viewingBalance.paternity} days</div>
                <div><span className="font-medium">Bereavement:</span> {viewingBalance.bereavement} days</div>
                <div><span className="font-medium">Unpaid:</span> {viewingBalance.unpaid} days</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
