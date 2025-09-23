import { useDepartmentsList } from '@/hooks/useDepartments';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search, 
  Users, 
  AlertCircle, 
  CheckCircle,
  X,
  Download,
  Eye,
  Edit,
  Trash2,
  Clock,
  FileText,
  DollarSign,
  Settings,
  Calculator,
  Receipt,
  CreditCard,
  Plus,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import DashboardCard from '../components/DashboardCard';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  joinDate: string;
  isActive: boolean;
  uanNumber?: string;
  esiNumber?: string;
  pfStatus?: 'active' | 'inactive';
  pfNumber?: string;
  bankName?: string;
  branch?: string;
  ifsc?: string;
  bankAccount?: string;
  panNumber?: string;
  aadhaarNumber?: string;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  payableDays: number;
  otHours: number;
  netPayable: number;
  totalPayableAmount: number;
  remarks?: string;
  // Detailed breakdown for edit modal
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  pfEmployee: number;
  esiEmployee: number;
  pt: number;
  salaryAdvance: number;
  otherDeductions: number;
  otPayment: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  uanNumber?: string;
  esiNumber?: string;
  // Additional detailed fields for comprehensive salary sheet
  pfStatus?: 'active' | 'inactive';
  esiStatus?: 'active' | 'inactive';
  basicDA?: number; // Basic + DA
  balanceAdvance?: number;
  tds?: number;
  totalDeductions?: number;
  arrears?: number;
  differenceAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PFContribution {
  id: string;
  employeeId: string;
  employeeName: string;
  uanNumber: string;
  pfBasic: number;
  employeePF: number; // 12%
  eps: number; // 8.33%
  epf: number; // 3.67%
  edli: number; // 0.5%
  adminCharges: number; // 0.5%
  edliAdmin: number; // 0%
  employerPFTotal: number;
}

interface ESIContribution {
  id: string;
  employeeId: string;
  employeeName: string;
  esiNumber: string;
  grossSalary: number;
  employeeContribution: number; // 0.75%
  employerContribution: number; // 3.25%
  total: number;
}

interface PayrollSettings {
  // PF Settings
  pfEmployeeRate: number; // 12%
  pfEmployerRate: number; // 12%
  epsContributionRate: number; // 8.33%
  epfContributionRate: number; // 3.67%
  edliContributionRate: number; // 0.5%
  adminChargesRate: number; // 0.5%
  edliAdminChargesRate: number; // 0.0%
  pfApplicable: boolean;
  
  // ESI Settings
  esiEmployeeRate: number; // 0.75%
  esiEmployerRate: number; // 3.25%
  esiApplicable: boolean;
  
  // Overtime Settings
  otHourlyRate: number; // 50
  
  // Holiday Pay Settings
  holidayPayRules: 'paid' | 'unpaid';
  holidayPayType: 'paid' | 'unpaid';
}

