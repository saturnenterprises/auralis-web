import twilio from 'twilio';

// Initialize Twilio client
let twilioClient;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📞 Twilio Calls API - Starting...');
    
    // Validate environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Missing Twilio credentials');
      return res.status(500).json({
        error: 'Twilio configuration missing',
        details: 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables not set'
      });
    }

    // Get query parameters
    const { 
      limit = 20, 
      status, 
      startTime, 
      endTime,
      direction = 'outbound'
    } = req.query;

    const client = getTwilioClient();
    
    console.log('📋 Fetching Twilio calls with params:', { 
      limit: parseInt(limit), 
      status, 
      direction,
      startTime,
      endTime 
    });

    // Build query options
    const queryOptions = {
      limit: parseInt(limit),
      ...(status && { status }),
      ...(direction && { direction }),
      ...(startTime && { startTime: new Date(startTime) }),
      ...(endTime && { endTime: new Date(endTime) })
    };

    // Fetch calls from Twilio
    const calls = await client.calls.list(queryOptions);

    console.log('✅ Twilio calls fetched:', {
      count: calls.length
    });

    // Transform calls to match our expected format
    const transformedCalls = calls.map(call => ({
      callId: call.sid,
      toNumber: call.to,
      fromNumber: call.from,
      status: call.status,
      durationSec: call.duration ? parseInt(call.duration) : 0,
      createdAt: call.dateCreated ? call.dateCreated.toISOString() : new Date().toISOString(),
      updatedAt: call.dateUpdated ? call.dateUpdated.toISOString() : new Date().toISOString(),
      cost: call.price ? Math.abs(parseFloat(call.price)) : 0,
      direction: call.direction,
      // Additional Twilio-specific fields
      metadata: {
        parentCallSid: call.parentCallSid,
        phoneNumberSid: call.phoneNumberSid,
        apiVersion: call.apiVersion,
        forwardedFrom: call.forwardedFrom,
        callerName: call.callerName,
        uri: call.uri,
        subresourceUris: call.subresourceUris
      }
    }));

    return res.status(200).json({
      success: true,
      calls: transformedCalls,
      count: transformedCalls.length,
      timestamp: new Date().toISOString(),
      metadata: {
        hasMore: calls.length === parseInt(limit), // Approximate pagination indicator
        totalFetched: transformedCalls.length,
        queryParams: queryOptions
      }
    });

  } catch (error) {
    console.error('❌ Error in Twilio calls API:', error);
    
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
        error: 'Failed to fetch Twilio calls',
        details: error.message,
        type: 'network_error'
      });
    }

    // Handle unknown errors
    return res.status(500).json({
      error: 'Internal server error in Twilio integration',
      details: 'An unexpected error occurred',
      type: 'unknown_error'
    });
  }
}