// utils/syncQueue.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';

const SYNC_QUEUE_KEY = 'journalSyncQueue';
const LAST_SYNC_KEY = 'lastSyncTimestamp';

export const syncQueue = {
  /**
   * Add an operation to the sync queue
   */
  async addToQueue(operation) {
    try {
      const queue = await this.getQueue();
      const queueItem = {
        ...operation,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      };
      queue.push(queueItem);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      
      // Try to process immediately if online
      this.processQueue();
      
      return queueItem.id;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  },

  /**
   * Get all items in the sync queue
   */
  async getQueue() {
    try {
      const queue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  },

  /**
   * Process all pending sync operations
   */
  async processQueue() {
    try {
      // Check if online
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('Offline - skipping sync queue processing');
        return { processed: 0, failed: 0 };
      }

      // Check if user is authenticated
      const auth = getAuth();
      if (!auth.currentUser) {
        console.log('Not authenticated - skipping sync queue processing');
        return { processed: 0, failed: 0 };
      }

      const queue = await this.getQueue();
      if (queue.length === 0) {
        return { processed: 0, failed: 0 };
      }

      const failedOperations = [];
      let processedCount = 0;

      for (const operation of queue) {
        try {
          await this.executeOperation(operation);
          processedCount++;
        } catch (error) {
          console.error('Sync operation failed:', operation.id, error);
          
          // Retry up to 3 times
          if (operation.retryCount < 3) {
            failedOperations.push({
              ...operation,
              retryCount: operation.retryCount + 1,
              lastError: error.message
            });
          } else {
            console.error('Operation exceeded max retries:', operation.id);
          }
        }
      }

      // Save failed operations back to queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedOperations));
      
      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      return { processed: processedCount, failed: failedOperations.length };
    } catch (error) {
      console.error('Error processing sync queue:', error);
      return { processed: 0, failed: 0 };
    }
  },

  /**
   * Execute a single sync operation
   */
  async executeOperation(operation) {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    switch (operation.type) {
      case 'CREATE':
        await addDoc(collection(db, 'journals'), {
          ...operation.data,
          userId: auth.currentUser.uid,
          syncedAt: new Date().toISOString()
        });
        break;

      case 'UPDATE':
        await updateDoc(doc(db, 'journals', operation.entryId), {
          ...operation.data,
          updatedAt: new Date().toISOString()
        });
        break;

      case 'DELETE':
        await deleteDoc(doc(db, 'journals', operation.entryId));
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  },

  /**
   * Clear the sync queue
   */
  async clearQueue() {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
  },

  /**
   * Get pending sync count
   */
  async getPendingCount() {
    const queue = await this.getQueue();
    return queue.length;
  },

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime() {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }
};