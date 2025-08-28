import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Pagination,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Description as FileTextIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  PlayArrow as ProcessIcon
} from '@mui/icons-material';
import firebaseService from '@/services/firebaseService';
import { showNotification } from '@/utils/notification';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  baseSalary: number;
  joinDate: string;
  isActive: boolean;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employee: Employee;
  month: string;
  year: number;
  basicSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  bonuses: number;
  allowances: number;
  deductions: number;
  taxDeductions: number;
  grossPay: number;
  netPay: number;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'rejected';
  paymentMethod: 'bank' | 'check' | 'cash';
  paymentDate?: string;
  processedBy: string;
  processedAt: string;
  paidAt?: string;
  notes?: string;
  payableDays?: number;
  otHours?: number;
  basicDA?: number;
  hra?: number;
  specialAllowance?: number;
  pfEmployee?: number;
  esiEmployee?: number;
  pt?: number;
  salaryAdvance?: number;
  otherDeductions?: number;
  balanceAdvance?: number;
  tds?: number;
  arrears?: number;
  otPayment?: number;
  totalPayableAmount?: number;
  pfEsiStatus?: string;
  differenceAmount?: number;
  uanNumber?: string;
  esiNumber?: string;
  pfApplicable?: boolean;
  esiApplicable?: boolean;
  remarks?: string;
}



interface PayrollFilters {
  search: string;
  status: string;
  department: string;
  month: string;
  year: string;
  paymentMethod: string;
}

const initialFilters: PayrollFilters = {
  search: '',
  status: '',
  department: '',
  month: '',
  year: new Date().getFullYear().toString(),
  paymentMethod: ''
};

const statusColors = {
  draft: '#9e9e9e',
  pending: '#ff9800',
  approved: '#2196f3',
  paid: '#4caf50',
  rejected: '#f44336'
};

const paymentMethodColors = {
  bank: '#2196f3',
  check: '#ff9800',
  cash: '#4caf50'
};

