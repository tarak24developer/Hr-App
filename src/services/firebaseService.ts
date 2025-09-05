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
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';
import { db } from './firebase';
import type { ApiResponse } from '../types';

interface QueryOptions {
  where?: Array<{ field: string; operator: string; value: any }>;
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
}

class FirebaseService {
  private getCollectionRef(collectionName: string): CollectionReference<DocumentData> | null {
    if (!db) {
      console.warn('Firebase not available');
      return null;
    }
    return collection(db, collectionName);
  }

  private getDocumentRef(collectionName: string, docId: string): DocumentReference<DocumentData> | null {
    if (!db) {
      console.warn('Firebase not available');
      return null;
    }
    return doc(db, collectionName, docId);
  }

  async getCollection<T = DocumentData>(
    collectionName: string, 
    options: QueryOptions = {}
  ): Promise<ApiResponse<T[]>> {
    try {
      const collectionRef = this.getCollectionRef(collectionName);
      if (!collectionRef) {
        return { success: false, error: 'Firebase not available' };
      }

      let q = query(collectionRef);
      const constraints: QueryConstraint[] = [];

      // Apply where clauses
      if (options.where) {
        options.where.forEach(({ field, operator, value }) => {
          constraints.push(where(field, operator as any, value));
        });
      }

      // Apply order by
      if (options.orderBy) {
        options.orderBy.forEach(({ field, direction }) => {
          constraints.push(orderBy(field, direction));
        });
      }

      // Apply limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // Apply start after for pagination
      if (options.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      // Apply constraints
      if (constraints.length > 0) {
        q = query(collectionRef, ...constraints);
      }

      const querySnapshot = await getDocs(q);
      const data: T[] = [];

      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as T);
      });

      return {
        success: true,
        data,
        pagination: {
          page: 1,
          limit: options.limit || data.length,
          total: data.length,
          totalPages: 1
        }
      };
    } catch (error: any) {
      console.error('Error getting collection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDocument<T = DocumentData>(
    collectionName: string, 
    docId: string
  ): Promise<ApiResponse<T>> {
    try {
      const docRef = this.getDocumentRef(collectionName, docId);
      if (!docRef) {
        return { success: false, error: 'Firebase not available' };
      }

      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
        
        return { success: true, data };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error: any) {
      console.error('Error getting document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addDocument<T = DocumentData>(
    collectionName: string, 
    data: Omit<T, 'id'>
  ): Promise<ApiResponse<T>> {
    try {
      const collectionRef = this.getCollectionRef(collectionName);
      if (!collectionRef) {
        return { success: false, error: 'Firebase not available' };
      }

      const docRef = await addDoc(collectionRef, data);
      const newDoc = await getDoc(docRef);
      
      if (newDoc.exists()) {
        const newData = {
          id: newDoc.id,
          ...newDoc.data()
        } as T;
        
        return { success: true, data: newData };
      } else {
        return { success: false, error: 'Failed to create document' };
      }
    } catch (error: any) {
      console.error('Error adding document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateDocument<T = DocumentData>(
    collectionName: string, 
    docId: string, 
    data: Partial<T>
  ): Promise<ApiResponse<T>> {
    try {
      const docRef = this.getDocumentRef(collectionName, docId);
      if (!docRef) {
        return { success: false, error: 'Firebase not available' };
      }

      await updateDoc(docRef, data as any);
      
      // Get updated document
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        const updatedData = {
          id: updatedDoc.id,
          ...updatedDoc.data()
        } as T;
        
        return { success: true, data: updatedData };
      } else {
        return { success: false, error: 'Document not found after update' };
      }
    } catch (error: any) {
      console.error('Error updating document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteDocument(
    collectionName: string, 
    docId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const docRef = this.getDocumentRef(collectionName, docId);
      if (!docRef) {
        return { success: false, error: 'Firebase not available' };
      }

      await deleteDoc(docRef);
      return { success: true, data: true };
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async queryDocuments<T = DocumentData>(
    collectionName: string,
    field: string,
    operator: string,
    value: any
  ): Promise<ApiResponse<T[]>> {
    try {
      const collectionRef = this.getCollectionRef(collectionName);
      if (!collectionRef) {
        return { success: false, error: 'Firebase not available' };
      }

      const q = query(collectionRef, where(field, operator as any, value));
      const querySnapshot = await getDocs(q);
      
      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as T);
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error querying documents:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new FirebaseService();
