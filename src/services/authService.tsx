import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../config/firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('token');
    this.setupAuthListener();
  }

  // Setup Firebase auth state listener
  setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        // User is signed in with Firebase Auth
        console.log('User signed in:', user.email);
        // Get and store token
        user.getIdToken().then(token => {
          this.token = token;
          localStorage.setItem('token', token);
        });
      } else {
        // User is signed out
        console.log('User signed out');
        this.clearTokens();
      }
    });
  }

  // Login with Firebase Auth
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // Store token and user data
      this.token = idToken;
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        role: 'admin', // Default role
        emailVerified: user.emailVerified
      }));

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          role: 'admin',
          emailVerified: user.emailVerified
        },
        token: idToken
      };
    } catch (error) {
      console.error('Firebase login error:', error);
      throw error;
    }
  }

  // Register new user with Firebase Auth
  async register(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // Store token and user data
      this.token = idToken;
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: displayName || 'User',
        role: 'user', // Default role for new users
        emailVerified: user.emailVerified
      }));

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName || 'User',
          role: 'user',
          emailVerified: user.emailVerified
        },
        token: idToken
      };
    } catch (error) {
      console.error('Firebase registration error:', error);
      throw error;
    }
  }

  // Enhanced registration with database storage
  async registerWithDatabase(email, password, displayName, additionalData = {}) {
    try {
      // First create the Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Prepare user data for database
      const userDataForDatabase = {
        uid: user.uid,
        email: user.email,
        firstName: displayName?.split(' ')[0] || 'User',
        lastName: displayName?.split(' ').slice(1).join(' ') || '',
        role: additionalData.role || 'user',
        department: additionalData.department || '',
        isActive: true,
        mustChangePassword: false, // User set their own password
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...additionalData // Include any additional fields
      };
      
      // Import firebaseService dynamically to avoid circular dependencies
      const { default: firebaseService } = await import('./firebaseService');
      
      // Save to database
      const dbResult = await firebaseService.addDocument('users', userDataForDatabase);
      
      if (!dbResult.success) {
        console.warn('Failed to save user data to database:', dbResult.error);
        // Don't fail registration if database save fails
      } else {
        console.log('User data saved to database successfully');
      }
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // Store token and user data
      this.token = idToken;
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: displayName || 'User',
        role: userDataForDatabase.role,
        emailVerified: user.emailVerified
      }));

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName || 'User',
          role: userDataForDatabase.role,
          emailVerified: user.emailVerified,
          ...userDataForDatabase
        },
        token: idToken,
        databaseSaved: dbResult.success
      };
    } catch (error) {
      console.error('Enhanced registration error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Logout from Firebase Auth
      if (auth.currentUser) {
        await signOut(auth);
      }

      // Clear local storage
      this.clearTokens();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear tokens even if logout fails
      this.clearTokens();
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current token
  getCurrentToken() {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser && !!this.token;
  }

  // Clear tokens and user data
  clearTokens() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(displayName, photoURL) {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName, photoURL });
        return { success: true };
      }
      throw new Error('No user logged in');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Create user account for another user (admin function)
  async createUserForOther(email, password, userData) {
    try {
      // Store current user session
      const currentUser = auth.currentUser;
      const currentToken = this.token;
      
      // Create new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Update profile with display name if provided
      if (userData.displayName) {
        await updateProfile(newUser, { displayName: userData.displayName });
      }
      
      // Sign out the newly created user to restore admin session
      await signOut(auth);
      
      // Restore the admin session
      if (currentUser && currentToken) {
        this.token = currentToken;
        localStorage.setItem('token', currentToken);
        
        // Re-authenticate the admin user
        // Note: This is a simplified approach. In production, you might want to use Firebase Admin SDK on the backend
        console.log('Restored admin session after creating user for:', email);
      }
      
      return {
        success: true,
        user: {
          uid: newUser.uid,
          email: newUser.email,
          displayName: userData.displayName || email.split('@')[0],
          ...userData
        }
      };
    } catch (error) {
      console.error('Error creating user for other:', error);
      throw error;
    }
  }
}

// Create and export a single instance
const authService = new AuthService();
export default authService;