const Payroll: React.FC = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([]);
  const [filters, setFilters] = useState<PayrollFilters>(initialFilters);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Form state for creating/editing payroll records
  const [payrollForm, setPayrollForm] = useState({
    employeeId: '',
    month: new Date().getMonth().toString().padStart(2, '0'),
    year: new Date().getFullYear(),
    basicSalary: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    bonuses: 0,
    allowances: 0,
    deductions: 0,
    taxDeductions: 0,
    paymentMethod: 'bank' as 'bank' | 'check' | 'cash',
    notes: '',
    payableDays: 0,
    otHours: 0,
    basicDA: 0,
    hra: 0,
    specialAllowance: 0,
    pfEmployee: 0,
    esiEmployee: 0,
    pt: 0,
    salaryAdvance: 0,
    otherDeductions: 0,
    balanceAdvance: 0,
    tds: 0,
    arrears: 0,
    otPayment: 0,
    totalPayableAmount: 0,
    pfEsiStatus: '',
    differenceAmount: 0,
    uanNumber: '',
    esiNumber: '',
    pfApplicable: true,
    esiApplicable: true,
    remarks: ''
  });

  // Fetch attendance data for payroll calculations
  const fetchAttendanceForMonth = async (employeeId: string, month: string, year: number) => {
    try {
      const startDate = `${year}-${month}-01`;
      const endDateObj = new Date(year, parseInt(month), 0);
      const endDate = (endDateObj.toISOString().split('T')[0]) || '';
      
      const result = await firebaseService.getCollection('attendance');
      if (!result.success || !result.data) return null;

      // Filter attendance records for the specific employee and month
      const monthRecords = result.data.filter((record: any) => {
        const recordDate = record.date;
        return record.employeeId === employeeId && 
               recordDate >= startDate && 
               endDate !== '' && recordDate <= endDate;
      });

      return monthRecords;
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      return null;
    }
  };

  // Calculate payable days and overtime from attendance
  const calculateAttendanceMetrics = async (employeeId: string, month: string, year: number) => {
    try {
      const attendanceRecords = await fetchAttendanceForMonth(employeeId, month, year);
      if (!attendanceRecords) return { payableDays: 0, otHours: 0 };

      // Get holidays for the month
      const holidaysResult = await firebaseService.getCollection('holidays');
      const holidays = holidaysResult.success && holidaysResult.data ? holidaysResult.data : [];
      
      // Get leave requests for the month
      const leavesResult = await firebaseService.getCollection('leaveRequests');
      const leaves = leavesResult.success && leavesResult.data ? leavesResult.data : [];

      let payableDays = 0;
      let totalOtHours = 0;

      // Get all dates in the month
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0);
      
      if (!endDate) return { payableDays: 0, otHours: 0 };
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!dateStr) continue;
        
        const dayOfWeek = d.getDay();
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // Skip holidays
        const isHoliday = holidays.some((h: any) => h.date === dateStr && (h.isActive ?? true));
        if (isHoliday) continue;
        
        // Check if employee has approved leave on this date
        const hasLeave = leaves.some((l: any) => 
          l.employeeId === employeeId && 
          l['status'] === 'approved' &&
          l.startDate <= dateStr && 
          (l.endDate || l.startDate) >= dateStr
        );
        if (hasLeave) continue;
        
        // Check if employee was present on this date
        const attendanceRecord = attendanceRecords.find((r: any) => r.date === dateStr);
        if (attendanceRecord && attendanceRecord['status'] === 'present') {
          payableDays++;
          
          // Calculate overtime hours (assuming 8 hours is standard work day)
          if (attendanceRecord['totalHours'] && attendanceRecord['totalHours'] > 8) {
            totalOtHours += attendanceRecord['totalHours'] - 8;
          }
        }
      }

      return { payableDays, otHours: totalOtHours };
    } catch (err) {
      console.error('Error calculating attendance metrics:', err);
      return { payableDays: 0, otHours: 0 };
    }
  };

  // Fetch employees from Firebase
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      setEmployeesError(null);

      const mapToEmployee = (emp: any): Employee => ({
        id: emp.id,
        employeeId: emp.employeeId || emp.employee_id || emp.userId || emp.uid || '',
        firstName: emp.firstName || emp.first_name || emp.givenName || '',
        lastName: emp.lastName || emp.last_name || emp.familyName || '',
        email: emp.email || '',
        department: emp.department || emp.dept || '',
        position: emp.position || emp.designation || '',
        baseSalary: emp.baseSalary || emp.base_salary || emp.salary || 0,
        joinDate: emp.joinDate || emp.join_date || emp.joinedAt || '',
        isActive: emp.isActive !== false
      });

      // Try 'employees' collection first
      let employeesData: Employee[] = [];
      const employeesResult = await firebaseService.getCollection('employees');
      if (employeesResult.success && employeesResult.data) {
        employeesData = employeesResult.data.map(mapToEmployee);
      }

      // Fallback to 'users' collection if empty
      if (employeesData.length === 0) {
        const usersResult = await firebaseService.getCollection('users');
        if (usersResult.success && usersResult.data) {
          employeesData = usersResult.data
            .filter((u: any) => (u.role ? ['employee','staff','hr','finance','admin'].includes(String(u.role).toLowerCase()) : true))
            .map(mapToEmployee);
        }
      }

      setEmployees(employeesData);
      if (employeesData.length === 0) {
        setEmployeesError('No employees found');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployeesError('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Fetch payroll records from Firebase
  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await firebaseService.getCollection('payroll');
      
      if (result.success && result.data) {
        const payrollData = result.data.map((record: any) => {
          // Handle both embedded employee object and employeeId field
          let employee;
          if (record.employee && record.employee.id) {
            // If employee object is embedded, use it directly
            employee = record.employee;
          } else if (record.employeeId) {
            // If only employeeId is stored, find the employee
            employee = employees.find(emp => emp.id === record.employeeId);
          }
          
          return {
            id: record.id,
            employeeId: record.employeeId || (record.employee ? record.employee.id : ''),
            employee: employee || {
              id: '',
              employeeId: '',
              firstName: 'Unknown',
              lastName: 'Employee',
              email: '',
              department: '',
              position: '',
              baseSalary: 0,
              joinDate: '',
              isActive: false
            },
            month: record.month || '',
            year: record.year || new Date().getFullYear(),
            basicSalary: record.basicSalary || 0,
            overtimeHours: record.overtimeHours || 0,
            overtimeRate: record.overtimeRate || 0,
            overtimePay: record.overtimePay || 0,
            bonuses: record.bonuses || 0,
            allowances: record.allowances || 0,
            deductions: record.deductions || 0,
            taxDeductions: record.taxDeductions || 0,
            grossPay: record.grossPay || 0,
            netPay: record.netPay || 0,
            status: record.status || 'draft',
            paymentMethod: record.paymentMethod || 'bank',
            paymentDate: record.paymentDate || '',
            processedBy: record.processedBy || '',
            processedAt: record.processedAt || '',
            paidAt: record.paidAt || '',
            notes: record.notes || '',
            // Add the new fields
            payableDays: record.payableDays || 0,
            otHours: record.otHours || 0,
            basicDA: record.basicDA || 0,
            hra: record.hra || 0,
            specialAllowance: record.specialAllowance || 0,
            pfEmployee: record.pfEmployee || 0,
            esiEmployee: record.esiEmployee || 0,
            pt: record.pt || 0,
            salaryAdvance: record.salaryAdvance || 0,
            otherDeductions: record.otherDeductions || 0,
            arrears: record.arrears || 0,
            pfApplicable: record.pfApplicable !== false,
            esiApplicable: record.esiApplicable !== false,
            uanNumber: record.uanNumber || '',
            esiNumber: record.esiNumber || '',
            remarks: record.remarks || ''
          };
        });
        setPayrollRecords(payrollData);
      } else {
        setError('Failed to load payroll records');
        showNotification('Error loading payroll records', 'error');
      }
    } catch (err) {
      console.error('Error fetching payroll records:', err);
      setError('Failed to load payroll records');
      showNotification('Error loading payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate payroll totals
  const calculatePayrollTotals = useCallback(() => {
    const totalBasicSalary = payrollRecords.reduce((sum, record) => sum + record.basicSalary, 0);
    const totalAllowances = payrollRecords.reduce((sum, record) => sum + record.allowances, 0);
    const totalDeductions = payrollRecords.reduce((sum, record) => sum + record.deductions, 0);
    const totalNetSalary = payrollRecords.reduce((sum, record) => sum + record.netPay, 0);
    const totalOvertimePay = payrollRecords.reduce((sum, record) => sum + record.overtimePay, 0);
    const totalBonuses = payrollRecords.reduce((sum, record) => sum + record.bonuses, 0);
    const totalTaxDeductions = payrollRecords.reduce((sum, record) => sum + record.taxDeductions, 0);
    
    return {
      totalEmployees: payrollRecords.length,
      totalBasicSalary,
      totalAllowances,
      totalDeductions,
      totalNetSalary,
      averageSalary: payrollRecords.length > 0 ? totalNetSalary / payrollRecords.length : 0,
      totalOvertimePay,
      totalBonuses,
      totalTaxDeductions
    };
  }, [payrollRecords]);

  const payrollSummary = calculatePayrollTotals();
  const [activeTab, setActiveTab] = useState(0);

  // Settings state (persisted in Firebase under 'payrollSettings/percentages')
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    pfPercent: 12,
    epsPercent: 8.33,
    epfPercent: 3.67,
    edliPercent: 0.5,
    adminChargesPercent: 0.5,
    esiEmployeePercent: 0.75,
    esiEmployerPercent: 3.25,
    ptAmount: 0,
    hraPercent: 40,
    daPercent: 0,
    specialAllowancePercent: 0
  });

  const fetchSettings = useCallback(async () => {
    try {
      const result = await firebaseService.getDocument('payrollSettings', 'percentages');
      if (result.success && result.data) {
        setSettings((prev) => ({ ...prev, ...result.data }));
      }
    } catch (e) {
      // ignore; use defaults
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handler functions
  const handlePayrollFormChange = (field: string, value: any) => {
    setPayrollForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-calculate attendance metrics when employee is selected
  const handleEmployeeSelection = async (employeeId: string) => {
    if (!employeeId) return;
    
    // Update the form
    setPayrollForm(prev => ({
      ...prev,
      employeeId
    }));

    // Auto-calculate attendance metrics
    const metrics = await calculateAttendanceMetrics(employeeId, payrollForm.month, payrollForm.year);
    
    // Update payable days and OT hours
    setPayrollForm(prev => ({
      ...prev,
      payableDays: metrics.payableDays,
      otHours: metrics.otHours
    }));

    // Auto-populate basic salary from employee data
    const selectedEmployee = employees.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      const basicSalary = selectedEmployee.baseSalary || 0;
      
      // Calculate PF/ESI and other values based on settings
      const da = (settings.daPercent / 100) * basicSalary;
      const hra = (settings.hraPercent / 100) * basicSalary;
      const specialAllowance = (settings.specialAllowancePercent / 100) * basicSalary;
      const pfEmployee = (settings.pfPercent / 100) * basicSalary;
      const esiEmployee = (settings.esiEmployeePercent / 100) * (basicSalary + hra + specialAllowance);
      const pt = settings.ptAmount || 0;
      
      setPayrollForm(prev => ({
        ...prev,
        basicSalary,
        basicDA: da,
        hra: hra,
        specialAllowance: specialAllowance,
        pfEmployee: pfEmployee,
        esiEmployee: esiEmployee,
        pt: pt
      }));
    }
  };

  const handleSavePayroll = async () => {
    try {
      if (!payrollForm.employeeId || payrollForm.basicSalary <= 0) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const employee = employees.find(emp => emp.id === payrollForm.employeeId);
      if (!employee) {
        showNotification('Employee not found', 'error');
        return;
      }

      const da = (settings.daPercent / 100) * payrollForm.basicSalary;
      const hra = (settings.hraPercent / 100) * payrollForm.basicSalary;
      const specialAllowance = (settings.specialAllowancePercent / 100) * payrollForm.basicSalary;
      const overtimePay = payrollForm.overtimeHours * payrollForm.overtimeRate;
      const grossPay = payrollForm.basicSalary + da + hra + specialAllowance + overtimePay + payrollForm.bonuses + payrollForm.allowances + (payrollForm.arrears || 0);

      const pfEmployee = payrollForm.pfApplicable ? (settings.pfPercent / 100) * payrollForm.basicSalary : 0;
      const esiEmployee = payrollForm.esiApplicable ? (settings.esiEmployeePercent / 100) * (payrollForm.basicSalary + hra + specialAllowance) : 0;
      const pt = settings.ptAmount || 0;

      const totalDeductions = (payrollForm.deductions || 0) + (payrollForm.taxDeductions || 0) + (payrollForm.salaryAdvance || 0) + (payrollForm.otherDeductions || 0) + pfEmployee + esiEmployee + pt;
      const netPay = grossPay - totalDeductions;

      const payrollData = {
        ...payrollForm,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department,
          position: employee.position,
          baseSalary: employee.baseSalary,
          joinDate: employee.joinDate,
          isActive: employee.isActive
        },
        overtimePay,
        grossPay,
        netPay,
        payableDays: payrollForm.payableDays,
        otHours: payrollForm.otHours,
        basicDA: da,
        hra: hra,
        specialAllowance: specialAllowance,
        pfEmployee: pfEmployee,
        esiEmployee: esiEmployee,
        pt: pt,
        arrears: payrollForm.arrears,
        salaryAdvance: payrollForm.salaryAdvance,
        otherDeductions: payrollForm.otherDeductions,
        pfApplicable: payrollForm.pfApplicable,
        esiApplicable: payrollForm.esiApplicable,
        uanNumber: payrollForm.uanNumber,
        esiNumber: payrollForm.esiNumber,
        remarks: payrollForm.remarks,
        status: 'draft' as const,
        processedBy: 'current-user-id', // TODO: Get from auth context
        processedAt: new Date().toISOString()
      };

      if (isCreateMode) {
        const result = await firebaseService.addDocument('payroll', payrollData);
        if (result.success) {
          showNotification('Payroll record created successfully!', 'success');
          setIsDialogOpen(false);
          resetPayrollForm();
          fetchPayrollRecords();
        } else {
          showNotification('Failed to create payroll record', 'error');
        }
      } else if (selectedRecord) {
        const result = await firebaseService.updateDocument('payroll', selectedRecord.id, payrollData);
        if (result.success) {
          showNotification('Payroll record updated successfully!', 'success');
          setIsDialogOpen(false);
          resetPayrollForm();
          fetchPayrollRecords();
        } else {
          showNotification('Failed to update payroll record', 'error');
        }
      }
    } catch (err) {
      console.error('Error saving payroll record:', err);
      showNotification('Error saving payroll record', 'error');
    }
  };

  const resetPayrollForm = () => {
    setPayrollForm({
      employeeId: '',
      month: new Date().getMonth().toString().padStart(2, '0'),
      year: new Date().getFullYear(),
      basicSalary: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      bonuses: 0,
      allowances: 0,
      deductions: 0,
      taxDeductions: 0,
      paymentMethod: 'bank',
      notes: '',
      payableDays: 0,
      otHours: 0,
      basicDA: 0,
      hra: 0,
      specialAllowance: 0,
      pfEmployee: 0,
      esiEmployee: 0,
      pt: 0,
      salaryAdvance: 0,
      otherDeductions: 0,
      balanceAdvance: 0,
      tds: 0,
      arrears: 0,
      otPayment: 0,
      totalPayableAmount: 0,
      pfEsiStatus: '',
      differenceAmount: 0,
      uanNumber: '',
      esiNumber: '',
      pfApplicable: true,
      esiApplicable: true,
      remarks: ''
    });
  };

  const handleCreatePayroll = async () => {
    resetPayrollForm();
    setSelectedRecord(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    if (employees.length === 0 && !employeesLoading) {
      await fetchEmployees();
      if (employeesError) {
        showNotification(employeesError, 'error');
      }
    }
    setIsDialogOpen(true);
  };

  const handleEditPayroll = async (record: PayrollRecord) => {
    setPayrollForm({
      employeeId: record.employeeId,
      month: record.month,
      year: record.year,
      basicSalary: record.basicSalary,
      overtimeHours: record.overtimeHours,
      overtimeRate: record.overtimeRate,
      bonuses: record.bonuses,
      allowances: record.allowances,
      deductions: record.deductions,
      taxDeductions: record.taxDeductions,
      paymentMethod: record.paymentMethod,
      notes: record.notes || '',
      payableDays: record.payableDays || 0,
      otHours: record.otHours || 0,
      basicDA: record.basicDA || 0,
      hra: record.hra || 0,
      specialAllowance: record.specialAllowance || 0,
      pfEmployee: record.pfEmployee || 0,
      esiEmployee: record.esiEmployee || 0,
      pt: record.pt || 0,
      salaryAdvance: record.salaryAdvance || 0,
      otherDeductions: record.otherDeductions || 0,
      balanceAdvance: record.balanceAdvance || 0,
      tds: record.tds || 0,
      arrears: record.arrears || 0,
      otPayment: record.otPayment || 0,
      totalPayableAmount: record.totalPayableAmount || 0,
      pfEsiStatus: record.pfEsiStatus || '',
      differenceAmount: record.differenceAmount || 0,
      uanNumber: record.uanNumber || '',
      esiNumber: record.esiNumber || '',
      pfApplicable: record.pfApplicable ?? true,
      esiApplicable: record.esiApplicable ?? true,
      remarks: record.remarks || ''
    });
    setSelectedRecord(record);
    setIsViewMode(false);
    setIsCreateMode(false);
    if (employees.length === 0 && !employeesLoading) {
      await fetchEmployees();
      if (employeesError) {
        showNotification(employeesError, 'error');
      }
    }
    setIsDialogOpen(true);
  };

  const handleViewPayroll = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setIsViewMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleDeletePayroll = async (recordId: string) => {
    try {
      const result = await firebaseService.deleteDocument('payroll', recordId);
      
      if (result.success) {
        setPayrollRecords(prev => prev.filter(record => record.id !== recordId));
        setSnackbar({
          open: true,
          message: 'Payroll record deleted successfully',
          severity: 'success'
        });
        showNotification('Payroll record deleted successfully!', 'success');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to delete payroll record',
          severity: 'error'
        });
        showNotification('Failed to delete payroll record', 'error');
      }
    } catch (err) {
      console.error('Error deleting payroll record:', err);
      setSnackbar({
        open: true,
        message: 'Error deleting payroll record',
        severity: 'error'
      });
      showNotification('Error deleting payroll record', 'error');
    }
  };

  const handleProcessPayroll = async (recordId: string) => {
    try {
      const record = payrollRecords.find(r => r.id === recordId);
      if (!record) return;

      const updatedRecord = {
        ...record,
        status: 'approved',
        processedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('payroll', recordId, updatedRecord);
      if (result.success) {
        fetchPayrollRecords();
        showNotification('Payroll record processed successfully!', 'success');
      } else {
        showNotification('Failed to process payroll record', 'error');
      }
    } catch (err) {
      console.error('Error processing payroll record:', err);
      showNotification('Error processing payroll record', 'error');
    }
  };

  const handlePayPayroll = async (recordId: string) => {
    try {
      const record = payrollRecords.find(r => r.id === recordId);
      if (!record) {
        showNotification('Payroll record not found', 'error');
        return;
      }

      const updatedRecord = {
        ...record,
        status: 'paid',
        paidAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('payroll', recordId, updatedRecord);
      if (result.success) {
        fetchPayrollRecords();
        showNotification('Payroll record marked as paid!', 'success');
      } else {
        showNotification('Failed to mark payroll record as paid', 'error');
      }
    } catch (err) {
      console.error('Error marking payroll record as paid:', err);
      showNotification('Error marking payroll record as paid', 'error');
    }
  };

  const handleExportPayroll = () => {
    try {
      // Create CSV data
      const csvData = [
        ['Employee ID', 'Employee Name', 'Department', 'Position', 'Month', 'Year', 'Basic Salary', 'Allowances', 'Deductions', 'Net Pay', 'Status', 'Payment Method'],
        ...filteredRecords.map(record => [
          record.employee.employeeId,
          `${record.employee.firstName} ${record.employee.lastName}`,
          record.employee.department,
          record.employee.position,
          record.month,
          record.year.toString(),
          formatIndianCurrency(record.basicSalary),
          formatIndianCurrency(record.allowances),
          formatIndianCurrency(record.deductions),
          formatIndianCurrency(record.netPay),
          record.status,
          record.paymentMethod
        ])
      ];

      // Convert to CSV string
      const csvString = csvData.map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('Payroll data exported successfully!', 'success');
    } catch (err) {
      console.error('Error exporting payroll data:', err);
      showNotification('Error exporting payroll data', 'error');
    }
  };
// Generate payroll slip HTML content
const generatePayrollSlipHTML = (record: PayrollRecord) => {
  const employee = record.employee;
  const monthYear = formatMonthYear(record.month, record.year);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payroll Slip - ${employee.firstName} ${employee.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #333; }
        .payroll-title { font-size: 20px; color: #666; margin-top: 10px; }
        .employee-info { margin-bottom: 30px; }
        .info-row { display: flex; margin-bottom: 10px; }
        .info-label { font-weight: bold; width: 150px; }
        .info-value { flex: 1; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
        .amount-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .amount-label { font-weight: bold; }
        .amount-value { text-align: right; }
        .total-row { border-top: 2px solid #333; padding-top: 10px; margin-top: 15px; font-weight: bold; font-size: 16px; }
        .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">HRMS Company</div>
        <div class="payroll-title">PAYROLL SLIP</div>
        <div>${monthYear}</div>
      </div>
      
      <div class="employee-info">
        <div class="info-row">
          <div class="info-label">Employee ID:</div>
          <div class="info-value">${employee.employeeId}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Name:</div>
          <div class="info-value">${employee.firstName} ${employee.lastName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Department:</div>
          <div class="info-value">${employee.department}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Position:</div>
          <div class="info-value">${employee.position}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Payable Days:</div>
          <div class="info-value">${record.payableDays || 0}</div>
        </div>
        <div class="info-row">
          <div class="info-label">OT Hours:</div>
          <div class="info-value">${record.otHours || 0}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Earnings</div>
        <div class="amount-row">
          <div class="amount-label">Basic Salary:</div>
          <div class="amount-value">₹${record.basicSalary?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">DA:</div>
          <div class="amount-value">₹${record.basicDA?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">HRA:</div>
          <div class="amount-value">₹${record.hra?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">Special Allowance:</div>
          <div class="amount-value">₹${record.specialAllowance?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">Overtime Pay:</div>
          <div class="amount-value">₹${record.overtimePay?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">Bonuses:</div>
          <div class="amount-value">₹${record.bonuses?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">Other Allowances:</div>
          <div class="amount-value">₹${record.allowances?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">Arrears:</div>
          <div class="amount-value">₹${record.arrears?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row total-row">
          <div class="amount-label">Gross Salary:</div>
          <div class="amount-value">₹${record.grossPay?.toLocaleString('en-IN') || 0}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Deductions</div>
        <div class="amount-row">
          <div class="amount-label">PF Employee:</div>
          <div class="amount-value">₹${record.pfEmployee?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">ESI Employee:</div>
          <div class="amount-value">₹${record.esiEmployee?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">PT:</div>
          <div class="amount-value">₹${record.pt?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">Salary Advance:</div>
          <div class="amount-value">₹${record.salaryAdvance?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">Other Deductions:</div>
          <div class="amount-value">₹${record.otherDeductions?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row">
          <div class="amount-label">TDS:</div>
          <div class="amount-value">₹${record.taxDeductions?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div class="amount-row total-row">
          <div class="amount-label">Total Deductions:</div>
          <div class="amount-value">₹${((record.pfEmployee || 0) + (record.esiEmployee || 0) + (record.pt || 0) + (record.salaryAdvance || 0) + (record.otherDeductions || 0) + (record.taxDeductions || 0)).toLocaleString('en-IN')}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Net Pay</div>
        <div class="amount-row total-row">
          <div class="amount-label">Net Payable Amount:</div>
          <div class="amount-value">₹${record.netPay?.toLocaleString('en-IN') || 0}</div>
        </div>
      </div>
      
      <div class="footer">
        <p>This is a computer generated document. No signature required.</p>
        <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      
      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()">Print Payroll Slip</button>
      </div>
    </body>
    </html>
  `;
};

// Download payroll slip as HTML
const downloadPayrollSlip = async (record: PayrollRecord) => {
  try {
    const htmlContent = generatePayrollSlipHTML(record);
    
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payroll_${record.employee.firstName}_${record.employee.lastName}_${record.month}_${record.year}.html`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    showNotification('Payroll slip downloaded successfully!', 'success');
  } catch (error) {
    console.error('Error downloading payroll slip:', error);
    showNotification('Error downloading payroll slip', 'error');
  }
};

// Print payroll slip
const printPayrollSlip = (record: PayrollRecord) => {
  try {
    const htmlContent = generatePayrollSlipHTML(record);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      showNotification('Print dialog opened successfully!', 'success');
    } else {
      showNotification('Please allow popups to print payroll slip', 'info');
    }
  } catch (error) {
    console.error('Error printing payroll slip:', error);
    showNotification('Error printing payroll slip', 'error');
  }
};
  // Filter and search functionality
  useEffect(() => {
    applyFilters();
  }, [payrollRecords, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...payrollRecords];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(record =>
        record.employee.firstName.toLowerCase().includes(searchLower) ||
        record.employee.lastName.toLowerCase().includes(searchLower) ||
        record.employee.department.toLowerCase().includes(searchLower) ||
        record.employee.position.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(record => record.status === filters.status);
    }

    if (filters.department) {
      filtered = filtered.filter(record => record.employee.department === filters.department);
    }

    if (filters.month) {
      filtered = filtered.filter(record => record.month === filters.month);
    }

    if (filters.year) {
      filtered = filtered.filter(record => record.year.toString() === filters.year);
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(record => record.paymentMethod === filters.paymentMethod);
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [payrollRecords, filters]);

  const handleFilterChange = (field: keyof PayrollFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load data on component mount
  useEffect(() => {
    fetchEmployees();
    fetchPayrollRecords();
  }, []);

  // Helper functions
  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Removed unused formatIndianDate helper (not referenced)

  const formatMonthYear = (month: string, year: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;
    }
    return `${month}/${year}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileTextIcon color="action" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'approved':
        return <CheckCircleIcon color="info" />;
      case 'paid':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return <FileTextIcon />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank':
        return <BankIcon />;
      case 'check':
        return <ReceiptIcon />;
      case 'cash':
        return <MoneyIcon />;
      default:
        return <MoneyIcon />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchPayrollRecords} variant="contained">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Payroll Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportPayroll}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePayroll}
            sx={{ bgcolor: 'primary.main' }}
          >
            Process Payroll
          </Button>
        </Box>
      </Box>

      {/* Settings Modal Trigger */}
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => setSettingsOpen(true)}>Salary Calculation Settings</Button>
      </Box>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Salary Calculation Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
                         <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
               <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                 <TextField label="PF %" type="number" fullWidth value={settings.pfPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, pfPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="EPS %" type="number" fullWidth value={settings.epsPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, epsPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="EPF %" type="number" fullWidth value={settings.epfPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, epfPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="EDLI %" type="number" fullWidth value={settings.edliPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, edliPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="Admin Charges %" type="number" fullWidth value={settings.adminChargesPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, adminChargesPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
               </Box>
               <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                 <TextField label="ESI Employee %" type="number" fullWidth value={settings.esiEmployeePercent}
                   onChange={(e) => setSettings((s) => ({ ...s, esiEmployeePercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="ESI Employer %" type="number" fullWidth value={settings.esiEmployerPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, esiEmployerPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="PT Amount" type="number" fullWidth value={settings.ptAmount}
                   onChange={(e) => setSettings((s) => ({ ...s, ptAmount: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="HRA %" type="number" fullWidth value={settings.hraPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, hraPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="DA %" type="number" fullWidth value={settings.daPercent}
                   onChange={(e) => setSettings((s) => ({ ...s, daPercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
                 <TextField label="Special Allowance %" type="number" fullWidth value={settings.specialAllowancePercent}
                   onChange={(e) => setSettings((s) => ({ ...s, specialAllowancePercent: parseFloat(e.target.value) || 0 }))} sx={{ mb: 2 }} />
               </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const res = await firebaseService.updateDocument('payrollSettings', 'percentages', settings);
              if (res.success) {
                showNotification('Settings saved', 'success');
                setSettingsOpen(false);
              } else {
                showNotification('Failed to save settings', 'error');
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Payroll" />
          <Tab label="PF Statement" />
          <Tab label="ESI Statement" />
        </Tabs>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, 
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'primary.100', borderRadius: 1, mr: 2 }}>
                <PersonIcon color="primary" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h4" component="div">
                  {payrollSummary.totalEmployees}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'success.100', borderRadius: 1, mr: 2 }}>
                <MoneyIcon color="success" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Net Salary
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {formatIndianCurrency(payrollSummary.totalNetSalary)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'warning.100', borderRadius: 1, mr: 2 }}>
                <PendingIcon color="warning" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {payrollRecords.filter(record => record.status === 'pending').length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'info.100', borderRadius: 1, mr: 2 }}>
                <MoneyIcon color="info" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Average Salary
                </Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {formatIndianCurrency(payrollSummary.averageSalary)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* No Data State */}
      {payrollRecords.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MoneyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No payroll records available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by processing your first payroll record.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePayroll}
          >
            Process First Payroll
          </Button>
        </Box>
      )}

      {/* Filters */}
      {payrollRecords.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2 
          }}>
            <TextField
              fullWidth
              label="Search Payroll"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon />
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {Array.from(new Set(employees.map(emp => emp.department))).map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Payroll Records Table (Tab 0) */}
      {activeTab === 0 && payrollRecords.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Month/Year</TableCell>
                  <TableCell>Payable Days</TableCell>
                  <TableCell>OT Hours</TableCell>
                  <TableCell>Earnings (Basic+DA)</TableCell>
                  <TableCell>HRA</TableCell>
                  <TableCell>Special Allowance</TableCell>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell>PF</TableCell>
                  <TableCell>ESI</TableCell>
                  <TableCell>PT</TableCell>
                  <TableCell>Salary Advance</TableCell>
                  <TableCell>Other Deductions</TableCell>
                  <TableCell>Total Deductions</TableCell>
                  <TableCell>Arrears</TableCell>
                  <TableCell>Net Payable</TableCell>
                  <TableCell>OT Payment</TableCell>
                  <TableCell>Total Payable</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>PF & ESI</TableCell>
                  <TableCell>Difference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((record, idx) => {
                  const da = (settings.daPercent / 100) * record.basicSalary;
                  const hra = (settings.hraPercent / 100) * record.basicSalary;
                  const specialAllowance = (settings.specialAllowancePercent / 100) * record.basicSalary;
                  const pf = record.pfApplicable ? (settings.pfPercent / 100) * record.basicSalary : 0;
                  const esi = record.esiApplicable ? (settings.esiEmployeePercent / 100) * (record.basicSalary + hra + specialAllowance) : 0;
                  const pt = settings.ptAmount || 0;
                  const totalDeductions = (record.deductions || 0) + (record.taxDeductions || 0) + (record.salaryAdvance || 0) + (record.otherDeductions || 0) + pf + esi + pt;
                  const netPayable = record.grossPay - totalDeductions;
                  const otPayment = record.overtimePay;
                  const totalPayable = netPayable + otPayment;
                  const pfEsiStatus = `${record.pfApplicable ? 'PF' : ''}${record.pfApplicable && record.esiApplicable ? ' & ' : ''}${record.esiApplicable ? 'ESI' : ''}` || 'N/A';
                  const difference = totalPayable - record.netPay;
                  return (
                  <TableRow key={record.id} hover>
                    <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                    <TableCell>{record.employee.employeeId}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {record.employee.firstName} {record.employee.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {record.employee.department} • {record.employee.position}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatMonthYear(record.month, record.year)}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.payableDays ?? '-'}</TableCell>
                    <TableCell>{record.overtimeHours}</TableCell>
                    <TableCell>{formatIndianCurrency(record.basicSalary + da)}</TableCell>
                    <TableCell>{formatIndianCurrency(hra)}</TableCell>
                    <TableCell>{formatIndianCurrency(specialAllowance)}</TableCell>
                    <TableCell>{formatIndianCurrency(record.grossPay)}</TableCell>
                    <TableCell>{formatIndianCurrency(pf)}</TableCell>
                    <TableCell>{formatIndianCurrency(esi)}</TableCell>
                    <TableCell>{formatIndianCurrency(pt)}</TableCell>
                    <TableCell>{formatIndianCurrency(record.salaryAdvance || 0)}</TableCell>
                    <TableCell>{formatIndianCurrency(record.otherDeductions || 0)}</TableCell>
                    <TableCell>{formatIndianCurrency(totalDeductions)}</TableCell>
                    <TableCell>{formatIndianCurrency(record.arrears || 0)}</TableCell>
                    <TableCell>{formatIndianCurrency(netPayable)}</TableCell>
                    <TableCell>{formatIndianCurrency(otPayment)}</TableCell>
                    <TableCell>{formatIndianCurrency(totalPayable)}</TableCell>
                    <TableCell>{record.remarks || '-'}</TableCell>
                    <TableCell>{pfEsiStatus}</TableCell>
                    <TableCell>{formatIndianCurrency(difference)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(record.status)}
                        <Chip
                          label={record.status}
                          size="small"
                          sx={{
                            bgcolor: statusColors[record.status],
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPaymentMethodIcon(record.paymentMethod)}
                        <Chip
                          label={record.paymentMethod}
                          size="small"
                          sx={{
                            bgcolor: paymentMethodColors[record.paymentMethod],
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewPayroll(record)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Payroll">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPayroll(record)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {record.status === 'draft' && (
                          <Tooltip title="Process Payroll">
                            <IconButton
                              size="small"
                              onClick={() => handleProcessPayroll(record.id)}
                              color="success"
                            >
                              <ProcessIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {record.status === 'pending' && (
                          <Tooltip title="Process Payroll">
                            <IconButton
                              size="small"
                              onClick={() => handleProcessPayroll(record.id)}
                              color="success"
                            >
                              <ProcessIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {record.status === 'approved' && (
                          <Tooltip title="Mark as Paid">
                            <IconButton
                              size="small"
                              onClick={() => handlePayPayroll(record.id)}
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete Payroll">
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePayroll(record.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Payroll Slip">
                          <IconButton
                            size="small"
                            onClick={() => downloadPayrollSlip(record)}
                            color="info"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Payroll Slip">
                          <IconButton
                            size="small"
                            onClick={() => printPayrollSlip(record)}
                            color="secondary"
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* PF Statement (Tab 1) */}
      {activeTab === 1 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>UAN Number</TableCell>
                  <TableCell>PF Basic</TableCell>
                  <TableCell>EPF 12% (A/C 1)</TableCell>
                  <TableCell>EPS 8.33% (A/C 10)</TableCell>
                  <TableCell>EPF 3.67% (A/C 1)</TableCell>
                  <TableCell>EDLI 0.5% (A/C 2)</TableCell>
                  <TableCell>Admin 0.5% (A/C 21)</TableCell>
                  <TableCell>EDLI Admin 0.00% (A/C 22)</TableCell>
                  <TableCell>Employer Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((record, idx) => {
                  const pfBasic = record.basicSalary;
                  const epf12 = (settings.pfPercent / 100) * pfBasic;
                  const eps833 = (settings.epsPercent / 100) * pfBasic;
                  const epf367 = (settings.epfPercent / 100) * pfBasic;
                  const edli05 = (settings.edliPercent / 100) * pfBasic;
                  const admin05 = (settings.adminChargesPercent / 100) * pfBasic;
                  const edliAdmin0 = 0;
                  const employerTotal = eps833 + epf367 + edli05 + admin05 + edliAdmin0;
                  return (
                    <TableRow key={record.id} hover>
                      <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell>{record.employee.employeeId}</TableCell>
                      <TableCell>{record.employee.firstName} {record.employee.lastName}</TableCell>
                      <TableCell>{record.employee.employeeId || '-'}</TableCell>
                      <TableCell>{formatIndianCurrency(pfBasic)}</TableCell>
                      <TableCell>{formatIndianCurrency(epf12)}</TableCell>
                      <TableCell>{formatIndianCurrency(eps833)}</TableCell>
                      <TableCell>{formatIndianCurrency(epf367)}</TableCell>
                      <TableCell>{formatIndianCurrency(edli05)}</TableCell>
                      <TableCell>{formatIndianCurrency(admin05)}</TableCell>
                      <TableCell>{formatIndianCurrency(edliAdmin0)}</TableCell>
                      <TableCell>{formatIndianCurrency(employerTotal)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ESI Statement (Tab 2) */}
      {activeTab === 2 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>ESI Number</TableCell>
                  <TableCell>Gross (Basic+HRA+Allowances)</TableCell>
                  <TableCell>Employee 0.75%</TableCell>
                  <TableCell>Employer 3.25%</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((record, idx) => {
                  const hra = (settings.hraPercent / 100) * record.basicSalary;
                  const specialAllowance = (settings.specialAllowancePercent / 100) * record.basicSalary;
                  const grossBase = record.basicSalary + hra + specialAllowance;
                  const emp075 = (settings.esiEmployeePercent / 100) * grossBase;
                  const empr325 = (settings.esiEmployerPercent / 100) * grossBase;
                  const total = emp075 + empr325;
                  return (
                    <TableRow key={record.id} hover>
                      <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell>{record.employee.employeeId}</TableCell>
                      <TableCell>{record.employee.firstName} {record.employee.lastName}</TableCell>
                      <TableCell>{record.employee.employeeId || '-'}</TableCell>
                      <TableCell>{formatIndianCurrency(grossBase)}</TableCell>
                      <TableCell>{formatIndianCurrency(emp075)}</TableCell>
                      <TableCell>{formatIndianCurrency(empr325)}</TableCell>
                      <TableCell>{formatIndianCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pagination */}
      {Math.ceil(filteredRecords.length / itemsPerPage) > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(filteredRecords.length / itemsPerPage)}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Payroll Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon />
            <Typography variant="h6">
              {isViewMode ? 'Payroll Details' : isCreateMode ? 'Process New Payroll' : 'Edit Payroll'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isViewMode && selectedRecord ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                               <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                 <Typography variant="h6" gutterBottom>Employee Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Employee Name"
                        secondary={`${selectedRecord.employee.firstName} ${selectedRecord.employee.lastName}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Department"
                        secondary={selectedRecord.employee.department}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Position"
                        secondary={selectedRecord.employee.position}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Month/Year"
                        secondary={formatMonthYear(selectedRecord.month, selectedRecord.year)}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="h6" gutterBottom>Payroll Details</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Basic Salary"
                        secondary={formatIndianCurrency(selectedRecord.basicSalary)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Allowances"
                        secondary={formatIndianCurrency(selectedRecord.allowances)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Deductions"
                        secondary={formatIndianCurrency(selectedRecord.deductions)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Net Pay"
                        secondary={formatIndianCurrency(selectedRecord.netPay)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedRecord.status}
                            size="small"
                            sx={{
                              bgcolor: statusColors[selectedRecord.status],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Payroll Form */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="employee-label">Employee</InputLabel>
                                         <Select
                       labelId="employee-label"
                       value={payrollForm.employeeId}
                       label="Employee"
                       onChange={(e) => handleEmployeeSelection(e.target.value)}
                       displayEmpty
                       disabled={employeesLoading}
                     >
                      <MenuItem value="" disabled>
                        {employeesLoading ? 'Loading employees…' : 'Select an employee'}
                      </MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} - {emp.department}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="month-label">Month</InputLabel>
                    <Select
                      labelId="month-label"
                      value={payrollForm.month}
                      label="Month"
                      onChange={(e) => handlePayrollFormChange('month', e.target.value)}
                    >
                      <MenuItem value="01">January</MenuItem>
                      <MenuItem value="02">February</MenuItem>
                      <MenuItem value="03">March</MenuItem>
                      <MenuItem value="04">April</MenuItem>
                      <MenuItem value="05">May</MenuItem>
                      <MenuItem value="06">June</MenuItem>
                      <MenuItem value="07">July</MenuItem>
                      <MenuItem value="08">August</MenuItem>
                      <MenuItem value="09">September</MenuItem>
                      <MenuItem value="10">October</MenuItem>
                      <MenuItem value="11">November</MenuItem>
                      <MenuItem value="12">December</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={payrollForm.year}
                    onChange={(e) => handlePayrollFormChange('year', parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <TextField
                    fullWidth
                    label="Basic Salary"
                    type="number"
                    value={payrollForm.basicSalary}
                    onChange={(e) => handlePayrollFormChange('basicSalary', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Overtime Hours"
                    type="number"
                    value={payrollForm.overtimeHours}
                    onChange={(e) => handlePayrollFormChange('overtimeHours', parseFloat(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Overtime Rate"
                    type="number"
                    value={payrollForm.overtimeRate}
                    onChange={(e) => handlePayrollFormChange('overtimeRate', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
                    }}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <TextField
                    fullWidth
                    label="Bonuses"
                    type="number"
                    value={payrollForm.bonuses}
                    onChange={(e) => handlePayrollFormChange('bonuses', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Allowances"
                    type="number"
                    value={payrollForm.allowances}
                    onChange={(e) => handlePayrollFormChange('allowances', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
                    }}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
  <Typography variant="subtitle2" gutterBottom color="primary">
    💰 PF/ESI & Deductions
  </Typography>
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
    <TextField
      fullWidth
      label="PF Employee"
      type="number"
      value={payrollForm.pfEmployee}
      onChange={(e) => handlePayrollFormChange('pfEmployee', parseFloat(e.target.value))}
      InputProps={{
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
      }}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="ESI Employee"
      type="number"
      value={payrollForm.esiEmployee}
      onChange={(e) => handlePayrollFormChange('esiEmployee', parseFloat(e.target.value))}
      InputProps={{
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
      }}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="PT Amount"
      type="number"
      value={payrollForm.pt}
      onChange={(e) => handlePayrollFormChange('pt', parseFloat(e.target.value))}
      InputProps={{
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
      }}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="Salary Advance"
      type="number"
      value={payrollForm.salaryAdvance}
      onChange={(e) => handlePayrollFormChange('salaryAdvance', parseFloat(e.target.value))}
      InputProps={{
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
      }}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="Other Deductions"
      type="number"
      value={payrollForm.otherDeductions}
      onChange={(e) => handlePayrollFormChange('otherDeductions', parseFloat(e.target.value))}
      InputProps={{
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
      }}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="Arrears"
      type="number"
      value={payrollForm.arrears}
      onChange={(e) => handlePayrollFormChange('arrears', parseFloat(e.target.value))}
      InputProps={{
        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
      }}
      sx={{ mb: 2 }}
    />
  </Box>
</Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <TextField
                    fullWidth
                    label="Deductions"
                    type="number"
                    value={payrollForm.deductions}
                    onChange={(e) => handlePayrollFormChange('deductions', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Tax Deductions"
                    type="number"
                    value={payrollForm.taxDeductions}
                    onChange={(e) => handlePayrollFormChange('taxDeductions', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
                    }}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box sx={{ width: '100%' }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={payrollForm.paymentMethod}
                      label="Payment Method"
                      onChange={(e) => handlePayrollFormChange('paymentMethod', e.target.value)}
                    >
                      <MenuItem value="bank">Bank Transfer</MenuItem>
                      <MenuItem value="check">Check</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                    </Select>
                  </FormControl>
                                     <TextField
                     fullWidth
                     label="Notes (Optional)"
                     multiline
                     rows={3}
                     value={payrollForm.notes}
                     onChange={(e) => handlePayrollFormChange('notes', e.target.value)}
                   />
                   
                   {/* Attendance Auto-Calculation Section */}
                   <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                     <Typography variant="subtitle2" gutterBottom color="primary">
                       📊 Attendance Auto-Calculation
                     </Typography>
                     <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                       <TextField
                         label="Payable Days"
                         type="number"
                         value={payrollForm.payableDays}
                         onChange={(e) => handlePayrollFormChange('payableDays', parseInt(e.target.value) || 0)}
                         size="small"
                         sx={{ width: 120 }}
                       />
                       <TextField
                         label="OT Hours"
                         type="number"
                         value={payrollForm.otHours}
                         onChange={(e) => handlePayrollFormChange('otHours', parseFloat(e.target.value) || 0)}
                         size="small"
                         sx={{ width: 120 }}
                       />
                       <Button
                         variant="outlined"
                         size="small"
                         onClick={() => {
                           if (payrollForm.employeeId) {
                             handleEmployeeSelection(payrollForm.employeeId);
                           }
                         }}
                         disabled={!payrollForm.employeeId}
                       >
                         🔄 Refresh from Attendance
                       </Button>
                     </Box>
                     <Typography variant="caption" color="textSecondary">
                       Payable days and OT hours are automatically calculated from attendance records, excluding weekends, holidays, and approved leaves.
                     </Typography>
                   </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isViewMode ? (
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleSavePayroll}
              >
                {isCreateMode ? 'Process Payroll' : 'Update Payroll'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payroll;
