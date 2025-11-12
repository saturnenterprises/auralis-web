// Enhanced Firebase service for call management
import { db } from './firebaseClient';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, where, onSnapshot, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { CallRecord } from './types';

// Collection names - Renamed to avoid conflicts with existing collections
const VOICE_CALLS_COLLECTION = 'voiceCalls';
const CALL_LOGS_COLLECTION = 'callLogs';

/**
 * Create a call record in Firestore (client-side)
 * @param callData - Call data to store
 * @returns Promise<string> - Document ID
 */
export async function createCallRecord(callData: Partial<CallRecord>): Promise<string> {
  try {
    console.log('🔄 Creating call record in Firestore:', callData);
    
    const now = new Date().toISOString();
    const record: CallRecord = {
      callId: callData.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: callData.agentId || '',
      toNumber: callData.toNumber || '',
      fromNumber: callData.fromNumber || '',
      status: callData.status || 'initiated',
      createdAt: now,
      updatedAt: now,
      ...callData
    };

    // Use callId as document ID for easy retrieval
    const docRef = doc(db, VOICE_CALLS_COLLECTION, record.callId);
    await setDoc(docRef, record, { merge: true });
    
    console.log('✅ Call record created successfully:', record.callId);
    return record.callId;
  } catch (error) {
    console.error('❌ Failed to create call record:', error);
    throw error;
  }
}

/**
 * Update a call record in Firestore
 * @param callId - Call ID
 * @param updates - Updates to apply
 * @returns Promise<void>
 */
export async function updateCallRecord(callId: string, updates: Partial<CallRecord>): Promise<void> {
  try {
    console.log('🔄 Updating call record:', callId, updates);
    
    const docRef = doc(db, VOICE_CALLS_COLLECTION, callId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await updateDoc(docRef, updateData);
    console.log('✅ Call record updated successfully:', callId);
  } catch (error) {
    console.error('❌ Failed to update call record:', error);
    throw error;
  }
}

/**
 * Get a call record from Firestore
 * @param callId - Call ID
 * @returns Promise<CallRecord | null>
 */
export async function getCallRecord(callId: string): Promise<CallRecord | null> {
  try {
    const docRef = doc(db, VOICE_CALLS_COLLECTION, callId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as CallRecord;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get call record:', error);
    return null;
  }
}

/**
 * Get recent calls from Firestore
 * @param limitCount - Number of calls to retrieve
 * @returns Promise<CallRecord[]>
 */
export async function getRecentCalls(limitCount: number = 20): Promise<CallRecord[]> {
  try {
    console.log('🔄 Fetching recent calls from Firestore...');
    
    const q = query(
      collection(db, VOICE_CALLS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const calls: CallRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data() } as CallRecord);
    });
    
    console.log(`✅ Retrieved ${calls.length} calls from Firestore`);
    return calls;
  } catch (error) {
    console.error('❌ Failed to get recent calls:', error);
    return [];
  }
}

/**
 * Subscribe to real-time call updates
 * @param callback - Callback function for updates
 * @param limitCount - Number of calls to monitor
 * @returns Function - Unsubscribe function
 */
export function subscribeToCalls(callback: (calls: CallRecord[]) => void, limitCount: number = 20): () => void {
  console.log('🔄 Setting up real-time call subscription...');
  
  const q = query(
    collection(db, VOICE_CALLS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const calls: CallRecord[] = [];
    querySnapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data() } as CallRecord);
    });
    
    console.log(`📞 Real-time update: ${calls.length} calls`);
    callback(calls);
  }, (error) => {
    console.error('❌ Real-time subscription error:', error);
    callback([]);
  });
  
  return unsubscribe;
}

/**
 * Add a call log entry
 * @param callId - Call ID
 * @param logData - Log data
 * @returns Promise<string> - Log ID
 */
export async function addCallLog(callId: string, logData: {
  type: string;
  message: string;
  data?: any;
}): Promise<string> {
  try {
    const logEntry = {
      ...logData,
      callId,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, CALL_LOGS_COLLECTION), logEntry);
    console.log('✅ Call log added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to add call log:', error);
    throw error;
  }
}

/**
 * Get call logs for a specific call
 * @param callId - Call ID
 * @returns Promise<any[]>
 */
export async function getCallLogs(callId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, CALL_LOGS_COLLECTION),
      where('callId', '==', callId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const logs: any[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return logs;
  } catch (error) {
    console.error('❌ Failed to get call logs:', error);
    return [];
  }
}

/**
 * Search calls by phone number
 * @param phoneNumber - Phone number to search
 * @returns Promise<CallRecord[]>
 */
export async function searchCallsByPhone(phoneNumber: string): Promise<CallRecord[]> {
  try {
    const q = query(
      collection(db, VOICE_CALLS_COLLECTION),
      where('toNumber', '==', phoneNumber)
    );
    
    const querySnapshot = await getDocs(q);
    const calls: CallRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data() } as CallRecord);
    });
    
    return calls;
  } catch (error) {
    console.error('❌ Failed to search calls by phone:', error);
    return [];
  }
}

/**
 * Get call statistics
 * @returns Promise<{
 *   totalCalls: number;
 *   completedCalls: number;
 *   failedCalls: number;
 *   inProgressCalls: number;
 *   totalDuration: number;
 *   averageDuration: number;
 * }>
 */
export async function getCallStatistics(): Promise<{
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  inProgressCalls: number;
  totalDuration: number;
  averageDuration: number;
}> {
  try {
    const calls = await getRecentCalls(1000); // Get more calls for stats
    
    const stats = {
      totalCalls: calls.length,
      completedCalls: calls.filter(call => call.status === 'completed').length,
      failedCalls: calls.filter(call => call.status === 'failed').length,
      inProgressCalls: calls.filter(call => call.status === 'in-progress').length,
      totalDuration: calls.reduce((sum, call) => sum + (call.durationSec || 0), 0),
      averageDuration: 0,
    };
    
    if (stats.completedCalls > 0) {
      stats.averageDuration = Math.round(stats.totalDuration / stats.completedCalls);
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get call statistics:', error);
    return {
      totalCalls: 0,
      completedCalls: 0,
      failedCalls: 0,
      inProgressCalls: 0,
      totalDuration: 0,
      averageDuration: 0,
    };
  }
}
