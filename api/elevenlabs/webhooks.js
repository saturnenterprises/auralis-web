// ElevenLabs webhook handler for call status updates
import { updateCallRecord, findCallByElevenLabsId } from '../../lib/serverCallsService.js';

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
    const webhookType = req.query.type || 'call-status'; // call-status, conversation-events, etc.

    console.log(`📞 ElevenLabs ${webhookType} webhook received:`, {
      callId: body.callId || body.call_id,
      status: body.status || body.call_status,
      timestamp: new Date().toISOString()
    });

    if (webhookType === 'call-status') {
      await handleCallStatusUpdate(body);
    } else if (webhookType === 'conversation-events') {
      await handleConversationEvents(body);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing ElevenLabs webhook:', error);
    // Still return 200 to prevent ElevenLabs from retrying
    res.status(200).send('OK');
  }
}

/**
 * Handle ElevenLabs call status updates
 */
async function handleCallStatusUpdate(body) {
  const callId = body.callId || body.call_id;
  const status = body.status || body.call_status;
  const duration = body.duration;
  const endReason = body.end_reason;
  const errorCode = body.error_code;
  const errorMessage = body.error_message;

  if (!callId) {
    console.warn('⚠️ No callId in ElevenLabs status update');
    return;
  }

  try {
    // Find the call record by ElevenLabs call ID
    const callRecord = await findCallByElevenLabsId(callId);
    
    if (!callRecord) {
      console.warn(`⚠️ No call record found for ElevenLabs call ID: ${callId}`);
      return;
    }

    // Map ElevenLabs status to our status
    const statusMap = {
      'initiated': 'initiating',
      'ringing': 'ringing',
      'in_progress': 'in-progress',
      'completed': 'completed',
      'failed': 'failed',
      'no_answer': 'no-answer',
      'busy': 'failed',
      'cancelled': 'failed',
    };

    const mappedStatus = statusMap[status] || 'initiating';

    // Prepare updates
    const updates = {
      status: mappedStatus,
      elevenlabsStatus: status,
      updatedAt: new Date().toISOString(),
    };

    // Add timing information if available
    if (duration) {
      updates.durationSec = parseInt(duration);
    }
    if (endReason) {
      updates.endReason = endReason;
    }
    if (errorCode) {
      updates.errorCode = errorCode;
    }
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    // Add end time for completed/failed calls
    if (mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'no-answer') {
      updates.endedAt = new Date().toISOString();
    }

    // Update the call record
    await updateCallRecord(callRecord.callId, updates);
    
    console.log(`✅ Updated call ${callRecord.callId} with ElevenLabs status: ${mappedStatus}`);
  } catch (error) {
    console.error(`❌ Failed to update call record for ElevenLabs call ID ${callId}:`, error);
  }
}

/**
 * Handle ElevenLabs conversation events
 */
async function handleConversationEvents(body) {
  const callId = body.callId || body.call_id;
  const eventType = body.event_type;
  const message = body.message;
  const timestamp = body.timestamp;

  if (!callId) {
    console.warn('⚠️ No callId in ElevenLabs conversation event');
    return;
  }

  try {
    // Find the call record
    const callRecord = await findCallByElevenLabsId(callId);
    
    if (!callRecord) {
      console.warn(`⚠️ No call record found for ElevenLabs call ID: ${callId}`);
      return;
    }

    // Add conversation event to call logs
    await addCallLog(callRecord.callId, {
      type: 'conversation_event',
      message: `ElevenLabs event: ${eventType}`,
      data: {
        eventType,
        message,
        timestamp,
        source: 'elevenlabs'
      }
    });

    console.log(`✅ Added conversation event for call ${callRecord.callId}: ${eventType}`);
  } catch (error) {
    console.error(`❌ Failed to add conversation event for call ID ${callId}:`, error);
  }
}
