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
    console.log('💬 ElevenLabs Conversations API - Starting...');
    
    // Validate environment variables
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ Missing ElevenLabs API key');
      return res.status(500).json({
        error: 'ElevenLabs configuration missing',
        details: 'ELEVENLABS_API_KEY environment variable not set'
      });
    }

    // Get query parameters
    const { limit = 10, cursor, agent_id } = req.query;
    
    console.log('📋 Fetching conversations with params:', { limit, cursor, agent_id });

    // Fetch conversations from ElevenLabs
    const conversationsResponse = await client.conversationalAi.conversations.list({
      limit: parseInt(limit),
      cursor: cursor || undefined,
      ...(agent_id && { agentId: agent_id })
    });

    console.log('✅ ElevenLabs conversations fetched:', {
      count: conversationsResponse.conversations?.length || 0,
      hasMore: conversationsResponse.hasMore
    });

    return res.status(200).json({
      success: true,
      conversations: conversationsResponse.conversations || [],
      hasMore: conversationsResponse.hasMore || false,
      nextCursor: conversationsResponse.nextCursor || null,
      count: conversationsResponse.conversations?.length || 0,
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
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to fetch ElevenLabs conversations',
        details: error.message,
        type: 'network_error'
      });
    }

    // Handle unknown errors
    return res.status(500).json({
      error: 'Internal server error in ElevenLabs integration',
      details: 'An unexpected error occurred',
      type: 'unknown_error'
    });
  }
}