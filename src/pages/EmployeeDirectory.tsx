import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Users,
  Mail,
  Phone,
  Building,
  Briefcase,
  Badge,
  X,
  User,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import DashboardCard from '../components/DashboardCard';
// import { useAuthStore } from '../stores/authStore';
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

// Removed: statusColors (unused)

const EmployeeDirectory: React.FC = () => {
  // Removed: user (unused)
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

  // Removed: getStatusColor (unused)

  // Removed: formatSalary (unused)

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

  // Note: canViewSalary is currently unused in the compact view
  // const canViewSalary = !!(user && (user.role === 'admin' || user.role === 'hr'));

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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-base font-medium text-gray-700">Loading Employee Directory...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-gray-600">Manage your team members and their information</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleExportEmployees}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleCreateEmployee}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          name="Total Employees"
          value={employees.length}
          icon={Users}
          color="blue"
        />
        <DashboardCard
          name="Active Employees"
          value={employees.filter(emp => emp.status === 'active').length}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="Departments"
          value={departments.length}
          icon={Building}
          color="purple"
        />
        <DashboardCard
          name="New This Month"
          value={employees.filter(emp => {
            const joinDate = new Date(emp.joiningDate);
            const now = new Date();
            return joinDate.getMonth() === now.getMonth() && 
                   joinDate.getFullYear() === now.getFullYear();
          }).length}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Filter className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 ml-2">Filters</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Search Employees
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                placeholder="Search by name, email, or ID..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name} ({getDepartmentCount(dept.name)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Position
            </label>
            <select
              value={filters.position}
              onChange={(e) => handleFilterChange('position', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
            >
              <option value="">All Positions</option>
              {getUniquePositions().map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table (unified with Holidays table UI) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {employees.length === 0 ? 'No employees found' : 'No employees match the current filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {employees.length === 0 ? 'Add your first employee to get started.' : 'Try adjusting your search criteria.'}
            </p>
            {employees.length === 0 && (
              <button
                onClick={handleCreateEmployee}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            )}
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-xs">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-[12rem]">{employee.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{maskSalary(employee.salary)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          employee.status === 'active' ? "bg-green-100 text-green-800" :
                        employee.status === 'inactive' ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        )}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                    <button
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
                          className="text-green-600 hover:text-green-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                            onClick={() => handleViewEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedEmployee(employee); handleDeleteEmployee(); }}
                          className="text-red-600 hover:text-red-900"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-t border-b border-gray-300",
                  currentPage === page
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    {selectedEmployee ? <Edit className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-primary-600" />}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {selectedEmployee ? 'Edit Employee' : 'Add Employee'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Form */}
              <div className="space-y-4 pb-16">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Employee Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="Enter employee name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={selectedEmployee?.employeeId || `EMP${String(employees.length + 1).padStart(3, '0')}`}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Designation *
                      </label>
                      <input
                        type="text"
                        value={editFormData.position || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="Enter designation"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Department *
                      </label>
                      <select
                        value={editFormData.department || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, department: String(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Status *
                      </label>
                      <select
                        value={editFormData.status || 'active'}
                        onChange={(e) => setEditFormData({ ...editFormData, status: String(e.target.value) as Employee['status'] })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Employment Type
                      </label>
                      <select
                        value={editFormData.employmentType || 'Permanent'}
                        onChange={(e) => setEditFormData({ ...editFormData, employmentType: String(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      >
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Date of Joining
                      </label>
                      <input
                        type="date"
                        value={(editFormData.joiningDate ? new Date(editFormData.joiningDate) : new Date()).toISOString().split('T')[0]}
                        onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value ? new Date(e.target.value) : new Date() })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={(editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth) : new Date(0)).toISOString().split('T')[0]}
                        onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value ? new Date(e.target.value) : new Date(0) })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="Enter contact number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Gross Salary
                      </label>
                      <input
                        type="number"
                        value={editFormData.salary ?? 0}
                        onChange={(e) => setEditFormData({ ...editFormData, salary: Number(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="Enter salary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Office Location
                      </label>
                      <input
                        type="text"
                        value={editFormData.officeLocation || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, officeLocation: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        placeholder="Enter office location"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white mt-4 flex justify-end space-x-2 border-t border-gray-200 pt-3 z-[1] shadow-[0_-4px_8px_-4px_rgba(0,0,0,0.08)]">
                {selectedEmployee && (
                  <button
                    onClick={handleDeleteEmployee}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Mark Terminated
                  </button>
                )}
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEmployee}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 border border-blue-600"
                >
                  {isSaving ? 'Saving...' : (selectedEmployee ? 'Save Changes' : 'Add Employee')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details View Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Employee Details</h3>
                </div>
                <button
                  onClick={handleCloseDialog}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Employee Details Content */}
              {selectedEmployee && (
                <div className="space-y-6">
                  {/* Employee Header */}
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-xl">
                        {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{selectedEmployee.name}</h4>
                      <p className="text-gray-600">{selectedEmployee.employeeId}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedEmployee.status === 'active' ? "bg-green-100 text-green-800" :
                          selectedEmployee.status === 'inactive' ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">{selectedEmployee.department}</span>
                        <span className="text-sm text-gray-500">{selectedEmployee.position}</span>
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
                            <Badge className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Employee ID</p>
                            <p className="text-sm text-gray-600">{selectedEmployee.employeeId}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Name</p>
                            <p className="text-sm text-gray-600">{selectedEmployee.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Position</p>
                            <p className="text-sm text-gray-600">{selectedEmployee.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Building className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Department</p>
                            <p className="text-sm text-gray-600">{selectedEmployee.department}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Contact Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Email</p>
                            <p className="text-sm text-gray-600">{selectedEmployee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Phone className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Phone</p>
                            <p className="text-sm text-gray-600">{selectedEmployee.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Office Location</p>
                            <p className="text-sm text-gray-600">{selectedEmployee.officeLocation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Employment Details</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Joining Date</span>
                          <span className="text-sm text-gray-900">{new Date(selectedEmployee.joiningDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Salary</span>
                          <span className="text-sm text-gray-900">{formatIndianCurrency(selectedEmployee.salary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Status</span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedEmployee.status === 'active' ? "bg-green-100 text-green-800" :
                            selectedEmployee.status === 'inactive' ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Emergency Contact</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Name</span>
                          <span className="text-sm text-gray-900">{selectedEmployee.emergencyContact.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Relation</span>
                          <span className="text-sm text-gray-900">{selectedEmployee.emergencyContact.relation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Phone</span>
                          <span className="text-sm text-gray-900">{selectedEmployee.emergencyContact.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                <button
                  onClick={handleCloseDialog}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={cn(
            "px-4 py-3 rounded-lg shadow-lg max-w-sm",
            snackbar.severity === 'success' ? "bg-green-50 border border-green-200" :
            snackbar.severity === 'error' ? "bg-red-50 border border-red-200" :
            "bg-blue-50 border border-blue-200"
          )}>
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-sm font-medium",
                snackbar.severity === 'success' ? "text-green-800" :
                snackbar.severity === 'error' ? "text-red-800" :
                "text-blue-800"
              )}>
          {snackbar.message}
              </p>
              <button
                onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;