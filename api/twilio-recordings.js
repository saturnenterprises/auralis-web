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
    console.log('🎵 Twilio Recordings API - Starting...');
    
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
      callSid,
      startTime,
      endTime
    } = req.query;

    const client = getTwilioClient();
    
    console.log('📋 Fetching Twilio recordings with params:', { 
      limit: parseInt(limit), 
      callSid,
      startTime,
      endTime 
    });

    // Build query options
    const queryOptions = {
      limit: parseInt(limit),
      ...(callSid && { callSid }),
      ...(startTime && { dateCreated: new Date(startTime) }),
      ...(endTime && { dateCreatedBefore: new Date(endTime) })
    };

    // Fetch recordings from Twilio
    const recordings = await client.recordings.list(queryOptions);

    console.log('✅ Twilio recordings fetched:', {
      count: recordings.length
    });

    // Transform recordings to match our expected format
    const transformedRecordings = recordings.map(recording => {
      // Construct recording URL
      const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}`;
      const recordingUrl = `${baseUrl}/Recordings/${recording.sid}.mp3`;
      
      return {
        recordingSid: recording.sid,
        callSid: recording.callSid,
        recordingUrl,
        duration: recording.duration ? parseInt(recording.duration) : 0,
        status: recording.status,
        channels: recording.channels || 1,
        source: recording.source || 'RecordVerb',
        createdAt: recording.dateCreated ? recording.dateCreated.toISOString() : new Date().toISOString(),
        updatedAt: recording.dateUpdated ? recording.dateUpdated.toISOString() : new Date().toISOString(),
        // Additional recording metadata
        metadata: {
          accountSid: recording.accountSid,
          apiVersion: recording.apiVersion,
          price: recording.price,
          priceUnit: recording.priceUnit,
          uri: recording.uri,
          mediaUrl: recording.mediaUrl,
          encryptionDetails: recording.encryptionDetails
        }
      };
    });

    return res.status(200).json({
      success: true,
      recordings: transformedRecordings,
      count: transformedRecordings.length,
      timestamp: new Date().toISOString(),
      metadata: {
        hasMore: recordings.length === parseInt(limit),
        totalFetched: transformedRecordings.length,
        queryParams: queryOptions
      }
    });

  } catch (error) {
    console.error('❌ Error in Twilio recordings API:', error);
    
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
        error: 'Failed to fetch Twilio recordings',
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