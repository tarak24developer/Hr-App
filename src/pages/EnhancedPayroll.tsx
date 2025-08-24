import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Tooltip,
  Stack,
  Container,
  Fade,
  TablePagination,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CheckCircle,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  PlayArrow as ProcessIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

// Types
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
  baseSalary: number;
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
  processedBy: string;
  processedAt: string;
  paidAt?: string;
}

interface PayrollFormData {
  employeeId: string;
  month: string;
  year: number;
  baseSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  bonuses: number;
  allowances: number;
  deductions: number;
}

const EnhancedPayroll: React.FC = () => {
  const theme = useTheme();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [formData, setFormData] = useState<PayrollFormData>({
    employeeId: '',
    month: new Date().getMonth().toString().padStart(2, '0'),
    year: new Date().getFullYear(),
    baseSalary: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    bonuses: 0,
    allowances: 0,
    deductions: 0
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [processing, setProcessing] = useState(false);

  // Sample data
  const sampleEmployees: Employee[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      department: 'Engineering',
      position: 'Software Engineer',
      baseSalary: 75000,
      joinDate: '2023-01-15',
      isActive: true
    },
    {
      id: '2',
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
      department: 'Marketing',
      position: 'Marketing Manager',
      baseSalary: 65000,
      joinDate: '2023-02-01',
      isActive: true
    }
  ];

  const samplePayrollRecords: PayrollRecord[] = [
    {
      id: '1',
      employeeId: '1',
      employee: sampleEmployees[0],
      month: '01',
      year: 2024,
      baseSalary: 6250,
      overtimeHours: 10,
      overtimeRate: 35,
      overtimePay: 350,
      bonuses: 500,
      allowances: 200,
      deductions: 100,
      taxDeductions: 1250,
      grossPay: 7300,
      netPay: 5950,
      status: 'approved',
      processedBy: 'HR Admin',
      processedAt: '2024-01-31T10:00:00Z'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmployees(sampleEmployees);
      setPayrollRecords(samplePayrollRecords);
    } catch (err) {
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = (data: PayrollFormData) => {
    const overtimePay = data.overtimeHours * data.overtimeRate;
    const grossPay = data.baseSalary + overtimePay + data.bonuses + data.allowances - data.deductions;
    const taxRate = 0.20;
    const taxDeductions = grossPay * taxRate;
    const netPay = grossPay - taxDeductions;

    return {
      overtimePay,
      grossPay,
      taxDeductions,
      netPay
    };
  };

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = 
      record.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || record.employee.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleCreateClick = () => {
    setFormData({
      employeeId: '',
      month: new Date().getMonth().toString().padStart(2, '0'),
      year: new Date().getFullYear(),
      baseSalary: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      bonuses: 0,
      allowances: 0,
      deductions: 0
    });
    setShowCreateDialog(true);
  };

  const handleEditClick = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setFormData({
      employeeId: record.employeeId,
      month: record.month,
      year: record.year,
      baseSalary: record.baseSalary,
      overtimeHours: record.overtimeHours,
      overtimeRate: record.overtimeRate,
      bonuses: record.bonuses,
      allowances: record.allowances,
      deductions: record.deductions
    });
    setShowEditDialog(true);
  };

  const handleViewClick = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  const handleDeleteClick = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employeeId,
        baseSalary: Math.round(employee.baseSalary / 12)
      }));
    }
  };

  const handleFormSubmit = async () => {
    try {
      setProcessing(true);
      const employee = employees.find(emp => emp.id === formData.employeeId);
      if (!employee) {
        setSnackbar({ open: true, message: 'Employee not found', severity: 'error' });
        return;
      }

      const calculations = calculatePayroll(formData);
      
      if (showCreateDialog) {
        const newRecord: PayrollRecord = {
          id: Date.now().toString(),
          employeeId: formData.employeeId,
          employee,
          month: formData.month,
          year: formData.year,
          baseSalary: formData.baseSalary,
          overtimeHours: formData.overtimeHours,
          overtimeRate: formData.overtimeRate,
          overtimePay: calculations.overtimePay,
          bonuses: formData.bonuses,
          allowances: formData.allowances,
          deductions: formData.deductions,
          taxDeductions: calculations.taxDeductions,
          grossPay: calculations.grossPay,
          netPay: calculations.netPay,
          status: 'draft',
          processedBy: 'Current User',
          processedAt: new Date().toISOString()
        };
        
        setPayrollRecords(prev => [newRecord, ...prev]);
        setSnackbar({ open: true, message: 'Payroll record created successfully', severity: 'success' });
        setShowCreateDialog(false);
      } else if (showEditDialog && selectedRecord) {
        const updatedRecord: PayrollRecord = {
          ...selectedRecord,
          month: formData.month,
          year: formData.year,
          baseSalary: formData.baseSalary,
          overtimeHours: formData.overtimeHours,
          overtimeRate: formData.overtimeRate,
          overtimePay: calculations.overtimePay,
          bonuses: formData.bonuses,
          allowances: formData.allowances,
          deductions: formData.deductions,
          taxDeductions: calculations.taxDeductions,
          grossPay: calculations.grossPay,
          netPay: calculations.netPay,
          processedAt: new Date().toISOString()
        };
        
        setPayrollRecords(prev => prev.map(record => 
          record.id === selectedRecord.id ? updatedRecord : record
        ));
        setSnackbar({ open: true, message: 'Payroll record updated successfully', severity: 'success' });
        setShowEditDialog(false);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Operation failed', severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedRecord) {
        setPayrollRecords(prev => prev.filter(record => record.id !== selectedRecord.id));
        setSnackbar({ open: true, message: 'Payroll record deleted successfully', severity: 'success' });
        setShowDeleteDialog(false);
        setSelectedRecord(null);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete payroll record', severity: 'error' });
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: PayrollRecord['status']) => {
    try {
      setPayrollRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              status: newStatus,
              paidAt: newStatus === 'paid' ? new Date().toISOString() : record.paidAt
            }
          : record
      ));
      setSnackbar({ open: true, message: `Status updated to ${newStatus}`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const getStatusIcon = (status: PayrollRecord['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle color="success" />;
      case 'paid': return <CheckCircle color="success" />;
      case 'pending': return <PendingIcon color="warning" />;
      case 'rejected': return <RejectedIcon color="error" />;
      default: return <ProcessIcon color="info" />;
    }
  };

  const getStatusColor = (status: PayrollRecord['status']) => {
    switch (status) {
      case 'approved': return 'success';
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'info';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Enhanced Payroll Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              Create Payroll
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {formatCurrency(payrollRecords.reduce((sum, record) => sum + record.netPay, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Payroll
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {payrollRecords.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Records
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
                sx={{ minWidth: 300 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {Array.from(new Set(employees.map(emp => emp.department))).map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Payroll Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Base Salary</TableCell>
                    <TableCell>Gross Pay</TableCell>
                    <TableCell>Net Pay</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {record.employee.firstName} {record.employee.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {record.employee.employeeId} • {record.employee.department}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(record.year, parseInt(record.month) - 1).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell>{formatCurrency(record.baseSalary)}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {formatCurrency(record.grossPay)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(record.netPay)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(record.status)}
                            label={record.status.toUpperCase()}
                            size="small"
                            color={getStatusColor(record.status) as any}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewClick(record)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditClick(record)}
                                disabled={record.status === 'paid'}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteClick(record)}
                                disabled={record.status === 'paid'}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRecords.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>

          {/* Dialogs would continue here but truncated for brevity */}
          
          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default EnhancedPayroll;
