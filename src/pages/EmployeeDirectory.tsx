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
  ListItemAvatar
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
  Emergency as EmergencyIcon
} from '@mui/icons-material';
import { useDataService } from '../hooks/useDataService';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mock data for development
  const mockDepartments: Department[] = [
    { id: '1', name: 'Information Technology', description: 'IT Department', headOfDepartment: 'John Smith' },
    { id: '2', name: 'Human Resources', description: 'HR Department', headOfDepartment: 'Sarah Johnson' },
    { id: '3', name: 'Marketing', description: 'Marketing Department', headOfDepartment: 'Mike Wilson' },
    { id: '4', name: 'Finance', description: 'Finance Department', headOfDepartment: 'Lisa Brown' },
    { id: '5', name: 'Sales', description: 'Sales Department', headOfDepartment: 'David Jones' }
  ];

  const mockEmployees: Employee[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      department: 'Information Technology',
      position: 'Senior Software Engineer',
      joiningDate: new Date('2022-03-15'),
      salary: 85000,
      status: 'active',
      address: '123 Main St, Anytown, USA',
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1 (555) 123-4568',
        relation: 'Spouse'
      },
      skills: ['React', 'Node.js', 'TypeScript', 'Python'],
      manager: 'John Smith',
      officeLocation: 'New York Office'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      phone: '+1 (555) 234-5678',
      department: 'Human Resources',
      position: 'HR Manager',
      joiningDate: new Date('2021-01-10'),
      salary: 75000,
      status: 'active',
      address: '456 Oak Ave, Anytown, USA',
      emergencyContact: {
        name: 'Bob Smith',
        phone: '+1 (555) 234-5679',
        relation: 'Husband'
      },
      skills: ['Recruitment', 'Employee Relations', 'Training'],
      manager: 'Sarah Johnson',
      officeLocation: 'New York Office'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      phone: '+1 (555) 345-6789',
      department: 'Marketing',
      position: 'Marketing Specialist',
      joiningDate: new Date('2023-06-01'),
      salary: 60000,
      status: 'active',
      address: '789 Pine St, Anytown, USA',
      emergencyContact: {
        name: 'Sarah Johnson',
        phone: '+1 (555) 345-6780',
        relation: 'Sister'
      },
      skills: ['Digital Marketing', 'Social Media', 'Content Creation'],
      manager: 'Mike Wilson',
      officeLocation: 'Los Angeles Office'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      phone: '+1 (555) 456-7890',
      department: 'Finance',
      position: 'Financial Analyst',
      joiningDate: new Date('2022-09-15'),
      salary: 70000,
      status: 'inactive',
      address: '321 Elm St, Anytown, USA',
      emergencyContact: {
        name: 'Tom Wilson',
        phone: '+1 (555) 456-7891',
        relation: 'Father'
      },
      skills: ['Financial Analysis', 'Excel', 'QuickBooks'],
      manager: 'Lisa Brown',
      officeLocation: 'Chicago Office'
    }
  ];

  useEffect(() => {
    // Load mock data
    setDepartments(mockDepartments);
    setEmployees(mockEmployees);
  }, []);

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

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    setSnackbar({
      open: true,
      message: 'Employee deleted successfully',
      severity: 'success'
    });
  };

  const handleSaveEmployee = (employeeData: Partial<Employee>) => {
    if (selectedEmployee) {
      // Update existing employee
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
      // Create new employee
      const newEmployee: Employee = {
        id: Date.now().toString(),
        employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
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
    }
    setIsDialogOpen(false);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(salary);
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
              {paginatedEmployees.map((employee) => (
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
              ))}
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
        onClose={() => setIsDialogOpen(false)}
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
          {selectedEmployee && (
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
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