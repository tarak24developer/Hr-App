import firebaseService from '../services/firebaseService';

// Function to generate sequential employee IDs
const generateEmployeeId = (index: number): string => {
  return `EMP${(index + 1).toString().padStart(3, '0')}`;
};

// Sample user data for testing the EmployeeDirectory
export const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+91 98765 43210',
    department: 'Information Technology',
    position: 'Senior Software Engineer',
    hireDate: '2022-03-15T00:00:00.000Z',
    salary: 850000,
    status: 'active',
    address: '123 Main Street, Koramangala, Bangalore, Karnataka 560034',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+91 98765 43211',
      relationship: 'Spouse'
    },
    skills: ['React', 'Node.js', 'TypeScript', 'Python'],
    officeLocation: 'Bangalore Office',
    role: 'employee',
    avatar: null,
    createdAt: '2022-03-15T00:00:00.000Z',
    updatedAt: '2022-03-15T00:00:00.000Z',
    isActive: true,
    employeeId: 'EMP001',
    bankingInfo: {
      bankName: 'State Bank of India',
      accountHolderName: 'John Doe',
      accountNumber: '12345678901',
      ifscCode: 'SBIN0001234',
      accountType: 'savings'
    },
    governmentInfo: {
      panNumber: 'ABCDE1234F',
      aadharNumber: '1234-5678-9012'
    }
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    phone: '+91 98765 43212',
    department: 'Human Resources',
    position: 'HR Manager',
    hireDate: '2021-01-10T00:00:00.000Z',
    salary: 750000,
    status: 'active',
    address: '456 Oak Avenue, Andheri West, Mumbai, Maharashtra 400058',
    emergencyContact: {
      name: 'Bob Smith',
      phone: '+91 98765 43213',
      relationship: 'Husband'
    },
    skills: ['Recruitment', 'Employee Relations', 'Training'],
    officeLocation: 'Mumbai Office',
    role: 'hr',
    avatar: null,
    createdAt: '2021-01-10T00:00:00.000Z',
    updatedAt: '2021-01-10T00:00:00.000Z',
    isActive: true,
    employeeId: 'EMP002',
    bankingInfo: {
      bankName: 'HDFC Bank',
      accountHolderName: 'Jane Smith',
      accountNumber: '98765432109',
      ifscCode: 'HDFC0001234',
      accountType: 'savings'
    },
    governmentInfo: {
      panNumber: 'FGHIJ5678K',
      aadharNumber: '9876-5432-1098'
    }
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    phone: '+91 98765 43214',
    department: 'Marketing',
    position: 'Marketing Specialist',
    hireDate: '2023-06-01T00:00:00.000Z',
    salary: 600000,
    status: 'active',
    address: '789 Pine Street, Banjara Hills, Hyderabad, Telangana 500034',
    emergencyContact: {
      name: 'Sarah Johnson',
      phone: '+91 98765 43215',
      relationship: 'Sister'
    },
    skills: ['Digital Marketing', 'Social Media', 'Content Creation'],
    officeLocation: 'Hyderabad Office',
    role: 'employee',
    avatar: null,
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2023-06-01T00:00:00.000Z',
    isActive: true,
    employeeId: 'EMP003',
    bankingInfo: {
      bankName: 'ICICI Bank',
      accountHolderName: 'Mike Johnson',
      accountNumber: '11223344556',
      ifscCode: 'ICIC0001234',
      accountType: 'current'
    },
    governmentInfo: {
      panNumber: 'KLMNO9012P',
      aadharNumber: '1122-3344-5566'
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+91 98765 43216',
    department: 'Finance',
    position: 'Financial Analyst',
    hireDate: '2022-09-15T00:00:00.000Z',
    salary: 700000,
    status: 'active',
    address: '321 Elm Street, Indiranagar, Bangalore, Karnataka 560038',
    emergencyContact: {
      name: 'Tom Wilson',
      phone: '+91 98765 43217',
      relationship: 'Father'
    },
    skills: ['Financial Analysis', 'Excel', 'QuickBooks'],
    officeLocation: 'Bangalore Office',
    role: 'employee',
    avatar: null,
    createdAt: '2022-09-15T00:00:00.000Z',
    updatedAt: '2022-09-15T00:00:00.000Z',
    isActive: true,
    employeeId: 'EMP004',
    bankingInfo: {
      bankName: 'Axis Bank',
      accountHolderName: 'Sarah Wilson',
      accountNumber: '99887766554',
      ifscCode: 'UTIB0001234',
      accountType: 'savings'
    },
    governmentInfo: {
      panNumber: 'PQRST3456U',
      aadharNumber: '9988-7766-5544'
    }
  }
];

// Function to populate the users collection with sample data
export const populateSampleUsers = async () => {
  try {
    console.log('Starting to populate sample users...');
    
    for (const userData of sampleUsers) {
      const result = await firebaseService.addDocument('users', userData);
      if (result.success) {
        console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} with ID: ${userData.employeeId}`);
      } else {
        console.error(`❌ Failed to create user: ${userData.firstName} ${userData.lastName}`, result.error);
      }
    }
    
    console.log('✅ Sample users population completed!');
    return true;
  } catch (error) {
    console.error('❌ Error populating sample users:', error);
    return false;
  }
};

// Function to clear all users (for testing purposes)
export const clearAllUsers = async () => {
  try {
    console.log('⚠️ Clearing all users...');
    
    // Get all users
    const usersResult = await firebaseService.getCollection('users');
    if (usersResult.success && usersResult.data) {
      for (const user of usersResult.data) {
        await firebaseService.deleteDocument('users', user['id']);
        console.log(`🗑️ Deleted user: ${user['id']}`);
      }
    }
    
    console.log('✅ All users cleared!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing users:', error);
    return false;
  }
};

// Function to check if users collection has data
export const checkUsersCollection = async () => {
  try {
    const result = await firebaseService.getCollection('users');
    if (result.success && result.data) {
      console.log(`📊 Users collection has ${result.data.length} documents`);
      return result.data.length;
    } else {
      console.log('📊 Users collection is empty or error occurred');
      return 0;
    }
  } catch (error) {
    console.error('❌ Error checking users collection:', error);
    return 0;
  }
};
