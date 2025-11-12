import { db } from '@/lib/firebaseClient';
import { collection, getDocs, limit, orderBy, query, doc, setDoc } from 'firebase/firestore';
import type { ConversationMessage } from '@/lib/types';

export async function listMessages(callId: string, maxItems: number = 200): Promise<ConversationMessage[]> {
  const q = query(
    collection(db, 'calls', callId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(maxItems)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as ConversationMessage);
}

export async function addMessage(callId: string, message: ConversationMessage): Promise<void> {
  const ref = doc(db, 'calls', callId, 'messages', message.id);
  await setDoc(ref, message, { merge: true });
}


