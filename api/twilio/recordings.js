import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
        details: 'Account SID or Auth Token not configured'
      });
    }

    // Get query parameters
    const { 
      callSid,
      recordingSid,
      pageSize = 20,
      dateAfter,
      dateBefore
    } = req.query;

    console.log('📋 Fetching recordings with params:', { 
      callSid, recordingSid, pageSize, dateAfter, dateBefore 
    });

    if (recordingSid) {
      // Fetch specific recording details
      console.log('📋 Fetching specific recording:', recordingSid);
      
      const recording = await client.recordings(recordingSid).fetch();
      
      return res.status(200).json({
        success: true,
        recording: {
          sid: recording.sid,
          accountSid: recording.accountSid,
          callSid: recording.callSid,
          conferenceSid: recording.conferenceSid,
          status: recording.status,
          dateCreated: recording.dateCreated,
          dateUpdated: recording.dateUpdated,
          startTime: recording.startTime,
          duration: recording.duration,
          channels: recording.channels,
          source: recording.source,
          errorCode: recording.errorCode,
          uri: recording.uri,
          encryptionDetails: recording.encryptionDetails,
          priceUnit: recording.priceUnit,
          price: recording.price,
          mediaUrl: recording.mediaUrl,
          links: recording.links
        },
        timestamp: new Date().toISOString()
      });
    }

    // Build query options for recordings list
    const queryOptions = {
      limit: parseInt(pageSize)
    };

    // Add filters if provided
    if (callSid) queryOptions.callSid = callSid;
    if (dateAfter) queryOptions.dateCreatedAfter = new Date(dateAfter);
    if (dateBefore) queryOptions.dateCreatedBefore = new Date(dateBefore);

    // Fetch recordings list
    const recordings = await client.recordings.list(queryOptions);

    console.log('✅ Successfully fetched recordings:', recordings.length);

    // Transform recordings data
    const transformedRecordings = recordings.map(recording => ({
      sid: recording.sid,
      accountSid: recording.accountSid,
      callSid: recording.callSid,
      conferenceSid: recording.conferenceSid,
      status: recording.status,
      dateCreated: recording.dateCreated,
      dateUpdated: recording.dateUpdated,
      startTime: recording.startTime,
      duration: recording.duration,
      channels: recording.channels,
      source: recording.source,
      errorCode: recording.errorCode,
      uri: recording.uri,
      encryptionDetails: recording.encryptionDetails,
      priceUnit: recording.priceUnit,
      price: recording.price,
      mediaUrl: recording.mediaUrl,
      links: recording.links
    }));

    return res.status(200).json({
      success: true,
      recordings: transformedRecordings,
      totalCount: transformedRecordings.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Twilio recordings API:', error);
    
    // Handle specific Twilio API errors
    if (error.status) {
      console.error('Twilio API Error:', error.message);
      
      // Handle 404 - recording not found
      if (error.status === 404) {
        return res.status(404).json({
          error: 'Recording not found',
          details: 'The requested recording does not exist',
          status: 404
        });
      }

      return res.status(error.status || 500).json({
        error: 'Twilio API error',
        details: error.message || 'Unknown Twilio error',
        status: error.status
      });
    }

    // Handle network or other errors
    return res.status(500).json({
      error: 'Failed to fetch recordings',
      details: error.message || 'Unknown error occurred',
      type: 'network_error'
    });
  }
}