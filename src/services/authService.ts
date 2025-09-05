import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User, UserRole } from '../types';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordConfirmData {
  oobCode: string;
  newPassword: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.initializeAuthStateListener();
  }

  private async initializeAuthStateListener() {
    if (!auth) {
      console.warn('Firebase Auth not available - authentication will not work');
      // Set loading to false so the app can show the configuration error
      this.notifyListeners({ user: null, loading: false, error: 'Firebase not configured' });
      return;
    }

    // Set initial loading state while checking auth
    this.notifyListeners({ user: null, loading: true, error: null });

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('User authenticated, fetching user data...', { uid: firebaseUser.uid, email: firebaseUser.email });
          const user = await this.getUserFromFirestore(firebaseUser.uid);
          this.currentUser = user;
          console.log('User data loaded successfully:', { id: user.id, email: user.email, role: user.role });
          this.notifyListeners({ user, loading: false, error: null });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Don't log out the user if there's an error fetching data
          // Instead, create a minimal user object from Firebase auth
          const minimalUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            role: 'employee' as const,
            department: '',
            position: '',
            hireDate: new Date().toISOString(),
            status: 'active' as const,
            avatar: null,
            phone: '',
            address: '',
            emergencyContact: {
              name: '',
              phone: '',
              relationship: ''
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          this.currentUser = minimalUser;
          console.log('Created minimal user object:', { id: minimalUser.id, email: minimalUser.email });
          this.notifyListeners({ user: minimalUser, loading: false, error: null });
          
          // Try to create the user document in the background
          this.createUserDocumentInBackground(firebaseUser.uid, minimalUser);
        }
      } else {
        // Only log this if we actually had a user before
        if (this.currentUser) {
          console.log('User logged out, clearing state...');
        } else {
          console.log('No user authenticated initially...');
        }
        this.currentUser = null;
        this.notifyListeners({ user: null, loading: false, error: null });
      }
    });
  }

  private async createUserDocumentInBackground(uid: string, userData: any) {
    try {
      if (db) {
        await setDoc(doc(db, 'users', uid), userData);
        console.log('User document created successfully in background');
      }
    } catch (error) {
      console.warn('Failed to create user document in background:', error);
      // Don't throw error - user can still use the app
    }
  }

  private async getUserFromFirestore(uid: string): Promise<User> {
    if (!db) {
      throw new Error('Firestore not available. Please check your Firebase configuration.');
    }

    try {
      console.log('Fetching user document from Firestore:', { uid });
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User document found:', { 
          id: userData['id'], 
          email: userData['email'], 
          firstName: userData['firstName'],
          role: userData['role'] 
        });
        return userData as User;
      } else {
        // User document doesn't exist, create a default one
        console.log('Creating new user document for:', { uid });
        const defaultUser: User = {
          id: uid,
          email: '', // Will be filled from Firebase auth
          firstName: '',
          lastName: '',
          role: 'employee', // Default role
          department: '',
          position: '',
          hireDate: new Date().toISOString(),
          status: 'active',
          avatar: null,
          phone: '',
          address: '',
          emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save the default user document
        await setDoc(doc(db, 'users', uid), defaultUser);
        console.log('Default user document created successfully:', { uid, role: defaultUser.role });
        return defaultUser;
      }
    } catch (error: any) {
      console.error('Error in getUserFromFirestore:', { uid, error: error.message });
      // Don't throw error - let the calling method handle it
      throw new Error('Failed to fetch or create user data');
    }
  }

  private notifyListeners(state: AuthState) {
    this.authStateListeners.forEach(listener => listener(state));
  }

  public subscribeToAuthState(listener: (state: AuthState) => void) {
    this.authStateListeners.push(listener);
    
    // Immediately notify the listener of current state
    if (this.currentUser) {
      listener({ user: this.currentUser, loading: false, error: null });
    } else {
      listener({ user: null, loading: true, error: null });
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async login(credentials: LoginCredentials): Promise<User> {
    if (!auth) {
      throw new Error('Firebase Auth not available. Please check your Firebase configuration.');
    }

    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      let user = await this.getUserFromFirestore(firebaseUser.uid);
      
      // Update user document with Firebase auth data if it's a new user
      if (!user.email) {
        user = {
          ...user,
          email: firebaseUser.email || credentials.email,
          updatedAt: new Date().toISOString()
        };
        
        // Update the user document
        if (db) {
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            email: user.email,
            updatedAt: serverTimestamp()
          });
        }
      }
      
      // Update last login
      if (db) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: serverTimestamp()
        });
      }

      this.currentUser = user;
      this.notifyListeners({ user, loading: false, error: null });
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  public async register(credentials: RegisterCredentials): Promise<User> {
    if (!auth || !db) {
      throw new Error('Firebase services not available. Please check your Firebase configuration.');
    }

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: `${credentials.firstName} ${credentials.lastName}`
      });

      // Create user document in Firestore
      const user: User = {
        id: firebaseUser.uid,
        email: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        role: credentials.role,
        department: '',
        position: '',
        hireDate: new Date().toISOString(),
        status: 'active',
        avatar: null,
        phone: '',
        address: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      
      this.currentUser = user;
      this.notifyListeners({ user, loading: false, error: null });
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  public async logout(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not available. Please check your Firebase configuration.');
    }

    try {
      await signOut(auth);
      this.currentUser = null;
      this.notifyListeners({ user: null, loading: false, error: null });
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  public async resetPassword(data: PasswordResetData): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not available. Please check your Firebase configuration.');
    }

    try {
      await sendPasswordResetEmail(auth, data.email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  public async confirmPasswordReset(data: PasswordConfirmData): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not available. Please check your Firebase configuration.');
    }

    try {
      await confirmPasswordReset(auth, data.oobCode, data.newPassword);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  public async changePassword(newPassword: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not available. Please check your Firebase configuration.');
    }

    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      await updatePassword(auth.currentUser, newPassword);
      // Persist last password change timestamp in Firestore if possible
      if (db && this.currentUser) {
        await updateDoc(doc(db, 'users', this.currentUser.id), {
          lastPasswordChangeAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  public async updateProfile(updates: Partial<User>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    if (!db) {
      throw new Error('Firestore not available');
    }

    try {
      await updateDoc(doc(db, 'users', this.currentUser.id), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Update local user state
      this.currentUser = { ...this.currentUser, ...updates };
      this.notifyListeners({ user: this.currentUser, loading: false, error: null });
    } catch (error: any) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  public async changeUserRole(userId: string, newRole: UserRole): Promise<void> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    if (!db) {
      throw new Error('Firestore not available');
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(`Failed to change user role: ${error.message}`);
    }
  }

  public async deactivateUser(userId: string): Promise<void> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    if (!db) {
      throw new Error('Firestore not available');
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'inactive',
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  }

  public hasPermission(_resource: string, _action: string): boolean {
    if (!this.currentUser) return false;
    
    // For now, return true for admin, false for others
    // This can be enhanced later with proper permission system
    return this.currentUser.role === 'admin';
  }

  public canAccess(resource: string, action: string): boolean {
    return this.hasPermission(resource, action);
  }

  private handleAuthError(error: any): Error {
    let message = 'Authentication failed';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No user found with this email address';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/email-already-in-use':
        message = 'Email address is already in use';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      default:
        message = error.message || 'Authentication failed';
    }
    
    return new Error(message);
  }
}

export const authService = new AuthService();
export default authService;
