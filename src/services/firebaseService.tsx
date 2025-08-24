import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { getSampleData } from './dataInitializationService';

class FirebaseService {
  // Generic CRUD operations
  async getCollection(collectionName, filters = [], orderByField = null, limitCount = null) {
    try {
      // Validate collection name
      if (!collectionName || typeof collectionName !== 'string') {
        console.error('Invalid collection name:', collectionName);
        return { success: false, error: 'Invalid collection name' };
      }
      
      let q = collection(db, collectionName);
      
      // Validate and apply filters
      if (Array.isArray(filters) && filters.length > 0) {
        filters.forEach((filter, index) => {
          // Validate filter object has required properties
          if (filter && typeof filter === 'object' && filter.field && filter.operator && filter.value !== undefined) {
            // Ensure value is not undefined or null for Firestore
            if (filter.value !== null && filter.value !== undefined) {
              try {
                q = query(q, where(filter.field, filter.operator, filter.value));
              } catch (filterError) {
                console.error(`Error applying filter ${index}:`, filter, filterError);
              }
            }
          } else {
            console.warn(`Invalid filter object at index ${index}:`, filter);
          }
        });
      }
      
      // Apply ordering
      if (orderByField && orderByField.field) {
        try {
          q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
        } catch (orderError) {
          console.error('Error applying orderBy:', orderByField, orderError);
        }
      }
      
      // Apply limit
      if (limitCount && typeof limitCount === 'number' && limitCount > 0) {
        try {
          q = query(q, limit(limitCount));
        } catch (limitError) {
          console.error('Error applying limit:', limitCount, limitError);
        }
      }
      
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data };
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error);
      