const Payroll: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const departments = useDepartmentsList();
  const [activeTab, setActiveTab] = useState<'salary' | 'pf' | 'esi' | 'settings'>('salary');
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [pfContributions] = useState<PFContribution[]>([]);
  const [esiContributions] = useState<ESIContribution[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  
  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Realtime listener ref
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Form data
  const [formData, setFormData] = useState<Partial<PayrollRecord>>({
    employeeId: '',
    employeeName: '',
    grossSalary: 0,
    payableDays: 0,
    otHours: 0,
    netPayable: 0,
    totalPayableAmount: 0,
    basicSalary: 0,
    hra: 0,
    specialAllowance: 0,
    pfEmployee: 0,
    esiEmployee: 0,
    pt: 0,
    salaryAdvance: 0,
    otherDeductions: 0,
    otPayment: 0,
    pfApplicable: true,
    esiApplicable: true,
    remarks: ''
  });

  const [settings, setSettings] = useState<PayrollSettings>({
    // PF Settings
    pfEmployeeRate: 0,
    pfEmployerRate: 0,
    epsContributionRate: 0,
    epfContributionRate: 0,
    edliContributionRate: 0,
    adminChargesRate: 0,
    edliAdminChargesRate: 0,
    pfApplicable: false,
    
    // ESI Settings
    esiEmployeeRate: 0,
    esiEmployerRate: 0,
    esiApplicable: false,
    
    // Overtime Settings
    otHourlyRate: 0,
    
    // Holiday Pay Settings
    holidayPayRules: 'paid',
    holidayPayType: 'paid'
  });

  // Load data
  useEffect(() => {
    const initializeData = async () => {
      await loadEmployees();
      await loadSettings();
      setupRealtimePayrollListener();
    };
    initializeData();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown) {
        const target = event.target as Element;
        if (!target.closest('.export-dropdown')) {
          setShowExportDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Sync formData with selectedRecord when modal opens
  useEffect(() => {
    if (showEditModal && selectedRecord) {
      console.log('Syncing formData with selectedRecord:', selectedRecord);
      setFormData(selectedRecord);
    }
  }, [showEditModal, selectedRecord]);


  const setupRealtimePayrollListener = () => {
    if (!db) {
      console.warn('Firebase not available for realtime listener');
      setError('Firebase not available');
      return;
    }

    setLoading(true);
    
    try {
      const payrollCollection = collection(db, 'payrollRecords');
      const q = query(payrollCollection);
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('Payroll realtime update received, documents:', querySnapshot.size);
        const records: PayrollRecord[] = [];
        querySnapshot.forEach((doc) => {
          const record = {
            id: doc.id,
            ...doc.data()
          } as PayrollRecord;
          console.log('Processing payroll record:', record);
          records.push(record);
        });
        
        console.log('Setting payroll records:', records.length);
        setPayrollRecords(records);
        setLoading(false);
        setError('');
      }, (error) => {
        console.error('Error in payroll realtime listener:', error);
        setError('Failed to load payroll data in realtime');
        setLoading(false);
      });
      
      // Store unsubscribe function
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error setting up payroll listener:', error);
      setError('Failed to setup realtime listener');
      setLoading(false);
    }
  };

  // Removed auto-generation function to avoid mock/placeholder data

  // Removed PF/ESI generation functions to avoid mock data


  const loadEmployees = async () => {
    try {
      const response = await firebaseService.getCollection('users');
      if (response.success && response.data) {
        // Transform the user data to match our Employee interface
        const transformedEmployees: Employee[] = response.data.map((user: any) => ({
          id: user.id,
          employeeId: user.employeeId || `EMP${user.id.slice(-3)}`,
          firstName: user.firstName || user.name?.split(' ')[0] || 'Unknown',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || 'Employee',
          email: user.email || '',
          department: user.department || 'General',
          position: user.position || 'Employee',
          salary: user.salary || 0,
          joinDate: user.joiningDate || user.hireDate || user.createdAt || new Date().toISOString(),
          isActive: user.status === 'active' || user.isActive !== false,
          uanNumber: user.uanNumber || '',
          esiNumber: user.esiNumber || '',
          pfStatus: user.pfStatus || 'inactive',
          pfNumber: user.pfNumber || '',
          bankName: user.bankingInfo?.bankName || user.bankName || '',
          branch: user.bankingInfo?.branch || user.branch || '',
          ifsc: user.bankingInfo?.ifscCode || user.ifsc || '',
          bankAccount: user.bankingInfo?.accountNumber || user.bankAccount || '',
          panNumber: user.governmentInfo?.panNumber || user.panNumber || '',
          aadhaarNumber: user.governmentInfo?.aadharNumber || user.aadhaarNumber || ''
        }));
        setEmployees(transformedEmployees);
        
        // Migrate existing payroll records if needed
        await migratePayrollRecords(transformedEmployees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  // Migrate existing payroll records to use correct employeeId format
  const migratePayrollRecords = async (employees: Employee[]) => {
    try {
      const response = await firebaseService.getCollection('payrollRecords');
      if (response.success && response.data) {
        const recordsToUpdate: any[] = [];
        
        response.data.forEach((record: any) => {
          // Check if the employeeId looks like a document ID (longer than typical employee IDs)
          if (record.employeeId && record.employeeId.length > 10) {
            // Find the employee by document ID
            const employee = employees.find(emp => emp.id === record.employeeId);
            if (employee) {
              recordsToUpdate.push({
                id: record.id,
                employeeId: employee.employeeId
              });
            }
          }
        });
        
        // Update records that need migration
        for (const update of recordsToUpdate) {
          try {
            await firebaseService.updateDocument('payrollRecords', update.id, {
              employeeId: update.employeeId
            });
            console.log(`Migrated payroll record ${update.id} to use employeeId: ${update.employeeId}`);
          } catch (error) {
            console.error(`Failed to migrate payroll record ${update.id}:`, error);
          }
        }
        
        if (recordsToUpdate.length > 0) {
          console.log(`Migration completed: ${recordsToUpdate.length} payroll records updated`);
        }
      }
    } catch (error) {
      console.error('Error migrating payroll records:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await firebaseService.getDocument('payrollSettings', 'settings');
      if (response.success && response.data) {
        setSettings(response.data as PayrollSettings);
      } else {
        // Create default settings in Firebase if they don't exist
        const defaultSettings: PayrollSettings = {
          // PF Settings
          pfEmployeeRate: 12,
          pfEmployerRate: 12,
          epsContributionRate: 8.33,
          epfContributionRate: 3.67,
          edliContributionRate: 0.5,
          adminChargesRate: 0.5,
          edliAdminChargesRate: 0.0,
          pfApplicable: true,
          
          // ESI Settings
          esiEmployeeRate: 0.75,
          esiEmployerRate: 3.25,
          esiApplicable: true,
          
          // Overtime Settings
          otHourlyRate: 50,
          
          // Holiday Pay Settings
          holidayPayRules: 'paid',
          holidayPayType: 'paid'
        };
        
        await firebaseService.setDocument('payrollSettings', 'settings', defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if Firebase fails
      const defaultSettings: PayrollSettings = {
        // PF Settings
        pfEmployeeRate: 12,
        pfEmployerRate: 12,
        epsContributionRate: 8.33,
        epfContributionRate: 3.67,
        edliContributionRate: 0.5,
        adminChargesRate: 0.5,
        edliAdminChargesRate: 0.0,
        pfApplicable: true,
        
        // ESI Settings
        esiEmployeeRate: 0.75,
        esiEmployerRate: 3.25,
        esiApplicable: true,
        
        // Overtime Settings
        otHourlyRate: 50,
        
        // Holiday Pay Settings
        holidayPayRules: 'paid',
        holidayPayType: 'paid'
      };
      setSettings(defaultSettings);
    }
  };

  // Calculate salary based on attendance and holidays
  const calculateSalaryFromAttendance = async (employeeId: string, month: string, year: number) => {
    try {
      // Fetch attendance data
      const attendanceResponse = await firebaseService.getCollection('attendance');
      const holidaysResponse = await firebaseService.getCollection('holidays');
      
      if (!attendanceResponse.success || !holidaysResponse.success) {
        console.warn('Could not fetch attendance or holiday data, using default values');
        return { payableDays: 22, otHours: 0 }; // Default values when data unavailable
      }

      const attendanceRecords = attendanceResponse.data || [];
      const holidays = holidaysResponse.data || [];

      // Get all dates in the month
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0);
      
      let payableDays = 0;
      let totalOtHours = 0;

      // Calculate payable days and OT hours
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // Check if it's a holiday
        const isHoliday = holidays.some((holiday: any) => 
          holiday.date === dateStr && holiday['status'] === 'active'
        );
        
        if (isHoliday && settings.holidayPayRules === 'unpaid') continue;
        
        // Check attendance for this date
        const attendanceRecord = attendanceRecords.find((record: any) => 
          record.employeeId === employeeId && record.date === dateStr
        );
        
        if (attendanceRecord && attendanceRecord['status'] === 'present') {
          payableDays++;
          
          // Calculate OT hours (assuming 8 hours standard work day)
          const clockIn = new Date(`${dateStr}T${attendanceRecord['clockIn']}`);
          const clockOut = attendanceRecord['clockOut'] ? new Date(`${dateStr}T${attendanceRecord['clockOut']}`) : null;
          
          if (clockOut) {
            const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
            const otHours = Math.max(0, totalHours - 8); // 8 hours standard
            totalOtHours += otHours;
          }
        }
      }

      return { payableDays, otHours: totalOtHours };
    } catch (error) {
      console.error('Error calculating salary from attendance:', error);
      return { payableDays: 22, otHours: 0 }; // Default values
    }
  };

  // Removed bulk save function to avoid mock data creation

  // Update payroll record in Firebase
  const updatePayrollRecord = async (record: PayrollRecord) => {
    try {
      await firebaseService.updateDocument('payrollRecords', record.id, record);
    } catch (error) {
      console.error('Error updating payroll record:', error);
    }
  };

  // Create new payroll record
  const createPayrollRecord = async (record: PayrollRecord) => {
    try {
      console.log('Creating payroll record in Firebase:', record);
      await firebaseService.setDocument('payrollRecords', record.id, record);
      console.log('Payroll record created successfully - realtime listener will update UI');
      // Note: Local state update removed - realtime listener will handle this automatically
    } catch (error) {
      console.error('Error creating payroll record:', error);
      throw error; // Re-throw to be handled by calling function
    }
  };

  // Save settings to Firebase
  const saveSettings = async (newSettings: PayrollSettings) => {
    try {
      setSavingSettings(true);
      await firebaseService.setDocument('payrollSettings', 'settings', newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Auto-calculate salary when editing
  const handleAutoCalculate = async (employeeId: string, grossSalary: number) => {
    const currentDate = new Date();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    
    const { payableDays, otHours } = await calculateSalaryFromAttendance(employeeId, month, year);
    
    // Calculate salary breakdown
    const basicSalary = grossSalary * 0.6; // 60% basic
    const hra = grossSalary * 0.3; // 30% HRA
    const specialAllowance = grossSalary * 0.1; // 10% special allowance
    
    // Calculate PF and ESI
    const pfEmployee = settings.pfApplicable ? basicSalary * (settings.pfEmployeeRate / 100) : 0;
    const esiEmployee = settings.esiApplicable ? grossSalary * (settings.esiEmployeeRate / 100) : 0;
    
    // Calculate OT payment
    const otPayment = otHours * settings.otHourlyRate;
    
    // Calculate net payable
    const totalWorkingDays = 22; // Default working days per month
    const netPayable = (grossSalary / totalWorkingDays) * payableDays + otPayment - pfEmployee - esiEmployee;
    const totalPayableAmount = netPayable;
    
    setFormData(prev => ({
      ...prev,
      payableDays,
      otHours,
      basicSalary,
      hra,
      specialAllowance,
      pfEmployee,
      esiEmployee,
      otPayment,
      netPayable,
      totalPayableAmount
    }));
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = [...payrollRecords];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.employeeName.toLowerCase().includes(searchLower) ||
        record.employeeId.toLowerCase().includes(searchLower)
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(record => {
        const employee = employees.find(emp => emp.employeeId === record.employeeId);
        return employee && employee.department === departmentFilter;
      });
    }

    return filtered;
  }, [payrollRecords, searchQuery, departmentFilter, employees]);

  // Statistics
  const stats = useMemo(() => {
    const total = payrollRecords.length;
    const totalGrossSalary = payrollRecords.reduce((sum, record) => sum + record.grossSalary, 0);
    const totalNetPayable = payrollRecords.reduce((sum, record) => sum + record.netPayable, 0);
    const totalOTHours = payrollRecords.reduce((sum, record) => sum + record.otHours, 0);

    return { total, totalGrossSalary, totalNetPayable, totalOTHours };
  }, [payrollRecords]);

  // Action handlers
  const handleViewRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setFormData(record);
    setShowViewModal(true);
  };

  const handleEditRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setFormData(record);
    setShowEditModal(true);
  };

  const handleDeleteRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const confirmDeleteRecord = async () => {
    if (!selectedRecord) return;
    
    try {
      await firebaseService.deleteDocument('payrollRecords', selectedRecord.id);
      setPayrollRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
      setShowDeleteModal(false);
      setSuccessMessage('Payroll record deleted successfully');
    } catch (error) {
      setError('Failed to delete payroll record');
    }
  };

  const handleSaveRecord = async () => {
    if (!selectedRecord) return;

    try {
      const updatedRecord = { 
        ...selectedRecord, 
        ...formData,
        updatedAt: new Date().toISOString()
      } as PayrollRecord;
      console.log('Saving record:', updatedRecord);
      console.log('Selected record:', selectedRecord);
      console.log('Form data:', formData);
      
      // Check if this is a new record (no employeeId means it's new)
      if (!selectedRecord.employeeId || selectedRecord.employeeId === '') {
        // Create new record
        console.log('Creating new payroll record');
        await createPayrollRecord(updatedRecord);
        setSuccessMessage('New payroll record created successfully');
      } else {
        // Update existing record
        console.log('Updating existing payroll record');
        await updatePayrollRecord(updatedRecord);
        setPayrollRecords(prev => prev.map(r => r.id === selectedRecord.id ? updatedRecord : r));
        setSuccessMessage('Payroll record updated successfully');
      }
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving payroll record:', error);
      setError('Failed to save payroll record');
    }
  };

  // Export functions
  const exportToExcel = (data: any[], filename: string) => {
    // Create a simple CSV export (can be enhanced with actual Excel library)
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Deprecated: replaced by jsPDF-based renderPayslip flows
  /* const exportToPDF = (content: string | string[], filename: string) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 16;

      const addTextBlock = (text: string, isFirstPage: boolean) => {
        if (!isFirstPage) {
          doc.addPage();
        }
        let y = margin;
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      };
      
      if (Array.isArray(content)) {
        content.forEach((block, idx) => addTextBlock(block, idx === 0));
      } else {
        addTextBlock(content, true);
      }

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error in exportToPDF:', error);
      throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }; */

  // Removed custom minimal PDF builder in favor of jsPDF for higher quality output

  const renderPayslip = (
    doc: jsPDF,
    record: PayrollRecord,
    employee: Employee | undefined,
    month: string,
    year: number
  ) => {
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerY = margin;

    // Header
    doc.setFontSize(14);
    doc.text(`PAY SLIP FOR THE MONTH OF ${month.toUpperCase()}-${year}`, margin, headerY);

    // Employee details table
    autoTable(doc, {
      startY: headerY + 16,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      head: [['Employee Details', 'Value']].map((h) => h),
      body: [
        ['Employee ID', record.employeeId],
        ['Name', record.employeeName],
        ['Department', employee?.department || ''],
        ['Designation', employee?.position || ''],
        ['Bank A/C No', employee?.bankAccount || '0'],
        ['PF / UAN Number', employee?.pfNumber || '0'],
        ['ESI Number', employee?.esiNumber || '0'],
        ['Days in Month', String(new Date(year, new Date().getMonth() + 1, 0).getDate())],
        ['Days to Pay', String(record.payableDays)],
        ['Overtime Hours', String(record.otHours)],
        ['Advance', String(record.salaryAdvance)],
        ['Balance Advance', String(record.balanceAdvance || 0)]
      ]
    });

    // Earnings table
    const earningsStartY = (doc as any).lastAutoTable.finalY + 14;
    autoTable(doc, {
      startY: earningsStartY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      head: [['Earnings', 'Amount (Rs.)', 'Payable (Rs.)']],
      body: [
        ['Basic', record.basicSalary.toLocaleString(),
          Math.round(record.basicSalary * (record.payableDays / new Date(year, new Date().getMonth() + 1, 0).getDate())).toLocaleString()
        ],
        ['HRA', record.hra.toLocaleString(),
          Math.round(record.hra * (record.payableDays / new Date(year, new Date().getMonth() + 1, 0).getDate())).toLocaleString()
        ],
        ['Special Allowance', record.specialAllowance.toLocaleString(),
          Math.round(record.specialAllowance * (record.payableDays / new Date(year, new Date().getMonth() + 1, 0).getDate())).toLocaleString()
        ],
        ['Total Earnings', record.grossSalary.toLocaleString(),
          Math.round(record.grossSalary * (record.payableDays / new Date(year, new Date().getMonth() + 1, 0).getDate())).toLocaleString()
        ]
      ]
    });

    // Deductions table
    const deductionsStartY = (doc as any).lastAutoTable.finalY + 14;
    autoTable(doc, {
      startY: deductionsStartY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      head: [['Deductions', 'Amount (Rs.)']],
      body: [
        ['PF Employee', String(record.pfEmployee || 0)],
        ['ESI Employee', String(record.esiEmployee || 0)],
        ['Professional Tax', String(record.pt || 0)],
        ['Advance Deducted', String(record.salaryAdvance || 0)],
        ['TDS', String(record.tds || 0)],
        ['Total Deductions', String(record.totalDeductions || 0)]
      ]
    });

    // Summary table
    const summaryStartY = (doc as any).lastAutoTable.finalY + 14;
    autoTable(doc, {
      startY: summaryStartY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      head: [['Summary', 'Value']],
      body: [
        ['PF & ESI Account Deposit', String((record.pfEmployee + record.esiEmployee))],
        ['OT Amount', String(record.otPayment)],
        ['Allowance', String(record.arrears || 0)],
        ['Cost to Company', String(record.totalPayableAmount)],
        ['To Bank', String(record.netPayable)],
        ['Cash to Pay', String(record.otPayment)],
        ['Salary After Deduction', String(record.totalPayableAmount)],
        ['Generated on', new Date().toLocaleDateString()],
        ['Generated at', new Date().toLocaleTimeString()]
      ]
    });

    // Footer line
    const footerY = (doc as any).lastAutoTable.finalY + 16;
    doc.setDrawColor(200);
    doc.line(margin, footerY, pageWidth - margin, footerY);
  };


  const generatePayslipData = (record: PayrollRecord, employee: Employee | undefined, month: string, year: number) => {
    // Calculate days in month
    const daysInMonth = new Date(year, new Date().getMonth() + 1, 0).getDate();
    const basicPayable = Math.round(record.basicSalary * (record.payableDays / daysInMonth));
    const hraPayable = Math.round(record.hra * (record.payableDays / daysInMonth));
    const specialPayable = Math.round(record.specialAllowance * (record.payableDays / daysInMonth));
    const totalEarningsPayable = Math.round(record.grossSalary * (record.payableDays / daysInMonth));
    
    return {
      'PAY SLIP FOR THE MONTH OF': `${month.toUpperCase()}-${year}`,
      'SPACER1': '',
      'EMPLOYEE DETAILS': '',
      'EMPLOYEE ID': record.employeeId,
      'NAME': record.employeeName.toUpperCase(),
      'DAYS IN MONTH': daysInMonth,
      'DAYS TO PAY': record.payableDays,
      'BANK A/C NO': employee?.bankAccount || '0',
      'PF / UAN NUMBER': employee?.pfNumber || '0',
      'DESIGNATION': employee?.position || '',
      'ESI NUMBER': employee?.esiNumber || '0',
      'DEPARTMENT': employee?.department || '',
      'OVER TIME Hrs.': record.otHours,
      'ADVANCE': record.salaryAdvance,
      'BAL ADVANCE': record.balanceAdvance,
      'SPACER2': '',
      'EARNINGS': '',
      'EARNINGS_SALARY_HEAD': 'AMOUNT (Rs.)',
      'Basic': record.basicSalary,
      'Basic Payable': basicPayable,
      'H R A': record.hra,
      'H R A Payable': hraPayable,
      'Special. All': record.specialAllowance,
      'Special. All Payable': specialPayable,
      'TOTAL EARNINGS': record.grossSalary,
      'TOTAL EARNINGS Payable': totalEarningsPayable,
      'SPACER3': '',
      'DEDUCTIONS': '',
      'DEDUCTIONS_SALARY_HEAD': 'AMOUNT (Rs.)',
      'PF EMPLOYEE': record.pfEmployee || 0,
      'ESI EMPLOYEE': record.esiEmployee || 0,
      'PROFESSIONAL TAX': record.pt || 0,
      'ADVANCE DEDUCTED': record.salaryAdvance || 0,
      'TDS': record.tds || 0,
      'TOTAL DEDUCTIONS': record.totalDeductions || 0,
      'SPACER4': '',
      'SUMMARY': '',
      'PF & ESI ACCOUNT DEPOSIT': (record.pfEmployee + record.esiEmployee),
      'OT Amount': record.otPayment,
      'ALLOWANCE': record.arrears || 0,
      'COST TO COMPANY': record.totalPayableAmount,
      'TO BANK': record.netPayable,
      'CASH TO PAY': record.otPayment,
      'SALARY AFTER DEDUCTION': record.totalPayableAmount,
      'SPACER5': '',
      'Generated on': new Date().toLocaleDateString(),
      'Generated at': new Date().toLocaleTimeString()
    };
  };

  /* const generatePayslipPDF = (record: PayrollRecord, employee: Employee | undefined, month: string, year: number): string => {
    const daysInMonth = new Date(year, new Date().getMonth() + 1, 0).getDate();
    const basicPayable = Math.round(record.basicSalary * (record.payableDays / daysInMonth));
    const hraPayable = Math.round(record.hra * (record.payableDays / daysInMonth));
    const specialPayable = Math.round(record.specialAllowance * (record.payableDays / daysInMonth));
    const totalEarningsPayable = Math.round(record.grossSalary * (record.payableDays / daysInMonth));
    
    return `
                    PAY SLIP FOR THE MONTH OF ${month.toUpperCase()}-${year}
${'='.repeat(80)}

AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A                              EMPLOYEE DETAILS                                  A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A EMPLOYEE ID: ${record.employeeId.toString().padEnd(20)} A NAME: ${record.employeeName.toUpperCase().padEnd(30)} A
A DAYS IN MONTH: ${daysInMonth.toString().padEnd(15)} A DAYS TO PAY: ${record.payableDays.toString().padEnd(25)} A
A BANK A/C NO: ${(employee?.bankAccount || '0').toString().padEnd(18)} A PF / UAN NUMBER: ${(employee?.pfNumber || '0').toString().padEnd(20)} A
A DESIGNATION: ${(employee?.position || '').padEnd(16)} A ESI NUMBER: ${(employee?.esiNumber || '0').toString().padEnd(25)} A
A DEPARTMENT: ${(employee?.department || '').padEnd(17)} A OVER TIME Hrs.: ${record.otHours.toString().padEnd(20)} A
A ADVANCE: ${record.salaryAdvance.toString().padEnd(22)} A BAL ADVANCE: ${(record.balanceAdvance || 0).toString().padEnd(25)} A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A                                  EARNINGS                                      A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A SALARY HEAD              A AMOUNT (Rs.)    A PAYABLE (Rs.)                     A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A Basic                    A ${record.basicSalary.toLocaleString().padStart(12)} A ${basicPayable.toLocaleString().padStart(12)}                     A
A H R A                    A ${record.hra.toLocaleString().padStart(12)} A ${hraPayable.toLocaleString().padStart(12)}                     A
A Special. All             A ${record.specialAllowance.toLocaleString().padStart(12)} A ${specialPayable.toLocaleString().padStart(12)}                     A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A TOTAL EARNINGS           A ${record.grossSalary.toLocaleString().padStart(12)} A ${totalEarningsPayable.toLocaleString().padStart(12)}                     A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A                                 DEDUCTIONS                                     A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A SALARY HEAD              A AMOUNT (Rs.)                                        A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A PF EMPLOYEE              A ${(record.pfEmployee || 0).toString().padStart(12)}                                        A
A ESI EMPLOYEE             A ${(record.esiEmployee || 0).toString().padStart(12)}                                        A
A PROFESSIONAL TAX         A ${(record.pt || 0).toString().padStart(12)}                                        A
A ADVANCE DEDUCTED         A ${(record.salaryAdvance || 0).toString().padStart(12)}                                        A
A TDS                      A ${(record.tds || 0).toString().padStart(12)}                                        A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A TOTAL DEDUCTIONS         A ${(record.totalDeductions || 0).toString().padStart(12)}                                        A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A                                  SUMMARY                                       A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
A PF & ESI ACCOUNT DEPOSIT: ${(record.pfEmployee + record.esiEmployee).toLocaleString().padEnd(35)} A
A OT Amount: ${record.otPayment.toLocaleString().padEnd(50)} A
A ALLOWANCE: ${(record.arrears || 0).toLocaleString().padEnd(52)} A
A COST TO COMPANY: ${record.totalPayableAmount.toLocaleString().padEnd(45)} A
A                                                                                 A
A TO BANK: ${record.netPayable.toLocaleString().padEnd(55)} A
A CASH TO PAY: ${record.otPayment.toLocaleString().padEnd(50)} A
A SALARY AFTER DEDUCTION: ${record.totalPayableAmount.toLocaleString().padEnd(40)} A
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

${'='.repeat(80)}
Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    `.trim();
  }; */

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    setShowExportDropdown(false);
    
    try {
      // Check if there are payroll records
      if (payrollRecords.length === 0) {
        setError('No payroll records found to export');
        return;
      }
      
      // Bulk export - all employees
      await exportBulkPayslips(format);
      setSuccessMessage(`Bulk payslips exported successfully! (${payrollRecords.length} employees)`);
    } catch (error) {
      console.error('Export error:', error);
      setError(`Failed to export payslips: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };


  const handleDownloadPDF = async (record: PayrollRecord) => {
    setIsExporting(true);
    try {
      await exportSinglePayslip(record, 'pdf');
      setSuccessMessage('Payslip downloaded successfully!');
    } catch (error) {
      setError('Failed to download payslip');
    } finally {
      setIsExporting(false);
    }
  };

  const exportSinglePayslip = async (record: PayrollRecord, format: 'pdf' | 'excel') => {
    const employee = employees.find(emp => emp.employeeId === record.employeeId);
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    if (format === 'excel') {
      const payslipData = generatePayslipData(record, employee, month, year);
      exportToExcel([payslipData], `payslip_${record.employeeName.replace(/\s+/g, '_')}_${month}_${year}`);
    } else {
      // Generate a structured PDF using jsPDF + autoTable
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      renderPayslip(doc, record, employee, month, year);
      doc.save(`payslip_${record.employeeName.replace(/\s+/g, '_')}_${month}_${year}.pdf`);
    }
  };

  const exportBulkPayslips = async (format: 'pdf' | 'excel') => {
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    if (format === 'excel') {
      const payslipsData = payrollRecords.map(record => {
        const employee = employees.find(emp => emp.employeeId === record.employeeId);
        return generatePayslipData(record, employee, month, year);
      });
      exportToExcel(payslipsData, `payslips_${month}_${year}`);
    } else {
      // Create a comprehensive bulk PDF with one page per payslip
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      payrollRecords.forEach((record, index) => {
        const employee = employees.find(emp => emp.employeeId === record.employeeId);
        if (index > 0) doc.addPage();
        renderPayslip(doc, record, employee, month, year);
      });
      doc.save(`payslips_${month}_${year}.pdf`);
    }
  };

  /* const generateBulkPayslipPDF = (month: string, year: number): string => {
    
    let bulkContent = `
                    BULK PAYSLIP REPORT - ${month.toUpperCase()} ${year}
${'='.repeat(80)}

Total Employees: ${payrollRecords.length}
Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

${'='.repeat(80)}

`;

    payrollRecords.forEach((record, index) => {
      try {
        const employee = employees.find(emp => emp.employeeId === record.employeeId);
        const payslipContent = generatePayslipPDF(record, employee, month, year);
        
        bulkContent += `
PAYSLIP ${index + 1} of ${payrollRecords.length}
${'='.repeat(80)}

${payslipContent}

${'='.repeat(80)}
${'='.repeat(80)}

`;
      } catch (error) {
        console.error(`Error generating payslip for employee ${record.employeeName}:`, error);
        bulkContent += `
PAYSLIP ${index + 1} of ${payrollRecords.length}
${'='.repeat(80)}

ERROR: Failed to generate payslip for ${record.employeeName}
Employee ID: ${record.employeeId}

${'='.repeat(80)}
${'='.repeat(80)}

`;
      }
    });

    return bulkContent.trim();
  }; */



  const tabs = [
    { id: 'salary', name: 'Salary Sheet', icon: FileText },
    { id: 'pf', name: 'PF Contributions', icon: CreditCard },
    { id: 'esi', name: 'ESI Statement', icon: Receipt },
    { id: 'settings', name: 'Settings', icon: Settings }
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payroll data...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage employee salaries, PF contributions, and ESI statements</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => {
              // Create a new payroll record
              const newRecord: PayrollRecord = {
                id: `payroll_${Date.now()}`,
                employeeId: '',
                employeeName: '',
                grossSalary: 0,
                payableDays: 0,
                otHours: 0,
                netPayable: 0,
                totalPayableAmount: 0,
                remarks: '',
                pfStatus: 'active',
                esiStatus: 'active',
                basicSalary: 0,
                hra: 0,
                specialAllowance: 0,
                pfEmployee: 0,
                esiEmployee: 0,
                pt: 0,
                salaryAdvance: 0,
                otherDeductions: 0,
                otPayment: 0,
                pfApplicable: true,
                esiApplicable: true,
                basicDA: 0,
                balanceAdvance: 0,
                tds: 0,
                totalDeductions: 0,
                arrears: 0,
                differenceAmount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setSelectedRecord(newRecord);
              setFormData(newRecord); // Initialize formData with the new record
              setShowEditModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
          
          {/* Export Dropdown */}
          <div className="relative export-dropdown">
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              {!isExporting && <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <span>Excel (.xlsx)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          name="Total Employees"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <DashboardCard
          name="Total Gross Salary"
          value={`₹${stats.totalGrossSalary.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <DashboardCard
          name="Net Payable"
          value={`₹${stats.totalNetPayable.toLocaleString()}`}
          icon={Calculator}
          color="purple"
        />
        <DashboardCard
          name="Total OT Hours"
          value={stats.totalOTHours}
          icon={Clock}
          color="yellow"
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
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by employee name or ID"
                aria-label="Search employees by name or ID"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-2">
              <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

          {/* Salary Sheet Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Salary Sheet</h3>
            </div>

            {/* No Data Message */}
            {payrollRecords.length === 0 && !loading && (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Records Found</h3>
                <p className="text-gray-600 mb-6">
                  {employees.length > 0 
                    ? "Create payroll records manually or import from your source."
                    : "Add employees first, then create payroll records."
                  }
                </p>
              </div>
            )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.employeeId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-xs">
                                {record.employeeName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.grossSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.payableDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.otHours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.netPayable.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{record.totalPayableAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.remarks || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button onClick={() => handleViewRecord(record)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditRecord(record)} className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors" title="Edit Record">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownloadPDF(record)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors" 
                            title="Download PDF Payslip"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteRecord(record)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors" title="Delete Record">
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
        </div>
      )}

      {/* PF Contributions Tab */}
      {activeTab === 'pf' && (
        <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">PF Contributions (Employer Side)</h3>
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UAN Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PF Basic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee PF (12%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPS (8.33%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPF (3.67%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EDLI (0.5%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Charges (0.5%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EDLI Admin (0%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employer PF Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {pfContributions.map((contribution, index) => (
                    <tr key={contribution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contribution.employeeId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contribution.employeeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contribution.uanNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.pfBasic.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.employeePF.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.eps.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.epf.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.edli.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.adminCharges.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.edliAdmin.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">₹{contribution.employerPFTotal.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ESI Statement Tab */}
      {activeTab === 'esi' && (
        <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">ESI Statement (Per Month)</h3>
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ESI Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Contribution (0.75%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employer Contribution (3.25%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {esiContributions.map((contribution, index) => (
                    <tr key={contribution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contribution.employeeId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contribution.employeeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contribution.esiNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.grossSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.employeeContribution.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{contribution.employerContribution.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">₹{contribution.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
                            </div>
                          </div>
                            </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Payroll Settings</h3>
                  <p className="text-sm text-gray-600">Configure payroll calculation parameters and rules for PF, ESI, Overtime, and Holiday Pay</p>
                </div>
                {savingSettings && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium">Saving...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-8">
                {/* PF Settings */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    PF (Provident Fund) Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee PF Rate (%)</label>
                      <input
                        type="number"
                        value={settings.pfEmployeeRate}
                        onChange={(e) => setSettings({ ...settings, pfEmployeeRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        placeholder="12.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employer PF Rate (%)</label>
                      <input
                        type="number"
                        value={settings.pfEmployerRate}
                        onChange={(e) => setSettings({ ...settings, pfEmployerRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        placeholder="12.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">EPS Contribution Rate (%)</label>
                      <input
                        type="number"
                        value={settings.epsContributionRate}
                        onChange={(e) => setSettings({ ...settings, epsContributionRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        placeholder="8.33"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">EPF Contribution Rate (%)</label>
                      <input
                        type="number"
                        value={settings.epfContributionRate}
                        onChange={(e) => setSettings({ ...settings, epfContributionRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        placeholder="3.67"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">EDLI Contribution Rate (%)</label>
                      <input
                        type="number"
                        value={settings.edliContributionRate}
                        onChange={(e) => setSettings({ ...settings, edliContributionRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        placeholder="0.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Charges Rate (%)</label>
                      <input
                        type="number"
                        value={settings.adminChargesRate}
                        onChange={(e) => setSettings({ ...settings, adminChargesRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        placeholder="0.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">EDLI Admin Charges Rate (%)</label>
                      <input
                        type="number"
                        value={settings.edliAdminChargesRate}
                        onChange={(e) => setSettings({ ...settings, edliAdminChargesRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="pfApplicable"
                        checked={settings.pfApplicable}
                        onChange={(e) => setSettings({ ...settings, pfApplicable: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="pfApplicable" className="ml-2 block text-sm text-gray-700">
                        PF Applicable
                      </label>
                    </div>
                  </div>
                </div>

                {/* ESI Settings */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-green-600" />
                    ESI (Employee State Insurance) Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ESI Rate (%)</label>
                      <input
                        type="number"
                        value={settings.esiEmployeeRate}
                        onChange={(e) => setSettings({ ...settings, esiEmployeeRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        step="0.01"
                        placeholder="0.75"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employer ESI Rate (%)</label>
                      <input
                        type="number"
                        value={settings.esiEmployerRate}
                        onChange={(e) => setSettings({ ...settings, esiEmployerRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        step="0.01"
                        placeholder="3.25"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="esiApplicable"
                        checked={settings.esiApplicable}
                        onChange={(e) => setSettings({ ...settings, esiApplicable: e.target.checked })}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="esiApplicable" className="ml-2 block text-sm text-gray-700">
                        ESI Applicable
                      </label>
                    </div>
                  </div>
                </div>

                {/* Overtime Settings */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    Overtime Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">OT Hourly Rate (₹)</label>
                      <input
                        type="number"
                        value={settings.otHourlyRate}
                        onChange={(e) => setSettings({ ...settings, otHourlyRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Holiday Pay Settings */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-600" />
                    Holiday Pay Rules
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Pay Type</label>
                      <select
                        value={settings.holidayPayType}
                        onChange={(e) => setSettings({ ...settings, holidayPayType: e.target.value as 'paid' | 'unpaid' })}
                        aria-label="Holiday pay type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="paid">Paid Holidays</option>
                        <option value="unpaid">Unpaid Holidays</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Pay Rules</label>
                      <select
                        value={settings.holidayPayRules}
                        onChange={(e) => setSettings({ ...settings, holidayPayRules: e.target.value as 'paid' | 'unpaid' })}
                        aria-label="Holiday pay rules"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="paid">Paid Holidays</option>
                        <option value="unpaid">Unpaid Holidays</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={async () => {
                    try {
                      const defaultSettings: PayrollSettings = {
                        // PF Settings
                        pfEmployeeRate: 12,
                        pfEmployerRate: 12,
                        epsContributionRate: 8.33,
                        epfContributionRate: 3.67,
                        edliContributionRate: 0.5,
                        adminChargesRate: 0.5,
                        edliAdminChargesRate: 0.0,
                        pfApplicable: true,
                        
                        // ESI Settings
                        esiEmployeeRate: 0.75,
                        esiEmployerRate: 3.25,
                        esiApplicable: true,
                        
                        // Overtime Settings
                        otHourlyRate: 50,
                        
                        // Holiday Pay Settings
                        holidayPayRules: 'paid',
                        holidayPayType: 'paid'
                      };
                      await saveSettings(defaultSettings);
                      setSuccessMessage('Settings reset to default values');
                    } catch (error) {
                      setError('Failed to reset settings to default');
                    }
                  }}
                  disabled={savingSettings}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-700"
                >
                  <Settings className="w-4 h-4" />
                  <span>Reset to Default</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      await saveSettings(settings);
                      setSuccessMessage('Settings saved successfully');
                    } catch (error) {
                      setError('Failed to save settings');
                    }
                  }}
                  disabled={savingSettings}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - grouped sections, read-only */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <Eye className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Salary Details</h3>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close view modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Salary Details Content */}
              <div className="space-y-6">
                {/* Employee Header */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-xl">
                      {selectedRecord.employeeName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900">{selectedRecord.employeeName}</h4>
                    <p className="text-gray-600">{selectedRecord.employeeId}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">Payable Days: {selectedRecord.payableDays}</span>
                      <span className="text-sm text-gray-500">OT Hours: {selectedRecord.otHours}</span>
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
                          <p className="text-sm text-gray-600">{selectedRecord.employeeName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Employee ID</p>
                          <p className="text-sm text-gray-600">{selectedRecord.employeeId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Payable Days</p>
                          <p className="text-sm text-gray-600">{selectedRecord.payableDays}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">OT Hours</p>
                          <p className="text-sm text-gray-600">{selectedRecord.otHours}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary Information */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Salary Information</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Gross Salary</span>
                        <span className="text-sm text-gray-900">₹{selectedRecord.grossSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Net Payable</span>
                        <span className="text-sm text-gray-900">₹{selectedRecord.netPayable.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Total Payable</span>
                        <span className="text-sm text-gray-900">₹{selectedRecord.totalPayableAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">OT Payment</span>
                        <span className="text-sm text-gray-900">₹{selectedRecord.otPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">PF Status</span>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedRecord.pfStatus === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {selectedRecord.pfStatus || 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">ESI Status</span>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedRecord.esiStatus === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {selectedRecord.esiStatus || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Salary Breakdown</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Basic + DA:</span>
                      <span className="text-sm font-medium">₹{(selectedRecord.basicDA || selectedRecord.basicSalary).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">HRA:</span>
                      <span className="text-sm font-medium">₹{selectedRecord.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Special Allowances:</span>
                      <span className="text-sm font-medium">₹{selectedRecord.specialAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200 font-semibold">
                      <span className="text-gray-900">Gross Salary:</span>
                      <span className="text-gray-900">₹{selectedRecord.grossSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Deductions</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">P.F (Employee):</span>
                      <span className="text-sm font-medium">₹{selectedRecord.pfEmployee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">E.S.I (Employee):</span>
                      <span className="text-sm font-medium">₹{selectedRecord.esiEmployee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">PT (Professional Tax):</span>
                      <span className="text-sm font-medium">₹{selectedRecord.pt.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Salary Advance:</span>
                      <span className="text-sm font-medium">₹{selectedRecord.salaryAdvance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Other Deductions:</span>
                      <span className="text-sm font-medium">₹{selectedRecord.otherDeductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200 font-semibold">
                      <span className="text-gray-900">Total Deductions:</span>
                      <span className="text-gray-900">₹{(selectedRecord.totalDeductions || (selectedRecord.pfEmployee + selectedRecord.esiEmployee + selectedRecord.pt + selectedRecord.otherDeductions + (selectedRecord.tds || 0))).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Final Calculations */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Final Calculations</h5>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-blue-800 font-medium">Net Payable:</span>
                        <span className="font-bold text-blue-900">₹{selectedRecord.netPayable.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-blue-800 font-medium">Total Payable Amount:</span>
                        <span className="font-bold text-blue-900">₹{selectedRecord.totalPayableAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-blue-800 font-medium">Difference Amount:</span>
                        <span className="font-bold text-blue-900">₹{(selectedRecord.differenceAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {selectedRecord.remarks && (
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Remarks</h5>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedRecord.remarks}</p>
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
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedRecord && (!selectedRecord.employeeId || selectedRecord.employeeId === '') ? 'Create New Payroll Record' : `Edit Salary Record - ${selectedRecord.employeeName}`}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close edit modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
                  <div className="space-y-3">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                      {selectedRecord && (!selectedRecord.employeeId || selectedRecord.employeeId === '') ? (
                        <select
                          value={employees.find(emp => emp.employeeId === formData.employeeId)?.id || ''}
                          onChange={(e) => {
                            const selectedEmployee = employees.find(emp => emp.id === e.target.value);
                            const updatedFormData = { 
                              ...formData, 
                              employeeId: selectedEmployee ? selectedEmployee.employeeId : '',
                              employeeName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '',
                              grossSalary: selectedEmployee ? selectedEmployee.salary : 0
                            };
                            console.log('Employee selected:', selectedEmployee);
                            console.log('Updated form data:', updatedFormData);
                            setFormData(updatedFormData);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Select employee"
                        >
                          <option value="">Select Employee</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.firstName} {employee.lastName} - {employee.employeeId}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.employeeId || ''}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Employee ID"
                          readOnly
                        />
                      )}
                        </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                      <input
                        type="text"
                        value={formData.employeeName || ''}
                        onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Employee name"
                        readOnly
                      />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary</label>
                      <div className="flex space-x-2">
                          <input
                    type="number"
                          value={formData.grossSalary || 0}
                          onChange={(e) => setFormData({ ...formData, grossSalary: Number(e.target.value) })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          aria-label="Gross salary"
                        />
                        <button
                          onClick={() => handleAutoCalculate(formData.employeeId || '', formData.grossSalary || 0)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          title="Auto-calculate based on attendance"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>Auto Calc</span>
                        </button>
                        </div>
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payable Days</label>
                          <input
                            type="number"
                        value={formData.payableDays || 0}
                        onChange={(e) => setFormData({ ...formData, payableDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Payable days"
                      />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">OT Hours</label>
                          <input
                            type="number"
                        value={formData.otHours || 0}
                        onChange={(e) => setFormData({ ...formData, otHours: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Overtime hours"
                      />
                      </div>
                    </div>
                  </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Salary Breakdown</h4>
                  <div className="space-y-3">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                          <input
      type="number"
                        value={formData.basicSalary || 0}
                        onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Basic salary"
                      />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
                          <input
      type="number"
                        value={formData.hra || 0}
                        onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="HRA"
                      />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Allowance</label>
                          <input
      type="number"
                        value={formData.specialAllowance || 0}
                        onChange={(e) => setFormData({ ...formData, specialAllowance: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Special allowance"
                      />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">OT Payment</label>
                          <input
      type="number"
                        value={formData.otPayment || 0}
                        onChange={(e) => setFormData({ ...formData, otPayment: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="OT payment"
                      />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions</label>
                          <input
      type="number"
                        value={formData.otherDeductions || 0}
                        onChange={(e) => setFormData({ ...formData, otherDeductions: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          aria-label="Other deductions"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                      <textarea
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Enter remarks"
                  aria-label="Remarks"
                   />
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
                onClick={handleSaveRecord}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedRecord && (!selectedRecord.employeeId || selectedRecord.employeeId === '') ? 'Create Record' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the payroll record for <strong>{selectedRecord.employeeName}</strong>? 
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
                onClick={confirmDeleteRecord}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Record
                  </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payroll;
