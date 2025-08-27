import React, { useEffect, useMemo, useState } from 'react';
import { 
  Clock, 
  Search, 
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
  Trash2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { collection, onSnapshot, query, orderBy, limit as fsLimit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import firebaseService from '../services/firebaseService';
import type { User } from '../types';
import { useUser } from '@/stores/authStore';

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
  const user = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'employees' | 'reports'>('overview');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Quick Actions state
  const [showClockDialog, setShowClockDialog] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [clockAction, setClockAction] = useState<'in' | 'out'>('in');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Admin: Add attendance record dialog state
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const [newAttendance, setNewAttendance] = useState<{
    employeeId: string;
    employeeName: string;
    date: string;
    clockIn: string;
    clockOut: string;
    status: AttendanceRecord['status'];
    location: string;
    notes: string;
  }>({
    employeeId: '',
    employeeName: '',
    date: new Date().toISOString().split('T')[0] || '',
    clockIn: '',
    clockOut: '',
      status: 'present',
      location: 'Main Office',
    notes: ''
  });

  // Dialog state for view/edit/delete
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editRecord, setEditRecord] = useState<Partial<AttendanceRecord> | null>(null);
  
  const [showViewEmployeeDialog, setShowViewEmployeeDialog] = useState(false);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [showDeleteEmployeeDialog, setShowDeleteEmployeeDialog] = useState(false);
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Partial<Employee> | null>(null);

  // Quick Actions functions
  const handleClockInOut = async () => {
    if (!selectedEmployee) return;
    
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const dateString = now.toISOString().split('T')[0];
      
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) return;

      // Check current employee status before allowing clock in/out
      if (clockAction === 'in' && employee.currentStatus === 'clocked-in') {
        setError('Employee is already clocked in. Please clock out first.');
        return;
      }

      if (clockAction === 'out' && employee.currentStatus === 'clocked-out') {
        setError('Employee is already clocked out. Please clock in first.');
        return;
      }

      if (!dateString) return;
      
      const newRecord: Partial<AttendanceRecord> = {
        employeeId: selectedEmployee,
        employeeName: employee.name,
        date: dateString,
      location: 'Main Office',
        status: 'present'
      };

      if (clockAction === 'in') {
        newRecord.clockIn = timeString;
        // Add new record for clock in
        await firebaseService.addDocument('attendance', newRecord);
      } else {
        newRecord.clockOut = timeString;
        // Find existing record to update for clock out
        const existingRecord = attendanceRecords.find(r => 
          r.employeeId === selectedEmployee && r.date === dateString
        );
        if (existingRecord) {
          // Update existing record
          await firebaseService.updateDocument('attendance', existingRecord.id, {
            clockOut: timeString,
            totalHours: calculateHours(existingRecord.clockIn, timeString)
          });
        } else {
          // If no existing record found, create one
          await firebaseService.addDocument('attendance', newRecord);
        }
      }

      // Update employee status
      await firebaseService.updateDocument('users', selectedEmployee, {
        currentStatus: clockAction === 'in' ? 'clocked-in' : 'clocked-out',
        lastClockIn: clockAction === 'in' ? `${dateString} ${timeString}` : (employee.lastClockIn || '')
      });

      // Show success message
      setSuccessMessage(`Successfully ${clockAction === 'in' ? 'clocked in' : 'clocked out'} ${employee.name} at ${timeString}`);
      // Create alert
      try {
        if (db) {
          await addDoc(collection(db, 'alerts'), {
            type: 'attendance',
            message: `${employee.name} ${clockAction === 'in' ? 'clocked in' : 'clocked out'} at ${timeString}`,
            employeeId: employee.id,
            createdAt: serverTimestamp()
          });
        }
      } catch (e) {
        // non-blocking
        console.warn('Failed to create alert', e);
      }
      
      // Clear error if any
      setError('');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowClockDialog(false);
        setSelectedEmployee('');
        setClockAction('in');
        setSuccessMessage('');
        // Reload data
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error clocking in/out:', error);
      setError('Failed to clock in/out');
    }
  };

  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inHour, inMin] = clockIn.replace(/\s*(AM|PM)/i, '').split(':').map(Number);
    const [outHour, outMin] = clockOut.replace(/\s*(AM|PM)/i, '').split(':').map(Number);
    
    const inHourNum = inHour || 0;
    const inMinNum = inMin || 0;
    const outHourNum = outHour || 0;
    const outMinNum = outMin || 0;
    
    let in24 = inHourNum + (clockIn.includes('PM') && inHourNum !== 12 ? 12 : 0);
    let out24 = outHourNum + (clockOut.includes('PM') && outHourNum !== 12 ? 12 : 0);
    
    if (in24 === 12 && clockIn.includes('AM')) in24 = 0;
    if (out24 === 12 && clockOut.includes('AM')) out24 = 0;
    
    const totalMinutes = (out24 * 60 + outMinNum) - (in24 * 60 + inMinNum);
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const handleExportReport = () => {
    const csvContent = [
      ['Employee ID', 'Employee Name', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status', 'Location'],
      ...attendanceRecords.map(record => [
        record.employeeId,
        record.employeeName,
        record.date,
        record.clockIn,
        record.clockOut || '',
        record.totalHours?.toString() || '',
        record.status,
        record.location
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${today}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Admin: Add attendance handler
  const handleAddAttendance = async () => {
    try {
      setError('');
      if (!newAttendance.employeeId || !newAttendance.employeeName || !newAttendance.date || !newAttendance.clockIn) {
        setError('Please fill required fields: employee, date, and clock in time.');
        return;
      }

      const payload: Partial<AttendanceRecord> = {
        employeeId: newAttendance.employeeId,
        employeeName: newAttendance.employeeName,
        date: newAttendance.date,
        clockIn: newAttendance.clockIn,
        clockOut: newAttendance.clockOut || '',
        status: newAttendance.status,
        location: newAttendance.location,
        notes: newAttendance.notes || '',
      };

      // Calculate totalHours if both times provided
      if (payload.clockIn && payload.clockOut) {
        payload.totalHours = calculateHours(payload.clockIn, payload.clockOut);
      }

      const res = await firebaseService.addDocument('attendance', payload);
      if (res.success) {
        // Optimistically update local state
        setAttendanceRecords(prev => [
          {
            id: (res.data && (res.data as any).id) || Math.random().toString(36).slice(2),
            employeeId: payload.employeeId || '',
            employeeName: payload.employeeName || '',
            date: payload.date || '',
            clockIn: payload.clockIn || '',
            clockOut: payload.clockOut || '',
            totalHours: payload.totalHours || 0,
            status: payload.status || 'present',
            location: payload.location || '',
            notes: payload.notes || '',
          } as AttendanceRecord,
          ...prev,
        ]);

        setSuccessMessage('Attendance record added successfully!');
        // Create alert
        try {
          if (db) {
            await addDoc(collection(db, 'alerts'), {
              type: 'attendance',
              message: `${payload.employeeName || 'Employee'} record added for ${payload.date}`,
              employeeId: payload.employeeId || '',
              createdAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Failed to create alert', e);
        }
        setTimeout(() => setSuccessMessage(''), 3000);

        // Reset form and close
        setShowAddRecordDialog(false);
        setNewAttendance(prev => ({
          ...prev,
          employeeId: '',
          employeeName: '',
          clockIn: '',
          clockOut: '',
      status: 'present',
          location: 'Main Office',
          notes: ''
        }));
      } else {
        setError('Failed to add attendance record.');
      }
    } catch (e) {
      console.error('Add attendance error', e);
      setError('Failed to add attendance record.');
    }
  };

  // Record action handlers
  const handleViewRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditRecord({ ...record });
    setShowEditDialog(true);
  };

  const handleDeleteRecord = async (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  // Employee action handlers
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployeeForView(employee);
    setShowViewEmployeeDialog(true);
  };


  const handleDeleteEmployee = async (employee: Employee) => {
    setSelectedEmployeeForView(employee);
    setShowDeleteEmployeeDialog(true);
  };

  // Delete confirmation handlers
  const confirmDeleteRecord = async () => {
    if (!selectedRecord) return;
    
    try {
      await firebaseService.deleteDocument('attendance', selectedRecord.id);
      // Remove from local state
      setAttendanceRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
      setShowDeleteDialog(false);
      setSelectedRecord(null);
      setSuccessMessage('Record deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Failed to delete record. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!selectedEmployeeForView) return;
    
    try {
      await firebaseService.deleteDocument('users', selectedEmployeeForView.id);
      // Remove from local state
      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployeeForView.id));
      setShowDeleteEmployeeDialog(false);
      setSelectedEmployeeForView(null);
      setSuccessMessage('Employee deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError('Failed to delete employee. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Load data from Firebase + realtime alerts
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const attRes = await firebaseService.getCollection<any>('attendance');
        if (attRes.success && attRes.data) {
          const recs = attRes.data.map((r: any) => ({
            id: r.id || r['id'],
            employeeId: r.employeeId || '',
            employeeName: r.employeeName || '',
            date: r.date || '',
            clockIn: r.clockIn || '',
            clockOut: r.clockOut,
            totalHours: r.totalHours,
            status: r.status || 'present',
            location: r.location || '',
            notes: r.notes
          })) as AttendanceRecord[];
          setAttendanceRecords(recs);
        } else {
          setAttendanceRecords([]);
        }

        const empRes = await firebaseService.getCollection<User>('users');
        if (empRes.success && empRes.data) {
          const emps = empRes.data.map((u: any) => ({
            id: u.employeeId || u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName || u.email || 'Employee',
            department: u.department || 'General',
            position: u.position || '',
            status: (u.status as Employee['status']) || 'active',
            lastClockIn: u.lastClockIn,
            currentStatus: (u.currentStatus as Employee['currentStatus']) || 'clocked-out'
          })) as Employee[];
          setEmployees(emps);
        } else {
          setEmployees([]);
        }

        // Realtime alerts from Firestore (collection: alerts)
        if (db) {
          try {
            const alertsRef = collection(db, 'alerts');
            const alertsQ = query(alertsRef, orderBy('createdAt', 'desc'), fsLimit(20));
            const unsub = onSnapshot(alertsQ, (snap) => {
              const realtimeAlerts: string[] = [];
              snap.forEach(doc => {
                const d: any = doc.data();
                const message = d.message || d.title || d.text || '';
                if (message) realtimeAlerts.push(message);
              });
              setAlerts(realtimeAlerts);
            });
            unsubscribes.push(unsub);
          } catch (e) {
            console.warn('Realtime alerts unavailable; falling back to none');
            setAlerts([]);
          }
        } else {
          setAlerts([]);
        }
      } catch (e) {
        console.error('Error loading attendance data', e);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      unsubscribes.forEach(u => {
        try { u(); } catch {}
      });
    };
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const { presentToday, absentToday, lateToday, totalEmployees } = useMemo(() => {
    const todayRecords = attendanceRecords.filter(record => record.date === today);
    return {
      presentToday: todayRecords.filter(record => record.status === 'present').length,
      absentToday: todayRecords.filter(record => record.status === 'absent').length,
      lateToday: todayRecords.filter(record => record.status === 'late').length,
      totalEmployees: employees.length
    };
  }, [attendanceRecords, employees, today]);

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

  // Utility function to get CSS class for dynamic width/height values
  const getProgressWidthClass = (percentage: number): string => {
    const rounded = Math.round(percentage / 10) * 10;
    return `progress-width-${Math.min(100, Math.max(0, rounded))}`;
  };

  const getChartHeightClass = (percentage: number): string => {
    const rounded = Math.round(percentage / 10) * 10;
    return `chart-height-${Math.min(100, Math.max(0, rounded))}`;
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'records', name: 'Records', icon: Clock },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'reports', name: 'Reports', icon: Download }
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track employee attendance, clock in/out, and generate reports</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
           <button 
             onClick={() => {
               setClockAction('in');
               setError('');
               setSuccessMessage('');
               setShowClockDialog(true);
             }}
             className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
           >
            <Plus className="w-4 h-4" />
             <span>Quick Clock In</span>
          </button>
           <button 
            onClick={handleExportReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
           <button 
             onClick={() => setShowAlerts(true)}
             className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
           >
             <AlertCircle className="w-4 h-4" />
             <span>View Alerts</span>
          </button>
        </div>
      </div>

      {/* Content - only show when not loading and no errors */}
      {!loading && !error && (
        <>
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
               {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                   <div className="text-sm text-gray-500">
                     {currentTime.toLocaleDateString('en-US', { 
                       weekday: 'long', 
                       year: 'numeric', 
                       month: 'long', 
                       day: 'numeric' 
                     })}
              </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                   <button 
                     onClick={() => {
                       setClockAction('in');
                       setError('');
                       setSuccessMessage('');
                       setShowClockDialog(true);
                     }}
                     className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-105"
                   >
                     <div className="p-3 bg-primary-100 rounded-full mb-3 group-hover:bg-primary-200 transition-colors">
                       <Clock className="w-8 h-8 text-primary-600" />
                     </div>
                     <span className="text-sm font-medium text-gray-900 text-center">Clock In</span>
                     <span className="text-xs text-gray-500 text-center mt-1">Start work day</span>
                   </button>
                   
                   <button 
                     onClick={() => {
                       setClockAction('out');
                       setError('');
                       setSuccessMessage('');
                       setShowClockDialog(true);
                     }}
                     className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200 transform hover:scale-105"
                   >
                     <div className="p-3 bg-red-100 rounded-full mb-3 group-hover:bg-red-200 transition-colors">
                       <X className="w-8 h-8 text-red-600" />
              </div>
                     <span className="text-sm font-medium text-gray-900 text-center">Clock Out</span>
                     <span className="text-xs text-gray-500 text-center mt-1">End work day</span>
                   </button>
                   
                   <button 
                     onClick={() => setShowCalendarModal(true)}
                     className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-105"
                   >
                     <div className="p-3 bg-blue-100 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
                       <Calendar className="w-8 h-8 text-blue-600" />
              </div>
                     <span className="text-sm font-medium text-gray-900 text-center">View Calendar</span>
                     <span className="text-xs text-gray-500 text-center mt-1">Monthly overview</span>
                   </button>
                   
                   <button 
                     onClick={() => setShowExportModal(true)}
                     className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-105"
                   >
                     <div className="p-3 bg-green-100 rounded-full mb-3 group-hover:bg-green-200 transition-colors">
                       <Download className="w-8 h-8 text-green-600" />
                     </div>
                     <span className="text-sm font-medium text-gray-900 text-center">Export Report</span>
                     <span className="text-xs text-gray-500 text-center mt-1">Download CSV</span>
                   </button>
                   
                   <button 
                     onClick={() => setShowAlertsModal(true)}
                     className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-105"
                   >
                     <div className="p-3 bg-yellow-100 rounded-full mb-3 group-hover:bg-yellow-200 transition-colors">
                       <AlertCircle className="w-8 h-8 text-yellow-600" />
                     </div>
                     <span className="text-sm font-medium text-gray-900 text-center">View Alerts</span>
                     <span className="text-xs text-gray-500 text-center mt-1">Notifications</span>
                   </button>
            </div>
          </div>

               {/* Current Employee Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-6">Current Employee Status</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                     <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                     <div className="text-3xl font-bold text-green-600">
                       {employees.filter(emp => emp.currentStatus === 'clocked-in').length}
                      </div>
                     <div className="text-sm font-medium text-green-700">Currently Working</div>
                     <div className="text-xs text-green-600 mt-1">Clock In</div>
                    </div>
                   <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                     <X className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                     <div className="text-3xl font-bold text-gray-600">
                       {employees.filter(emp => emp.currentStatus === 'clocked-out').length}
                    </div>
                     <div className="text-sm font-medium text-gray-700">Not Working</div>
                     <div className="text-xs text-gray-600 mt-1">Clock Out</div>
                    </div>
                   <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                     <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                     <div className="text-3xl font-bold text-yellow-600">
                       {employees.filter(emp => emp.currentStatus === 'on-break').length}
                  </div>
                     <div className="text-sm font-medium text-yellow-700">On Break</div>
                     <div className="text-xs text-yellow-600 mt-1">Temporary</div>
            </div>
          </div>

                 {/* Employee Status List */}
                 <div className="mt-6">
                   <h4 className="text-md font-medium text-gray-900 mb-4">Employee Status Details</h4>
                   <div className="space-y-3 max-h-64 overflow-y-auto">
                     {employees.map((employee) => (
                       <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                         <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                             <span className="text-sm font-medium text-primary-600">
                               {employee.name.charAt(0).toUpperCase()}
                             </span>
                           </div>
                           <div>
                             <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                             <div className="text-xs text-gray-500">{employee.department} • {employee.position}</div>
                           </div>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCurrentStatusColor(employee.currentStatus)}`}>
                             {(() => {
                               const Icon = getCurrentStatusIcon(employee.currentStatus);
                               return (
                                 <>
                                   <Icon className="w-3 h-3 mr-1" />
                                   {employee.currentStatus.replace('-', ' ')}
                                 </>
                               );
                             })()}
                           </span>
                                                       <button 
                              onClick={() => {
                                setClockAction(employee.currentStatus === 'clocked-in' ? 'out' : 'in');
                                setSelectedEmployee(employee.id);
                                setError('');
                                setSuccessMessage('');
                                setShowClockDialog(true);
                              }}
                              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors duration-200 hover:shadow-sm ${
                                employee.currentStatus === 'clocked-in'
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {employee.currentStatus === 'clocked-in' ? 'Clock Out' : 'Clock In'}
              </button>
                         </div>
                       </div>
                     ))}
                   </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
               {/* Search and Filters */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <div className="flex flex-col sm:flex-row gap-4">
                   <div className="flex-1">
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                         placeholder="Search by employee name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
                   </div>
                   <div className="flex gap-2">
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
                       value={dateFilter}
                       onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       aria-label="Filter by date"
                     >
                       <option value="today">Today</option>
                       <option value="yesterday">Yesterday</option>
                       <option value="week">This Week</option>
                       <option value="month">This Month</option>
                       <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>

               {/* Attendance Records Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h3 className="text-lg font-medium text-gray-900">Attendance Records</h3>
                   <p className="text-sm text-gray-600">Showing {filteredRecords.length} records</p>
                   {user?.role === 'admin' && (
                     <div className="mt-3">
                       <button
                         onClick={() => setShowAddRecordDialog(true)}
                         className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center shadow-sm border border-blue-700"
                       >
                         <Plus className="w-4 h-4 mr-2" />
                         Add Attendance
                       </button>
                     </div>
                   )}
                 </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                       {filteredRecords.length === 0 ? (
                         <tr>
                           <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                             No attendance records found
                           </td>
                         </tr>
                       ) : (
                         filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                          <div className="text-sm text-gray-500">{record.employeeId}</div>
                        </div>
                      </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.clockIn}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.clockOut || '-'}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.totalHours || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                                    onClick={() => handleViewRecord(record)}
                                    className="p-2 bg-white border border-gray-200 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                    aria-label="View attendance record"
                                    title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                                    onClick={() => handleEditRecord(record)}
                                    className="p-2 bg-white border border-gray-200 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                    aria-label="Edit attendance record"
                                    title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                                    onClick={() => handleDeleteRecord(record)}
                                    className="p-2 bg-white border border-gray-200 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    aria-label="Delete attendance record"
                                    title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                         ))
                       )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
             <div className="space-y-6">
               {/* Employee Status Overview */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Status Overview</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                     <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-green-600">
                       {employees.filter(emp => emp.currentStatus === 'clocked-in').length}
                     </div>
                     <div className="text-sm text-green-600">Currently Working</div>
                   </div>
                   <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                     <X className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-gray-600">
                       {employees.filter(emp => emp.currentStatus === 'clocked-out').length}
                     </div>
                     <div className="text-sm text-gray-600">Not Working</div>
                   </div>
                   <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                     <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-yellow-600">
                       {employees.filter(emp => emp.currentStatus === 'on-break').length}
                     </div>
                     <div className="text-sm text-yellow-600">On Break</div>
                   </div>
                 </div>
               </div>

               {/* Employee List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h3 className="text-lg font-medium text-gray-900">Employee List</h3>
                   <p className="text-sm text-gray-600">Showing {employees.length} employees</p>
                 </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Clock In</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                       {employees.length === 0 ? (
                         <tr>
                           <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                             No employees found
                           </td>
                         </tr>
                       ) : (
                         employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                                   <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                     <span className="text-sm font-medium text-primary-600">
                                       {employee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                   <div className="text-sm text-gray-500">ID: {employee.id}</div>
                          </div>
                        </div>
                      </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCurrentStatusColor(employee.currentStatus)}`}>
                                 {(() => {
                                   const Icon = getCurrentStatusIcon(employee.currentStatus);
                                   return (
                                     <>
                                       <Icon className="w-3 h-3 mr-1" />
                          {employee.currentStatus.replace('-', ' ')}
                                     </>
                                   );
                                 })()}
                        </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                               {employee.lastClockIn || 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                                    onClick={() => {
                                      setClockAction(employee.currentStatus === 'clocked-in' ? 'out' : 'in');
                                      setSelectedEmployee(employee.id);
                                      setError('');
                                      setSuccessMessage('');
                                      setShowClockDialog(true);
                                    }}
                                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors duration-200 ${
                                      employee.currentStatus === 'clocked-in'
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200 hover:shadow-sm'
                                        : 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-sm'
                                    }`}
                                  >
                                    {employee.currentStatus === 'clocked-in' ? 'Clock Out' : 'Clock In'}
                                  </button>
                                  <button 
                                    onClick={() => handleViewEmployee(employee)}
                                    className="p-2 bg-white border border-gray-200 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                            aria-label="View employee details"
                                    title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button 
                                    onClick={() => handleDeleteEmployee(employee)}
                                    className="p-2 bg-white border border-gray-200 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    aria-label="Delete employee"
                                    title="Delete Employee"
                                  >
                                    <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                         ))
                       )}
              </tbody>
            </table>
                 </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
               {/* Report Generation Options */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Reports</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                     <div className="flex items-center mb-3">
                       <Calendar className="w-6 h-6 text-blue-600 mr-2" />
                       <h4 className="font-medium text-gray-900">Daily Report</h4>
                     </div>
                     <p className="text-sm text-gray-600 mb-3">Generate attendance report for today</p>
                     <button 
                       onClick={handleExportReport}
                       className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                     >
                       Generate
                     </button>
                   </div>
                   
                   <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                     <div className="flex items-center mb-3">
                       <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                       <h4 className="font-medium text-gray-900">Weekly Report</h4>
                     </div>
                     <p className="text-sm text-gray-600 mb-3">Generate attendance report for this week</p>
                     <button className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">
                       Generate
                     </button>
                   </div>
                   
                   <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                     <div className="flex items-center mb-3">
                       <Download className="w-6 h-6 text-purple-600 mr-2" />
                       <h4 className="font-medium text-gray-900">Monthly Report</h4>
                     </div>
                     <p className="text-sm text-gray-600 mb-3">Generate attendance report for this month</p>
                     <button className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors">
                       Generate
                     </button>
                   </div>
                 </div>
               </div>

               {/* Attendance Statistics */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Statistics</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                     <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-blue-600">{totalEmployees}</div>
                     <div className="text-sm text-blue-600">Total Employees</div>
                   </div>
                   <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                     <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-green-600">{presentToday}</div>
                     <div className="text-sm text-green-600">Present Today</div>
                   </div>
                   <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                     <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-red-600">{absentToday}</div>
                     <div className="text-sm text-red-600">Absent Today</div>
                   </div>
                   <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                     <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-yellow-600">{lateToday}</div>
                     <div className="text-sm text-yellow-600">Late Today</div>
                   </div>
                 </div>
               </div>

               {/* Attendance Trends */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Trends</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                     <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-blue-600">
                       {attendanceRecords.filter(r => r.date === today).length}
                     </div>
                     <div className="text-sm text-blue-600">Today's Records</div>
                   </div>
                   <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                     <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-green-600">
                       {Math.round((presentToday / totalEmployees) * 100) || 0}%
                     </div>
                     <div className="text-sm text-green-600">Attendance Rate</div>
                   </div>
                   <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                     <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-purple-600">
                       {attendanceRecords.filter(r => r.totalHours && r.totalHours > 8).length}
                     </div>
                     <div className="text-sm text-purple-600">Overtime Records</div>
                   </div>
                   <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                     <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                     <div className="text-2xl font-bold text-orange-600">
                       {attendanceRecords.filter(r => r.status === 'late').length}
                     </div>
                     <div className="text-sm text-orange-600">Late Arrivals</div>
                   </div>
                 </div>
                 
                 {/* Weekly Trend Chart */}
                 <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                   <h4 className="text-md font-medium text-gray-900 mb-3">Weekly Attendance Trend</h4>
                   <div className="flex items-end justify-between h-32">
                     {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                       const dayRecords = attendanceRecords.filter(r => {
                         const recordDate = new Date(r.date);
                         const dayOfWeek = recordDate.getDay();
                         return dayOfWeek === (index === 0 ? 1 : index === 6 ? 0 : index + 1);
                       }).length;
                       const maxRecords = Math.max(...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((_, i) => 
                         attendanceRecords.filter(r => {
                           const recordDate = new Date(r.date);
                           const dayOfWeek = recordDate.getDay();
                           return dayOfWeek === (i === 0 ? 1 : i === 6 ? 0 : i + 1);
                         }).length
                       ));
                       const height = maxRecords > 0 ? (dayRecords / maxRecords) * 100 : 0;
                       
                       return (
                         <div key={day} className="flex flex-col items-center">
                           <div className="text-xs text-gray-500 mb-1">{day}</div>
                           <div 
                             className={`w-8 bg-primary-500 rounded-t-sm transition-all duration-300 chart-bar ${getChartHeightClass(height)}`}
                           ></div>
                           <div className="text-xs text-gray-600 mt-1">{dayRecords}</div>
                      </div>
                       );
                     })}
                    </div>
                  </div>
               </div>

               {/* Department Trends */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Department Trends</h3>
                 <div className="space-y-4">
                   {(() => {
                     const departmentStats = employees.reduce((acc, emp) => {
                       if (!acc[emp.department]) {
                         acc[emp.department] = { total: 0, present: 0, absent: 0 };
                       }
                       // Now we know acc[emp.department] exists, so we can safely access it
                       const deptStats = acc[emp.department]!;
                       deptStats.total++;
                       if (emp.currentStatus === 'clocked-in') {
                         deptStats.present++;
                       } else {
                         deptStats.absent++;
                       }
                       return acc;
                     }, {} as Record<string, { total: number; present: number; absent: number }>);
                     
                     return Object.entries(departmentStats)
                       .filter(([_, stats]) => stats && typeof stats === 'object')
                       .map(([dept, stats]) => {
                         if (!stats || typeof stats !== 'object') return null;
                         const typedStats = stats as { total: number; present: number; absent: number };
                         const total = typedStats.total || 0;
                         const present = typedStats.present || 0;
                         const absent = typedStats.absent || 0;
                       
                       return (
                         <div key={dept} className="p-4 border border-gray-200 rounded-lg">
                           <div className="flex items-center justify-between mb-3">
                             <h5 className="font-medium text-gray-900">{dept}</h5>
                             <span className="text-sm text-gray-500">{total} employees</span>
                           </div>
                           <div className="flex items-center space-x-4">
                             <div className="flex-1">
                               <div className="flex justify-between text-sm text-gray-600 mb-1">
                                 <span>Present</span>
                                 <span>{present}</span>
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-2">
                                 <div 
                                   className={`bg-green-500 h-2 rounded-full transition-all duration-300 progress-bar ${getProgressWidthClass(total > 0 ? (present / total) * 100 : 0)}`}
                                 ></div>
                               </div>
                             </div>
                             <div className="flex-1">
                               <div className="flex justify-between text-sm text-gray-600 mb-1">
                                 <span>Absent</span>
                                 <span>{absent}</span>
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-2">
                                 <div 
                                   className={`bg-red-500 h-2 rounded-full transition-all duration-300 progress-bar ${getProgressWidthClass(total > 0 ? (absent / total) * 100 : 0)}`}
                                 ></div>
                               </div>
                             </div>
                           </div>
                           <div className="mt-2 text-xs text-gray-500">
                             Attendance Rate: {total > 0 ? Math.round((present / total) * 100) : 0}%
                           </div>
                         </div>
                       );
                     });
                   })()}
              </div>
            </div>

               {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                   {attendanceRecords.slice(0, 5).map((record) => (
                     <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center">
                         <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                         <div>
                           <div className="text-sm font-medium text-gray-900">
                             {record.employeeName} {record.clockIn ? 'clocked in' : 'clocked out'}
                      </div>
                           <div className="text-xs text-gray-500">
                             {record.date} at {record.clockIn || record.clockOut}
                           </div>
                         </div>
                       </div>
                       <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
                         {record.status}
                      </span>
                    </div>
                   ))}
                   {attendanceRecords.length === 0 && (
                     <div className="text-center text-gray-500 py-4">
                       No recent activity
                  </div>
                   )}
                 </div>
               </div>
             </div>
           )}

          {/* End of conditional content */}
        </>
      )}

      {/* Clock In/Out Dialog */}
      {showClockDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Clock In/Out
              </h3>
                             <button
                 onClick={() => setShowClockDialog(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close clock in/out dialog"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            {/* Clock Action Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Clock Action
              </label>
              <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setClockAction('in')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    clockAction === 'in'
                      ? 'bg-blue-600 text-white shadow-sm border border-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Clock In
                </button>
                <button
                  onClick={() => setClockAction('out')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    clockAction === 'out'
                      ? 'bg-blue-600 text-white shadow-sm border border-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Clock Out
                </button>
              </div>
            </div>
            
                         <div className="mb-6">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Select Employee
               </label>
               <select
                 value={selectedEmployee}
                 onChange={(e) => setSelectedEmployee(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                 aria-label="Select employee for clock in/out"
               >
                 <option value="">Choose an employee...</option>
                 {employees.map((emp) => (
                   <option key={emp.id} value={emp.id}>
                     {emp.name} ({emp.department})
                   </option>
                 ))}
               </select>
              </div>

             {/* Employee Current Status Display */}
             {selectedEmployee && (
               <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                 <div className="text-sm text-blue-600 mb-1">Current Status:</div>
                 <div className="text-lg font-medium text-blue-900">
                   {(() => {
                     const emp = employees.find(e => e.id === selectedEmployee);
                     if (!emp) return 'Unknown';
                     
                     const statusText = emp.currentStatus === 'clocked-in' ? '🟢 Clocked In' : 
                                       emp.currentStatus === 'clocked-out' ? '🔴 Clocked Out' : 
                                       '🟡 On Break';
                     
                     return `${emp.name} - ${statusText}`;
                   })()}
            </div>
                 <div className="text-sm text-blue-600 mt-1">
                   {(() => {
                     const emp = employees.find(e => e.id === selectedEmployee);
                     if (!emp) return '';
                     
                     if (clockAction === 'in' && emp.currentStatus === 'clocked-in') {
                       return '⚠️ Employee is already clocked in. Cannot clock in again.';
                     } else if (clockAction === 'out' && emp.currentStatus === 'clocked-out') {
                       return '⚠️ Employee is already clocked out. Cannot clock out again.';
                     } else {
                       return `✅ Ready to ${clockAction === 'in' ? 'clock in' : 'clock out'}`;
                     }
                   })()}
          </div>
               </div>
             )}

             {/* Error Message Display */}
             {error && (
               <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
                 <div className="text-sm text-red-600">
                   <AlertCircle className="w-4 h-4 inline mr-2" />
                   {error}
                 </div>
               </div>
             )}

             {/* Success Message Display */}
             {successMessage && (
               <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                 <div className="text-sm text-green-600">
                   <CheckCircle className="w-4 h-4 inline mr-2" />
                   {successMessage}
                 </div>
               </div>
             )}

            {/* Current Time Display */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Time:</div>
              <div className="text-lg font-mono font-medium text-gray-900">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour12: true, 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>

            <div className="flex space-x-3">
                             <button
                 onClick={handleClockInOut}
                 disabled={!selectedEmployee || (() => {
                   const emp = employees.find(e => e.id === selectedEmployee);
                   if (!emp) return true;
                   return (clockAction === 'in' && emp.currentStatus === 'clocked-in') ||
                          (clockAction === 'out' && emp.currentStatus === 'clocked-out');
                 })()}
                 className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center shadow-sm border border-blue-700"
               >
                 {clockAction === 'in' ? (
                   <>
                     <Clock className="w-4 h-4 mr-2" />
                     Clock In
                   </>
                 ) : (
                   <>
                     <X className="w-4 h-4 mr-2" />
                     Clock Out
                   </>
                 )}
              </button>
              <button
                onClick={() => setShowClockDialog(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {showCalendar && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Attendance Calendar</h3>
                             <button
                 onClick={() => setShowCalendar(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close calendar view"
               >
                 <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Calendar view coming soon...</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Add Attendance Record Dialog */}
      {user?.role === 'admin' && showAddRecordDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Attendance Record</h3>
              <button
                onClick={() => setShowAddRecordDialog(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close add record dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={newAttendance.employeeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const emp = employees.find(emp => emp.id === id);
                    setNewAttendance(prev => ({
                      ...prev,
                      employeeId: id,
                      employeeName: emp ? emp.name : ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  aria-label="Select employee"
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newAttendance.date}
                    onChange={(e) => setNewAttendance(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    aria-label="Select date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newAttendance.status}
                    onChange={(e) => setNewAttendance(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    aria-label="Select attendance status"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half Day</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clock In</label>
                  <input
                    type="time"
                    value={newAttendance.clockIn}
                    onChange={(e) => setNewAttendance(prev => ({ ...prev, clockIn: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    aria-label="Select clock in time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clock Out (optional)</label>
                  <input
                    type="time"
                    value={newAttendance.clockOut}
                    onChange={(e) => setNewAttendance(prev => ({ ...prev, clockOut: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    aria-label="Select clock out time"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newAttendance.location}
                  onChange={(e) => setNewAttendance(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Main Office"
                  aria-label="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={newAttendance.notes}
                  onChange={(e) => setNewAttendance(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any notes..."
                  aria-label="Enter notes"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddRecordDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAttendance}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Alerts View */}
       {showAlerts && (
         <div className="fixed inset-0 flex items-center justify-center z-50 p-2">
           <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-2 shadow-xl max-h-[85vh] overflow-hidden">
             <div className="flex items-center justify-between mb-3">
               <h3 className="text-base font-medium text-gray-900">Attendance Alerts</h3>
                              <button
                  onClick={() => setShowAlerts(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close alerts view"
                >
                  <X className="w-4 h-4" />
                </button>
             </div>
             
              <div className="space-y-2 overflow-y-auto max-h-32">
               {alerts.map((alert, index) => (
                 <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                   <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                   <p className="text-sm text-yellow-800 break-words">{alert}</p>
                 </div>
               ))}
             </div>
             
             <button
               onClick={() => setShowAlerts(false)}
               className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
             >
               Close
             </button>
           </div>
         </div>
       )}

       {/* View Record Dialog */}
       {showViewDialog && selectedRecord && (
         <div className="fixed inset-0 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Attendance Record Details</h3>
               <button
                 onClick={() => setShowViewDialog(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close view dialog"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.employeeName}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.employeeId}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.date}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRecord.status)}`}>
                     {selectedRecord.status}
                   </span>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Clock In</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.clockIn}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Clock Out</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.clockOut || 'Not clocked out'}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.totalHours || '-'}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.location}</p>
                 </div>
               </div>
               
               {selectedRecord.notes && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRecord.notes}</p>
                 </div>
               )}
             </div>
             
             <div className="mt-6 flex justify-end">
               <button
                 onClick={() => setShowViewDialog(false)}
                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Edit Record Dialog */}
       {showEditDialog && selectedRecord && (
         <div className="fixed inset-0 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Edit Attendance Record</h3>
               <button
                 onClick={() => { setShowEditDialog(false); setEditRecord(null); }}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close edit dialog"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             {editRecord && (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                     <input
                       type="date"
                       value={editRecord.date || ''}
                       onChange={(e) => setEditRecord(prev => ({ ...(prev || {}), date: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       aria-label="Select date"
                        />
                      </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                     <select
                       value={editRecord.status as any}
                       onChange={(e) => setEditRecord(prev => ({ ...(prev || {}), status: e.target.value as any }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       aria-label="Select attendance status"
                     >
                       <option value="present">Present</option>
                       <option value="absent">Absent</option>
                       <option value="late">Late</option>
                       <option value="half-day">Half Day</option>
                       <option value="leave">Leave</option>
                     </select>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Clock In</label>
                     <input
                       type="time"
                       value={editRecord.clockIn || ''}
                       onChange={(e) => setEditRecord(prev => ({ ...(prev || {}), clockIn: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       aria-label="Select clock in time"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Clock Out</label>
                     <input
                       type="time"
                       value={editRecord.clockOut || ''}
                       onChange={(e) => setEditRecord(prev => ({ ...(prev || {}), clockOut: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       aria-label="Select clock out time"
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                   <input
                     type="text"
                     value={editRecord.location || ''}
                     onChange={(e) => setEditRecord(prev => ({ ...(prev || {}), location: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="e.g., Main Office"
                     aria-label="Enter location"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                   <textarea
                     value={editRecord.notes || ''}
                     onChange={(e) => setEditRecord(prev => ({ ...(prev || {}), notes: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     rows={3}
                     placeholder="Add any notes..."
                     aria-label="Enter notes"
                   />
                 </div>
               </div>
             )}
             <div className="mt-6 flex justify-end space-x-3">
               <button
                 onClick={() => { setShowEditDialog(false); setEditRecord(null); }}
                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={async () => {
                   if (!selectedRecord || !editRecord) return;
                   try {
                     const updated: Partial<AttendanceRecord> = {
                       date: editRecord.date || selectedRecord.date,
                       clockIn: editRecord.clockIn || selectedRecord.clockIn,
                       clockOut: editRecord.clockOut || selectedRecord.clockOut || '',
                       status: (editRecord.status as AttendanceRecord['status']) || selectedRecord.status,
                       location: editRecord.location || selectedRecord.location,
                       notes: editRecord.notes || selectedRecord.notes || ''
                     };
                     if (updated.clockIn && updated.clockOut) {
                       updated.totalHours = calculateHours(updated.clockIn, updated.clockOut);
                     }
                     await firebaseService.updateDocument('attendance', selectedRecord.id, updated);
                     // Update local state
                     setAttendanceRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, ...updated } : r));
                     setShowEditDialog(false);
                     setEditRecord(null);
                     setSuccessMessage('Record updated successfully!');
                     setTimeout(() => setSuccessMessage(''), 3000);
                   } catch (e) {
                     console.error('Failed to update record', e);
                     setError('Failed to update record. Please try again.');
                     setTimeout(() => setError(''), 3000);
                   }
                 }}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
               >
                 Save Changes
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Delete Record Confirmation Dialog */}
       {showDeleteDialog && selectedRecord && (
         <div className="fixed inset-0 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Delete Attendance Record</h3>
               <button
                 onClick={() => setShowDeleteDialog(false)}
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
                 You are about to delete the attendance record for <span className="font-medium">{selectedRecord.employeeName}</span> on <span className="font-medium">{selectedRecord.date}</span>.
               </p>
               <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
             </div>
             
             <div className="flex space-x-3">
               <button
                 onClick={() => setShowDeleteDialog(false)}
                 className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDeleteRecord}
                 className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
               >
                 Delete Record
               </button>
             </div>
           </div>
         </div>
       )}

               {/* View Employee Dialog */}
        {showViewEmployeeDialog && selectedEmployeeForView && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Employee Details</h3>
               <button
                 onClick={() => setShowViewEmployeeDialog(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close view employee dialog"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                   <span className="text-lg font-medium text-primary-600">
                     {selectedEmployeeForView.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                 <div>
                   <h4 className="text-lg font-medium text-gray-900">{selectedEmployeeForView.name}</h4>
                   <p className="text-sm text-gray-500">ID: {selectedEmployeeForView.id}</p>
                  </div>
              </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedEmployeeForView.department}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedEmployeeForView.position}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCurrentStatusColor(selectedEmployeeForView.currentStatus)}`}>
                     {selectedEmployeeForView.currentStatus.replace('-', ' ')}
                   </span>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Last Clock In</label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedEmployeeForView.lastClockIn || 'Never'}</p>
                 </div>
            </div>
          </div>

             <div className="mt-6 flex justify-end">
               <button
                 onClick={() => setShowViewEmployeeDialog(false)}
                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
               >
                 Close
              </button>
             </div>
           </div>
         </div>
       )}

       {/* Edit Employee Dialog */}
       {showEditEmployeeDialog && selectedEmployeeForView && (
         <div className="fixed inset-0 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Edit Employee</h3>
               <button
                 onClick={() => { setShowEditEmployeeDialog(false); setEditEmployee(null); }}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close edit employee dialog"
               >
                 <X className="w-6 h-6" />
              </button>
             </div>
             
             {editEmployee && (
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                   <input
                     type="text"
                     value={editEmployee.name || ''}
                     onChange={(e) => setEditEmployee(prev => ({ ...(prev || {}), name: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="Employee name"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                   <input
                     type="text"
                     value={editEmployee.department || ''}
                     onChange={(e) => setEditEmployee(prev => ({ ...(prev || {}), department: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="e.g., Engineering"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                   <input
                     type="text"
                     value={editEmployee.position || ''}
                     onChange={(e) => setEditEmployee(prev => ({ ...(prev || {}), position: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="e.g., Software Engineer"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                   <select
                     value={editEmployee.status || 'active'}
                     onChange={(e) => setEditEmployee(prev => ({ ...(prev || {}), status: e.target.value as 'active' | 'inactive' }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     aria-label="Select employee status"
                   >
                     <option value="active">Active</option>
                     <option value="inactive">Inactive</option>
                   </select>
                 </div>
               </div>
             )}
             
             <div className="mt-6 flex justify-end space-x-3">
               <button
                 onClick={() => { setShowEditEmployeeDialog(false); setEditEmployee(null); }}
                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={async () => {
                   if (!selectedEmployeeForView || !editEmployee) return;
                   try {
                     const updated: Partial<Employee> = {
                       name: editEmployee.name || selectedEmployeeForView.name,
                       department: editEmployee.department || selectedEmployeeForView.department,
                       position: editEmployee.position || selectedEmployeeForView.position,
                       status: editEmployee.status || selectedEmployeeForView.status
                     };
                     await firebaseService.updateDocument('employees', selectedEmployeeForView.id, updated);
                     // Update local state
                     setEmployees(prev => prev.map(e => e.id === selectedEmployeeForView.id ? { ...e, ...updated } : e));
                     setShowEditEmployeeDialog(false);
                     setEditEmployee(null);
                     setSuccessMessage('Employee updated successfully!');
                     setTimeout(() => setSuccessMessage(''), 3000);
                   } catch (e) {
                     console.error('Failed to update employee', e);
                     setError('Failed to update employee. Please try again.');
                     setTimeout(() => setError(''), 3000);
                   }
                 }}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
               >
                 Save Changes
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Delete Employee Confirmation Dialog */}
       {showDeleteEmployeeDialog && selectedEmployeeForView && (
         <div className="fixed inset-0 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-medium text-gray-900">Delete Employee</h3>
               <button
                 onClick={() => setShowDeleteEmployeeDialog(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close delete employee dialog"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="text-center mb-6">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Trash2 className="w-8 h-8 text-red-600" />
               </div>
               <h4 className="text-lg font-medium text-gray-900 mb-2">Are you absolutely sure?</h4>
               <p className="text-gray-600">
                 You are about to delete <span className="font-medium">{selectedEmployeeForView.name}</span> from the system.
               </p>
               <p className="text-sm text-red-600 mt-2">This action cannot be undone and will remove all associated data.</p>
             </div>
             
             <div className="flex space-x-3">
               <button
                 onClick={() => setShowDeleteEmployeeDialog(false)}
                 className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDeleteEmployee}
                 className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
               >
                 Delete Employee
              </button>
            </div>
          </div>
        </div>
             )}

       {/* Quick Actions Modals */}
       
                     {/* Calendar Modal */}
       {showCalendarModal && (
         <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
           <div className="bg-white rounded-lg p-3 sm:p-4 w-full max-w-lg sm:max-w-xl mx-2 sm:mx-4 shadow-xl max-h-[85vh] overflow-hidden">
             <div className="flex items-center justify-between mb-3 sm:mb-4">
               <h3 className="text-base sm:text-lg font-medium text-gray-900">Attendance Calendar</h3>
               <button
                 onClick={() => setShowCalendarModal(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close calendar modal"
               >
                 <X className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>
             </div>
             
             <div className="text-center mb-3 sm:mb-4">
               <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-2 sm:mb-3" />
               <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">Monthly Attendance Overview</h4>
               <p className="text-xs sm:text-sm text-gray-600">View and manage attendance records by month</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
               <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                 <div className="text-lg sm:text-xl font-bold text-green-600">{presentToday}</div>
                 <div className="text-xs text-green-700">Present Today</div>
               </div>
               <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
                 <div className="text-lg sm:text-xl font-bold text-red-600">{absentToday}</div>
                 <div className="text-xs text-red-700">Absent Today</div>
               </div>
               <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                 <div className="text-lg sm:text-xl font-bold text-yellow-600">{lateToday}</div>
                 <div className="text-xs text-red-700">Late Today</div>
               </div>
             </div>
             
             <div className="flex justify-end">
               <button
                 onClick={() => setShowCalendarModal(false)}
                 className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-xs sm:text-sm"
               >
                 Close
               </button>
               </div>
             </div>
           </div>
         )}

              {/* Export Modal */}
       {showExportModal && (
         <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
           <div className="bg-white rounded-lg p-3 sm:p-4 w-full max-w-sm sm:max-w-md mx-2 sm:mx-4 shadow-xl max-h-[85vh] overflow-hidden">
             <div className="flex items-center justify-between mb-3 sm:mb-4">
               <h3 className="text-base sm:text-lg font-medium text-gray-900">Export Attendance Report</h3>
               <button
                 onClick={() => setShowExportModal(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close export modal"
               >
                 <X className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>
             </div>
             
             <div className="text-center mb-3 sm:mb-4">
               <Download className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-2 sm:mb-3" />
               <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">Generate Report</h4>
               <p className="text-xs sm:text-sm text-gray-600">Export attendance data as CSV file</p>
             </div>
             
             <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
               <div className="text-xs sm:text-sm text-gray-600">
                 <p>• Total Records: {attendanceRecords.length}</p>
                 <p>• Date Range: All available dates</p>
                 <p>• Format: CSV (Comma Separated Values)</p>
               </div>
             </div>
             
             <div className="flex space-x-2 sm:space-x-3">
               <button
                 onClick={() => setShowExportModal(false)}
                 className="flex-1 px-3 py-2 sm:px-4 sm:py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors text-xs sm:text-sm"
               >
                 Cancel
               </button>
               <button
                 onClick={() => {
                   handleExportReport();
                   setShowExportModal(false);
                 }}
                 className="flex-1 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-xs sm:text-sm"
               >
                 Export Report
               </button>
               </div>
             </div>
           </div>
         )}

       {/* Alerts Modal */}
       {showAlertsModal && (
         <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
           <div className="bg-white rounded-lg p-3 sm:p-4 w-full max-w-sm sm:max-w-md mx-2 sm:mx-4 shadow-xl max-h-[85vh] overflow-hidden">
             <div className="flex items-center justify-between mb-3 sm:mb-4">
               <h3 className="text-base sm:text-lg font-medium text-gray-900">System Alerts</h3>
               <button
                 onClick={() => setShowAlertsModal(false)}
                 className="text-gray-400 hover:text-gray-600"
                 aria-label="Close alerts modal"
               >
                 <X className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>
             </div>
             
             <div className="text-center mb-3 sm:mb-4">
               <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 mx-auto mb-2 sm:mb-3" />
               <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">Recent Notifications</h4>
               <p className="text-xs sm:text-sm text-gray-600">View system alerts and notifications</p>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-32 sm:max-h-40">
               {alerts.length > 0 ? (
                 alerts.map((alert, index) => (
                   <div key={index} className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                     <div className="flex items-start space-x-2 sm:space-x-3">
                       <AlertCircle className="w-4 h-4 sm:w-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                       <p className="text-xs sm:text-sm text-gray-700 break-words leading-relaxed">{alert}</p>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-4 sm:py-6 text-gray-500">
                   <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
                   <p className="text-xs sm:text-sm">No alerts at the moment</p>
                 </div>
               )}
             </div>
             
             <div className="flex justify-end">
               <button
                 onClick={() => setShowAlertsModal(false)}
                 className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-xs sm:text-sm"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default Attendance;
