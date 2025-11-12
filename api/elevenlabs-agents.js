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
        details: 'ELEVENLABS_API_KEY environment variable not set'
      });
    }

    console.log('📋 Fetching ElevenLabs agents...');

    // Fetch agents from ElevenLabs
    const agentsResponse = await client.conversationalAi.agents.list();

    console.log('✅ ElevenLabs agents fetched:', {
      count: agentsResponse.agents?.length || 0
    });

    // Transform agents to match our expected format
    const transformedAgents = (agentsResponse.agents || []).map(agent => ({
      id: agent.agentId,
      agentId: agent.agentId,
      name: agent.name,
      description: agent.prompt || 'ElevenLabs AI Agent',
      voiceId: agent.voice?.voiceId,
      voiceSettings: agent.voice ? {
        stability: agent.voice.stability,
        similarity_boost: agent.voice.similarityBoost,
        style: agent.voice.style,
        use_speaker_boost: agent.voice.useSpeakerBoost
      } : null,
      status: 'active', // ElevenLabs doesn't provide status, assume active
      conversationConfig: {
        systemPrompt: agent.prompt || '',
        temperature: agent.llmSettings?.temperature || 0.7,
        maxTokens: agent.llmSettings?.maxTokens || 500,
        model: agent.llmSettings?.model || 'gpt-4'
      },
      metadata: {
        language: agent.language || 'en',
        createdAt: agent.createdAt || new Date().toISOString(),
        updatedAt: agent.updatedAt || new Date().toISOString()
      }
    }));

    return res.status(200).json({
      success: true,
      agents: transformedAgents,
      count: transformedAgents.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in ElevenLabs agents API:', error);
    
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
        error: 'Failed to fetch ElevenLabs agents',
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