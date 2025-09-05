import React, { useState, useEffect, useCallback } from 'react';
//
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
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  Download as DownloadIcon,
  Emergency as EmergencyIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  School as EducationIcon,
  Home as HomeIcon,
  Description as FileText,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { useAuthStore } from '../stores/authStore';
import { formatIndianCurrency } from '../utils/currency';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joiningDate: Date;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  avatar?: string;
  skills: string[];
  manager?: string;
  officeLocation: string;
  // Additional fields for detailed view
  dateOfBirth?: Date;
  retirementAge?: number;
  gender?: string;
  employmentType?: string;
  pfStatus?: string;
  pfNumber?: string;
  uanNumber?: string;
  esiNumber?: string;
  // PF/ESI Option: 1 PF, 2 ESI, 3 Both, 4 None
  pfEsicOption?: number;
  bankName?: string;
  branch?: string;
  ifsc?: string;
  bankAccount?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bloodGroup?: string;
  educationalQualification?: string;
  residence?: string;
  spouseName?: string;
  remarks?: string;
  resigned?: boolean;
}

interface Department {
  id: string;
  name: string;
  description: string;
  headOfDepartment: string;
}

interface EmployeeFilters {
  search: string;
  department: string;
  status: string;
  position: string;
}

const initialFilters: EmployeeFilters = {
  search: '',
  department: '',
  status: '',
  position: '',
};

const statusColors = {
  active: '#4caf50',
  inactive: '#ff9800',
  terminated: '#f44336'
};

