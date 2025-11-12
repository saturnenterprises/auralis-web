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
    console.log('🤖 ElevenLabs Agents API - Starting...');
    
    // Validate environment variables
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ Missing ElevenLabs API key');
      return res.status(500).json({
        error: 'ElevenLabs configuration missing',
        details: 'API key not configured'
      });
    }

    // Get query parameters
    const { agentId } = req.query;
    
    if (agentId) {
      // Fetch specific agent details
      console.log('📋 Fetching agent details for ID:', agentId);
      
      const agent = await client.conversationalAi.agents.get(agentId);
      
      console.log('✅ Successfully fetched agent details');
      
      return res.status(200).json({
        success: true,
        agent,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fetch all agents
      console.log('📋 Fetching all agents...');
      
      const agents = await client.conversationalAi.agents.list({});
      
      console.log('✅ Successfully fetched agents:', agents.agents?.length || 0);
      
      return res.status(200).json({
        success: true,
        agents: agents.agents || [],
        totalCount: agents.totalCount || 0,
        hasMore: agents.hasMore || false,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error in ElevenLabs agents API:', error);
    
    // Handle specific ElevenLabs API errors
    if (error.response) {
      console.error('ElevenLabs API Error:', error.response.data);
      
      // Handle 404 - agent not found
      if (error.response.status === 404) {
        return res.status(404).json({
          error: 'Agent not found',
          details: 'The requested agent does not exist',
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
      error: 'Failed to fetch agent(s)',
      details: error.message || 'Unknown error occurred',
      type: 'network_error'
    });
  }
}