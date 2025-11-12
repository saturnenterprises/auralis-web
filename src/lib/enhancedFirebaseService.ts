import { db } from '@/lib/firebaseClient';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  writeBatch,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import type { 
  ConversationRecord, 
  EnhancedAgentRecord, 
  CallAnalytics, 
  RecordingRecord,
  NotificationRecord,
  SystemSettings,
  DashboardKPIs
} from '@/lib/types';

// Collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const ENHANCED_AGENTS_COLLECTION = 'enhancedAgents';
const CALL_ANALYTICS_COLLECTION = 'callAnalytics';
const RECORDINGS_COLLECTION = 'recordings';
const NOTIFICATIONS_COLLECTION = 'notifications';
const SYSTEM_SETTINGS_COLLECTION = 'systemSettings';
const DASHBOARD_KPIS_COLLECTION = 'dashboardKPIs';

// === CONVERSATIONS ===

export async function createConversationRecord(conversation: Omit<ConversationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const conversationData: ConversationRecord = {
    ...conversation,
    id: '', // Will be set by Firestore
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function updateConversationRecord(id: string, updates: Partial<ConversationRecord>): Promise<void> {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, id);
  await updateDoc(conversationRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function getConversationRecord(id: string): Promise<ConversationRecord | null> {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, id);
  const snap = await getDoc(conversationRef);
  return snap.exists() ? snap.data() as ConversationRecord : null;
}

export async function listConversationRecords(options: {
  agentId?: string;
  status?: string;
  limit?: number;
  orderBy?: 'startedAt' | 'endedAt' | 'createdAt';
  direction?: 'asc' | 'desc';
} = {}): Promise<ConversationRecord[]> {
  const constraints: QueryConstraint[] = [];
  
  if (options.agentId) {
    constraints.push(where('agentId', '==', options.agentId));
  }
  if (options.status) {
    constraints.push(where('status', '==', options.status));
  }
  if (options.orderBy) {
    constraints.push(orderBy(options.orderBy, options.direction || 'desc'));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(collection(db, CONVERSATIONS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as ConversationRecord);
}

export function subscribeToConversations(
  callback: (conversations: ConversationRecord[]) => void,
  options: { agentId?: string; limit?: number } = {}
): () => void {
  const constraints: QueryConstraint[] = [
    orderBy('startedAt', 'desc')
  ];
  
  if (options.agentId) {
    constraints.push(where('agentId', '==', options.agentId));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(collection(db, CONVERSATIONS_COLLECTION), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => doc.data() as ConversationRecord);
    callback(conversations);
  });
}

// === ENHANCED AGENTS ===

export async function createEnhancedAgentRecord(agent: Omit<EnhancedAgentRecord, 'updatedAt'>): Promise<string> {
  const agentData: EnhancedAgentRecord = {
    ...agent,
    updatedAt: new Date().toISOString(),
  };

  const docRef = doc(db, ENHANCED_AGENTS_COLLECTION, agent.id);
  await setDoc(docRef, agentData);
  return agent.id;
}

export async function updateEnhancedAgentRecord(id: string, updates: Partial<EnhancedAgentRecord>): Promise<void> {
  const agentRef = doc(db, ENHANCED_AGENTS_COLLECTION, id);
  await updateDoc(agentRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function getEnhancedAgentRecord(id: string): Promise<EnhancedAgentRecord | null> {
  const agentRef = doc(db, ENHANCED_AGENTS_COLLECTION, id);
  const snap = await getDoc(agentRef);
  return snap.exists() ? snap.data() as EnhancedAgentRecord : null;
}

export async function listEnhancedAgentRecords(): Promise<EnhancedAgentRecord[]> {
  const q = query(collection(db, ENHANCED_AGENTS_COLLECTION), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as EnhancedAgentRecord);
}

export function subscribeToEnhancedAgents(callback: (agents: EnhancedAgentRecord[]) => void): () => void {
  const q = query(collection(db, ENHANCED_AGENTS_COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const agents = snapshot.docs.map(doc => doc.data() as EnhancedAgentRecord);
    callback(agents);
  });
}

// === CALL ANALYTICS ===

export async function createCallAnalytics(analytics: Omit<CallAnalytics, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const analyticsData: CallAnalytics = {
    ...analytics,
    id: '', // Will be set by Firestore
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, CALL_ANALYTICS_COLLECTION), analyticsData);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function updateCallAnalytics(id: string, updates: Partial<CallAnalytics>): Promise<void> {
  const analyticsRef = doc(db, CALL_ANALYTICS_COLLECTION, id);
  await updateDoc(analyticsRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function getCallAnalytics(callId: string): Promise<CallAnalytics | null> {
  const q = query(
    collection(db, CALL_ANALYTICS_COLLECTION),
    where('callId', '==', callId),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data() as CallAnalytics;
}

export async function listCallAnalytics(options: {
  limit?: number;
  dateAfter?: string;
  dateBefore?: string;
} = {}): Promise<CallAnalytics[]> {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc')
  ];
  
  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(collection(db, CALL_ANALYTICS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as CallAnalytics);
}

// === RECORDINGS ===

export async function createRecordingRecord(recording: Omit<RecordingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const recordingData: RecordingRecord = {
    ...recording,
    id: '', // Will be set by Firestore
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, RECORDINGS_COLLECTION), recordingData);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function updateRecordingRecord(id: string, updates: Partial<RecordingRecord>): Promise<void> {
  const recordingRef = doc(db, RECORDINGS_COLLECTION, id);
  await updateDoc(recordingRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function getRecordingRecord(id: string): Promise<RecordingRecord | null> {
  const recordingRef = doc(db, RECORDINGS_COLLECTION, id);
  const snap = await getDoc(recordingRef);
  return snap.exists() ? snap.data() as RecordingRecord : null;
}

export async function getRecordingByCallId(callId: string): Promise<RecordingRecord | null> {
  const q = query(
    collection(db, RECORDINGS_COLLECTION),
    where('callId', '==', callId),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data() as RecordingRecord;
}

export async function listRecordingRecords(options: {
  callId?: string;
  status?: string;
  limit?: number;
} = {}): Promise<RecordingRecord[]> {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc')
  ];
  
  if (options.callId) {
    constraints.push(where('callId', '==', options.callId));
  }
  if (options.status) {
    constraints.push(where('status', '==', options.status));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(collection(db, RECORDINGS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as RecordingRecord);
}

// === NOTIFICATIONS ===

export async function createNotification(notification: Omit<NotificationRecord, 'id' | 'createdAt'>): Promise<string> {
  const notificationData: NotificationRecord = {
    ...notification,
    id: '', // Will be set by Firestore
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  await updateDoc(notificationRef, { isRead: true });
}

export async function listNotifications(options: {
  isRead?: boolean;
  severity?: string;
  limit?: number;
} = {}): Promise<NotificationRecord[]> {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc')
  ];
  
  if (options.isRead !== undefined) {
    constraints.push(where('isRead', '==', options.isRead));
  }
  if (options.severity) {
    constraints.push(where('severity', '==', options.severity));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(collection(db, NOTIFICATIONS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as NotificationRecord);
}

export function subscribeToNotifications(
  callback: (notifications: NotificationRecord[]) => void,
  options: { limit?: number } = {}
): () => void {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc')
  ];
  
  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(collection(db, NOTIFICATIONS_COLLECTION), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => doc.data() as NotificationRecord);
    callback(notifications);
  });
}

// === DASHBOARD KPIs ===

export async function saveDashboardKPIs(kpis: DashboardKPIs): Promise<void> {
  const kpisRef = doc(db, DASHBOARD_KPIS_COLLECTION, 'current');
  await setDoc(kpisRef, kpis, { merge: true });
}

export async function getDashboardKPIs(): Promise<DashboardKPIs | null> {
  const kpisRef = doc(db, DASHBOARD_KPIS_COLLECTION, 'current');
  const snap = await getDoc(kpisRef);
  return snap.exists() ? snap.data() as DashboardKPIs : null;
}

export function subscribeToDashboardKPIs(callback: (kpis: DashboardKPIs | null) => void): () => void {
  const kpisRef = doc(db, DASHBOARD_KPIS_COLLECTION, 'current');
  return onSnapshot(kpisRef, (snapshot) => {
    const kpis = snapshot.exists() ? snapshot.data() as DashboardKPIs : null;
    callback(kpis);
  });
}

// === SYSTEM SETTINGS ===

export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  const settingsRef = doc(db, SYSTEM_SETTINGS_COLLECTION, 'default');
  await setDoc(settingsRef, settings, { merge: true });
}

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const settingsRef = doc(db, SYSTEM_SETTINGS_COLLECTION, 'default');
  const snap = await getDoc(settingsRef);
  return snap.exists() ? snap.data() as SystemSettings : null;
}

// === BATCH OPERATIONS ===

export async function batchCreateConversations(conversations: Omit<ConversationRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  conversations.forEach((conversation) => {
    const docRef = doc(collection(db, CONVERSATIONS_COLLECTION));
    const conversationData: ConversationRecord = {
      ...conversation,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(docRef, conversationData);
  });

  await batch.commit();
}

export async function batchUpdateAgentMetrics(updates: Array<{
  agentId: string;
  metrics: EnhancedAgentRecord['metrics'];
  realTimeStatus: EnhancedAgentRecord['realTimeStatus'];
}>): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  updates.forEach(({ agentId, metrics, realTimeStatus }) => {
    const agentRef = doc(db, ENHANCED_AGENTS_COLLECTION, agentId);
    batch.update(agentRef, {
      metrics,
      realTimeStatus,
      updatedAt: now
    });
  });

  await batch.commit();
}

// === UTILITY FUNCTIONS ===

export async function cleanupExpiredNotifications(): Promise<void> {
  const now = new Date().toISOString();
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('expiresAt', '<=', now)
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

export async function getAnalyticsSummary(dateAfter: string, dateBefore: string): Promise<{
  totalCalls: number;
  totalConversations: number;
  avgQualityScore: number;
  totalRecordings: number;
}> {
  // This would be optimized with proper indexing and aggregation
  const [callAnalytics, conversations, recordings] = await Promise.all([
    listCallAnalytics({ limit: 1000 }),
    listConversationRecords({ limit: 1000 }),
    listRecordingRecords({ limit: 1000 })
  ]);

  // Filter by date range
  const filteredAnalytics = callAnalytics.filter(a => 
    a.createdAt >= dateAfter && a.createdAt <= dateBefore
  );
  const filteredConversations = conversations.filter(c => 
    c.startedAt >= dateAfter && c.startedAt <= dateBefore
  );
  const filteredRecordings = recordings.filter(r => 
    r.createdAt >= dateAfter && r.createdAt <= dateBefore
  );

  const avgQualityScore = filteredAnalytics.length > 0 
    ? filteredAnalytics.reduce((sum, a) => sum + (a.twilioMetrics?.qualityScore || 0), 0) / filteredAnalytics.length
    : 0;

  return {
    totalCalls: filteredAnalytics.length,
    totalConversations: filteredConversations.length,
    avgQualityScore,
    totalRecordings: filteredRecordings.length
  };
}