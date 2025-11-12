import { upsertCalls } from '../lib/serverCallsService.js';
import twilio from 'twilio';

// Initialize Twilio client
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  return twilio(accountSid, authToken);
}

// Map Twilio call to our CallRecord format
function mapTwilioCallToRecord(call) {
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

  const mappedStatus = statusMap[call.status] || 'queued';

  return {
    callId: `twilio-${call.sid}`,
    twilioCallSid: call.sid,
    agentId: '', // Will be empty for Twilio-originated calls
    toNumber: call.to || '',
    fromNumber: call.from || '',
    status: mappedStatus,
    startedAt: call.startTime ? call.startTime.toISOString() : undefined,
    endedAt: call.endTime ? call.endTime.toISOString() : undefined,
    durationSec: call.duration ? parseInt(call.duration) : undefined,
    createdAt: call.dateCreated ? call.dateCreated.toISOString() : new Date().toISOString(),
    updatedAt: call.dateUpdated ? call.dateUpdated.toISOString() : new Date().toISOString(),
  };
}

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
    console.log('🔄 Starting call sync from Twilio to Firestore...');
    
    // Validate environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Missing Twilio credentials');
      return res.status(500).json({
        error: 'Twilio configuration missing',
        details: 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables not set'
      });
    }

    const { 
      limit = 50, 
      daysBack = 1,
      status,
      direction = 'outbound'
    } = req.body;

    const client = getTwilioClient();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log('📋 Fetching Twilio calls with params:', { 
      limit, 
      daysBack,
      status, 
      direction,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Build query options
    const queryOptions = {
      limit: parseInt(limit),
      startTimeAfter: startDate,
      startTimeBefore: endDate,
      ...(status && { status }),
      ...(direction && { direction })
    };

    // Fetch calls from Twilio
    const calls = await client.calls.list(queryOptions);

    console.log(`✅ Fetched ${calls.length} calls from Twilio`);

    // Transform calls to our format
    const transformedCalls = calls.map(mapTwilioCallToRecord);

    // Upsert to Firestore
    await upsertCalls(transformedCalls);

    console.log(`✅ Successfully synced ${transformedCalls.length} calls to Firestore`);

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${transformedCalls.length} calls to Firestore`,
      syncedCount: transformedCalls.length,
      timestamp: new Date().toISOString(),
      metadata: {
        queryOptions,
        calls: transformedCalls.map(call => ({
          callId: call.callId,
          status: call.status,
          toNumber: call.toNumber,
          fromNumber: call.fromNumber,
          durationSec: call.durationSec
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error in call sync API:', error);
    
    // Handle specific Twilio API errors
    if (error.code) {
      console.error('Twilio API Error:', error);
      return res.status(error.status || 500).json({
        error: 'Twilio API error',
        details: error.message,
        code: error.code,
        moreInfo: error.moreInfo
      });
    }

    // Handle authentication errors
    if (error.message?.includes('credentials')) {
      return res.status(401).json({
        error: 'Twilio authentication failed',
        details: 'Please check your Twilio credentials',
        type: 'auth_error'
      });
    }

    // Handle network or other errors
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to sync calls',
        details: error.message,
        type: 'network_error'
      });
    }

    // Handle unknown errors
    return res.status(500).json({
      error: 'Internal server error in call sync',
      details: 'An unexpected error occurred',
      type: 'unknown_error'
    });
  }
}

