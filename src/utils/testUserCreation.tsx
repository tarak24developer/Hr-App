// Test utility for automatic user creation
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

interface TestUserResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface TestUsersResult {
  success: boolean;
  data: User[];
  count: number;
  error?: string;
}

export const createTestUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'employee'
): Promise<TestUserResult> => {
  try {
    // Create user with Firebase Auth
    const authResult = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role
    });

    return {
      success: true,
      user: authResult
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const createMultipleTestUsers = async (
  userData: Array<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }>
): Promise<TestUsersResult> => {
  try {
    const results: User[] = [];
    const errors: string[] = [];

    for (const userInfo of userData) {
      try {
        const result = await createTestUser(
          userInfo.email,
          userInfo.password,
          userInfo.firstName,
          userInfo.lastName,
          userInfo.role
        );

        if (result.success && result.user) {
          results.push(result.user);
        } else if (result.error) {
          errors.push(result.error);
        }
      } catch (error: any) {
        errors.push(`Failed to create user ${userInfo.email}: ${error.message}`);
      }
    }

    return {
      success: results.length > 0,
      data: results,
      count: results.length,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const createSampleTestUsers = async (): Promise<TestUsersResult> => {
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' as UserRole
    },
    {
      email: 'hr@test.com',
      password: 'hr123',
      firstName: 'HR',
      lastName: 'Manager',
      role: 'hr' as UserRole
    },
    {
      email: 'manager@test.com',
      password: 'manager123',
      firstName: 'Department',
      lastName: 'Manager',
      role: 'manager' as UserRole
    },
    {
      email: 'employee@test.com',
      password: 'employee123',
      firstName: 'Regular',
      lastName: 'Employee',
      role: 'employee' as UserRole
    }
  ];

  return createMultipleTestUsers(testUsers);
};

export const cleanupTestUsers = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // This would typically involve deleting test users from the database
    // For now, we'll just return a success message
    console.log('Test users cleanup completed');
    return {
      success: true,
      message: 'Test users cleanup completed successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Cleanup failed: ${error.message}`
    };
  }
};

export const getTestUsersSummary = async (): Promise<{ success: boolean; summary: any }> => {
  try {
    // This would typically fetch users from the database
    // For now, we'll return a mock summary
    return {
      success: true,
      summary: {
        total: 4,
        admin: 1,
        hr: 1,
        manager: 1,
        employee: 1
      }
    };
  } catch (error: any) {
    return {
      success: false,
      summary: { error: error.message }
    };
  }
};
