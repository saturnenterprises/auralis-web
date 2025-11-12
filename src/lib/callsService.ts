import { db } from '@/lib/firebaseClient';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import type { CallRecord } from '@/lib/types';

const CALLS_COLLECTION = 'calls';

export async function createCallRecord(partial: Omit<CallRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
  const nowIso = new Date().toISOString();
  const record: CallRecord = {
    ...partial,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  // Use ElevenLabs callId as document id for idempotency
  const ref = doc(db, CALLS_COLLECTION, record.callId);
  await setDoc(ref, record, { merge: true });
}

export async function listRecentCalls(daysBack: number = 1, maxItems: number = 25): Promise<CallRecord[]> {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  const q = query(
    collection(db, CALLS_COLLECTION),
    where('createdAt', '>=', cutoff),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CallRecord);
}

export function subscribeRecentCalls(
  daysBack: number,
  maxItems: number,
  onData: (records: CallRecord[]) => void,
  onError?: (error: unknown) => void
) {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  const q = query(
    collection(db, CALLS_COLLECTION),
    where('createdAt', '>=', cutoff),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  const unsub = onSnapshot(q, (snap) => {
    const records = snap.docs.map(d => d.data() as CallRecord);
    onData(records);
  }, (err) => {
    if (onError) onError(err);
  });
  return unsub;
}

// Map Twilio API call to our CallRecord shape
function mapTwilioCallToRecord(call: any): CallRecord {
  // Twilio fields commonly present: sid, to, from, status, start_time, end_time, duration
  const sid: string = call.sid;
  const toNumber: string = call.to || '';
  const fromNumber: string = call.from || '';
  const statusRaw = (call.status || 'queued').toString().toLowerCase();
  const statusMap: Record<string, CallRecord['status']> = {
    queued: 'queued',
    ringing: 'ringing',
    inprogress: 'in-progress',
    'in-progress': 'in-progress',
    completed: 'completed',
    busy: 'failed',
    failed: 'failed',
    noanswer: 'no-answer',
    'no-answer': 'no-answer',
    canceled: 'failed',
  };
  const status: CallRecord['status'] = statusMap[statusRaw] || 'queued';
  const startedAt: string | undefined = call.start_time ? new Date(call.start_time).toISOString() : undefined;
  const endedAt: string | undefined = call.end_time ? new Date(call.end_time).toISOString() : undefined;
  const durationSec: number | undefined = call.duration != null ? Number(call.duration) : undefined;
  const createdAt = startedAt || new Date().toISOString();
  return {
    callId: `twilio-${sid}`,
    twilioCallSid: sid,
    agentId: '',
    toNumber,
    fromNumber,
    status,
    startedAt,
    endedAt,
    durationSec,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchTwilioRecentCalls(pageSize: number = 25): Promise<CallRecord[]> {
  const resp = await fetch('/api/twilio/calls?pageSize=' + encodeURIComponent(String(pageSize)));
  if (!resp.ok) {
    throw new Error('Twilio calls fetch failed');
  }
  const data = await resp.json();
  const calls = Array.isArray(data?.calls) ? data.calls : data?.calls?.records || data?.calls || data?.items || data?.call_list || data?.records || [];
  return (calls as any[]).map(mapTwilioCallToRecord);
}

export async function upsertCalls(records: CallRecord[]): Promise<void> {
  for (const record of records) {
    const ref = doc(db, CALLS_COLLECTION, record.callId);
    await setDoc(ref, record, { merge: true });
  }
}

export async function fetchTwilioRecordingsForCall(callSid: string): Promise<{ url?: string; duration?: number } | undefined> {
  const resp = await fetch('/api/twilio/recordings?callSid=' + encodeURIComponent(callSid));
  if (!resp.ok) return undefined;
  const data = await resp.json();
  const items: any[] = data?.recordings || data?.items || data?.recordings_list || data?.data || [];
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const first = items[0];
  // Twilio returns RecordingUrl without extension sometimes; prefer media URL if present
  const url: string | undefined = first?.media_url || first?.recording_url || first?.uri || first?.links?.media;
  const duration: number | undefined = first?.duration ? Number(first.duration) : undefined;
  return { url, duration };
}

export async function enrichCallsWithRecordings(records: CallRecord[]): Promise<CallRecord[]> {
  const updated: CallRecord[] = [];
  for (const rec of records) {
    if (!rec.twilioCallSid) { updated.push(rec); continue; }
    try {
      const info = await fetchTwilioRecordingsForCall(rec.twilioCallSid);
      if (info?.url) {
        const enriched: CallRecord = {
          ...rec,
          recording: {
            ...(rec.recording || {}),
            recordingUrl: info.url,
            durationSec: info.duration,
            status: 'completed',
          },
          updatedAt: new Date().toISOString(),
        };
        const ref = doc(db, CALLS_COLLECTION, enriched.callId);
        await setDoc(ref, enriched, { merge: true });
        updated.push(enriched);
      } else {
        updated.push(rec);
      }
    } catch {
      updated.push(rec);
    }
  }
  return updated;
}


