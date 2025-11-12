import { updateCallRecord, findCallByTwilioSid } from '../../lib/serverCallsService.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const webhookType = req.query.type || 'status'; // status, recording, etc.

    console.log(`📞 Twilio ${webhookType} webhook received:`, {
      callSid: body.CallSid,
      status: body.CallStatus || body.RecordingStatus,
      timestamp: new Date().toISOString()
    });

    if (webhookType === 'status') {
      await handleStatusCallback(body);
    } else if (webhookType === 'recording') {
      await handleRecordingCallback(body);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing Twilio webhook:', error);
    // Still return 200 to prevent Twilio from retrying
    res.status(200).send('OK');
  }
}

/**
 * Handle Twilio status callback
 */
async function handleStatusCallback(body) {
  const callSid = body.CallSid;
  const callStatus = body.CallStatus;
  const fromNumber = body.From;
  const toNumber = body.To;
  const startTime = body.Timestamp || body.StartTime;
  const endTime = body.EndTime;
  const duration = body.CallDuration || body.Duration;

  if (!callSid) {
    console.warn('⚠️ No CallSid in status callback');
    return;
  }

  try {
    // Find the call record by Twilio Call SID
    const callRecord = await findCallByTwilioSid(callSid);
    
    if (!callRecord) {
      console.warn(`⚠️ No call record found for Twilio SID: ${callSid}`);
      return;
    }

    // Map Twilio status to our status
    const statusMap = {
      'queued': 'queued',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'failed',
      'failed': 'failed',
      'no-answer': 'no-answer',
      'canceled': 'failed',
    };

    const mappedStatus = statusMap[callStatus] || 'queued';

    // Prepare updates
    const updates = {
      status: mappedStatus,
      twilioCallSid: callSid,
    };

    // Add timing information if available
    if (startTime) {
      updates.startedAt = new Date(startTime).toISOString();
    }
    if (endTime) {
      updates.endedAt = new Date(endTime).toISOString();
    }
    if (duration) {
      updates.durationSec = parseInt(duration);
    }

    // Update the call record
    await updateCallRecord(callRecord.callId, updates);
    
    console.log(`✅ Updated call ${callRecord.callId} with status: ${mappedStatus}`);
  } catch (error) {
    console.error(`❌ Failed to update call record for SID ${callSid}:`, error);
  }
}

/**
 * Handle Twilio recording callback
 */
async function handleRecordingCallback(body) {
  const callSid = body.CallSid;
  const recordingSid = body.RecordingSid;
  const recordingUrl = body.RecordingUrl;
  const recordingStatus = body.RecordingStatus;
  const recordingDuration = body.RecordingDuration;

  if (!callSid || !recordingSid) {
    console.warn('⚠️ Missing CallSid or RecordingSid in recording callback');
    return;
  }

  try {
    // Find the call record by Twilio Call SID
    const callRecord = await findCallByTwilioSid(callSid);
    
    if (!callRecord) {
      console.warn(`⚠️ No call record found for Twilio SID: ${callSid}`);
      return;
    }

    // Prepare recording updates
    const updates = {
      recording: {
        recordingSid: recordingSid,
        recordingUrl: recordingUrl,
        status: recordingStatus,
        durationSec: recordingDuration ? parseInt(recordingDuration) : undefined,
      }
    };

    // Update the call record
    await updateCallRecord(callRecord.callId, updates);
    
    console.log(`✅ Updated call ${callRecord.callId} with recording: ${recordingSid}`);
  } catch (error) {
    console.error(`❌ Failed to update call record with recording for SID ${callSid}:`, error);
  }
}

