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
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  Avatar,
  Badge,
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
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Download as DownloadIcon,
  Emergency as EmergencyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { populateSampleUsers, checkUsersCollection } from '../utils/sampleData';
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
  location: string;
}

const initialFilters: EmployeeFilters = {
  search: '',
  department: '',
  status: '',
  position: '',
  location: ''
};

const statusColors = {
  active: '#4caf50',
  inactive: '#ff9800',
  terminated: '#f44336'
};

const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filters, setFilters] = useState<EmployeeFilters>(initialFilters);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
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

  // Generate next available employee ID
  const generateNextEmployeeId = useCallback((): string => {
    const nextNumber = employees.length + 1;
    return `EMP${nextNumber.toString().padStart(3, '0')}`;
  }, [employees]);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load users from the existing users collection
        const usersResult = await firebaseService.getCollection('users');
        if (usersResult && usersResult.success && usersResult.data) {
          // Transform the user data to match our Employee interface
          const transformedEmployees = usersResult.data.map((user: any, index: number) => ({
            id: user.id,
            employeeId: user.employeeId || `EMP${(index + 1).toString().padStart(3, '0')}`,
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            phone: user.phone || '',
            department: user.department || 'Unassigned',
            position: user.position || 'Employee',
            joiningDate: user.hireDate ? new Date(user.hireDate) : new Date(),
            salary: user.salary || 0,
            status: user.status || 'active',
            address: user.address || '',
            emergencyContact: {
              name: user.emergencyContact?.name || '',
              phone: user.emergencyContact?.phone || '',
              relation: user.emergencyContact?.relationship || ''
            },
            skills: user.skills || [],
            manager: user.managerId || '',
            officeLocation: user.officeLocation || ''
          }));
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

    if (filters.location) {
      filtered = filtered.filter(employee => employee.officeLocation === filters.location);
    }

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
    setFormData({});
    setIsViewMode(false);
  };

  const handleCreateEmployee = () => {
    const newEmployee: Employee = {
      id: '',
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      joiningDate: new Date(),
      salary: 0,
      status: 'active',
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      },
      skills: [],
      manager: '',
      officeLocation: ''
    };
    setSelectedEmployee(newEmployee);
    setFormData(newEmployee);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      // Update the user status to terminated instead of deleting
      await firebaseService.updateDocument('users', employeeId, { 
        status: 'terminated',
        updatedAt: new Date().toISOString()
      });
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, status: 'terminated' }
          : emp
      ));
      setSnackbar({
        open: true,
        message: 'Employee status updated to terminated',
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Failed to update employee status: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleSaveEmployee = async (employeeData: Partial<Employee>) => {
    try {
      if (selectedEmployee && selectedEmployee.id) {
        // Update existing user
        const updateData = {
          firstName: employeeData.name?.split(' ')[0] || '',
          lastName: employeeData.name?.split(' ').slice(1).join(' ') || '',
          email: employeeData.email || '',
          phone: employeeData.phone || '',
          department: employeeData.department || '',
          position: employeeData.position || '',
          hireDate: employeeData.joiningDate?.toISOString() || new Date().toISOString(),
          salary: employeeData.salary || 0,
          address: employeeData.address || '',
          skills: employeeData.skills || [],
          officeLocation: employeeData.officeLocation || '',
          updatedAt: new Date().toISOString()
        };

        const updateResult = await firebaseService.updateDocument('users', selectedEmployee.id, updateData);
        if (updateResult && updateResult.success) {
          setEmployees(prev => prev.map(emp =>
            emp.id === selectedEmployee.id
              ? { ...emp, ...employeeData }
              : emp
          ));
          setSnackbar({
            open: true,
            message: 'Employee updated successfully',
            severity: 'success'
          });
        } else {
          throw new Error(updateResult?.error || 'Failed to update employee');
        }
      } else {
        // Create new user
        const newUserData = {
          firstName: employeeData.name?.split(' ')[0] || '',
          lastName: employeeData.name?.split(' ').slice(1).join(' ') || '',
          email: employeeData.email || '',
          phone: employeeData.phone || '',
          department: employeeData.department || '',
          position: employeeData.position || '',
          hireDate: employeeData.joiningDate?.toISOString() || new Date().toISOString(),
          salary: employeeData.salary || 0,
          address: employeeData.address || '',
          skills: employeeData.skills || [],
          officeLocation: employeeData.officeLocation || '',
          role: 'employee',
          status: 'active',
          avatar: null,
          emergencyContact: {
            name: employeeData.emergencyContact?.name || '',
            phone: employeeData.emergencyContact?.phone || '',
            relationship: employeeData.emergencyContact?.relation || ''
          },
          bankingInfo: {
            bankName: '',
            accountHolderName: '',
            accountNumber: '',
            ifscCode: '',
            accountType: 'savings'
          },
          governmentInfo: {
            panNumber: '',
            aadharNumber: ''
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };

        const createResult = await firebaseService.addDocument('users', newUserData);
        if (createResult && createResult.success && createResult.data) {
          const newEmployee: Employee = {
            id: createResult.data['id'] || Date.now().toString(),
            employeeId: generateNextEmployeeId(),
            name: employeeData.name || '',
            email: employeeData.email || '',
            phone: employeeData.phone || '',
            department: employeeData.department || '',
            position: employeeData.position || '',
            joiningDate: employeeData.joiningDate || new Date(),
            salary: employeeData.salary || 0,
            status: 'active',
            address: employeeData.address || '',
            emergencyContact: employeeData.emergencyContact || {
              name: '',
              phone: '',
              relation: ''
            },
            skills: employeeData.skills || [],
            manager: employeeData.manager || '',
            officeLocation: employeeData.officeLocation || ''
          };
          setEmployees(prev => [newEmployee, ...prev]);
          setSnackbar({
            open: true,
            message: 'Employee created successfully',
            severity: 'success'
          });
        } else {
          throw new Error(createResult?.error || 'Failed to create employee');
        }
      }
      handleCloseDialog();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Failed to save employee: ${err.message}`,
        severity: 'error'
      });
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
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Position', 'Status', 'Joining Date', 'Salary'];
    const csvContent = [
      headers.join(','),
      ...data.map(emp => [
        emp.employeeId,
        emp.name,
        emp.email,
        emp.phone,
        emp.department,
        emp.position,
        emp.status,
        emp.joiningDate.toLocaleDateString(),
        emp.salary
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

  const getDepartmentCount = (departmentName: string) => {
    return employees.filter(emp => emp.department === departmentName).length;
  };

  const getUniquePositions = () => {
    return [...new Set(employees.map(emp => emp.position))];
  };

  const getUniqueLocations = () => {
    return [...new Set(employees.map(emp => emp.officeLocation))];
  };

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
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateEmployee}
            sx={{ bgcolor: 'primary.main' }}
          >
            Add Employee
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={async () => {
              const userCount = await checkUsersCollection();
              if (userCount > 0) {
                setSnackbar({
                  open: true,
                  message: `Users collection already has ${userCount} documents.`,
                  severity: 'info'
                });
              } else {
                await populateSampleUsers();
                setSnackbar({
                  open: true,
                  message: 'Sample data populated successfully!',
                  severity: 'success'
                });
                // Reload the data
                window.location.reload();
              }
            }}
          >
            Populate Sample Data
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
                <TableCell>Joining Date</TableCell>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {employee.joiningDate.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatSalary(employee.salary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewEmployee(employee)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Employee">
                          <IconButton
                            size="small"
                            onClick={() => handleEditEmployee(employee)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Employee">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            color="error"
                          >
                            <DeleteIcon />
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

      {/* Employee Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            <Typography variant="h6">
              {isViewMode ? 'Employee Details' : selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isViewMode && selectedEmployee ? (
            // View Mode - Display employee details
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <List dense>
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
                        primary="Full Name"
                        secondary={selectedEmployee.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <EmailIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Email"
                        secondary={selectedEmployee.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PhoneIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Phone"
                        secondary={selectedEmployee.phone}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <LocationIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Address"
                        secondary={selectedEmployee.address}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Professional Information</Typography>
                  <List dense>
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
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <WorkIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Position"
                        secondary={selectedEmployee.position}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <CalendarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Joining Date"
                        secondary={selectedEmployee.joiningDate.toLocaleDateString()}
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
                    <ListItem>
                      <ListItemText
                        primary="Salary"
                        secondary={formatSalary(selectedEmployee.salary)}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Skills</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedEmployee.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <EmergencyIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Name"
                        secondary={selectedEmployee.emergencyContact.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Phone"
                        secondary={selectedEmployee.emergencyContact.phone}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Relation"
                        secondary={selectedEmployee.emergencyContact.relation}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </Box>
          ) : (
            // Edit/Create Mode - Show form
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                {/* Personal Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Box>

                {/* Professional Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Professional Information</Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={formData.department || ''}
                      label="Department"
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <MenuItem value="">Select Department</MenuItem>
                      <MenuItem value="Information Technology">Information Technology</MenuItem>
                      <MenuItem value="Human Resources">Human Resources</MenuItem>
                      <MenuItem value="Marketing">Marketing</MenuItem>
                      <MenuItem value="Finance">Finance</MenuItem>
                      <MenuItem value="Sales">Sales</MenuItem>
                      <MenuItem value="Operations">Operations</MenuItem>
                      <MenuItem value="Customer Support">Customer Support</MenuItem>
                      <MenuItem value="Research & Development">Research & Development</MenuItem>
                      <MenuItem value="Legal">Legal</MenuItem>
                      <MenuItem value="Administration">Administration</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Position</InputLabel>
                    <Select
                      value={formData.position || ''}
                      label="Position"
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    >
                      <MenuItem value="">Select Position</MenuItem>
                      <MenuItem value="Software Engineer">Software Engineer</MenuItem>
                      <MenuItem value="Senior Software Engineer">Senior Software Engineer</MenuItem>
                      <MenuItem value="Lead Software Engineer">Lead Software Engineer</MenuItem>
                      <MenuItem value="Software Architect">Software Architect</MenuItem>
                      <MenuItem value="Product Manager">Product Manager</MenuItem>
                      <MenuItem value="Project Manager">Project Manager</MenuItem>
                      <MenuItem value="HR Manager">HR Manager</MenuItem>
                      <MenuItem value="HR Specialist">HR Specialist</MenuItem>
                      <MenuItem value="Recruiter">Recruiter</MenuItem>
                      <MenuItem value="Marketing Manager">Marketing Manager</MenuItem>
                      <MenuItem value="Marketing Specialist">Marketing Specialist</MenuItem>
                      <MenuItem value="Content Writer">Content Writer</MenuItem>
                      <MenuItem value="Financial Analyst">Financial Analyst</MenuItem>
                      <MenuItem value="Accountant">Accountant</MenuItem>
                      <MenuItem value="Sales Representative">Sales Representative</MenuItem>
                      <MenuItem value="Sales Manager">Sales Manager</MenuItem>
                      <MenuItem value="Customer Support Specialist">Customer Support Specialist</MenuItem>
                      <MenuItem value="Operations Manager">Operations Manager</MenuItem>
                      <MenuItem value="Business Analyst">Business Analyst</MenuItem>
                      <MenuItem value="Data Analyst">Data Analyst</MenuItem>
                      <MenuItem value="Designer">Designer</MenuItem>
                      <MenuItem value="Intern">Intern</MenuItem>
                      <MenuItem value="Trainee">Trainee</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Joining Date"
                    type="date"
                    value={formData.joiningDate ? formData.joiningDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      joiningDate: e.target.value ? new Date(e.target.value) : new Date() 
                    })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Salary (₹)"
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) || 0 })}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Office Location</InputLabel>
                    <Select
                      value={formData.officeLocation || ''}
                      label="Office Location"
                      onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                    >
                      <MenuItem value="">Select Office Location</MenuItem>
                      <MenuItem value="Bangalore Office">Bangalore Office</MenuItem>
                      <MenuItem value="Mumbai Office">Mumbai Office</MenuItem>
                      <MenuItem value="Hyderabad Office">Hyderabad Office</MenuItem>
                      <MenuItem value="Delhi Office">Delhi Office</MenuItem>
                      <MenuItem value="Chennai Office">Chennai Office</MenuItem>
                      <MenuItem value="Pune Office">Pune Office</MenuItem>
                      <MenuItem value="Kolkata Office">Kolkata Office</MenuItem>
                      <MenuItem value="Remote">Remote</MenuItem>
                      <MenuItem value="Hybrid">Hybrid</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Emergency Contact */}
                <Box>
                  <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: {
                        name: e.target.value,
                        phone: formData.emergencyContact?.phone || '',
                        relation: formData.emergencyContact?.relation || ''
                      }
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={formData.emergencyContact?.phone || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: {
                        name: formData.emergencyContact?.name || '',
                        phone: e.target.value,
                        relation: formData.emergencyContact?.relation || ''
                      }
                    })}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Relationship</InputLabel>
                    <Select
                      value={formData.emergencyContact?.relation || ''}
                      label="Relationship"
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: {
                          name: formData.emergencyContact?.name || '',
                          phone: formData.emergencyContact?.phone || '',
                          relation: e.target.value
                        }
                      })}
                    >
                      <MenuItem value="">Select Relationship</MenuItem>
                      <MenuItem value="Spouse">Spouse</MenuItem>
                      <MenuItem value="Husband">Husband</MenuItem>
                      <MenuItem value="Wife">Wife</MenuItem>
                      <MenuItem value="Father">Father</MenuItem>
                      <MenuItem value="Mother">Mother</MenuItem>
                      <MenuItem value="Son">Son</MenuItem>
                      <MenuItem value="Daughter">Daughter</MenuItem>
                      <MenuItem value="Brother">Brother</MenuItem>
                      <MenuItem value="Sister">Sister</MenuItem>
                      <MenuItem value="Friend">Friend</MenuItem>
                      <MenuItem value="Guardian">Guardian</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Skills */}
                <Box>
                  <Typography variant="h6" gutterBottom>Skills</Typography>
                  <TextField
                    fullWidth
                    label="Skills (comma separated)"
                    placeholder="React, Node.js, TypeScript"
                    value={formData.skills?.join(', ') || ''}
                    onChange={(e) => {
                      const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
                      setFormData({ ...formData, skills });
                    }}
                    sx={{ mb: 2 }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!isViewMode && (
            <>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                onClick={() => handleSaveEmployee(formData)} 
                variant="contained"
              >
                {selectedEmployee && selectedEmployee.id ? 'Update Employee' : 'Create Employee'}
              </Button>
            </>
          )}
          {isViewMode && (
            <Button onClick={handleCloseDialog}>Close</Button>
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

export default EmployeeDirectory;