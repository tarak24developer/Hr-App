import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CreditCard as PayrollIcon,
  AccessTime as AttendanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Business as BusinessIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
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

type ExtendedEmployee = Employee & Partial<{
  employmentType: string;
  gender: string;
  dateOfBirth: Date;
  retirementAge: number;
  pfEsicOption: number;
  pfNumber: string;
  uanNumber: string;
  esiNumber: string;
  bankName: string;
  branch: string;
  ifsc: string;
  bankAccount: string;
  aadhaarNumber: string;
  panNumber: string;
  bloodGroup: string;
  educationalQualification: string;
  residence: string;
  spouseName: string;
  remarks: string;
  resigned: boolean;
}>;

const EmployeeProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const params = useParams();

  // removed local employees list to reduce unused state/lints
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ExtendedEmployee>>({});
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  // removed tabs in favor of single-page layout
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchValue, setSearchValue] = useState<Employee | null>(null);
  const [isInlineEdit, setIsInlineEdit] = useState(false);
	const [filterText, setFilterText] = useState('');
	const [filterDept, setFilterDept] = useState<string | 'all'>('all');
	const [sortBy, setSortBy] = useState<'name'|'department'|'position'>('name');
	const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

	const filteredSortedEmployees = (employees as any[])
		.filter((e) => {
			const t = filterText.trim().toLowerCase();
			const passesText = !t || (e.name || e.email || '').toLowerCase().includes(t) || (e.employeeId || '').toLowerCase().includes(t);
			const passesDept = filterDept === 'all' || (e.department || '').toLowerCase() === String(filterDept).toLowerCase();
			return passesText && passesDept;
		})
		.sort((a, b) => {
			const av = (a[sortBy] || '').toString().toLowerCase();
			const bv = (b[sortBy] || '').toString().toLowerCase();
			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});

  const opsRef = useRef<HTMLDivElement | null>(null);

  const selectEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setSearchValue(emp);
    setIsInlineEdit(false);
    setTimeout(() => {
      opsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const maskSalary = (salary: number) => {
    const formatted = formatIndianCurrency(salary);
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

  // pf/esic label helper not needed here; rendering inline

  const rollLabel = (status?: string) => {
    if (status === 'active') return 'On Roll';
    if (status === 'inactive') return 'Off Roll';
    if (status === 'terminated') return 'Resigned';
    return 'Not specified';
  };

  const copy = async (label: string, value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setSnackbar({ open: true, message: `${label} copied`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: `Failed to copy ${label}`, severity: 'error' });
    }
  };

  const FieldRow: React.FC<{ label: string; value?: React.ReactNode; copyable?: boolean }>
    = ({ label, value, copyable }) => (
    <ListItem secondaryAction={copyable && value ? (
      <Tooltip title={`Copy ${label}`}>
        <IconButton edge="end" onClick={() => copy(label, String(value))}>
          <CopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ) : undefined}>
      <ListItemText primary={label} secondary={value || 'Not specified'} />
    </ListItem>
  );

  // Load employees from Firebase
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const usersResult = await firebaseService.getCollection('users');
        if (usersResult && usersResult.success && usersResult.data) {
          const transformedEmployees = usersResult.data.map((user: any, index: number) => ({
            id: user['id'],
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
            officeLocation: user.officeLocation || '',
            // extended fields if present
            gender: user.gender,
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
            retirementAge: user.retirementAge,
            pfEsicOption: user.pfEsicOption,
            pfNumber: user.pfNumber,
            uanNumber: user.uanNumber,
            esiNumber: user.esiNumber,
            bankName: user.bankingInfo?.bankName,
            branch: user.bankingInfo?.branch,
            ifsc: user.bankingInfo?.ifscCode,
            bankAccount: user.bankingInfo?.accountNumber,
            aadhaarNumber: user.governmentInfo?.aadharNumber,
            panNumber: user.governmentInfo?.panNumber,
            bloodGroup: user.bloodGroup,
            educationalQualification: user.educationalQualification,
            residence: user.residence,
            spouseName: user.spouseName,
            remarks: user.remarks,
            resigned: user.resigned
          }));
          setEmployees(transformedEmployees as Employee[]);

          const routeId = location?.state?.employeeId || params?.['id'];
          const found = routeId ? (transformedEmployees.find((e: any) => e['id'] === routeId) || null) : null;
          setSelectedEmployee(found);
          setSearchValue(found || null);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
        setSnackbar({ open: true, message: 'Failed to load employees', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // legacy modal edit handler removed (inline edit is used)

  const handleDeleteEmployee = (employee?: Employee) => {
    const emp = employee || selectedEmployee;
    if (!emp) return;
    setSelectedEmployee(emp);
    setIsDeleteDialogOpen(true);
  };

  const handleManagePayroll = () => {
    if (!selectedEmployee) return;
    navigate('/payroll', { state: { employeeId: selectedEmployee.id } });
  };

  const handleManageAttendance = () => {
    if (!selectedEmployee) return;
    navigate('/attendance', { state: { employeeId: selectedEmployee.id } });
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      const updateData = {
        firstName: editFormData.name?.split(' ')[0] || '',
        lastName: editFormData.name?.split(' ').slice(1).join(' ') || '',
        email: editFormData.email || '',
        phone: editFormData.phone || '',
        department: editFormData.department || '',
        position: editFormData.position || '',
        hireDate: editFormData.joiningDate?.toISOString() || new Date().toISOString(),
        salary: editFormData.salary || 0,
        address: editFormData.address || '',
        skills: editFormData.skills || [],
        officeLocation: editFormData.officeLocation || '',
        // extended fields
        gender: (editFormData as any).gender || '',
        dateOfBirth: (editFormData as any).dateOfBirth ? (editFormData as any).dateOfBirth.toISOString?.() || new Date((editFormData as any).dateOfBirth).toISOString() : undefined,
        retirementAge: (editFormData as any).retirementAge ?? undefined,
        spouseName: (editFormData as any).spouseName || '',
        employmentType: (editFormData as any).employmentType || '',
        pfEsicOption: (editFormData as any).pfEsicOption ?? 4,
        pfNumber: (editFormData as any).pfNumber || '',
        uanNumber: (editFormData as any).uanNumber || '',
        esiNumber: (editFormData as any).esiNumber || '',
        bankingInfo: {
          bankName: (editFormData as any).bankName || '',
          branch: (editFormData as any).branch || '',
          ifscCode: (editFormData as any).ifsc || '',
          accountNumber: (editFormData as any).bankAccount || ''
        },
        governmentInfo: {
          aadharNumber: (editFormData as any).aadhaarNumber || '',
          panNumber: (editFormData as any).panNumber || ''
        },
        bloodGroup: (editFormData as any).bloodGroup || '',
        educationalQualification: (editFormData as any).educationalQualification || '',
        residence: (editFormData as any).residence || editFormData.address || '',
        remarks: (editFormData as any).remarks || '',
        emergencyContact: {
          name: (selectedEmployee as any).emergencyContact?.name || '',
          phone: (editFormData as any).emergencyPhone || (selectedEmployee as any).emergencyContact?.phone || '',
          relationship: (selectedEmployee as any).emergencyContact?.relationship || ''
        },
        updatedAt: new Date().toISOString()
      };

      const updateResult = await firebaseService.updateDocument('users', selectedEmployee.id, updateData);
      if (updateResult && updateResult.success) {
        setSelectedEmployee(prev => prev ? { ...prev, ...editFormData } as Employee : prev);
        setSnackbar({ open: true, message: 'Employee updated successfully', severity: 'success' });
        setIsInlineEdit(false);
      } else {
        throw new Error(updateResult?.error || 'Failed to update employee');
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: `Failed to update employee: ${error.message}`, severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;

    try {
      await firebaseService.updateDocument('users', selectedEmployee.id, { 
        status: 'terminated',
        updatedAt: new Date().toISOString()
      });
      setSelectedEmployee(prev => prev ? { ...prev, status: 'terminated' } : prev);
      setSnackbar({ open: true, message: 'Employee status updated to terminated', severity: 'success' });
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      setSnackbar({ open: true, message: `Failed to update employee status: ${error.message}`, severity: 'error' });
    }
  };

  // helper retained previously for potential color mapping – not used now

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  // removed unused CSS var read

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Employee Profile
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 320 }}>
          <Autocomplete
            size="small"
            sx={{ minWidth: 300 }}
            options={employees}
            value={searchValue}
            getOptionLabel={(opt: any) => opt?.name || opt?.email || opt?.employeeId || ''}
            onChange={(_, val: any) => { if (val) selectEmployee(val); }}
            renderInput={(params) => (
              <TextField
                {...(params as any)}
                size="small"
                placeholder="Search employees"
                InputProps={{
                  ...(params.InputProps as any),
                  startAdornment: (
                    <InputAdornment position="start">
                      <span role="img" aria-label="search">🔎</span>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
          {selectedEmployee && !isInlineEdit && (
            <Button variant="outlined" onClick={() => { setSelectedEmployee(null); setSearchValue(null); }}>Back to View Employees</Button>
          )}
          {isInlineEdit && (
            <Button variant="outlined" onClick={() => { setIsInlineEdit(false); }}>Back to Employee Profile</Button>
          )}
        </Box>
      </Box>

      {/* Employee List - shown when no employee is selected */}
      {employees.length > 0 && !selectedEmployee && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Select an Employee
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <TextField size="small" label="Quick search" value={filterText} onChange={(e) => setFilterText(e.target.value)} sx={{ minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Department</InputLabel>
              <Select value={filterDept} label="Department" onChange={(e) => setFilterDept(e.target.value as any)}>
                <MenuItem value="all">All</MenuItem>
                {Array.from(new Set(employees.map((e: any) => e.department || 'Unassigned'))).map((d: any) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Employee ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSortedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No employees found. Use the search bar to find employees.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSortedEmployees.map((emp: any) => (
                    <TableRow key={emp.id} hover sx={{ cursor: 'pointer' }} onClick={() => selectEmployee(emp)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                            {emp.name?.split(' ').map((n: string) => n[0]).join('') || emp.email?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {emp.name || emp.email}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {emp.employeeId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {emp.department || 'Unassigned'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WorkIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {emp.position || 'Employee'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {emp.employeeId}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Employee Profile Content */}
      {selectedEmployee && (
        <>
          {/* Employee Header Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                {selectedEmployee.name.split(' ').map((n: string) => n[0]).join('')}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {selectedEmployee.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip label={rollLabel(selectedEmployee.status)} color={selectedEmployee.status === 'active' ? 'success' : selectedEmployee.status === 'inactive' ? 'warning' : 'default'} />
                  <Chip label={selectedEmployee.position} variant="outlined" />
                  <Chip label={selectedEmployee.department} variant="outlined" />
                  <Chip label={`ID: ${selectedEmployee.employeeId}`} variant="outlined" size="small" />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Operations Section */}
          {!isInlineEdit && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Operations
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => { setIsInlineEdit(true); setEditFormData(selectedEmployee as any); }}>
                  Edit Employee
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteEmployee()}>
                  Delete Employee
                </Button>
                <Button variant="outlined" startIcon={<PayrollIcon />} onClick={handleManagePayroll}>
                  Manage Payroll
                </Button>
                <Button variant="outlined" startIcon={<AttendanceIcon />} onClick={handleManageAttendance}>
                  Manage Attendance
                </Button>
              </Box>
            </Paper>
          )}

          {/* Employee Details */}
          {!isInlineEdit && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              {/* Personal Information */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, borderBottom: 2, borderColor: 'primary.main', pb: 1 }}>
                  👤 Personal Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FieldRow label="Employee ID" value={selectedEmployee.employeeId} />
                  <FieldRow label="Full Name (As per Aadhaar)" value={selectedEmployee.name} />
                  <FieldRow label="Gender" value={(selectedEmployee as any).gender || 'Not specified'} />
                  <FieldRow label="Date of Birth" value={(selectedEmployee as any).dateOfBirth ? new Date((selectedEmployee as any).dateOfBirth).toLocaleDateString() : 'Not specified'} />
                  <FieldRow label="Retirement Age" value={(selectedEmployee as any).retirementAge || 'Not specified'} />
                  <FieldRow label="Spouse/Wife/Daughter/Other" value={(selectedEmployee as any).spouseName || 'Not specified'} />
                  <FieldRow label="Blood Group" value={(selectedEmployee as any).bloodGroup || 'Not specified'} />
                  <FieldRow label="Educational Qualification" value={(selectedEmployee as any).educationalQualification || 'Not specified'} />
                  <FieldRow label="Address" value={selectedEmployee.address || 'Not specified'} />
                </Box>
              </Paper>

              {/* Job & Employment Details */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, borderBottom: 2, borderColor: 'primary.main', pb: 1 }}>
                  💼 Job & Employment
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FieldRow label="Designation" value={selectedEmployee.position} />
                  <FieldRow label="Department" value={selectedEmployee.department} />
                  <FieldRow label="Employment Type" value={(selectedEmployee as any).employmentType || 'Not specified'} />
                  <FieldRow label="Date of Joining" value={selectedEmployee.joiningDate.toLocaleDateString()} />
                  <FieldRow label="Employment Status" value={rollLabel(selectedEmployee.status)} />
                  <FieldRow label="Office Location" value={selectedEmployee.officeLocation || 'Not specified'} />
                  <FieldRow label="Manager" value={selectedEmployee.manager || 'Not specified'} />
                  <FieldRow label="Skills" value={selectedEmployee.skills?.join(', ') || 'Not specified'} />
                </Box>
              </Paper>

              {/* Contact & Communication */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, borderBottom: 2, borderColor: 'primary.main', pb: 1 }}>
                  📞 Contact & Communication
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FieldRow label="Email Address" value={selectedEmployee.email} copyable />
                  <FieldRow label="Phone Number" value={selectedEmployee.phone || 'Not specified'} copyable />
                  <FieldRow label="Emergency Contact Name" value={selectedEmployee.emergencyContact?.name || 'Not specified'} />
                  <FieldRow label="Emergency Contact Phone" value={selectedEmployee.emergencyContact?.phone || 'Not specified'} copyable />
                  <FieldRow label="Emergency Contact Relation" value={selectedEmployee.emergencyContact?.relation || 'Not specified'} />
                  <FieldRow label="Residence" value={(selectedEmployee as any).residence || 'Not specified'} />
                </Box>
              </Paper>

              {/* Payroll & Benefits */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, borderBottom: 2, borderColor: 'primary.main', pb: 1 }}>
                  💰 Payroll & Benefits
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FieldRow label="Gross Salary" value={maskSalary(selectedEmployee.salary)} />
                  <FieldRow label="PF/ESI Status" value={(() => { const opt = (selectedEmployee as any).pfEsicOption; return opt === 1 ? 'PF' : opt === 2 ? 'ESI' : opt === 3 ? 'Both' : opt === 4 ? 'None' : 'Not specified'; })()} />
                  <FieldRow label="PF Number" value={(selectedEmployee as any).pfNumber || 'Not specified'} copyable />
                  <FieldRow label="UAN Number" value={(selectedEmployee as any).uanNumber || 'Not specified'} copyable />
                  <FieldRow label="ESI Number" value={(selectedEmployee as any).esiNumber || 'Not specified'} copyable />
                </Box>
              </Paper>

              {/* Banking & KYC */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, borderBottom: 2, borderColor: 'primary.main', pb: 1 }}>
                  🏦 Banking & KYC
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FieldRow label="Bank Name" value={(selectedEmployee as any).bankName || 'Not specified'} />
                  <FieldRow label="Branch" value={(selectedEmployee as any).branch || 'Not specified'} />
                  <FieldRow label="IFSC Code" value={(selectedEmployee as any).ifsc || 'Not specified'} />
                  <FieldRow label="Bank Account Number" value={(selectedEmployee as any).bankAccount || 'Not specified'} copyable />
                  <FieldRow label="Aadhaar Number" value={(selectedEmployee as any).aadhaarNumber || 'Not specified'} copyable />
                  <FieldRow label="PAN Number" value={(selectedEmployee as any).panNumber || 'Not specified'} copyable />
                </Box>
              </Paper>

              {/* Additional Information */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, borderBottom: 2, borderColor: 'primary.main', pb: 1 }}>
                  📋 Additional Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FieldRow label="Resigned" value={(selectedEmployee as any).resigned ? 'Yes' : 'No'} />
                  <FieldRow label="Remarks" value={(selectedEmployee as any).remarks || 'No remarks'} />
                </Box>
              </Paper>
            </Box>
          )}

          {/* Edit Employee Form */}
          {isInlineEdit && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Edit Employee
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Personal */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Personal Details</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField required fullWidth label="Full Name" value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} helperText="As per Aadhaar" />
                    <TextField fullWidth label="Gender" value={(editFormData as any).gender || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), gender: e.target.value })} />
                    <TextField fullWidth label="DOB" type="date" value={(editFormData as any).dateOfBirth ? (new Date((editFormData as any).dateOfBirth)).toISOString().split('T')[0] : ''} onChange={(e) => setEditFormData({ ...(editFormData as any), dateOfBirth: new Date(e.target.value) as any })} InputLabelProps={{ shrink: true }} />
                    <TextField fullWidth label="Retirement Age" type="number" value={(editFormData as any).retirementAge ?? ''} onChange={(e) => setEditFormData({ ...(editFormData as any), retirementAge: Number(e.target.value) as any })} />
                    <TextField fullWidth label="S/W/D/O" value={(editFormData as any).spouseName || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), spouseName: e.target.value as any })} />
                    <TextField fullWidth label="Emergency Phone" value={(editFormData as any).emergencyPhone || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), emergencyPhone: e.target.value as any })} />
                    <TextField fullWidth label="Address" multiline rows={2} value={editFormData.address || ''} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }} />
                  </Box>
                </Paper>

                {/* Job */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Job Details</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField required fullWidth label="Email" type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                    <TextField fullWidth label="Phone" value={editFormData.phone || ''} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />
                    <FormControl fullWidth>
                      <InputLabel required>Department</InputLabel>
                      <Select value={editFormData.department || ''} label="Department" onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}>
                        <MenuItem value="Information Technology">Information Technology</MenuItem>
                        <MenuItem value="Human Resources">Human Resources</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                        <MenuItem value="Finance">Finance</MenuItem>
                        <MenuItem value="Sales">Sales</MenuItem>
                        <MenuItem value="Operations">Operations</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel required>Position</InputLabel>
                      <Select value={editFormData.position || ''} label="Position" onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}>
                        <MenuItem value="Software Engineer">Software Engineer</MenuItem>
                        <MenuItem value="Senior Software Engineer">Senior Software Engineer</MenuItem>
                        <MenuItem value="HR Manager">HR Manager</MenuItem>
                        <MenuItem value="Marketing Manager">Marketing Manager</MenuItem>
                        <MenuItem value="Financial Analyst">Financial Analyst</MenuItem>
                        <MenuItem value="Sales Representative">Sales Representative</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Employment Type</InputLabel>
                      <Select value={(editFormData as any).employmentType || ''} label="Employment Type" onChange={(e) => setEditFormData({ ...(editFormData as any), employmentType: e.target.value as any })}>
                        <MenuItem value="Permanent">Permanent</MenuItem>
                        <MenuItem value="Contract">Contract</MenuItem>
                        <MenuItem value="Intern">Intern</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField required fullWidth label="Joining Date" type="date" value={editFormData.joiningDate ? editFormData.joiningDate.toISOString().split('T')[0] : ''} onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value ? new Date(e.target.value) : new Date() })} InputLabelProps={{ shrink: true }} />
                    <TextField required fullWidth label="Salary (₹)" type="number" value={editFormData.salary || ''} onChange={(e) => setEditFormData({ ...editFormData, salary: Number(e.target.value) || 0 })} InputProps={{ startAdornment: (<InputAdornment position="start">₹</InputAdornment>) }} />
                    <FormControl fullWidth>
                      <InputLabel>PF/ESI Option</InputLabel>
                      <Select value={(editFormData as any).pfEsicOption ?? 4} label="PF/ESI Option" onChange={(e) => setEditFormData({ ...(editFormData as any), pfEsicOption: Number(e.target.value) as any })}>
                        <MenuItem value={1}>PF</MenuItem>
                        <MenuItem value={2}>ESI</MenuItem>
                        <MenuItem value={3}>Both</MenuItem>
                        <MenuItem value={4}>None</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField fullWidth label="PF Number" value={(editFormData as any).pfNumber || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), pfNumber: e.target.value as any })} />
                    <TextField fullWidth label="UAN Number" value={(editFormData as any).uanNumber || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), uanNumber: e.target.value as any })} />
                    <TextField fullWidth label="ESI Number" value={(editFormData as any).esiNumber || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), esiNumber: e.target.value as any })} />
                  </Box>
                </Paper>

                {/* Bank & KYC */}
                <Paper variant="outlined" sx={{ p: 3, gridColumn: { xs: 'auto', md: '1 / -1' } }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Bank & KYC Details</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField fullWidth label="Bank Name" value={(editFormData as any).bankName || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), bankName: e.target.value as any })} />
                    <TextField fullWidth label="Branch" value={(editFormData as any).branch || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), branch: e.target.value as any })} />
                    <TextField fullWidth label="IFSC" value={(editFormData as any).ifsc || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), ifsc: e.target.value as any })} />
                    <TextField fullWidth label="Bank Account" value={(editFormData as any).bankAccount || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), bankAccount: e.target.value as any })} />
                    <TextField fullWidth label="Aadhaar Number" value={(editFormData as any).aadhaarNumber || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), aadhaarNumber: e.target.value as any })} />
                    <TextField fullWidth label="PAN Number" value={(editFormData as any).panNumber || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), panNumber: e.target.value as any })} />
                    <TextField fullWidth label="Blood Group" value={(editFormData as any).bloodGroup || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), bloodGroup: e.target.value as any })} />
                    <TextField fullWidth label="Educational Qualification" value={(editFormData as any).educationalQualification || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), educationalQualification: e.target.value as any })} />
                    <TextField fullWidth label="Remarks" multiline rows={2} value={(editFormData as any).remarks || ''} onChange={(e) => setEditFormData({ ...(editFormData as any), remarks: e.target.value as any })} sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }} />
                  </Box>
                </Paper>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => { setIsInlineEdit(false); setEditFormData(selectedEmployee as any); }}>
                  Cancel
                </Button>
                <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* No Employee Selected Message */}
      {!selectedEmployee && employees.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No Employees Found</Typography>
          <Typography variant="body2" color="textSecondary">
            Use the search bar above to find employees or add new employees to get started.
          </Typography>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this employee as terminated? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeProfile;
