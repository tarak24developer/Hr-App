import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration with fallbacks for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'demo-measurement-id'
};

// Check if we have real Firebase credentials
const hasRealCredentials = import.meta.env.VITE_FIREBASE_API_KEY && 
                          import.meta.env.VITE_FIREBASE_API_KEY !== 'your_actual_api_key_here' &&
                          import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key';

// Initialize Firebase
let app;
if (getApps().length === 0) {
  try {
    if (!hasRealCredentials) {
      console.warn('⚠️ Firebase credentials not configured. App will show configuration error.');
      // Don't throw error here, let the app handle it gracefully
      app = null;
    } else {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    console.warn('⚠️ Firebase initialization failed. App will show configuration error.');
    app = null;
  }
} else {
  app = getApp();
}

// Initialize Firebase services with error handling
export const auth = hasRealCredentials && app ? getAuth(app) : null;
export const db = hasRealCredentials && app ? getFirestore(app) : null;
export const storage = hasRealCredentials && app ? getStorage(app) : null;
export const functions = hasRealCredentials && app ? getFunctions(app) : null;

// Initialize Analytics conditionally
export const analytics = hasRealCredentials && app && isSupported() ? 
  isSupported().then(yes => yes ? getAnalytics(app) : null) : 
  Promise.resolve(null);

// Connect to emulators in development
if (import.meta.env.DEV && hasRealCredentials && app) {
  try {
    // Auth emulator
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth!, 'http://localhost:9099');
    }
    
    // Firestore emulator
    if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true') {
      connectFirestoreEmulator(db!, 'localhost', 8080);
    }
    
    // Storage emulator
    if (import.meta.env.VITE_USE_STORAGE_EMULATOR === 'true') {
      connectStorageEmulator(storage!, 'localhost', 9199);
    }
    
    // Functions emulator
    if (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
      connectFunctionsEmulator(functions!, 'localhost', 5001);
    }
  } catch (error) {
    console.warn('Failed to connect to emulators:', error);
  }
}

// Show error if Firebase credentials are not configured
if (!hasRealCredentials) {
  console.error('❌ Firebase credentials not configured. Please set up your Firebase environment variables.');
  console.error('Required environment variables:');
  console.error('- VITE_FIREBASE_API_KEY');
  console.error('- VITE_FIREBASE_AUTH_DOMAIN');
  console.error('- VITE_FIREBASE_PROJECT_ID');
  console.error('- VITE_FIREBASE_STORAGE_BUCKET');
  console.error('- VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.error('- VITE_FIREBASE_APP_ID');
}

export default app;
