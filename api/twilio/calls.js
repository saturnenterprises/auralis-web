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
    console.log('📞 Twilio Calls API - Starting...');
    
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
      pageSize = 20, 
      status, 
      dateAfter, 
      dateBefore,
      to,
      from,
      callSid
    } = req.query;

    console.log('📋 Fetching calls with params:', { 
      pageSize, status, dateAfter, dateBefore, to, from, callSid 
    });

    // Build Twilio query options
    const queryOptions = {
      limit: parseInt(pageSize)
    };

    // Add filters if provided
    if (status) queryOptions.status = status;
    if (dateAfter) queryOptions.startTimeAfter = new Date(dateAfter);
    if (dateBefore) queryOptions.startTimeBefore = new Date(dateBefore);
    if (to) queryOptions.to = to;
    if (from) queryOptions.from = from;

    let calls;
    
    if (callSid) {
      // Fetch specific call details
      console.log('📋 Fetching specific call:', callSid);
      const call = await client.calls(callSid).fetch();
      
      return res.status(200).json({
        success: true,
        call,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fetch call list
      calls = await client.calls.list(queryOptions);
    }

    console.log('✅ Successfully fetched calls:', calls.length);

    // Transform Twilio call data for consistency
    const transformedCalls = calls.map(call => ({
      callSid: call.sid,
      to: call.to,
      from: call.from,
      status: call.status,
      direction: call.direction,
      startTime: call.startTime,
      endTime: call.endTime,
      duration: call.duration,
      price: call.price,
      priceUnit: call.priceUnit,
      uri: call.uri,
      accountSid: call.accountSid,
      parentCallSid: call.parentCallSid,
      phoneNumberSid: call.phoneNumberSid,
      answeredBy: call.answeredBy,
      forwardedFrom: call.forwardedFrom,
      groupSid: call.groupSid,
      callerName: call.callerName,
      queueTime: call.queueTime,
      trunkSid: call.trunkSid
    }));

    return res.status(200).json({
      success: true,
      calls: transformedCalls,
      totalCount: transformedCalls.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Twilio calls API:', error);
    
    // Handle specific Twilio API errors
    if (error.status) {
      console.error('Twilio API Error:', error.message);
      
      // Handle 404 - call not found
      if (error.status === 404) {
        return res.status(404).json({
          error: 'Call not found',
          details: 'The requested call does not exist',
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
      error: 'Failed to fetch calls',
      details: error.message || 'Unknown error occurred',
      type: 'network_error'
    });
  }
}