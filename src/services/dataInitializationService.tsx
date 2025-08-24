// Data initialization service for empty Firestore collections
export const sampleData = {
  employees: [
    {
      employeeName: 'John Smith',
      email: 'john.smith@company.com',
      department: { name: 'IT', id: 'dept_it' },
      position: 'Software Engineer',
      contactNumber: '+1-555-0101',
      hireDate: '2023-01-15',
      salary: 75000,
      status: 'active',
      resigned: false
    },
    {
      employeeName: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      department: { name: 'HR', id: 'dept_hr' },
      position: 'HR Manager',
      contactNumber: '+1-555-0102',
      hireDate: '2022-08-20',
      salary: 65000,
      status: 'active',
      resigned: false
    },
    {
      employeeName: 'Mike Davis',
      email: 'mike.davis@company.com',
      department: { name: 'Finance', id: 'dept_finance' },
      position: 'Financial Analyst',
      contactNumber: '+1-555-0103',
      hireDate: '2023-03-10',
      salary: 60000,
      status: 'active',
      resigned: false
    }
  ],
  departments: [
    { name: 'IT', description: 'Information Technology', manager: 'John Smith', budget: 500000 },
    { name: 'HR', description: 'Human Resources', manager: 'Sarah Johnson', budget: 300000 },
    { name: 'Finance', description: 'Finance & Accounting', manager: 'Mike Davis', budget: 400000 },
    { name: 'Marketing', description: 'Marketing & Sales', manager: 'Lisa Wilson', budget: 350000 },
    { name: 'Operations', description: 'Operations & Logistics', manager: 'David Brown', budget: 450000 }
  ],
  users: [
    {
      username: 'admin',
      email: 'admin@company.com',
      role: 'admin',
      status: 'active',
      lastLogin: new Date().toISOString(),
      permissions: ['read', 'write', 'delete', 'admin']
    },
    {
      username: 'manager',
      email: 'manager@company.com',
      role: 'manager',
      status: 'active',
      lastLogin: new Date().toISOString(),
      permissions: ['read', 'write']
    },
    {
      username: 'employee',
      email: 'employee@company.com',
      role: 'employee',
      status: 'active',
      lastLogin: new Date().toISOString(),
      permissions: ['read']
    }
  ],
  attendance: [
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      date: '2024-01-15',
      checkIn: '09:00',
      checkOut: '17:00',
      status: 'present',
      hours: 8
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Sarah Johnson',
      date: '2024-01-15',
      checkIn: '08:45',
      checkOut: '17:15',
      status: 'present',
      hours: 8.5
    }
  ],
  leaves: [
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      type: 'Annual Leave',
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      status: 'approved',
      reason: 'Family vacation'
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Sarah Johnson',
      type: 'Sick Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      status: 'approved',
      reason: 'Medical appointment'
    }
  ],
  payrolls: [
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      month: 'January 2024',
      basicSalary: 75000,
      allowances: 5000,
      deductions: 3000,
      netPay: 77000
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Sarah Johnson',
      month: 'January 2024',
      basicSalary: 65000,
      allowances: 4000,
      deductions: 2500,
      netPay: 66500
    }
  ],
  assets: [
    {
      name: 'Laptop Dell XPS 13',
      type: 'Computer',
      serialNumber: 'LAP001',
      assignedTo: 'John Smith',
      status: 'assigned',
      purchaseDate: '2023-06-15',
      value: 1200
    },
    {
      name: 'Office Chair',
      type: 'Furniture',
      serialNumber: 'FUR001',
      assignedTo: 'Sarah Johnson',
      status: 'assigned',
      purchaseDate: '2023-01-10',
      value: 300
    }
  ],
  inventory: [
    {
      itemName: 'Office Supplies',
      category: 'Stationery',
      quantity: 500,
      unitPrice: 2.50,
      supplier: 'OfficeMax',
      lastRestocked: '2024-01-10'
    },
    {
      itemName: 'Coffee Beans',
      category: 'Beverages',
      quantity: 25,
      unitPrice: 15.00,
      supplier: 'Coffee Co.',
      lastRestocked: '2024-01-12'
    }
  ],
  training: [
    {
      title: 'Leadership Skills Workshop',
      instructor: 'Dr. Emily Chen',
      duration: '2 days',
      capacity: 20,
      enrolled: 15,
      startDate: '2024-02-15',
      status: 'upcoming'
    },
    {
      title: 'Technical Skills Training',
      instructor: 'John Smith',
      duration: '1 day',
      capacity: 30,
      enrolled: 25,
      startDate: '2024-01-25',
      status: 'upcoming'
    }
  ],
  incidents: [
    {
      title: 'Minor Accident in Parking Lot',
      type: 'Safety',
      severity: 'Low',
      reportedBy: 'Mike Davis',
      date: '2024-01-14',
      status: 'resolved',
      description: 'Minor fender bender in company parking lot'
    },
    {
      title: 'IT System Outage',
      type: 'Technical',
      severity: 'Medium',
      reportedBy: 'John Smith',
      date: '2024-01-13',
      status: 'investigating',
      description: 'Email system down for 2 hours'
    }
  ],
  expenses: [
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      category: 'Travel',
      amount: 250.00,
      description: 'Client meeting travel expenses',
      date: '2024-01-15',
      status: 'pending'
    },
    {
      employeeId: 'emp_002',
      employeeName: 'Sarah Johnson',
      category: 'Office Supplies',
      amount: 75.50,
      description: 'Team building materials',
      date: '2024-01-14',
      status: 'approved'
    }
  ],
  holidays: [
    {
      name: 'New Year\'s Day',
      date: '2024-01-01',
      type: 'Public Holiday',
      description: 'New Year celebration'
    },
    {
      name: 'Independence Day',
      date: '2024-07-04',
      type: 'Public Holiday',
      description: 'Independence Day celebration'
    }
  ],
  announcements: [
    {
      title: 'Company Meeting Next Week',
      content: 'All employees are invited to attend the quarterly company meeting.',
      author: 'CEO',
      priority: 'Medium',
      publishDate: '2024-01-15',
      status: 'published'
    },
    {
      title: 'New Policy Update',
      content: 'Updated remote work policy effective immediately.',
      author: 'HR Department',
      priority: 'High',
      publishDate: '2024-01-14',
      status: 'published'
    }
  ],
  surveys: [
    {
      title: 'Employee Satisfaction Survey',
      description: 'Annual employee satisfaction and feedback survey',
      questions: 20,
      responses: 45,
      status: 'active',
      endDate: '2024-02-15'
    },
    {
      title: 'Work Environment Feedback',
      description: 'Feedback on office environment and facilities',
      questions: 15,
      responses: 38,
      status: 'active',
      endDate: '2024-01-30'
    }
  ],
  documents: [
    {
      title: 'Employee Handbook',
      type: 'Policy',
      category: 'HR',
      uploadDate: '2024-01-10',
      status: 'active',
      expiryDate: '2025-01-10'
    },
    {
      title: 'Financial Report Q4',
      type: 'Report',
      category: 'Finance',
      uploadDate: '2024-01-05',
      status: 'active',
      expiryDate: '2024-04-05'
    }
  ],
  permissions: [
    {
      name: 'Read Access',
      description: 'Basic read access to data',
      level: 'Basic',
      status: 'active'
    },
    {
      name: 'Write Access',
      description: 'Ability to create and modify data',
      level: 'Standard',
      status: 'active'
    },
    {
      name: 'Admin Access',
      description: 'Full administrative access',
      level: 'Advanced',
      status: 'active'
    }
  ],
  roleTemplates: [
    {
      name: 'Employee Role',
      description: 'Standard employee permissions',
      permissions: ['read'],
      status: 'active'
    },
    {
      name: 'Manager Role',
      description: 'Manager level permissions',
      permissions: ['read', 'write'],
      status: 'active'
    },
    {
      name: 'Admin Role',
      description: 'Administrative permissions',
      permissions: ['read', 'write', 'delete', 'admin'],
      status: 'active'
    }
  ],
  exitProcesses: [
    {
      employeeId: 'emp_003',
      employeeName: 'Alex Turner',
      exitDate: '2024-01-20',
      reason: 'Career change',
      status: 'in-progress',
      exitInterview: 'Scheduled'
    }
  ],
  performance: [
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      period: 'Q4 2023',
      rating: 4.5,
      goals: 'Exceeded expectations',
      feedback: 'Excellent work on the new system implementation'
    }
  ],
  goals: [
    {
      title: 'Increase Productivity',
      description: 'Improve team productivity by 15%',
      target: '15%',
      current: '12%',
      status: 'in-progress'
    }
  ],
  kpis: [
    {
      name: 'Employee Retention Rate',
      target: '90%',
      current: '88%',
      trend: 'improving',
      status: 'on-track'
    },
    {
      name: 'Customer Satisfaction',
      target: '4.5/5',
      current: '4.3/5',
      trend: 'stable',
      status: 'needs-improvement'
    }
  ]
};

// Helper function to get sample data for a collection
export const getSampleData = (collectionName) => {
  try {
    if (!collectionName || typeof collectionName !== 'string') {
      console.warn('Invalid collection name provided to getSampleData:', collectionName);
      return [];
    }
    
    const data = sampleData[collectionName];
    
    if (!data) {
      console.log(`No sample data found for collection: ${collectionName}`);
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.warn(`Sample data for ${collectionName} is not an array:`, data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting sample data for ${collectionName}:`, error);
    return [];
  }
};

// Helper function to check if a collection should be initialized
export const shouldInitializeCollection = (collectionName) => {
  try {
    if (!collectionName || typeof collectionName !== 'string') {
      return false;
    }
    
    return sampleData.hasOwnProperty(collectionName) && Array.isArray(sampleData[collectionName]);
  } catch (error) {
    console.error(`Error checking if collection should be initialized: ${collectionName}`, error);
    return false;
  }
};

export default {
  sampleData,
  getSampleData,
  shouldInitializeCollection
};
