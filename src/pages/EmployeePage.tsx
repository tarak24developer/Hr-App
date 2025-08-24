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
  Cancel as CancelIcon
} from '@mui/icons-material';
// Date picker imports removed to avoid dependency issues

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
    routingNumber: string;
    accountHolderName: string;
    accountType: 'savings' | 'checking';
  };
  governmentInfo: {
    ssn: string;
    taxId: string;
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
    country: ''
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
    routingNumber: '',
    accountHolderName: '',
    accountType: 'savings'
  },
  governmentInfo: {
    ssn: '',
    taxId: '',
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
    // Load employee data (mock data for now)
    const mockEmployee: Employee = {
      id: '1',
      employeeId: 'EMP001',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1 (555) 123-4567',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'male',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      professionalInfo: {
        department: 'Information Technology',
        position: 'Senior Software Engineer',
        joiningDate: new Date('2022-03-15'),
        employeeType: 'full-time',
        workLocation: 'New York Office',
        manager: 'Jane Smith',
        salary: 85000,
        status: 'active'
      },
      bankingInfo: {
        bankName: 'Chase Bank',
        accountNumber: '****1234',
        routingNumber: '021000021',
        accountHolderName: 'John Doe',
        accountType: 'checking'
      },
      governmentInfo: {
        ssn: '***-**-1234',
        taxId: '12-3456789',
        passportNumber: 'A12345678',
        drivingLicense: 'DL123456789'
      },
      emergencyContacts: [
        {
          id: '1',
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1 (555) 123-4568',
          email: 'jane.doe@email.com',
          address: '123 Main St, New York, NY 10001'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2008-09-01'),
          endDate: new Date('2012-06-15'),
          gpa: '3.8'
        }
      ],
      documents: [
        {
          id: '1',
          type: 'Resume',
          name: 'john_doe_resume.pdf',
          uploadDate: new Date('2022-03-10'),
          fileUrl: '/documents/john_doe_resume.pdf',
          status: 'approved'
        }
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
      certifications: ['AWS Certified Developer', 'React Certification']
    };

    setEmployee(mockEmployee);
  }, []);

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

  const handleSave = () => {
    // Save employee data
    setSnackbar({
      open: true,
      message: 'Employee information updated successfully',
      severity: 'success'
    });
    setIsEditing(false);
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
          disabled={!isEditing}
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
        <TextField
          fullWidth
          label="City"
          value={employee.personalInfo.city}
          onChange={(e) => handleInputChange('personalInfo', 'city', e.target.value)}
          disabled={!isEditing}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="State"
          value={employee.personalInfo.state}
          onChange={(e) => handleInputChange('personalInfo', 'state', e.target.value)}
          disabled={!isEditing}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="Zip Code"
          value={employee.personalInfo.zipCode}
          onChange={(e) => handleInputChange('personalInfo', 'zipCode', e.target.value)}
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
                    <TextField 
                      fullWidth 
          label="Department"
          value={employee.professionalInfo.department}
          onChange={(e) => handleInputChange('professionalInfo', 'department', e.target.value)}
          disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="Position"
          value={employee.professionalInfo.position}
          onChange={(e) => handleInputChange('professionalInfo', 'position', e.target.value)}
          disabled={!isEditing}
        />
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
        <TextField
          fullWidth
          label="Work Location"
          value={employee.professionalInfo.workLocation}
          onChange={(e) => handleInputChange('professionalInfo', 'workLocation', e.target.value)}
          disabled={!isEditing}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          label="Manager"
          value={employee.professionalInfo.manager}
          onChange={(e) => handleInputChange('professionalInfo', 'manager', e.target.value)}
          disabled={!isEditing}
                />
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
            startAdornment: <InputAdornment position="start">$</InputAdornment>
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
                    <TextField 
                      fullWidth 
          label="Bank Name"
          value={employee.bankingInfo.bankName}
          onChange={(e) => handleInputChange('bankingInfo', 'bankName', e.target.value)}
          disabled={!isEditing}
                    />
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
          label="Routing Number"
          value={employee.bankingInfo.routingNumber}
          onChange={(e) => handleInputChange('bankingInfo', 'routingNumber', e.target.value)}
          disabled={!isEditing}
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
            <MenuItem value="checking">Checking</MenuItem>
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
          label="Social Security Number"
          value={employee.governmentInfo.ssn}
          onChange={(e) => handleInputChange('governmentInfo', 'ssn', e.target.value)}
          disabled={!isEditing}
          type={isEditing ? 'text' : 'password'}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
          label="Tax ID"
          value={employee.governmentInfo.taxId}
          onChange={(e) => handleInputChange('governmentInfo', 'taxId', e.target.value)}
          disabled={!isEditing}
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
                    <TextField 
                      fullWidth 
                  label="Relationship"
                  value={contact.relationship}
                  onChange={(e) => {
                    const updated = employee.emergencyContacts.map(c =>
                      c.id === contact.id ? { ...c, relationship: e.target.value } : c
                    );
                    handleArrayChange('emergencyContacts', updated);
                  }}
                  disabled={!isEditing}
                    />
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
                    <TextField 
                      fullWidth 
                  label="Degree"
                  value={edu.degree}
                  onChange={(e) => {
                    const updated = employee.education.map(eduItem =>
                      eduItem.id === edu.id ? { ...eduItem, degree: e.target.value } : eduItem
                    );
                    handleArrayChange('education', updated);
                  }}
                  disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
                  label="Field of Study"
                  value={edu.fieldOfStudy}
                  onChange={(e) => {
                    const updated = employee.education.map(eduItem =>
                      eduItem.id === edu.id ? { ...eduItem, fieldOfStudy: e.target.value } : eduItem
                    );
                    handleArrayChange('education', updated);
                  }}
                  disabled={!isEditing}
                    />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField 
                      fullWidth 
                  label="GPA"
                  value={edu.gpa || ''}
                  onChange={(e) => {
                    const updated = employee.education.map(eduItem =>
                      eduItem.id === edu.id ? { ...eduItem, gpa: e.target.value } : eduItem
                    );
                    handleArrayChange('education', updated);
                  }}
                  disabled={!isEditing}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Employee Profile: {employee.personalInfo.firstName} {employee.personalInfo.lastName}
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
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{ bgcolor: 'primary.main' }}
              >
                Edit Profile
              </Button>
            )}
            </Box>
        </Box>

        {/* Employee Summary Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                {employee.personalInfo.firstName[0]}{employee.personalInfo.lastName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  {employee.professionalInfo.position}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<BusinessIcon />}
                    label={employee.professionalInfo.department}
                    variant="outlined"
                  />
                  <Chip
                    icon={<BadgeIcon />}
                    label={employee.employeeId}
                    variant="outlined"
                  />
                  <Chip
                    label={employee.professionalInfo.status}
                    color={employee.professionalInfo.status === 'active' ? 'success' : 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
            </Box>
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
      </Box>
  );
};

export default EmployeePage; 