const EmployeeDirectory: React.FC = () => {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filters, setFilters] = useState<EmployeeFilters>(initialFilters);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  

  //

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load users from the existing users collection
        const usersResult = await firebaseService.getCollection('users');
        if (usersResult && usersResult.success && Array.isArray(usersResult.data)) {
          // Transform the user data to match our Employee interface
          const transformedEmployees = usersResult.data.map((user: any, index: number): Employee => {
            // Ensure all required fields are present and valid
            const employeeId = typeof user.employeeId === 'string' && user.employeeId.trim() !== ''
              ? user.employeeId
              : `EMP${(index + 1).toString().padStart(3, '0')}`;

            const name = user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : (user.email || '');

            const joiningDate = user.hireDate
              ? new Date(user.hireDate)
              : new Date();

            // Always provide a Date for dateOfBirth, never undefined
            let dateOfBirth: Date;
            if (user.dateOfBirth) {
              dateOfBirth = new Date(user.dateOfBirth);
            } else {
              // Provide a default date (e.g., epoch) if missing
              dateOfBirth = new Date(0);
            }

            // Derive PF/ESI option from user record, default to 4 (None)
            const pfEsicOption = typeof user.pfEsicOption === 'number'
              ? user.pfEsicOption
              : (typeof user.pfStatusCode === 'number' ? user.pfStatusCode : 4);

            return {
            id: user.id,
              employeeId,
              name,
              email: user.email || '',
            phone: user.phone || '',
            department: user.department || 'Unassigned',
            position: user.position || 'Employee',
              joiningDate,
              salary: typeof user.salary === 'number' ? user.salary : 0,
            status: user.status || 'active',
            address: user.address || '',
            emergencyContact: {
              name: user.emergencyContact?.name || '',
              phone: user.emergencyContact?.phone || '',
              relation: user.emergencyContact?.relationship || ''
            },
              skills: Array.isArray(user.skills) ? user.skills : [],
            manager: user.managerId || '',
              officeLocation: user.officeLocation || '',
              // Additional fields with defaults
              dateOfBirth,
              retirementAge: typeof user.retirementAge === 'number' ? user.retirementAge : 60,
              gender: user.gender || '',
              employmentType: user.employmentType || 'Full-time',
              pfStatus: user.pfStatus || 'Active',
              pfNumber: user.pfNumber || '',
              uanNumber: user.uanNumber || '',
              esiNumber: user.esiNumber || '',
              pfEsicOption,
              bankName: user.bankingInfo?.bankName || '',
              branch: user.bankingInfo?.branch || '',
              ifsc: user.bankingInfo?.ifscCode || '',
              bankAccount: user.bankingInfo?.accountNumber || '',
              aadhaarNumber: user.governmentInfo?.aadharNumber || '',
              panNumber: user.governmentInfo?.panNumber || '',
              bloodGroup: user.bloodGroup || '',
              educationalQualification: user.educationalQualification || '',
              residence: user.residence || '',
              spouseName: user.spouseName || '',
              remarks: user.remarks || '',
              resigned: !!user.resigned
            } as Employee;
          });
          setEmployees(transformedEmployees);
        } else {
          console.warn('No users data received or request failed:', usersResult);
          setEmployees([]);
        }

        // Extract departments from users
        if (usersResult && usersResult.success && usersResult.data) {
          const departments = [...new Set(usersResult.data
            .map((user: any) => user.department)
            .filter((dept: string) => dept && dept !== 'Unassigned')
          )];
          
          const transformedDepartments = departments.map((dept: string, index: number) => ({
            id: index.toString(),
            name: dept,
            description: `${dept} Department`,
            headOfDepartment: ''
          }));
          setDepartments(transformedDepartments);
        } else {
          setDepartments([]);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
        setSnackbar({
          open: true,
          message: 'Failed to load data from Firebase',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update filtered employees when employees or filters change
  useEffect(() => {
    applyFilters();
  }, [employees, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...employees];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        employee.employeeId.toLowerCase().includes(searchLower) ||
        employee.position.toLowerCase().includes(searchLower) ||
        employee.department.toLowerCase().includes(searchLower)
      );
    }

    if (filters.department) {
      filtered = filtered.filter(employee => employee.department === filters.department);
    }

    if (filters.status) {
      filtered = filtered.filter(employee => employee.status === filters.status);
    }

    if (filters.position) {
      filtered = filtered.filter(employee => 
        employee.position.toLowerCase().includes(filters.position.toLowerCase())
      );
    }

    // Note: location filter removed (not used in UI)

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, filters]);

  const handleFilterChange = (field: keyof EmployeeFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setEditFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      joiningDate: new Date(),
      salary: 0,
      status: 'active',
      address: '',
      officeLocation: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  // Removed unused inline edit handler to keep Actions view-only per spec
  
  const handleSaveEmployee = async () => {
    try {
      setIsSaving(true);
      const payload: any = {
        firstName: (editFormData.name || '').split(' ')[0] || '',
        lastName: (editFormData.name || '').split(' ').slice(1).join(' '),
        email: editFormData.email || '',
        phone: editFormData.phone || '',
        department: editFormData.department || '',
        position: editFormData.position || 'Employee',
        hireDate: (editFormData.joiningDate || new Date()).toISOString(),
        salary: editFormData.salary || 0,
        status: editFormData.status || 'active',
        address: editFormData.address || '',
        skills: [],
        officeLocation: editFormData.officeLocation || '',
        pfEsicOption: (editFormData as any).pfEsicOption ?? 4,
        pfNumber: editFormData.pfNumber || '',
        uanNumber: editFormData.uanNumber || '',
        esiNumber: editFormData.esiNumber || '',
          bankingInfo: {
          bankName: editFormData.bankName || '',
          branch: editFormData.branch || '',
          ifscCode: editFormData.ifsc || '',
          accountNumber: editFormData.bankAccount || ''
          },
          governmentInfo: {
          aadharNumber: editFormData.aadhaarNumber || '',
          panNumber: editFormData.panNumber || ''
        },
        updatedAt: new Date().toISOString()
      };

      if (selectedEmployee) {
        const res = await firebaseService.updateDocument('users', selectedEmployee.id, payload);
        if (!res || !res.success) throw new Error(res?.error || 'Failed to update employee');
        setEmployees(prev => prev.map(emp => emp.id === selectedEmployee.id ? {
          ...emp,
          name: editFormData.name || emp.name,
          email: editFormData.email || emp.email,
          phone: editFormData.phone || emp.phone,
          department: editFormData.department || emp.department,
          position: editFormData.position || emp.position,
          joiningDate: editFormData.joiningDate || emp.joiningDate,
          salary: editFormData.salary ?? emp.salary,
          status: (editFormData.status as any) || emp.status,
          address: editFormData.address || emp.address,
          officeLocation: editFormData.officeLocation || emp.officeLocation
        } : emp));
        } else {
        const res = await firebaseService.addDocument('users', { ...payload, createdAt: new Date().toISOString() });
        const newId = (res as any)?.id || (res as any)?.data?.id;
        if (!res || !res.success || !newId) throw new Error((res as any)?.error || 'Failed to create employee');
        const newEmp: Employee = {
          id: newId,
          employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
          name: editFormData.name || payload.email,
          email: payload.email,
          phone: payload.phone,
          department: payload.department,
          position: payload.position,
          joiningDate: new Date(payload.hireDate),
          salary: payload.salary,
          status: payload.status,
          address: payload.address,
          emergencyContact: { name: '', phone: '', relation: '' },
          skills: [],
          manager: '',
          officeLocation: payload.officeLocation,
          pfEsicOption: (editFormData as any).pfEsicOption ?? 4,
          pfNumber: editFormData.pfNumber || '',
          uanNumber: editFormData.uanNumber || '',
          esiNumber: editFormData.esiNumber || '',
          bankName: editFormData.bankName || '',
          branch: editFormData.branch || '',
          ifsc: editFormData.ifsc || '',
          bankAccount: editFormData.bankAccount || '',
          aadhaarNumber: editFormData.aadhaarNumber || '',
          panNumber: editFormData.panNumber || '',
          bloodGroup: editFormData.bloodGroup || '',
          educationalQualification: editFormData.educationalQualification || '',
          residence: editFormData.residence || '',
          spouseName: editFormData.spouseName || '',
          remarks: editFormData.remarks || '',
          resigned: !!editFormData.resigned
        };
        setEmployees(prev => [newEmp, ...prev]);
      }

      setSnackbar({ open: true, message: selectedEmployee ? 'Employee updated' : 'Employee added', severity: 'success' });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      setEditFormData({});
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to save employee', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      setIsSaving(true);
      const res = await firebaseService.updateDocument('users', selectedEmployee.id, { status: 'terminated', updatedAt: new Date().toISOString() });
      if (!res || !res.success) throw new Error(res?.error || 'Failed to delete employee');
      setEmployees(prev => prev.map(emp => emp.id === selectedEmployee.id ? { ...emp, status: 'terminated' } : emp));
      setSnackbar({ open: true, message: 'Employee marked as terminated', severity: 'success' });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to delete employee', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportEmployees = () => {
    const csv = convertToCSV(filteredEmployees);
    downloadCSV(csv, 'employees.csv');
    setSnackbar({
      open: true,
      message: 'Employee data exported successfully',
      severity: 'success'
    });
  };

  const convertToCSV = (data: Employee[]): string => {
    const headers = [
      'S.No', 'Employee ID', 'Employee Name', 'Designation', 'Department', 'Status', 
      'Employment Type', 'DOJ', 'DOB', 'Retirement Age', 'Gender', 'Gross Salary', 
      'PF Status', 'PF Number', 'PF/UAN No', 'ESI Number', 'Bank Name', 'Branch', 
      'IFSC', 'Bank Account', 'Aadhaar No', 'PAN No', 'Blood Group', 
      'Educational Qualification', 'Residence', 'Contact Number', 'S/W/D/O', 
      'Emergency Contact', 'Remarks', 'Resigned'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map((emp, index) => [
        index + 1,
        emp.employeeId,
        emp.name,
        emp.position,
        emp.department,
        emp.status,
        emp.employmentType || '',
        emp.joiningDate.toLocaleDateString(),
        emp.dateOfBirth?.toLocaleDateString() || '',
        emp.retirementAge || '',
        emp.gender || '',
        emp.salary,
        emp.pfStatus || '',
        emp.pfNumber || '',
        emp.uanNumber || '',
        emp.esiNumber || '',
        emp.bankName || '',
        emp.branch || '',
        emp.ifsc || '',
        emp.bankAccount || '',
        emp.aadhaarNumber || '',
        emp.panNumber || '',
        emp.bloodGroup || '',
        emp.educationalQualification || '',
        emp.residence || '',
        emp.phone,
        emp.spouseName || '',
        emp.emergencyContact.name,
        emp.remarks || '',
        emp.resigned ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || '#9e9e9e';
  };

  const formatSalary = (salary: number) => {
    return formatIndianCurrency(salary);
  };

  const maskSalary = (salary: number) => {
    const formatted = formatIndianCurrency(salary);
    // Partially mask digits: keep currency symbol and last 2 digits
    // Replace digits except last 2 with 'X', preserve separators
    let digitsSeen = 0;
    const reversed = formatted.split('').reverse();
    const maskedReversed = reversed.map((ch) => {
      if (/[0-9]/.test(ch)) {
        digitsSeen += 1;
        return digitsSeen <= 2 ? ch : 'X';
      }
      return ch;
    });
    return maskedReversed.reverse().join('');
  };

  const canViewSalary = !!(user && (user.role === 'admin' || user.role === 'hr'));

  const getDepartmentCount = (departmentName: string) => {
    return employees.filter(emp => emp.department === departmentName).length;
  };

  const getUniquePositions = () => {
    return [...new Set(employees.map(emp => emp.position))];
  };

  // getUniqueLocations removed (unused)

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Employee Directory...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Employee Directory
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportEmployees}
          >
            Download Employees Info
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateEmployee}
            sx={{ bgcolor: 'primary.main' }}
          >
            Add Employee
          </Button>
        </Box>
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
            <Typography color="textSecondary" gutterBottom>
              Total Employees
            </Typography>
            <Typography variant="h4" component="div">
              {employees.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Employees
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {employees.filter(emp => emp.status === 'active').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Departments
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              {departments.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              New This Month
            </Typography>
            <Typography variant="h4" component="div" color="info.main">
              {employees.filter(emp => {
                const joinDate = new Date(emp.joiningDate);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && 
                       joinDate.getFullYear() === now.getFullYear();
              }).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2 
        }}>
          <TextField
            fullWidth
            label="Search Employees"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department}
              label="Department"
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.name}>
                  {dept.name} ({getDepartmentCount(dept.name)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Position</InputLabel>
            <Select
              value={filters.position}
              label="Position"
              onChange={(e) => handleFilterChange('position', e.target.value)}
            >
              <MenuItem value="">All Positions</MenuItem>
              {getUniquePositions().map(position => (
                <MenuItem key={position} value={position}>
                  {position}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Employee Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Emergency Contact</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {employees.length === 0 ? 'No employees found. Add your first employee to get started.' : 'No employees match the current filters.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {employee.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {employee.employeeId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {employee.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {employee.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {employee.department}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {employee.position}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(employee.status),
                          color: 'white',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {employee.emergencyContact.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {employee.emergencyContact.relation} • {employee.emergencyContact.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {maskSalary(employee.salary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setEditFormData({
                                name: employee.name,
                                email: employee.email,
                                phone: employee.phone,
                                department: employee.department,
                                position: employee.position,
                                joiningDate: employee.joiningDate,
                                salary: employee.salary,
                                status: employee.status,
                                address: employee.address,
                                officeLocation: employee.officeLocation
                              });
                              setIsEditDialogOpen(true);
                            }}
                            color="secondary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewEmployee(employee)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Add / Edit Employee Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedEmployee ? <EditIcon /> : <AddIcon />}
            <Typography variant="h6">{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Employee Name (As per Aadhaar)" value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} fullWidth />
            <TextField label="Employee ID (auto)" value={selectedEmployee?.employeeId || `EMP${String(employees.length + 1).padStart(3, '0')}`} fullWidth disabled />

            <TextField label="Designation" value={editFormData.position || ''} onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select label="Department" value={editFormData.department || ''} onChange={(e) => setEditFormData({ ...editFormData, department: String(e.target.value) })}>
                {departments.length === 0 && <MenuItem value="">Unassigned</MenuItem>}
                {departments.map((d) => (<MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={editFormData.status || 'active'} onChange={(e) => setEditFormData({ ...editFormData, status: String(e.target.value) as Employee['status'] })}>
                <MenuItem value="active">On Roll</MenuItem>
                <MenuItem value="inactive">Off Roll</MenuItem>
                <MenuItem value="terminated">Resigned</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Employment Type</InputLabel>
              <Select label="Employment Type" value={editFormData.employmentType || 'Permanent'} onChange={(e) => setEditFormData({ ...editFormData, employmentType: String(e.target.value) })}>
                <MenuItem value="Permanent">Permanent</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Intern">Intern</MenuItem>
              </Select>
            </FormControl>

            <TextField label="DOJ" type="date" value={(editFormData.joiningDate ? new Date(editFormData.joiningDate) : new Date()).toISOString().split('T')[0]} onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value ? new Date(e.target.value) : new Date() })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="DOB" type="date" value={(editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth) : new Date(0)).toISOString().split('T')[0]} onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value ? new Date(e.target.value) : new Date(0) })} InputLabelProps={{ shrink: true }} fullWidth />

            <TextField label="Retirement Age" type="number" value={editFormData.retirementAge ?? 60} onChange={(e) => setEditFormData({ ...editFormData, retirementAge: Number(e.target.value) || 60 })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select label="Gender" value={editFormData.gender || ''} onChange={(e) => setEditFormData({ ...editFormData, gender: String(e.target.value) })}>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Gross Salary" type="number" value={editFormData.salary ?? 0} onChange={(e) => setEditFormData({ ...editFormData, salary: Number(e.target.value) || 0 })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>PF/ESI</InputLabel>
              <Select label="PF/ESI" value={(editFormData as any).pfEsicOption ?? 4} onChange={(e) => setEditFormData({ ...editFormData, pfEsicOption: Number(e.target.value) as any })}>
                <MenuItem value={1}>PF</MenuItem>
                <MenuItem value={2}>ESI</MenuItem>
                <MenuItem value={3}>Both</MenuItem>
                <MenuItem value={4}>None</MenuItem>
              </Select>
            </FormControl>

            <TextField label="PF Number" value={editFormData.pfNumber || ''} onChange={(e) => setEditFormData({ ...editFormData, pfNumber: e.target.value })} fullWidth />
            <TextField label="PF / UAN Number" value={editFormData.uanNumber || ''} onChange={(e) => setEditFormData({ ...editFormData, uanNumber: e.target.value })} fullWidth />
            <TextField label="ESI Number" value={editFormData.esiNumber || ''} onChange={(e) => setEditFormData({ ...editFormData, esiNumber: e.target.value })} fullWidth />

            <TextField label="Bank Name" value={editFormData.bankName || ''} onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })} fullWidth />
            <TextField label="Branch" value={editFormData.branch || ''} onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })} fullWidth />
            <TextField label="IFSC" value={editFormData.ifsc || ''} onChange={(e) => setEditFormData({ ...editFormData, ifsc: e.target.value })} fullWidth />
            <TextField label="Account Number" value={editFormData.bankAccount || ''} onChange={(e) => setEditFormData({ ...editFormData, bankAccount: e.target.value })} fullWidth />

            <TextField label="Aadhaar Number" value={editFormData.aadhaarNumber || ''} onChange={(e) => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })} fullWidth />
            <TextField label="PAN Number" value={editFormData.panNumber || ''} onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value })} fullWidth />
            <TextField label="Blood Group" value={editFormData.bloodGroup || ''} onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })} fullWidth />
            <TextField label="Educational Qualification" value={editFormData.educationalQualification || ''} onChange={(e) => setEditFormData({ ...editFormData, educationalQualification: e.target.value })} fullWidth />

            <TextField label="Residence Address" value={editFormData.residence || ''} onChange={(e) => setEditFormData({ ...editFormData, residence: e.target.value })} fullWidth />
            <TextField label="Contact Number" value={editFormData.phone || ''} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} fullWidth />
            <TextField label="S/W/D/O" value={editFormData.spouseName || ''} onChange={(e) => setEditFormData({ ...editFormData, spouseName: e.target.value })} fullWidth />
            <TextField label="Emergency Contact Number" value={editFormData.emergencyContact?.phone || ''} onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: { name: editFormData.emergencyContact?.name || '', relation: editFormData.emergencyContact?.relation || '', phone: e.target.value } })} fullWidth />

            <TextField label="Remarks" value={editFormData.remarks || ''} onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })} fullWidth multiline minRows={2} />
            <FormControl fullWidth>
              <InputLabel>Resigned</InputLabel>
              <Select label="Resigned" value={(editFormData.resigned ? 'Yes' : 'No')} onChange={(e) => setEditFormData({ ...editFormData, resigned: String(e.target.value) === 'Yes' })}>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          {selectedEmployee && (
            <Button color="error" startIcon={<DeleteIcon />} onClick={handleDeleteEmployee} disabled={isSaving}>
              Mark Terminated
            </Button>
          )}
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEmployee} disabled={isSaving}>
            {selectedEmployee ? 'Save Changes' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Details View Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            <Typography variant="h6">
              Employee Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                {/* Basic Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <BadgeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="S.No"
                        secondary="1"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <BadgeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Employee ID"
                        secondary={selectedEmployee.employeeId}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Employee Name (As per Aadhaar)"
                        secondary={selectedEmployee.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <WorkIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Designation"
                        secondary={selectedEmployee.position}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <BusinessIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Department"
                        secondary={selectedEmployee.department}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedEmployee.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(selectedEmployee.status),
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Box>

                {/* Employment Details */}
                <Box>
                  <Typography variant="h6" gutterBottom>Employment Details</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <WorkIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Employment Type"
                        secondary={selectedEmployee.employmentType || 'Full-time'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <CalendarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Date of Joining (DOJ)"
                        secondary={selectedEmployee.joiningDate.toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <CalendarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Date of Birth (DOB)"
                        secondary={selectedEmployee.dateOfBirth?.toLocaleDateString() || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <CalendarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Retirement Age"
                        secondary={selectedEmployee.retirementAge || '60'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Gender"
                        secondary={selectedEmployee.gender || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <CardIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Gross Salary"
                        secondary={canViewSalary ? formatSalary(selectedEmployee.salary) : maskSalary(selectedEmployee.salary)}
                      />
                    </ListItem>
                  </List>
                </Box>

                {/* Government & Financial Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Government & Financial Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <BadgeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="PF Status"
                        secondary={selectedEmployee.pfStatus || 'Active'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <BadgeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="PF Number"
                        secondary={selectedEmployee.pfNumber || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <BadgeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="PF / UAN No"
                        secondary={selectedEmployee.uanNumber || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <BadgeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="ESI Number"
                        secondary={selectedEmployee.esiNumber || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <BankIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Bank Name"
                        secondary={selectedEmployee.bankName || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <BankIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Branch"
                        secondary={selectedEmployee.branch || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <BankIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="IFSC"
                        secondary={selectedEmployee.ifsc || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <BankIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Bank Account"
                        secondary={selectedEmployee.bankAccount || 'Not specified'}
                      />
                    </ListItem>
                  </List>
                </Box>

                {/* Personal & Contact Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Personal & Contact Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <BadgeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Aadhaar No"
                        secondary={selectedEmployee.aadhaarNumber || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <CardIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="PAN No"
                        secondary={selectedEmployee.panNumber || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Blood Group"
                        secondary={selectedEmployee.bloodGroup || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <EducationIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Educational Qualification"
                        secondary={selectedEmployee.educationalQualification || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <HomeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Residence"
                        secondary={selectedEmployee.residence || selectedEmployee.address || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <PhoneIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Contact Number"
                        secondary={selectedEmployee.phone}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="S/W/D/O"
                        secondary={selectedEmployee.spouseName || 'Not specified'}
                      />
                    </ListItem>
                  </List>
                </Box>

                {/* Emergency Contact & Additional Info */}
                <Box>
                  <Typography variant="h6" gutterBottom>Emergency Contact & Additional Info</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <EmergencyIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Emergency Contact"
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {selectedEmployee.emergencyContact.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {selectedEmployee.emergencyContact.relation} • {selectedEmployee.emergencyContact.phone}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <FileText />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Remarks"
                        secondary={selectedEmployee.remarks || 'No remarks'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <ExitIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Resigned"
                        secondary={
                          <Chip
                            label={selectedEmployee.resigned ? 'Yes' : 'No'}
                            size="small"
                            color={selectedEmployee.resigned ? 'error' : 'success'}
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
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

export default EmployeeDirectory;