      // Check if it's a permission error or collection doesn't exist
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn(`Collection ${collectionName} not accessible or doesn't exist yet`);
        return { success: true, data: [], message: 'Collection empty or not accessible' };
      }
      
      return { success: false, error: error.message };
    }
  }

  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      console.error(`Error getting ${collectionName}/${docId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, data: { id: docRef.id, ...data } };
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, data: { id: docId, ...data } };
    } catch (error) {
      console.error(`Error updating ${collectionName}/${docId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async deleteDocument(collectionName, docId) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting ${collectionName}/${docId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // File upload to Firebase Storage
  async uploadFile(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { success: true, data: { url: downloadURL, path: snapshot.ref.fullPath } };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  // Dashboard specific methods
  async getDashboardData() {
    try {
      // Compute dashboard data from Firestore collections
      // Employees
      const employeesSnap = await getDocs(collection(db, 'employees'));
      const totalEmployees = employeesSnap.size;

      let activeEmployees = 0;
      try {
        const activeQuery = query(collection(db, 'employees'), where('resigned', '==', false));
        const activeSnap = await getDocs(activeQuery);
        activeEmployees = activeSnap.size;
      } catch {
        // If field/query not available, best-effort fallback: assume all are active
        activeEmployees = totalEmployees;
      }

      // Pending leaves
      let pendingLeaves = 0;
      try {
        const pendingLeavesQuery = query(collection(db, 'leaves'), where('status', '==', 'pending'));
        const pendingLeavesSnap = await getDocs(pendingLeavesQuery);
        pendingLeaves = pendingLeavesSnap.size;
      } catch {
        pendingLeaves = 0;
      }

      // Total payroll amount (best-effort; sums 'amount' or 'totalNetPay' if present)
      let totalPayroll = 0;
      try {
        const payrollsSnap = await getDocs(collection(db, 'payrolls'));
        payrollsSnap.forEach((d) => {
          const data = d.data();
          const value = Number(data?.amount ?? data?.totalNetPay ?? 0);
          if (!Number.isNaN(value)) totalPayroll += value;
        });
      } catch {
        totalPayroll = 0;
      }

      // Open incidents (best-effort: status in ['open','pending'])
      let openIncidents = 0;
      try {
        const incidentsQuery = query(
          collection(db, 'incidents'),
          where('status', 'in', ['open', 'pending'])
        );
        const incidentsSnap = await getDocs(incidentsQuery);
        openIncidents = incidentsSnap.size;
      } catch {
        openIncidents = 0;
      }

      // Recent activities: try 'activities' collection ordered by createdAt desc
      let recentActivities = [];
      try {
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const activitiesSnap = await getDocs(activitiesQuery);
        activitiesSnap.forEach((d) => {
          recentActivities.push({ id: d.id, ...d.data() });
        });
      } catch {
        recentActivities = [];
      }

      return {
        success: true,
        data: {
          totalEmployees,
          activeEmployees,
          pendingLeaves,
          totalPayroll,
          openIncidents,
          recentActivities,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return { success: false, error: error.message };
    }
  }

  async getChartData(chartType, timeRange = 'weekly') {
    try {
      let data = [];
      
      switch (chartType) {
        case 'attendance':
          data = await this.getAttendanceChartData(timeRange);
          break;
        case 'payroll':
          data = await this.getPayrollChartData(timeRange);
          break;
        case 'leaves':
          data = await this.getLeavesChartData(timeRange);
          break;
        default:
          data = [];
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting chart data:', error);
      return { success: false, error: error.message };
    }
  }

  async getAttendanceChartData(timeRange) {
    try {
      // Implement attendance aggregation here if your schema supports it.
      // Returning empty array to avoid mock data.
      return [];
    } catch (error) {
      console.error('Error getting attendance chart data:', error);
      return [];
    }
  }

  async getPayrollChartData(timeRange) {
    try {
      // Implement payroll aggregation here if your schema supports it.
      // Returning empty array to avoid mock data.
      return [];
    } catch (error) {
      console.error('Error getting payroll chart data:', error);
      return [];
    }
  }

  async getLeavesChartData(timeRange) {
    try {
      // Implement leave aggregation here if your schema supports it.
      // Returning empty array to avoid mock data.
      return [];
    } catch (error) {
      console.error('Error getting leaves chart data:', error);
      return [];
    }
  }

  // Real-time listeners
  setupRealtimeListener(collectionName, callback, filters = []) {
    try {
      let q = collection(db, collectionName);
      
      // Validate and apply filters
      if (Array.isArray(filters) && filters.length > 0) {
        filters.forEach(filter => {
          // Validate filter object has required properties
          if (filter && typeof filter === 'object' && filter.field && filter.operator && filter.value !== undefined) {
            // Ensure value is not undefined or null for Firestore
            if (filter.value !== null && filter.value !== undefined) {
              q = query(q, where(filter.field, filter.operator, filter.value));
            }
          } else {
            console.warn(`Invalid filter object in real-time listener:`, filter);
          }
        });
      }
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        callback({ success: true, data });
      }, (error) => {
        console.error(`Error in real-time listener for ${collectionName}:`, error);
        callback({ success: false, error: error.message });
      });
      
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up real-time listener for ${collectionName}:`, error);
      return null;
    }
  }

  // Batch operations
  async batchWrite(operations) {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(op => {
        const docRef = doc(db, op.collection, op.id);
        
        switch (op.type) {
          case 'set':
            batch.set(docRef, op.data);
            break;
          case 'update':
            batch.update(docRef, op.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error in batch write:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize collections with sample data if they're empty
  async initializeCollectionIfEmpty(collectionName, sampleData = []) {
    try {
      console.log(`Checking if collection ${collectionName} needs initialization...`);
      
      // Check if collection exists and has data
      const existingData = await this.getCollection(collectionName);
      
      if (existingData.success && existingData.data.length === 0 && sampleData.length > 0) {
        console.log(`Initializing ${collectionName} with sample data...`);
        
        const batch = writeBatch(db);
        sampleData.forEach((item, index) => {
          const docRef = doc(collection(db, collectionName));
          batch.set(docRef, {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`✅ ${collectionName} initialized with ${sampleData.length} sample documents`);
        
        return { success: true, initialized: true, count: sampleData.length };
      }
      
      return { success: true, initialized: false, count: existingData.data.length };
    } catch (error) {
      console.error(`Error initializing ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get collection with fallback to sample data
  async getCollectionWithFallback(collectionName, customSampleData = [], filters = [], orderByField = null, limitCount = null) {
    try {
      // Validate collection name
      if (!collectionName || typeof collectionName !== 'string') {
        console.error('Invalid collection name in getCollectionWithFallback:', collectionName);
        return { success: false, error: 'Invalid collection name' };
      }
      
      // Validate sample data
      if (!Array.isArray(customSampleData)) {
        console.warn(`Sample data for ${collectionName} is not an array:`, customSampleData);
        customSampleData = [];
      }
      
      // Validate filters before passing to getCollection
      const validFilters = Array.isArray(filters) ? filters.filter(filter => 
        filter && typeof filter === 'object' && filter.field && filter.operator && filter.value !== undefined
      ) : [];
      
      // Try to get real data first
      const result = await this.getCollection(collectionName, validFilters, orderByField, limitCount);
      
      if (result.success && result.data.length > 0) {
        return result;
      }
      
      // Get sample data for this collection
      const sampleData = customSampleData.length > 0 ? customSampleData : getSampleData(collectionName);
      
      // Ensure sampleData is an array
      if (!Array.isArray(sampleData)) {
        console.warn(`Sample data for ${collectionName} is not an array:`, sampleData);
        return { success: true, data: [], message: 'No sample data available' };
      }
      
      // If no data and we have sample data, try to initialize
      if (sampleData.length > 0) {
        const initResult = await this.initializeCollectionIfEmpty(collectionName, sampleData);
        
        if (initResult.success && initResult.initialized) {
          // Now try to get the data again
          return await this.getCollection(collectionName, validFilters, orderByField, limitCount);
        }
      }
      
      // Return empty result if no data available
      return { success: true, data: [], message: 'No data available' };
      
    } catch (error) {
      console.error(`Error in getCollectionWithFallback for ${collectionName}:`, error);
      return { success: true, data: [], message: 'Error occurred, returning empty data' };
    }
  }
}

// Create and export a single instance
const firebaseService = new FirebaseService();
export default firebaseService;