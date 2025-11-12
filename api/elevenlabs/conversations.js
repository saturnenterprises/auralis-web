import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Initialize ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

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
    console.log('🔍 ElevenLabs Conversations API - Starting...');
    
    // Validate environment variables
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ Missing ElevenLabs API key');
      return res.status(500).json({
        error: 'ElevenLabs configuration missing',
        details: 'API key not configured'
      });
    }

    // Get query parameters
    const { agentId, pageSize = 20 } = req.query;
    
    console.log('📋 Fetching conversations with params:', { agentId, pageSize });

    // Fetch conversations from ElevenLabs
    const conversations = await client.conversationalAi.conversations.list({
      agentId: agentId || undefined,
      pageSize: parseInt(pageSize)
    });

    console.log('✅ Successfully fetched conversations:', conversations.conversations?.length || 0);

    return res.status(200).json({
      success: true,
      conversations: conversations.conversations || [],
      totalCount: conversations.totalCount || 0,
      hasMore: conversations.hasMore || false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in ElevenLabs conversations API:', error);
    
    // Handle specific ElevenLabs API errors
    if (error.response) {
      console.error('ElevenLabs API Error:', error.response.data);
      return res.status(error.response.status || 500).json({
        error: 'ElevenLabs API error',
        details: error.response.data?.message || error.message,
        status: error.response.status
      });
    }

    // Handle network or other errors
    return res.status(500).json({
      error: 'Failed to fetch conversations',
      details: error.message || 'Unknown error occurred',
      type: 'network_error'
    });
  }
}