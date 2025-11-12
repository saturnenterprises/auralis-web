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
    console.log('🔍 ElevenLabs Conversation Details API - Starting...');
    
    // Validate environment variables
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ Missing ElevenLabs API key');
      return res.status(500).json({
        error: 'ElevenLabs configuration missing',
        details: 'API key not configured'
      });
    }

    // Get conversation ID from URL parameters
    const { id: conversationId } = req.query;
    
    if (!conversationId) {
      return res.status(400).json({
        error: 'Conversation ID is required',
        details: 'Please provide a valid conversation ID'
      });
    }

    console.log('📋 Fetching conversation details for ID:', conversationId);

    // Fetch conversation details from ElevenLabs
    const conversation = await client.conversationalAi.conversations.get(conversationId);

    console.log('✅ Successfully fetched conversation details');

    return res.status(200).json({
      success: true,
      conversation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in ElevenLabs conversation details API:', error);
    
    // Handle specific ElevenLabs API errors
    if (error.response) {
      console.error('ElevenLabs API Error:', error.response.data);
      
      // Handle 404 - conversation not found
      if (error.response.status === 404) {
        return res.status(404).json({
          error: 'Conversation not found',
          details: 'The requested conversation does not exist',
          status: 404
        });
      }

      return res.status(error.response.status || 500).json({
        error: 'ElevenLabs API error',
        details: error.response.data?.message || error.message,
        status: error.response.status
      });
    }

    // Handle network or other errors
    return res.status(500).json({
      error: 'Failed to fetch conversation details',
      details: error.message || 'Unknown error occurred',
      type: 'network_error'
    });
  }
}