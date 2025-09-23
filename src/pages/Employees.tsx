import React, { useEffect, useMemo, useState } from 'react';
import { useDepartmentsList } from '@/hooks/useDepartments';
import { Plus, Search, Eye, Edit, Trash2, AlertCircle, Users, X, User, Badge, Briefcase, Building, Mail, Phone, MapPin } from 'lucide-react';
import firebaseService from '../services/firebaseService';
import { formatIndianCurrency } from '../utils/currency';
import { cn } from '../utils/cn';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  status: 'active' | 'upcoming' | 'inactive' | 'terminated';
  // Personal
  gender?: string;
  dateOfBirth?: string; // ISO yyyy-mm-dd
  residence?: string;
  spouseName?: string;
  bloodGroup?: string;
  educationalQualification?: string;
  remarks?: string;
  // Employment
  joiningDate?: string; // ISO yyyy-mm-dd
  rollStatus?: 'on' | 'off';
  resigned?: boolean;
  retirementAge?: number;
  // PF/ESI
  pfStatus?: 'active' | 'inactive';
  pfNumber?: string;
  uanNumber?: string;
  esiNumber?: string;
  // Bank
  bankName?: string;
  branch?: string;
  ifsc?: string;
  bankAccount?: string;
  // IDs
  panNumber?: string;
  aadhaarNumber?: string;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Employee['status']>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Partial<Employee>>({});
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ status: 'active' });
  // formError messaging currently handled inline; add if needed

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await firebaseService.getCollection<any>('users');
        if (res.success && res.data) {
          const mapped: Employee[] = res.data.map((u: any, idx: number) => ({
            id: u.id || u.employeeId || String(idx),
            employeeId: u.employeeId || `EMP${(idx + 1).toString().padStart(3, '0')}`,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName || u.email || 'Employee',
            email: u.email || '',
            phone: u.phone || '',
            department: u.department || 'General',
            position: u.position || 'Employee',
            salary: Number(u.salary || 0),
            status: (u.status as Employee['status']) || 'active',
            gender: u.gender || '',
            dateOfBirth: u.dateOfBirth || '',
            residence: u.residence || '',
            spouseName: u.spouseName || '',
            bloodGroup: u.bloodGroup || '',
            educationalQualification: u.educationalQualification || '',
            remarks: u.remarks || '',
            joiningDate: u.hireDate || '',
            rollStatus: (u.status === 'active' ? 'on' : 'off'),
            resigned: Boolean(u.resigned),
            retirementAge: typeof u.retirementAge === 'number' ? u.retirementAge : 0,
            pfStatus: (u.pfStatus === 'active' || u.pfStatus === 'inactive') ? u.pfStatus : 'inactive',
            pfNumber: u.pfNumber || '',
            uanNumber: u.uanNumber || '',
            esiNumber: u.esiNumber || '',
            bankName: (u.bankingInfo && u.bankingInfo.bankName) || '',
            branch: (u.bankingInfo && u.bankingInfo.branch) || '',
            ifsc: (u.bankingInfo && u.bankingInfo.ifscCode) || '',
            bankAccount: (u.bankingInfo && u.bankingInfo.accountNumber) || '',
            panNumber: (u.governmentInfo && u.governmentInfo.panNumber) || '',
            aadhaarNumber: (u.governmentInfo && u.governmentInfo.aadharNumber) || ''
          }));
          setEmployees(mapped);
        } else {
          setEmployees([]);
        }
      } catch (e) {
        setError('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const departments = useDepartmentsList();
  const departmentOptions = useMemo(() => ['all', ...departments], [departments]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = [e.name, e.email, e.phone, e.department, e.position, e.id]
        .join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesDept = departmentFilter === 'all' || (e.department || '').toLowerCase() === departmentFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  const openView = (emp: Employee) => { setSelectedEmployee(emp); setViewModalOpen(true); };
  const openEdit = (emp: Employee) => { setSelectedEmployee(emp); setEditEmployee(emp); setEditModalOpen(true); };
  const openDelete = (emp: Employee) => { setSelectedEmployee(emp); setDeleteModalOpen(true); };

  const validateEmployee = (e: Partial<Employee>) => {
    if (!e.employeeId || !e.name || !e.phone || !e.aadhaarNumber || !e.panNumber || !e.bankAccount) {
      return 'Employee ID, Name, Contact, Aadhaar, PAN, and Bank Account are required.';
    }
    return '';
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;
    try {
      // validate inline
      const err = validateEmployee(editEmployee);
      if (err) { try { window.alert(err); } catch {} return; }
      const payload = {
        employeeId: editEmployee.employeeId || '',
        firstName: (editEmployee.name || '').split(' ')[0] || '',
        lastName: (editEmployee.name || '').split(' ').slice(1).join(' '),
        email: editEmployee.email || '',
        phone: editEmployee.phone || '',
        department: editEmployee.department || '',
        position: editEmployee.position || '',
        salary: Number(editEmployee.salary || 0),
        status: editEmployee.status || 'active',
        gender: editEmployee.gender || '',
        dateOfBirth: editEmployee.dateOfBirth || '',
        residence: editEmployee.residence || '',
        spouseName: editEmployee.spouseName || '',
        bloodGroup: editEmployee.bloodGroup || '',
        educationalQualification: editEmployee.educationalQualification || '',
        remarks: editEmployee.remarks || '',
        hireDate: editEmployee.joiningDate || '',
        resigned: editEmployee.resigned || false,
        retirementAge: editEmployee.retirementAge || undefined,
        pfStatus: editEmployee.pfStatus || '',
        pfNumber: editEmployee.pfNumber || '',
        uanNumber: editEmployee.uanNumber || '',
        esiNumber: editEmployee.esiNumber || '',
        bankingInfo: {
          bankName: editEmployee.bankName || '',
          branch: editEmployee.branch || '',
          ifscCode: editEmployee.ifsc || '',
          accountNumber: editEmployee.bankAccount || ''
        },
        governmentInfo: {
          panNumber: editEmployee.panNumber || '',
          aadharNumber: editEmployee.aadhaarNumber || ''
        },
        updatedAt: new Date().toISOString()
      };
      await firebaseService.updateDocument('users', selectedEmployee.id, payload);
      setEmployees(prev => prev.map((e: Employee) => e.id === selectedEmployee.id ? ({
        ...e,
        employeeId: editEmployee.employeeId || e.employeeId,
        name: editEmployee.name || e.name,
        email: editEmployee.email || e.email,
        phone: editEmployee.phone || e.phone || '',
        department: editEmployee.department || e.department || '',
        position: editEmployee.position || e.position || '',
        salary: Number(editEmployee.salary ?? e.salary ?? 0),
        status: (editEmployee.status as Employee['status']) || e.status,
        gender: editEmployee.gender ?? e.gender ?? '',
        dateOfBirth: editEmployee.dateOfBirth ?? e.dateOfBirth ?? '',
        residence: editEmployee.residence ?? e.residence ?? '',
        spouseName: editEmployee.spouseName ?? e.spouseName ?? '',
        bloodGroup: editEmployee.bloodGroup ?? e.bloodGroup ?? '',
        educationalQualification: editEmployee.educationalQualification ?? e.educationalQualification ?? '',
        remarks: editEmployee.remarks ?? e.remarks ?? '',
        joiningDate: editEmployee.joiningDate ?? e.joiningDate ?? '',
        resigned: typeof editEmployee.resigned === 'boolean' ? editEmployee.resigned : Boolean(e.resigned),
        retirementAge: editEmployee.retirementAge ?? e.retirementAge ?? 0,
        pfStatus: (editEmployee.pfStatus as Employee['pfStatus']) ?? (e.pfStatus as Employee['pfStatus']) ?? 'inactive',
        pfNumber: editEmployee.pfNumber ?? e.pfNumber ?? '',
        uanNumber: editEmployee.uanNumber ?? e.uanNumber ?? '',
        esiNumber: editEmployee.esiNumber ?? e.esiNumber ?? '',
        bankName: editEmployee.bankName ?? e.bankName ?? '',
        branch: editEmployee.branch ?? e.branch ?? '',
        ifsc: editEmployee.ifsc ?? e.ifsc ?? '',
        bankAccount: editEmployee.bankAccount ?? e.bankAccount ?? '',
        panNumber: editEmployee.panNumber ?? e.panNumber ?? '',
        aadhaarNumber: editEmployee.aadhaarNumber ?? e.aadhaarNumber ?? ''
      }) : e));
      setEditModalOpen(false);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await firebaseService.deleteDocument('users', selectedEmployee.id);
      setEmployees(prev => prev.filter(e => e.id !== selectedEmployee.id));
      setDeleteModalOpen(false);
    } catch (e) {
      setError('Failed to delete employee');
    }
  };

  const handleAddEmployee = async () => {
    try {
      // validate inline
      const err = validateEmployee(newEmployee);
      if (err) { try { window.alert(err); } catch {} return; }
      const payload: any = {
        employeeId: newEmployee.employeeId,
        firstName: (newEmployee.name || '').split(' ')[0] || '',
        lastName: (newEmployee.name || '').split(' ').slice(1).join(' '),
        email: newEmployee.email || '',
        phone: newEmployee.phone || '',
        department: newEmployee.department || 'General',
        position: newEmployee.position || 'Employee',
        salary: Number(newEmployee.salary || 0),
        status: newEmployee.status || 'active',
        gender: newEmployee.gender || '',
        dateOfBirth: newEmployee.dateOfBirth || '',
        residence: newEmployee.residence || '',
        spouseName: newEmployee.spouseName || '',
        bloodGroup: newEmployee.bloodGroup || '',
        educationalQualification: newEmployee.educationalQualification || '',
        remarks: newEmployee.remarks || '',
        hireDate: newEmployee.joiningDate || '',
        resigned: newEmployee.resigned || false,
        retirementAge: newEmployee.retirementAge || undefined,
        pfStatus: newEmployee.pfStatus || '',
        pfNumber: newEmployee.pfNumber || '',
        uanNumber: newEmployee.uanNumber || '',
        esiNumber: newEmployee.esiNumber || '',
        bankingInfo: {
          bankName: newEmployee.bankName || '',
          branch: newEmployee.branch || '',
          ifscCode: newEmployee.ifsc || '',
          accountNumber: newEmployee.bankAccount || ''
        },
        governmentInfo: {
          panNumber: newEmployee.panNumber || '',
          aadharNumber: newEmployee.aadhaarNumber || ''
        },
        createdAt: new Date().toISOString()
      };
      const res = await firebaseService.addDocument('users', payload);
      const id = (res && (res as any).data && (res as any).data.id) || Math.random().toString(36).slice(2);
      setEmployees((prev: Employee[]) => [{
        id,
        employeeId: newEmployee.employeeId || `EMP${(prev.length + 1).toString().padStart(3, '0')}`,
        name: newEmployee.name || 'Employee',
        email: newEmployee.email || '',
        phone: newEmployee.phone || '',
        department: newEmployee.department || 'General',
        position: newEmployee.position || 'Employee',
        salary: Number(newEmployee.salary || 0),
        status: (newEmployee.status as Employee['status']) || 'active',
        gender: newEmployee.gender || '',
        dateOfBirth: newEmployee.dateOfBirth || '',
        residence: newEmployee.residence || '',
        spouseName: newEmployee.spouseName || '',
        bloodGroup: newEmployee.bloodGroup || '',
        educationalQualification: newEmployee.educationalQualification || '',
        remarks: newEmployee.remarks || '',
        joiningDate: newEmployee.joiningDate || '',
        resigned: Boolean(newEmployee.resigned),
        retirementAge: newEmployee.retirementAge ?? 0,
        pfStatus: (newEmployee.pfStatus as Employee['pfStatus']) || 'inactive',
        pfNumber: newEmployee.pfNumber || '',
        uanNumber: newEmployee.uanNumber || '',
        esiNumber: newEmployee.esiNumber || '',
        bankName: newEmployee.bankName || '',
        branch: newEmployee.branch || '',
        ifsc: newEmployee.ifsc || '',
        bankAccount: newEmployee.bankAccount || '',
        panNumber: newEmployee.panNumber || '',
        aadhaarNumber: newEmployee.aadhaarNumber || ''
      }, ...prev]);
      setAddModalOpen(false);
      setNewEmployee({ status: 'active' });
    } catch (e) {
      setError('Failed to add employee');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
        <p className="text-gray-600">Manage your organization's workforce</p>
      </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Employee</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees by name, email, phone, or department"
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              title="Filter by status"
              aria-label="Filter by status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[160px] text-sm"
              title="Filter by department"
              aria-label="Filter by department"
            >
              {departmentOptions.map(d => (
                <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
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
              {filteredEmployees.length === 0 ? (
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
                        onClick={() => setAddModalOpen(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Employee</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatIndianCurrency(employee.salary)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        employee.status === 'active' ? "bg-green-100 text-green-800" :
                        employee.status === 'inactive' ? "bg-yellow-100 text-yellow-800" :
                        employee.status === 'upcoming' ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                      )}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openView(employee)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View employee"
                          aria-label="View employee"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(employee)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit employee"
                          aria-label="Edit employee"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(employee)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete employee"
                          aria-label="Delete employee"
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

      {/* View Modal - grouped sections, read-only */}
      {viewModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <Eye className="w-5 h-5 text-primary-600" />
            </div>
                  <h3 className="text-base font-semibold text-gray-900">Employee Details</h3>
                </div>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Employee Details Content */}
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
                        selectedEmployee.status === 'upcoming' ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
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
                          <p className="text-sm text-gray-600">{selectedEmployee.email || '—'}</p>
                </div>
              </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="w-4 h-4 text-green-600" />
            </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phone</p>
                          <p className="text-sm text-gray-600">{selectedEmployee.phone || '—'}</p>
            </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Residence</p>
                          <p className="text-sm text-gray-600">{selectedEmployee.residence || '—'}</p>
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
                        <span className="text-sm text-gray-900">{selectedEmployee.joiningDate || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Salary</span>
                        <span className="text-sm text-gray-900">{formatIndianCurrency(selectedEmployee.salary || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedEmployee.status === 'active' ? "bg-green-100 text-green-800" :
                          selectedEmployee.status === 'inactive' ? "bg-yellow-100 text-yellow-800" :
                          selectedEmployee.status === 'upcoming' ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                        )}>
                          {selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">On/Off Roll</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.rollStatus === 'on' ? 'On Roll' : selectedEmployee.rollStatus === 'off' ? 'Off Roll' : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Resigned</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.resigned ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Retirement Age</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.retirementAge ?? '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Personal Details</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Gender</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.gender || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.dateOfBirth || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Blood Group</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.bloodGroup || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Education</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.educationalQualification || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">S/W/D/O</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.spouseName || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Additional Information - Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">PF / ESI Details</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">PF Status</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.pfStatus || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">PF Number</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.pfNumber || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">PF / UAN No</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.uanNumber || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">ESI Number</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.esiNumber || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Bank Details</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Bank Name</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.bankName || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Branch</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.branch || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">IFSC Code</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.ifsc || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Bank Account</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.bankAccount || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Government IDs */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Government IDs</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">PAN Number</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.panNumber || '—'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Aadhaar Number</span>
                        <span className="text-sm text-gray-900">{selectedEmployee.aadhaarNumber || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {selectedEmployee.remarks && (
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Remarks</h5>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedEmployee.remarks}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                <button
                  onClick={() => setViewModalOpen(false)}
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
      {editModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Edit className="w-4 h-4" /> Edit Employee</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-600 hover:text-gray-900" title="Close" aria-label="Close">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">S.No</label><input disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" value={(selectedEmployee.employeeId || '').replace(/\D/g,'')} title="Serial number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Employee ID</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.employeeId || ''} onChange={(e) => setEditEmployee({ ...editEmployee, employeeId: e.target.value })} placeholder="EMP001" title="Employee ID" /></div>
                  <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Employee Name (As per Aadhaar)</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.name || ''} onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })} placeholder="Enter full name" title="Employee name" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Gender</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.gender || ''} onChange={(e) => setEditEmployee({ ...editEmployee, gender: e.target.value })} title="Select gender" aria-label="Select gender"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">DOB</label><input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.dateOfBirth || ''} onChange={(e) => setEditEmployee({ ...editEmployee, dateOfBirth: e.target.value })} title="Date of birth" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Contact Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.phone || ''} onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })} placeholder="Enter contact number" title="Contact number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Residence</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.residence || ''} onChange={(e) => setEditEmployee({ ...editEmployee, residence: e.target.value })} placeholder="Enter residence" title="Residence" /></div>
                  <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">S/W/D/O</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.spouseName || ''} onChange={(e) => setEditEmployee({ ...editEmployee, spouseName: e.target.value })} placeholder="Enter relative's name" title="S/W/D/O" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Blood Group</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.bloodGroup || ''} onChange={(e) => setEditEmployee({ ...editEmployee, bloodGroup: e.target.value })} placeholder="Enter blood group" title="Blood group" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Educational Qualification</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.educationalQualification || ''} onChange={(e) => setEditEmployee({ ...editEmployee, educationalQualification: e.target.value })} placeholder="Enter qualification" title="Educational qualification" /></div>
                  <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Remarks</label><textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.remarks || ''} onChange={(e) => setEditEmployee({ ...editEmployee, remarks: e.target.value })} placeholder="Enter remarks" title="Remarks" /></div>
                </div>
              </div>
              {/* Employment Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">Designation</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.position || ''} onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })} placeholder="Enter designation" title="Designation" /></div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Department</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.department || ''} onChange={(e) => setEditEmployee({ ...editEmployee, department: e.target.value })} aria-label="Select department" title="Select department">
                      <option value="">Select</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div><label className="block text-sm text-gray-600 mb-1">DOJ</label><input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.joiningDate || ''} onChange={(e) => setEditEmployee({ ...editEmployee, joiningDate: e.target.value })} title="Date of joining" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Salary (₹)</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={Number(editEmployee.salary || 0)} onChange={(e) => setEditEmployee({ ...editEmployee, salary: Number(e.target.value) })} placeholder="Enter salary" title="Salary" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">On Roll / Off Roll</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.rollStatus || ''} onChange={(e) => setEditEmployee({ ...editEmployee, rollStatus: e.target.value as any })} title="Select roll status" aria-label="Select roll status"><option value="">Select</option><option value="on">On Roll</option><option value="off">Off Roll</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Resigned</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={String(editEmployee.resigned || false)} onChange={(e) => setEditEmployee({ ...editEmployee, resigned: e.target.value === 'true' })} title="Select resigned status" aria-label="Select resigned status"><option value="false">No</option><option value="true">Yes</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Retirement Age</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.retirementAge ?? ''} onChange={(e) => setEditEmployee({ ...editEmployee, retirementAge: Number(e.target.value) })} placeholder="Enter retirement age" title="Retirement age" /></div>
                </div>
              </div>
              {/* PF / ESI Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">PF / ESI Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">PF Status</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.pfStatus || ''} onChange={(e) => setEditEmployee({ ...editEmployee, pfStatus: e.target.value as any })} title="Select PF status" aria-label="Select PF status"><option value="">Select</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">PF Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.pfNumber || ''} onChange={(e) => setEditEmployee({ ...editEmployee, pfNumber: e.target.value })} placeholder="Enter PF number" title="PF number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">PF / UAN No</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.uanNumber || ''} onChange={(e) => setEditEmployee({ ...editEmployee, uanNumber: e.target.value })} placeholder="Enter UAN number" title="UAN number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">ESI Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.esiNumber || ''} onChange={(e) => setEditEmployee({ ...editEmployee, esiNumber: e.target.value })} placeholder="Enter ESI number" title="ESI number" /></div>
                </div>
              </div>
              {/* Bank Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">Bank Name</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.bankName || ''} onChange={(e) => setEditEmployee({ ...editEmployee, bankName: e.target.value })} placeholder="Enter bank name" title="Bank name" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Branch</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.branch || ''} onChange={(e) => setEditEmployee({ ...editEmployee, branch: e.target.value })} placeholder="Enter branch" title="Branch" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">IFSC Code</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.ifsc || ''} onChange={(e) => setEditEmployee({ ...editEmployee, ifsc: e.target.value })} placeholder="Enter IFSC" title="IFSC code" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Bank Account Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.bankAccount || ''} onChange={(e) => setEditEmployee({ ...editEmployee, bankAccount: e.target.value })} placeholder="Enter account number" title="Bank account number" /></div>
                </div>
              </div>
              {/* Government IDs */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Government IDs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">PAN Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.panNumber || ''} onChange={(e) => setEditEmployee({ ...editEmployee, panNumber: e.target.value })} placeholder="Enter PAN number" title="PAN number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Aadhaar Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={editEmployee.aadhaarNumber || ''} onChange={(e) => setEditEmployee({ ...editEmployee, aadhaarNumber: e.target.value })} placeholder="Enter Aadhaar number" title="Aadhaar number" /></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setEditModalOpen(false)} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={handleSaveEdit} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Employee</h4>
              <button onClick={() => setDeleteModalOpen(false)} className="text-gray-600 hover:text-gray-900" title="Close" aria-label="Close">✕</button>
            </div>
            <p className="text-sm text-gray-600">Are you sure you want to delete <span className="font-medium">{selectedEmployee.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal - full form like Edit */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Plus className="w-4 h-4" /> Add New Employee</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-600 hover:text-gray-900" title="Close" aria-label="Close">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">S.No</label><input disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" value={(employees.length + 1).toString().padStart(3,'0')} title="Serial number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Employee ID</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.employeeId || ''} onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })} placeholder="EMP001" title="Employee ID" /></div>
                  <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Employee Name (As per Aadhaar)</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.name || ''} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="Enter full name" title="Employee name" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Gender</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.gender || ''} onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })} title="Select gender" aria-label="Select gender"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">DOB</label><input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.dateOfBirth || ''} onChange={(e) => setNewEmployee({ ...newEmployee, dateOfBirth: e.target.value })} title="Date of birth" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Contact Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.phone || ''} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} placeholder="Enter contact number" title="Contact number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Residence</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.residence || ''} onChange={(e) => setNewEmployee({ ...newEmployee, residence: e.target.value })} placeholder="Enter residence" title="Residence" /></div>
                  <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">S/W/D/O</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.spouseName || ''} onChange={(e) => setNewEmployee({ ...newEmployee, spouseName: e.target.value })} placeholder="Enter relative's name" title="S/W/D/O" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Blood Group</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.bloodGroup || ''} onChange={(e) => setNewEmployee({ ...newEmployee, bloodGroup: e.target.value })} placeholder="Enter blood group" title="Blood group" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Educational Qualification</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.educationalQualification || ''} onChange={(e) => setNewEmployee({ ...newEmployee, educationalQualification: e.target.value })} placeholder="Enter qualification" title="Educational qualification" /></div>
                  <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Remarks</label><textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.remarks || ''} onChange={(e) => setNewEmployee({ ...newEmployee, remarks: e.target.value })} placeholder="Enter remarks" title="Remarks" /></div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">Designation</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.position || ''} onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })} placeholder="Enter designation" title="Designation" /></div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Department</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.department || ''} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} aria-label="Select department" title="Select department">
                      <option value="">Select</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div><label className="block text-sm text-gray-600 mb-1">DOJ</label><input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.joiningDate || ''} onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })} title="Date of joining" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Salary (₹)</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={Number(newEmployee.salary || 0)} onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })} placeholder="Enter salary" title="Salary" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">On Roll / Off Roll</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.rollStatus || ''} onChange={(e) => setNewEmployee({ ...newEmployee, rollStatus: e.target.value as any })} title="Select roll status" aria-label="Select roll status"><option value="">Select</option><option value="on">On Roll</option><option value="off">Off Roll</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Resigned</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={String(newEmployee.resigned || false)} onChange={(e) => setNewEmployee({ ...newEmployee, resigned: e.target.value === 'true' })} title="Select resigned status" aria-label="Select resigned status"><option value="false">No</option><option value="true">Yes</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Retirement Age</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.retirementAge ?? ''} onChange={(e) => setNewEmployee({ ...newEmployee, retirementAge: Number(e.target.value) })} placeholder="Enter retirement age" title="Retirement age" /></div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">PF / ESI Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">PF Status</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.pfStatus || ''} onChange={(e) => setNewEmployee({ ...newEmployee, pfStatus: e.target.value as any })} title="Select PF status" aria-label="Select PF status"><option value="">Select</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                  <div><label className="block text-sm text-gray-600 mb-1">PF Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.pfNumber || ''} onChange={(e) => setNewEmployee({ ...newEmployee, pfNumber: e.target.value })} placeholder="Enter PF number" title="PF number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">PF / UAN No</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.uanNumber || ''} onChange={(e) => setNewEmployee({ ...newEmployee, uanNumber: e.target.value })} placeholder="Enter UAN number" title="UAN number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">ESI Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.esiNumber || ''} onChange={(e) => setNewEmployee({ ...newEmployee, esiNumber: e.target.value })} placeholder="Enter ESI number" title="ESI number" /></div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">Bank Name</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.bankName || ''} onChange={(e) => setNewEmployee({ ...newEmployee, bankName: e.target.value })} placeholder="Enter bank name" title="Bank name" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Branch</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.branch || ''} onChange={(e) => setNewEmployee({ ...newEmployee, branch: e.target.value })} placeholder="Enter branch" title="Branch" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">IFSC Code</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.ifsc || ''} onChange={(e) => setNewEmployee({ ...newEmployee, ifsc: e.target.value })} placeholder="Enter IFSC" title="IFSC code" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Bank Account Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.bankAccount || ''} onChange={(e) => setNewEmployee({ ...newEmployee, bankAccount: e.target.value })} placeholder="Enter account number" title="Bank account number" /></div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Government IDs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-600 mb-1">PAN Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.panNumber || ''} onChange={(e) => setNewEmployee({ ...newEmployee, panNumber: e.target.value })} placeholder="Enter PAN number" title="PAN number" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Aadhaar Number</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newEmployee.aadhaarNumber || ''} onChange={(e) => setNewEmployee({ ...newEmployee, aadhaarNumber: e.target.value })} placeholder="Enter Aadhaar number" title="Aadhaar number" /></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-3 border-t sticky bottom-0 bg-white z-10">
              <button onClick={() => setAddModalOpen(false)} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={handleAddEmployee} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Create Employee</button>
            </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
