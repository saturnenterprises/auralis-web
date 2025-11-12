import { db, isInitialized } from './firebaseAdmin.js';

const VOICE_CALLS_COLLECTION = 'voiceCalls';

/**
 * Create a call record in Firestore (server-side)
 * @param {Object} partial - Partial call record data
 * @returns {Promise<void>}
 */
async function createCallRecord(partial) {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, skipping Firestore write');
    return;
  }

  try {
    const nowIso = new Date().toISOString();
    const record = {
      ...partial,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

  // Use ElevenLabs callId as document id for idempotency
  const ref = db.collection(VOICE_CALLS_COLLECTION).doc(record.callId);
    await ref.set(record, { merge: true });
    
    console.log('✅ Call record created in Firestore:', record.callId);
  } catch (error) {
    console.error('❌ Failed to create call record in Firestore:', error);
    throw error;
  }
}

/**
 * Update a call record in Firestore (server-side)
 * @param {string} callId - The call ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
async function updateCallRecord(callId, updates) {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, skipping Firestore update');
    return;
  }

  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const ref = db.collection(VOICE_CALLS_COLLECTION).doc(callId);
    await ref.update(updateData);
    
    console.log('✅ Call record updated in Firestore:', callId);
  } catch (error) {
    console.error('❌ Failed to update call record in Firestore:', error);
    throw error;
  }
}

/**
 * Get a call record from Firestore (server-side)
 * @param {string} callId - The call ID
 * @returns {Promise<Object|null>}
 */
async function getCallRecord(callId) {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, cannot read from Firestore');
    return null;
  }

  try {
    const ref = db.collection(VOICE_CALLS_COLLECTION).doc(callId);
    const doc = await ref.get();
    
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get call record from Firestore:', error);
    return null;
  }
}

/**
 * Find a call record by Twilio Call SID
 * @param {string} twilioCallSid - The Twilio Call SID
 * @returns {Promise<Object|null>}
 */
async function findCallByTwilioSid(twilioCallSid) {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, cannot search Firestore');
    return null;
  }

  try {
    const query = db.collection(VOICE_CALLS_COLLECTION)
      .where('twilioCallSid', '==', twilioCallSid)
      .limit(1);
    
    const snapshot = await query.get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to find call by Twilio SID:', error);
    return null;
  }
}

/**
 * Find a call record by ElevenLabs Call ID
 * @param {string} elevenlabsCallId - The ElevenLabs Call ID
 * @returns {Promise<Object|null>}
 */
async function findCallByElevenLabsId(elevenlabsCallId) {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, cannot search Firestore');
    return null;
  }

  try {
    const query = db.collection(VOICE_CALLS_COLLECTION)
      .where('elevenlabsCallId', '==', elevenlabsCallId)
      .limit(1);
    
    const snapshot = await query.get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to find call by ElevenLabs ID:', error);
    return null;
  }
}

/**
 * Get recent call records (server-side)
 * @param {number} limitCount - Number of records to retrieve
 * @returns {Promise<Array>}
 */
async function getRecentCalls(limitCount = 20) {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, cannot read from Firestore');
    return [];
  }

  try {
    const query = db.collection(VOICE_CALLS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limitCount);
    
    const snapshot = await query.get();
    const calls = [];
    
    snapshot.forEach(doc => {
      calls.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Retrieved ${calls.length} recent calls from Firestore`);
    return calls;
  } catch (error) {
    console.error('❌ Failed to get recent calls from Firestore:', error);
    return [];
  }
}

/**
 * Get call statistics (server-side)
 * @returns {Promise<Object>}
 */
async function getCallStatistics() {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, cannot read from Firestore');
    return { total: 0, completed: 0, failed: 0, inProgress: 0 };
  }

  try {
    const snapshot = await db.collection(VOICE_CALLS_COLLECTION).get();
    const stats = {
      total: 0,
      completed: 0,
      failed: 0,
      inProgress: 0,
      byStatus: {}
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      const status = data.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      if (status === 'completed') stats.completed++;
      else if (status === 'failed') stats.failed++;
      else if (['calling', 'in-progress', 'ringing'].includes(status)) stats.inProgress++;
    });
    
    console.log('✅ Retrieved call statistics from Firestore');
    return stats;
  } catch (error) {
    console.error('❌ Failed to get call statistics from Firestore:', error);
    return { total: 0, completed: 0, failed: 0, inProgress: 0 };
  }
}

/**
 * Upsert multiple call records (server-side)
 * @param {Array} records - Array of call records
 * @returns {Promise<void>}
 */
async function upsertCalls(records) {
  if (!isInitialized()) {
    console.warn('Firebase Admin not initialized, skipping Firestore upsert');
    return;
  }

  try {
    const batch = db.batch();
    
    records.forEach(record => {
      const ref = db.collection(VOICE_CALLS_COLLECTION).doc(record.callId);
      batch.set(ref, record, { merge: true });
    });
    
    await batch.commit();
    console.log(`✅ Upserted ${records.length} call records to Firestore`);
  } catch (error) {
    console.error('❌ Failed to upsert calls to Firestore:', error);
    throw error;
  }
}

export {
  createCallRecord,
  updateCallRecord,
  getCallRecord,
  findCallByTwilioSid,
  findCallByElevenLabsId,
  getRecentCalls,
  getCallStatistics,
  upsertCalls,
};

