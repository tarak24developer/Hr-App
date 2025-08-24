/**
 * Employee Profile Page
 * 
 * This page displays and allows editing of employee information.
 * Users can select an employee from a dropdown and view/edit their profile.
 * 
 * Firebase Integration: Complete
 * - Fetches employee list from Firebase users collection
 * - Loads individual employee data from Firebase
 * - Saves employee updates to Firebase
 * 
 * Current Status: Fully integrated with Firebase
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Divider,
  Avatar,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Assignment as DocumentIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { formatIndianCurrency } from '../utils/currency';
import firebaseService from '../services/firebaseService';
import type { User } from '../types';

interface Employee {
  id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date | null;
    gender: 'male' | 'female' | 'other';
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    avatar?: string;
  };
  professionalInfo: {
    department: string;
    position: string;
    joiningDate: Date | null;
    employeeType: 'full-time' | 'part-time' | 'contract' | 'intern';
    workLocation: string;
    manager: string;
    salary: number;
    status: 'active' | 'inactive' | 'terminated';
  };
  bankingInfo: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    accountType: 'savings' | 'current';
    customBankName?: string;
  };
  governmentInfo: {
    panNumber: string;
    aadharNumber: string;
    passportNumber: string;
    drivingLicense: string;
  };
  emergencyContacts: EmergencyContact[];
  education: EducationRecord[];
  documents: DocumentRecord[];
  skills: string[];
  certifications: string[];
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
}

interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date | null;
  endDate: Date | null;
  gpa?: string;
}

interface DocumentRecord {
  id: string;
  type: string;
  name: string;
  uploadDate: Date;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
}

const initialEmployee: Employee = {
  id: '',
  employeeId: '',
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: null,
    gender: 'male',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  },
  professionalInfo: {
    department: '',
    position: '',
    joiningDate: null,
    employeeType: 'full-time',
    workLocation: '',
    manager: '',
    salary: 0,
    status: 'active'
  },
  bankingInfo: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    accountType: 'savings',
    customBankName: ''
  },
  governmentInfo: {
    panNumber: '',
    aadharNumber: '',
    passportNumber: '',
    drivingLicense: ''
  },
  emergencyContacts: [],
  education: [],
  documents: [],
  skills: [],
  certifications: []
};

const EmployeePage: React.FC = () => {
  const [employee, setEmployee] = useState<Employee>(initialEmployee);
  const [isEditing, setIsEditing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; employeeId: string; name: string }[]>([]);

  const steps = [
    'Personal Information',
    'Professional Information',
    'Banking Information',
    'Government Information',
    'Emergency Contacts',
    'Education',
    'Documents'
  ];

  useEffect(() => {
    // Load available employees list
    loadAvailableEmployees();
  }, []);

  useEffect(() => {
    // Load employee data when selection changes
    if (selectedEmployeeId) {
      loadEmployeeData();
    } else {
      setEmployee(initialEmployee);
    }
  }, [selectedEmployeeId]);

  const loadAvailableEmployees = async () => {
    try {
      const response = await firebaseService.getCollection<User>('users');
      if (response.success && response.data) {
        setAvailableEmployees(response.data.map(emp => ({ 
          id: emp.id, 
          employeeId: emp.id, // Use id as employeeId since User doesn't have employeeId
          name: `${emp.firstName} ${emp.lastName}` 
        })));
      } else {
        console.error('Error loading employees:', response.error);
        setSnackbar({
          open: true,
          message: 'Error loading employees list',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading available employees:', error);
      setSnackbar({
        open: true,
        message: 'Error loading employees list',
        severity: 'error'
      });
    }
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsEditing(false); // Reset editing state when switching employees
    setActiveStep(0); // Reset to first step
  };

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const response = await firebaseService.getDocument<User>('users', selectedEmployeeId);
      if (response.success && response.data) {
                 // Transform User data to Employee format
         const employeeData: Employee = {
           id: response.data.id,
           employeeId: response.data.id, // Use id as employeeId since User doesn't have employeeId
           personalInfo: {
             firstName: response.data.firstName,
             lastName: response.data.lastName,
             email: response.data.email,
             phone: response.data.phone,
             dateOfBirth: (response.data as any).extendedProfile?.dateOfBirth ? new Date((response.data as any).extendedProfile.dateOfBirth) : null,
             gender: (response.data as any).extendedProfile?.gender || 'male',
             address: response.data.address,
             city: (response.data as any).extendedProfile?.city || '',
             state: (response.data as any).extendedProfile?.state || '',
             zipCode: (response.data as any).extendedProfile?.zipCode || '',
             country: (response.data as any).extendedProfile?.country || 'India'
           },
           professionalInfo: {
             department: response.data.department,
             position: response.data.position,
             joiningDate: response.data.hireDate ? new Date(response.data.hireDate) : null,
             employeeType: (response.data as any).extendedProfile?.employeeType || 'full-time',
             workLocation: (response.data as any).extendedProfile?.workLocation || '',
             manager: (response.data as any).extendedProfile?.manager || '',
             salary: (response.data as any).salary || 0,
             status: response.data.status
           },
           bankingInfo: {
             bankName: (response.data as any).extendedProfile?.bankingInfo?.bankName || '',
             accountNumber: (response.data as any).extendedProfile?.bankingInfo?.accountNumber || '',
             ifscCode: (response.data as any).extendedProfile?.bankingInfo?.ifscCode || '',
             accountHolderName: (response.data as any).extendedProfile?.bankingInfo?.accountHolderName || `${response.data.firstName} ${response.data.lastName}`,
             accountType: (response.data as any).extendedProfile?.bankingInfo?.accountType || 'savings',
             customBankName: (response.data as any).extendedProfile?.bankingInfo?.customBankName || ''
           },
           governmentInfo: {
             panNumber: (response.data as any).extendedProfile?.governmentInfo?.panNumber || '',
             aadharNumber: (response.data as any).extendedProfile?.governmentInfo?.aadharNumber || '',
             passportNumber: (response.data as any).extendedProfile?.governmentInfo?.passportNumber || '',
             drivingLicense: (response.data as any).extendedProfile?.governmentInfo?.drivingLicense || ''
           },
           emergencyContacts: response.data.emergencyContact ? [{
             id: '1',
             name: response.data.emergencyContact.name,
             relationship: response.data.emergencyContact.relationship,
             phone: response.data.emergencyContact.phone,
             email: (response.data as any).extendedProfile?.emergencyContacts?.[0]?.email || '',
             address: (response.data as any).extendedProfile?.emergencyContacts?.[0]?.address || ''
           }] : [],
           education: (response.data as any).extendedProfile?.education || [],
           documents: (response.data as any).extendedProfile?.documents || [],
           skills: (response.data as any).skills || [],
           certifications: (response.data as any).certifications || []
         };
        setEmployee(employeeData);
      } else {
        console.error('Error loading employee:', response.error);
        setSnackbar({
          open: true,
          message: 'Error loading employee data',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      setSnackbar({
        open: true,
        message: 'Error loading employee data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: keyof Employee, field: string, value: any) => {
    setEmployee(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof Employee] as any,
        [field]: value
      }
    }));
  };

  const handleArrayChange = (section: keyof Employee, newArray: any[]) => {
    setEmployee(prev => ({
      ...prev,
      [section]: newArray
    }));
  };

    const handleSave = async () => {
    setLoading(true);
    try {
      // Transform Employee data back to User format for Firebase
      const userUpdateData = {
        firstName: employee.personalInfo.firstName,
        lastName: employee.personalInfo.lastName,
        email: employee.personalInfo.email,
        phone: employee.personalInfo.phone,
        address: employee.personalInfo.address,
        department: employee.professionalInfo.department,
        position: employee.professionalInfo.position,
        hireDate: employee.professionalInfo.joiningDate ? employee.professionalInfo.joiningDate.toISOString() : '',
        status: employee.professionalInfo.status,
        emergencyContact: {
          name: employee.emergencyContacts[0]?.name || '',
          phone: employee.emergencyContacts[0]?.phone || '',
          relationship: employee.emergencyContacts[0]?.relationship || ''
        },
        // Add additional fields that might not be in User interface
        salary: employee.professionalInfo.salary,
        skills: employee.skills,
        certifications: employee.certifications,
        // Custom fields for extended profile
        extendedProfile: {
          dateOfBirth: employee.personalInfo.dateOfBirth,
          gender: employee.personalInfo.gender,
          city: employee.personalInfo.city,
          state: employee.personalInfo.state,
          zipCode: employee.personalInfo.zipCode,
          country: employee.personalInfo.country,
          employeeType: employee.professionalInfo.employeeType,
          workLocation: employee.professionalInfo.workLocation,
          manager: employee.professionalInfo.manager,
          bankingInfo: {
            bankName: employee.bankingInfo.bankName === 'Other' ? employee.bankingInfo.customBankName : employee.bankingInfo.bankName,
            accountNumber: employee.bankingInfo.accountNumber,
            ifscCode: employee.bankingInfo.ifscCode,
            accountHolderName: employee.bankingInfo.accountHolderName,
            accountType: employee.bankingInfo.accountType
          },
          governmentInfo: employee.governmentInfo,
          education: employee.education,
          documents: employee.documents
        }
      };

      const response = await firebaseService.updateDocument('users', employee.id, userUpdateData);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Employee information updated successfully',
          severity: 'success'
        });
        setIsEditing(false);
        // Reload employee data to show updated information
        await loadEmployeeData();
      } else {
        throw new Error(response.error || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Error saving employee data:', error);
      setSnackbar({
        open: true,
        message: 'Error saving employee data: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setIsEditing(false);
    setSnackbar({
      open: true,
      message: 'Changes cancelled',
      severity: 'info'
    });
  };

  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: ''
    };
    handleArrayChange('emergencyContacts', [...employee.emergencyContacts, newContact]);
  };

  const removeEmergencyContact = (id: string) => {
    handleArrayChange('emergencyContacts', employee.emergencyContacts.filter(contact => contact.id !== id));
  };

  const addEducationRecord = () => {
    const newEducation: EducationRecord = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: null,
      endDate: null,
      gpa: ''
    };
    handleArrayChange('education', [...employee.education, newEducation]);
  };

  const removeEducationRecord = (id: string) => {
    handleArrayChange('education', employee.education.filter(edu => edu.id !== id));
  };

  const addSkill = (skill: string) => {
    if (skill && !employee.skills.includes(skill)) {
      handleArrayChange('skills', [...employee.skills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    handleArrayChange('skills', employee.skills.filter(s => s !== skill));
  };

  const renderPersonalInfo = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="First Name"
          value={employee.personalInfo.firstName}
          onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
          disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="Last Name"
          value={employee.personalInfo.lastName}
          onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
          disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="Email"
          type="email"
          value={employee.personalInfo.email}
          onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
          disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={employee.personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={!isEditing}
                  helperText={isEditing ? "Format: +91 98765 43210" : ""}
                />
              </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={employee.personalInfo.dateOfBirth ? employee.personalInfo.dateOfBirth.toISOString().split('T')[0] : ''}
          onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value ? new Date(e.target.value) : null)}
          disabled={!isEditing}
          InputLabelProps={{
            shrink: true
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Gender</InputLabel>
                  <Select
            value={employee.personalInfo.gender}
            label="Gender"
            onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>
      <Box sx={{ flex: 1 }}>
        <TextField
          fullWidth
          label="Address"
          multiline
          rows={2}
          value={employee.personalInfo.address}
          onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
          disabled={!isEditing}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>City</InputLabel>
            <Select
              value={employee.personalInfo.city}
              label="City"
              onChange={(e) => handleInputChange('personalInfo', 'city', e.target.value)}
            >
              <MenuItem value="Mumbai">Mumbai</MenuItem>
              <MenuItem value="Delhi">Delhi</MenuItem>
              <MenuItem value="Bangalore">Bangalore</MenuItem>
              <MenuItem value="Hyderabad">Hyderabad</MenuItem>
              <MenuItem value="Chennai">Chennai</MenuItem>
              <MenuItem value="Kolkata">Kolkata</MenuItem>
              <MenuItem value="Pune">Pune</MenuItem>
              <MenuItem value="Ahmedabad">Ahmedabad</MenuItem>
              <MenuItem value="Jaipur">Jaipur</MenuItem>
              <MenuItem value="Surat">Surat</MenuItem>
              <MenuItem value="Lucknow">Lucknow</MenuItem>
              <MenuItem value="Kanpur">Kanpur</MenuItem>
              <MenuItem value="Nagpur">Nagpur</MenuItem>
              <MenuItem value="Indore">Indore</MenuItem>
              <MenuItem value="Thane">Thane</MenuItem>
              <MenuItem value="Bhopal">Bhopal</MenuItem>
              <MenuItem value="Visakhapatnam">Visakhapatnam</MenuItem>
              <MenuItem value="Pimpri-Chinchwad">Pimpri-Chinchwad</MenuItem>
              <MenuItem value="Patna">Patna</MenuItem>
              <MenuItem value="Vadodara">Vadodara</MenuItem>
              <MenuItem value="Ghaziabad">Ghaziabad</MenuItem>
              <MenuItem value="Ludhiana">Ludhiana</MenuItem>
              <MenuItem value="Agra">Agra</MenuItem>
              <MenuItem value="Nashik">Nashik</MenuItem>
              <MenuItem value="Faridabad">Faridabad</MenuItem>
              <MenuItem value="Meerut">Meerut</MenuItem>
              <MenuItem value="Rajkot">Rajkot</MenuItem>
              <MenuItem value="Kalyan-Dombivali">Kalyan-Dombivali</MenuItem>
              <MenuItem value="Vasai-Virar">Vasai-Virar</MenuItem>
              <MenuItem value="Varanasi">Varanasi</MenuItem>
              <MenuItem value="Srinagar">Srinagar</MenuItem>
              <MenuItem value="Aurangabad">Aurangabad</MenuItem>
              <MenuItem value="Navi Mumbai">Navi Mumbai</MenuItem>
              <MenuItem value="Solapur">Solapur</MenuItem>
              <MenuItem value="Ranchi">Ranchi</MenuItem>
              <MenuItem value="Chandigarh">Chandigarh</MenuItem>
              <MenuItem value="Coimbatore">Coimbatore</MenuItem>
              <MenuItem value="Kochi">Kochi</MenuItem>
              <MenuItem value="Guwahati">Guwahati</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>State</InputLabel>
            <Select
              value={employee.personalInfo.state}
              label="State"
              onChange={(e) => handleInputChange('personalInfo', 'state', e.target.value)}
            >
              <MenuItem value="Andhra Pradesh">Andhra Pradesh</MenuItem>
              <MenuItem value="Arunachal Pradesh">Arunachal Pradesh</MenuItem>
              <MenuItem value="Assam">Assam</MenuItem>
              <MenuItem value="Bihar">Bihar</MenuItem>
              <MenuItem value="Chhattisgarh">Chhattisgarh</MenuItem>
              <MenuItem value="Goa">Goa</MenuItem>
              <MenuItem value="Gujarat">Gujarat</MenuItem>
              <MenuItem value="Haryana">Haryana</MenuItem>
              <MenuItem value="Himachal Pradesh">Himachal Pradesh</MenuItem>
              <MenuItem value="Jharkhand">Jharkhand</MenuItem>
              <MenuItem value="Karnataka">Karnataka</MenuItem>
              <MenuItem value="Kerala">Kerala</MenuItem>
              <MenuItem value="Madhya Pradesh">Madhya Pradesh</MenuItem>
              <MenuItem value="Maharashtra">Maharashtra</MenuItem>
              <MenuItem value="Manipur">Manipur</MenuItem>
              <MenuItem value="Meghalaya">Meghalaya</MenuItem>
              <MenuItem value="Mizoram">Mizoram</MenuItem>
              <MenuItem value="Nagaland">Nagaland</MenuItem>
              <MenuItem value="Odisha">Odisha</MenuItem>
              <MenuItem value="Punjab">Punjab</MenuItem>
              <MenuItem value="Rajasthan">Rajasthan</MenuItem>
              <MenuItem value="Sikkim">Sikkim</MenuItem>
              <MenuItem value="Tamil Nadu">Tamil Nadu</MenuItem>
              <MenuItem value="Telangana">Telangana</MenuItem>
              <MenuItem value="Tripura">Tripura</MenuItem>
              <MenuItem value="Uttar Pradesh">Uttar Pradesh</MenuItem>
              <MenuItem value="Uttarakhand">Uttarakhand</MenuItem>
              <MenuItem value="West Bengal">West Bengal</MenuItem>
              <MenuItem value="Delhi">Delhi</MenuItem>
              <MenuItem value="Jammu and Kashmir">Jammu and Kashmir</MenuItem>
              <MenuItem value="Ladakh">Ladakh</MenuItem>
              <MenuItem value="Chandigarh">Chandigarh</MenuItem>
              <MenuItem value="Puducherry">Puducherry</MenuItem>
              <MenuItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</MenuItem>
              <MenuItem value="Dadra and Nagar Haveli">Dadra and Nagar Haveli</MenuItem>
              <MenuItem value="Daman and Diu">Daman and Diu</MenuItem>
              <MenuItem value="Lakshadweep">Lakshadweep</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <TextField
            fullWidth
            label="PIN Code"
            value={employee.personalInfo.zipCode}
            onChange={(e) => handleInputChange('personalInfo', 'zipCode', e.target.value)}
            disabled={!isEditing}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <TextField
            fullWidth
            label="Country"
            value={employee.personalInfo.country}
            onChange={(e) => handleInputChange('personalInfo', 'country', e.target.value)}
            disabled={!isEditing}
          />
        </Box>
      </Box>
    </Box>
  );

  const renderProfessionalInfo = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="Employee ID"
          value={employee.employeeId}
          disabled
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
                  <Select
            value={employee.professionalInfo.status}
            label="Status"
            onChange={(e) => handleInputChange('professionalInfo', 'status', e.target.value)}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="terminated">Terminated</MenuItem>
                  </Select>
                </FormControl>
              </Box>
                             <Box sx={{ flex: 1, minWidth: 200 }}>
                 <FormControl fullWidth disabled={!isEditing}>
                   <InputLabel>Department</InputLabel>
                   <Select
                     value={employee.professionalInfo.department}
                     label="Department"
                     onChange={(e) => handleInputChange('professionalInfo', 'department', e.target.value)}
                   >
                     <MenuItem value="Information Technology">Information Technology</MenuItem>
                     <MenuItem value="Human Resources">Human Resources</MenuItem>
                     <MenuItem value="Finance">Finance</MenuItem>
                     <MenuItem value="Marketing">Marketing</MenuItem>
                     <MenuItem value="Sales">Sales</MenuItem>
                     <MenuItem value="Operations">Operations</MenuItem>
                     <MenuItem value="Legal">Legal</MenuItem>
                     <MenuItem value="Research & Development">Research & Development</MenuItem>
                     <MenuItem value="Customer Support">Customer Support</MenuItem>
                     <MenuItem value="Quality Assurance">Quality Assurance</MenuItem>
                     <MenuItem value="Product Management">Product Management</MenuItem>
                     <MenuItem value="Business Development">Business Development</MenuItem>
                     <MenuItem value="Administration">Administration</MenuItem>
                     <MenuItem value="Other">Other</MenuItem>
                   </Select>
                 </FormControl>
               </Box>
               <Box sx={{ flex: 1, minWidth: 200 }}>
                 <FormControl fullWidth disabled={!isEditing}>
                   <InputLabel>Position</InputLabel>
                   <Select
                     value={employee.professionalInfo.position}
                     label="Position"
                     onChange={(e) => handleInputChange('professionalInfo', 'position', e.target.value)}
                   >
                     <MenuItem value="Software Engineer">Software Engineer</MenuItem>
                     <MenuItem value="Senior Software Engineer">Senior Software Engineer</MenuItem>
                     <MenuItem value="Team Lead">Team Lead</MenuItem>
                     <MenuItem value="Project Manager">Project Manager</MenuItem>
                     <MenuItem value="Product Manager">Product Manager</MenuItem>
                     <MenuItem value="Business Analyst">Business Analyst</MenuItem>
                     <MenuItem value="Data Analyst">Data Analyst</MenuItem>
                     <MenuItem value="HR Manager">HR Manager</MenuItem>
                     <MenuItem value="HR Executive">HR Executive</MenuItem>
                     <MenuItem value="Finance Manager">Finance Manager</MenuItem>
                     <MenuItem value="Accountant">Accountant</MenuItem>
                     <MenuItem value="Marketing Manager">Marketing Manager</MenuItem>
                     <MenuItem value="Marketing Executive">Marketing Executive</MenuItem>
                     <MenuItem value="Sales Manager">Sales Manager</MenuItem>
                     <MenuItem value="Sales Executive">Sales Executive</MenuItem>
                     <MenuItem value="Operations Manager">Operations Manager</MenuItem>
                     <MenuItem value="CEO">CEO</MenuItem>
                     <MenuItem value="CTO">CTO</MenuItem>
                     <MenuItem value="CFO">CFO</MenuItem>
                     <MenuItem value="Director">Director</MenuItem>
                     <MenuItem value="VP">VP</MenuItem>
                     <MenuItem value="Other">Other</MenuItem>
                   </Select>
                 </FormControl>
               </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="Joining Date"
          type="date"
          value={employee.professionalInfo.joiningDate ? employee.professionalInfo.joiningDate.toISOString().split('T')[0] : ''}
          onChange={(e) => handleInputChange('professionalInfo', 'joiningDate', e.target.value ? new Date(e.target.value) : null)}
          disabled={!isEditing}
          InputLabelProps={{
            shrink: true
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Employee Type</InputLabel>
                      <Select 
            value={employee.professionalInfo.employeeType}
            label="Employee Type"
            onChange={(e) => handleInputChange('professionalInfo', 'employeeType', e.target.value)}
          >
            <MenuItem value="full-time">Full Time</MenuItem>
            <MenuItem value="part-time">Part Time</MenuItem>
            <MenuItem value="contract">Contract</MenuItem>
            <MenuItem value="intern">Intern</MenuItem>
                  </Select>
                </FormControl>
              </Box>
                             <Box sx={{ flex: 1, minWidth: 200 }}>
                 <FormControl fullWidth disabled={!isEditing}>
                   <InputLabel>Work Location</InputLabel>
                   <Select
                     value={employee.professionalInfo.workLocation}
                     label="Work Location"
                     onChange={(e) => handleInputChange('professionalInfo', 'workLocation', e.target.value)}
                   >
                     <MenuItem value="Mumbai">Mumbai</MenuItem>
                     <MenuItem value="Delhi">Delhi</MenuItem>
                     <MenuItem value="Bangalore">Bangalore</MenuItem>
                     <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                     <MenuItem value="Chennai">Chennai</MenuItem>
                     <MenuItem value="Kolkata">Kolkata</MenuItem>
                     <MenuItem value="Pune">Pune</MenuItem>
                     <MenuItem value="Ahmedabad">Ahmedabad</MenuItem>
                     <MenuItem value="Jaipur">Jaipur</MenuItem>
                     <MenuItem value="Surat">Surat</MenuItem>
                     <MenuItem value="Lucknow">Lucknow</MenuItem>
                     <MenuItem value="Kanpur">Kanpur</MenuItem>
                     <MenuItem value="Nagpur">Nagpur</MenuItem>
                     <MenuItem value="Indore">Indore</MenuItem>
                     <MenuItem value="Thane">Thane</MenuItem>
                     <MenuItem value="Bhopal">Bhopal</MenuItem>
                     <MenuItem value="Visakhapatnam">Visakhapatnam</MenuItem>
                     <MenuItem value="Pimpri-Chinchwad">Pimpri-Chinchwad</MenuItem>
                     <MenuItem value="Patna">Patna</MenuItem>
                     <MenuItem value="Vadodara">Vadodara</MenuItem>
                     <MenuItem value="Ghaziabad">Ghaziabad</MenuItem>
                     <MenuItem value="Ludhiana">Ludhiana</MenuItem>
                     <MenuItem value="Agra">Agra</MenuItem>
                     <MenuItem value="Nashik">Nashik</MenuItem>
                     <MenuItem value="Faridabad">Faridabad</MenuItem>
                     <MenuItem value="Meerut">Meerut</MenuItem>
                     <MenuItem value="Rajkot">Rajkot</MenuItem>
                     <MenuItem value="Kalyan-Dombivali">Kalyan-Dombivali</MenuItem>
                     <MenuItem value="Vasai-Virar">Vasai-Virar</MenuItem>
                     <MenuItem value="Varanasi">Varanasi</MenuItem>
                     <MenuItem value="Srinagar">Srinagar</MenuItem>
                     <MenuItem value="Aurangabad">Aurangabad</MenuItem>
                     <MenuItem value="Navi Mumbai">Navi Mumbai</MenuItem>
                     <MenuItem value="Solapur">Solapur</MenuItem>
                     <MenuItem value="Ranchi">Ranchi</MenuItem>
                     <MenuItem value="Chandigarh">Chandigarh</MenuItem>
                     <MenuItem value="Coimbatore">Coimbatore</MenuItem>
                     <MenuItem value="Kochi">Kochi</MenuItem>
                     <MenuItem value="Guwahati">Guwahati</MenuItem>
                     <MenuItem value="Remote">Remote</MenuItem>
                     <MenuItem value="Other">Other</MenuItem>
                   </Select>
                 </FormControl>
               </Box>
               <Box sx={{ flex: 1, minWidth: 200 }}>
                 <FormControl fullWidth disabled={!isEditing}>
                   <InputLabel>Manager</InputLabel>
                   <Select
                     value={employee.professionalInfo.manager}
                     label="Manager"
                     onChange={(e) => handleInputChange('professionalInfo', 'manager', e.target.value)}
                   >
                     <MenuItem value="">No Manager</MenuItem>
                     {availableEmployees
                       .filter(emp => emp.id !== selectedEmployeeId) // Exclude current employee
                       .map((emp) => (
                         <MenuItem key={emp.id} value={emp.name}>
                           {emp.name} ({emp.employeeId})
                         </MenuItem>
                       ))}
                   </Select>
                 </FormControl>
               </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="Annual Salary"
          type="number"
          value={employee.professionalInfo.salary}
          onChange={(e) => handleInputChange('professionalInfo', 'salary', Number(e.target.value))}
          disabled={!isEditing}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>
          }}
        />
              </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" gutterBottom>Skills</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {employee.skills.map((skill, index) => (
            isEditing ? (
              <Chip
                key={index}
                label={skill}
                onDelete={() => removeSkill(skill)}
                variant="outlined"
              />
            ) : (
              <Chip
                key={index}
                label={skill}
                variant="outlined"
              />
            )
          ))}
        </Box>
        {isEditing && (
                    <TextField 
                      fullWidth 
            label="Add Skill"
            placeholder="Press Enter to add skill"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                addSkill(target.value);
                target.value = '';
              }
            }}
          />
        )}
              </Box>
    </Box>
  );

  const renderBankingInfo = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                                 <FormControl fullWidth disabled={!isEditing}>
                   <InputLabel>Bank Name</InputLabel>
                   <Select
                     value={employee.bankingInfo.bankName}
                     label="Bank Name"
                     onChange={(e) => handleInputChange('bankingInfo', 'bankName', e.target.value)}
                   >
                     <MenuItem value="State Bank of India">State Bank of India</MenuItem>
                     <MenuItem value="HDFC Bank">HDFC Bank</MenuItem>
                     <MenuItem value="ICICI Bank">ICICI Bank</MenuItem>
                     <MenuItem value="Axis Bank">Axis Bank</MenuItem>
                     <MenuItem value="Punjab National Bank">Punjab National Bank</MenuItem>
                     <MenuItem value="Bank of Baroda">Bank of Baroda</MenuItem>
                     <MenuItem value="Canara Bank">Canara Bank</MenuItem>
                     <MenuItem value="Union Bank of India">Union Bank of India</MenuItem>
                     <MenuItem value="Bank of India">Bank of India</MenuItem>
                     <MenuItem value="Central Bank of India">Central Bank of India</MenuItem>
                     <MenuItem value="Indian Bank">Indian Bank</MenuItem>
                     <MenuItem value="UCO Bank">UCO Bank</MenuItem>
                     <MenuItem value="Punjab & Sind Bank">Punjab & Sind Bank</MenuItem>
                     <MenuItem value="Bank of Maharashtra">Bank of Maharashtra</MenuItem>
                     <MenuItem value="Kotak Mahindra Bank">Kotak Mahindra Bank</MenuItem>
                     <MenuItem value="Yes Bank">Yes Bank</MenuItem>
                     <MenuItem value="Federal Bank">Federal Bank</MenuItem>
                     <MenuItem value="Karnataka Bank">Karnataka Bank</MenuItem>
                     <MenuItem value="Karnataka Vikas Grameena Bank">Karnataka Vikas Grameena Bank</MenuItem>
                     <MenuItem value="Other">Other</MenuItem>
                   </Select>
                 </FormControl>
                 {employee.bankingInfo.bankName === 'Other' && isEditing && (
                   <Box sx={{ flex: 1, minWidth: 200 }}>
                     <TextField
                       fullWidth
                       label="Custom Bank Name"
                       value={employee.bankingInfo.customBankName || ''}
                       onChange={(e) => handleInputChange('bankingInfo', 'customBankName', e.target.value)}
                       placeholder="Enter bank name"
                       helperText="Please specify the bank name"
                     />
                   </Box>
                 )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="Account Holder Name"
          value={employee.bankingInfo.accountHolderName}
          onChange={(e) => handleInputChange('bankingInfo', 'accountHolderName', e.target.value)}
          disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="Account Number"
          value={employee.bankingInfo.accountNumber}
          onChange={(e) => handleInputChange('bankingInfo', 'accountNumber', e.target.value)}
          disabled={!isEditing}
          type={isEditing ? 'text' : 'password'}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="IFSC Code"
          value={employee.bankingInfo.ifscCode}
          onChange={(e) => handleInputChange('bankingInfo', 'ifscCode', e.target.value)}
          placeholder="SBIN0001234"
          disabled={!isEditing}
          helperText={isEditing ? "Format: SBIN0001234 (11 characters)" : ""}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Account Type</InputLabel>
                      <Select 
            value={employee.bankingInfo.accountType}
            label="Account Type"
            onChange={(e) => handleInputChange('bankingInfo', 'accountType', e.target.value)}
          >
            <MenuItem value="savings">Savings</MenuItem>
            <MenuItem value="current">Current</MenuItem>
                  </Select>
                </FormControl>
              </Box>
    </Box>
  );

  const renderGovernmentInfo = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                                          <TextField 
                        fullWidth 
                        label="PAN Number"
                        value={employee.governmentInfo.panNumber}
                        onChange={(e) => handleInputChange('governmentInfo', 'panNumber', e.target.value)}
                        placeholder="ABCDE1234F"
                        disabled={!isEditing}
                        type={isEditing ? 'text' : 'password'}
                        helperText={isEditing ? "Format: ABCDE1234F (10 characters)" : ""}
                      />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                                          <TextField 
                        fullWidth 
                        label="Aadhar Number"
                        value={employee.governmentInfo.aadharNumber}
                        onChange={(e) => handleInputChange('governmentInfo', 'aadharNumber', e.target.value)}
                        placeholder="1234-5678-9012"
                        disabled={!isEditing}
                        helperText={isEditing ? "Format: 1234-5678-9012 (12 digits)" : ""}
                      />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="Passport Number"
          value={employee.governmentInfo.passportNumber}
          onChange={(e) => handleInputChange('governmentInfo', 'passportNumber', e.target.value)}
          disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="Driving License"
          value={employee.governmentInfo.drivingLicense}
          onChange={(e) => handleInputChange('governmentInfo', 'drivingLicense', e.target.value)}
          disabled={!isEditing}
                    />
              </Box>
    </Box>
  );

  const renderEmergencyContacts = () => (
    <Box>
      {employee.emergencyContacts.map((contact, index) => (
        <Accordion key={contact.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Contact {index + 1}: {contact.name || 'New Contact'}
            </Typography>
            {isEditing && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmergencyContact(contact.id);
                }}
                sx={{ ml: 'auto', mr: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
                  label="Name"
                  value={contact.name}
                  onChange={(e) => {
                    const updated = employee.emergencyContacts.map(c =>
                      c.id === contact.id ? { ...c, name: e.target.value } : c
                    );
                    handleArrayChange('emergencyContacts', updated);
                  }}
                  disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Relationship</InputLabel>
                  <Select
                    value={contact.relationship}
                    label="Relationship"
                    onChange={(e) => {
                      const updated = employee.emergencyContacts.map(c =>
                        c.id === contact.id ? { ...c, relationship: e.target.value } : c
                      );
                      handleArrayChange('emergencyContacts', updated);
                    }}
                  >
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
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
                  label="Phone"
                  value={contact.phone}
                  onChange={(e) => {
                    const updated = employee.emergencyContacts.map(c =>
                      c.id === contact.id ? { ...c, phone: e.target.value } : c
                    );
                    handleArrayChange('emergencyContacts', updated);
                  }}
                  disabled={!isEditing}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={contact.email}
                  onChange={(e) => {
                    const updated = employee.emergencyContacts.map(c =>
                      c.id === contact.id ? { ...c, email: e.target.value } : c
                    );
                    handleArrayChange('emergencyContacts', updated);
                  }}
                  disabled={!isEditing}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Address"
                      multiline 
                      rows={2} 
                  value={contact.address}
                  onChange={(e) => {
                    const updated = employee.emergencyContacts.map(c =>
                      c.id === contact.id ? { ...c, address: e.target.value } : c
                    );
                    handleArrayChange('emergencyContacts', updated);
                  }}
                  disabled={!isEditing}
                    />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
      {isEditing && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addEmergencyContact}
          sx={{ mt: 2 }}
        >
          Add Emergency Contact
        </Button>
      )}
    </Box>
  );

  const renderEducation = () => (
    <Box>
      {employee.education.map((edu, index) => (
        <Accordion key={edu.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Education {index + 1}: {edu.degree || 'New Education Record'}
            </Typography>
            {isEditing && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEducationRecord(edu.id);
                }}
                sx={{ ml: 'auto', mr: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Institution"
                  value={edu.institution}
                  onChange={(e) => {
                    const updated = employee.education.map(eduItem =>
                      eduItem.id === edu.id ? { ...eduItem, institution: e.target.value } : eduItem
                    );
                    handleArrayChange('education', updated);
                  }}
                  disabled={!isEditing}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Degree</InputLabel>
                  <Select
                    value={edu.degree}
                    label="Degree"
                    onChange={(e) => {
                      const updated = employee.education.map(eduItem =>
                        eduItem.id === edu.id ? { ...eduItem, degree: e.target.value } : eduItem
                      );
                      handleArrayChange('education', updated);
                    }}
                  >
                    <MenuItem value="Bachelor of Technology">Bachelor of Technology (B.Tech)</MenuItem>
                    <MenuItem value="Bachelor of Engineering">Bachelor of Engineering (B.E.)</MenuItem>
                    <MenuItem value="Bachelor of Science">Bachelor of Science (B.Sc.)</MenuItem>
                    <MenuItem value="Bachelor of Commerce">Bachelor of Commerce (B.Com)</MenuItem>
                    <MenuItem value="Bachelor of Arts">Bachelor of Arts (B.A.)</MenuItem>
                    <MenuItem value="Bachelor of Business Administration">Bachelor of Business Administration (BBA)</MenuItem>
                    <MenuItem value="Master of Technology">Master of Technology (M.Tech)</MenuItem>
                    <MenuItem value="Master of Science">Master of Science (M.Sc.)</MenuItem>
                    <MenuItem value="Master of Business Administration">Master of Business Administration (MBA)</MenuItem>
                    <MenuItem value="Master of Arts">Master of Arts (M.A.)</MenuItem>
                    <MenuItem value="Master of Commerce">Master of Commerce (M.Com)</MenuItem>
                    <MenuItem value="Doctor of Philosophy">Doctor of Philosophy (Ph.D.)</MenuItem>
                    <MenuItem value="Diploma">Diploma</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Field of Study</InputLabel>
                  <Select
                    value={edu.fieldOfStudy}
                    label="Field of Study"
                    onChange={(e) => {
                      const updated = employee.education.map(eduItem =>
                        eduItem.id === edu.id ? { ...eduItem, fieldOfStudy: e.target.value } : eduItem
                      );
                      handleArrayChange('education', updated);
                    }}
                  >
                    <MenuItem value="Computer Science">Computer Science</MenuItem>
                    <MenuItem value="Information Technology">Information Technology</MenuItem>
                    <MenuItem value="Electronics & Communication">Electronics & Communication</MenuItem>
                    <MenuItem value="Mechanical Engineering">Mechanical Engineering</MenuItem>
                    <MenuItem value="Civil Engineering">Civil Engineering</MenuItem>
                    <MenuItem value="Electrical Engineering">Electrical Engineering</MenuItem>
                    <MenuItem value="Chemical Engineering">Chemical Engineering</MenuItem>
                    <MenuItem value="Biotechnology">Biotechnology</MenuItem>
                    <MenuItem value="Business Administration">Business Administration</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Human Resources">Human Resources</MenuItem>
                    <MenuItem value="Economics">Economics</MenuItem>
                    <MenuItem value="Mathematics">Mathematics</MenuItem>
                    <MenuItem value="Physics">Physics</MenuItem>
                    <MenuItem value="Chemistry">Chemistry</MenuItem>
                    <MenuItem value="Biology">Biology</MenuItem>
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="History">History</MenuItem>
                    <MenuItem value="Geography">Geography</MenuItem>
                    <MenuItem value="Political Science">Political Science</MenuItem>
                    <MenuItem value="Sociology">Sociology</MenuItem>
                    <MenuItem value="Psychology">Psychology</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField 
                  fullWidth 
                  label="GPA/CGPA"
                  value={edu.gpa || ''}
                  onChange={(e) => {
                    const updated = employee.education.map(eduItem =>
                      eduItem.id === edu.id ? { ...eduItem, gpa: e.target.value } : eduItem
                    );
                    handleArrayChange('education', updated);
                  }}
                  placeholder="8.5"
                  disabled={!isEditing}
                  helperText={isEditing ? "Indian scale: 0-10 (e.g., 8.5)" : ""}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={edu.startDate ? edu.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const updated = employee.education.map(eduItem =>
                      eduItem.id === edu.id ? { ...eduItem, startDate: e.target.value ? new Date(e.target.value) : null } : eduItem
                    );
                    handleArrayChange('education', updated);
                  }}
                  disabled={!isEditing}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={edu.endDate ? edu.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const updated = employee.education.map(eduItem =>
                      eduItem.id === edu.id ? { ...eduItem, endDate: e.target.value ? new Date(e.target.value) : null } : eduItem
                    );
                    handleArrayChange('education', updated);
                  }}
                  disabled={!isEditing}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
      {isEditing && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addEducationRecord}
          sx={{ mt: 2 }}
        >
          Add Education Record
        </Button>
      )}
    </Box>
  );

  const renderDocuments = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Employee Documents
      </Typography>
      <List>
        {employee.documents.map((doc) => (
          <ListItem key={doc.id} divider>
            <ListItemIcon>
              <DocumentIcon />
            </ListItemIcon>
            <ListItemText
              primary={doc.name}
              secondary={
                <Box>
                  <Typography variant="caption" display="block">
                    Type: {doc.type}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Uploaded: {doc.uploadDate.toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={doc.status}
                    size="small"
                    color={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              }
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" color="primary">
                <ViewIcon />
              </IconButton>
              <IconButton size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>
      {isEditing && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
        >
          Upload Document
        </Button>
      )}
      
      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        Common document types: Resume, PAN Card, Aadhar Card, Passport, Driving License, 
        Educational Certificates, Experience Letters, Salary Slips, Bank Statements
      </Typography>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderProfessionalInfo();
      case 2:
        return renderBankingInfo();
      case 3:
        return renderGovernmentInfo();
      case 4:
        return renderEmergencyContacts();
      case 5:
        return renderEducation();
      case 6:
        return renderDocuments();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Employee Selection Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            Select Employee
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Choose Employee</InputLabel>
              <Select
                value={selectedEmployeeId}
                label="Choose Employee"
                onChange={(e) => handleEmployeeSelection(e.target.value)}
                startAdornment={<PersonIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="">
                  <em>Select an employee to view profile</em>
                </MenuItem>
                {availableEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1">{emp.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {emp.employeeId}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedEmployeeId && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadEmployeeData}
                disabled={loading}
              >
                Refresh Profile
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Employee Profile Section - Only show when employee is selected */}
      {selectedEmployeeId ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Employee Profile: {employee.personalInfo.firstName || 'Employee'} {employee.personalInfo.lastName || 'Name'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isEditing ? (
                <>
                  <Button
                      variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    color="primary"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                  >
                    Cancel
                </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    sx={{ bgcolor: 'primary.main' }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadEmployeeData}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </>
              )}
              </Box>
          </Box>

        {/* Employee Summary Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <Typography variant="h6" color="textSecondary">
                  Loading employee data...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                  {employee.personalInfo.firstName[0] || 'E'}{employee.personalInfo.lastName[0] || 'M'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    {employee.personalInfo.firstName || 'Employee'} {employee.personalInfo.lastName || 'Name'}
                  </Typography>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    {employee.professionalInfo.position || 'Position'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<BusinessIcon />}
                      label={employee.professionalInfo.department || 'Department'}
                      variant="outlined"
                    />
                    <Chip
                      icon={<BadgeIcon />}
                      label={employee.employeeId || 'Employee ID'}
                      variant="outlined"
                    />
                    <Chip
                      label={employee.professionalInfo.status || 'Status'}
                      color={employee.professionalInfo.status === 'active' ? 'success' : 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Annual Salary: {formatIndianCurrency(employee.professionalInfo.salary)}
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Stepper Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ p: 3 }}>
            {steps.map((label, index) => (
              <Step key={label} completed={false}>
                <StepLabel
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setActiveStep(index)}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {steps[activeStep]}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {getStepContent(activeStep)}
        </Paper>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
          >
            Previous
          </Button>
          <Button
            disabled={activeStep === steps.length - 1}
            onClick={() => setActiveStep(prev => prev + 1)}
            variant="contained"
          >
            Next
          </Button>
    </Box>

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
        </>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
            <Typography variant="h5" color="textSecondary" gutterBottom>
              No Employee Selected
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Please select an employee from the dropdown above to view their profile.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EmployeePage; 