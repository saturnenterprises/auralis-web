import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createCallRecord, updateCallRecord } from '../lib/serverCallsService.js';

// Initialize ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

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
    console.log('🚀 ElevenLabs Call API - Starting...');
    
    // Validate environment variables
    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_AGENT_ID || !process.env.ELEVENLABS_PHONE_NUMBER_ID) {
      console.error('❌ Missing ElevenLabs configuration');
      return res.status(500).json({
        error: 'ElevenLabs configuration missing',
        details: 'Required environment variables not set'
      });
    }

    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === '') {
      console.error('❌ Phone number validation failed');
      return res.status(400).json({
        error: 'Phone number is required',
        details: 'Please provide a valid phone number'
      });
    }

    // Clean and validate phone number format
    const cleanPhoneNumber = phoneNumber.trim();
    console.log('✅ Phone number validated:', cleanPhoneNumber);

    // Use the ElevenLabs phone number ID from environment
    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
    console.log('✅ Using ElevenLabs phone number ID:', phoneNumberId);

    // Generate a unique call ID first
    const callId = `elevenlabs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Generated call ID:', callId);

    // Create call record in Firestore immediately
    try {
      const callRecord = {
        callId: callId,
        agentId: process.env.ELEVENLABS_AGENT_ID || '',
        toNumber: cleanPhoneNumber,
        fromNumber: process.env.TWILIO_NUMBER || undefined,
        status: 'initiating',
        startedAt: new Date().toISOString(),
      };
      
      await createCallRecord(callRecord);
      console.log('✅ Call record created in Firestore:', callId);
    } catch (firestoreError) {
      console.error('⚠️ Failed to create call record in Firestore:', firestoreError);
      console.error('Firestore Error Details:', {
        message: firestoreError.message,
        code: firestoreError.code,
        stack: firestoreError.stack
      });
      // Continue with call even if Firestore write fails
    }

    // Make the outbound call using ElevenLabs Twilio integration
    console.log('📞 Initiating ElevenLabs outbound call...');
    let callResponse;
    
    try {
      callResponse = await client.conversationalAi.twilio.outboundCall({
        agentId: process.env.ELEVENLABS_AGENT_ID,
        agentPhoneNumberId: phoneNumberId,
        toNumber: cleanPhoneNumber
      });

      console.log('✅ ElevenLabs call initiated successfully:', {
        callId: callResponse.callId || callId,
        status: callResponse.status || 'initiated'
      });
    } catch (elevenlabsError) {
      console.error('❌ ElevenLabs call failed:', elevenlabsError);
      
      // Update call status to failed
      try {
        await createCallRecord({
          callId: callId,
          agentId: process.env.ELEVENLABS_AGENT_ID || '',
          toNumber: cleanPhoneNumber,
          fromNumber: process.env.TWILIO_NUMBER || undefined,
          status: 'failed',
          errorCode: elevenlabsError.code || 'ELEVENLABS_ERROR',
          errorMessage: elevenlabsError.message || 'Unknown ElevenLabs error',
          endedAt: new Date().toISOString(),
        });
      } catch (updateError) {
        console.error('⚠️ Failed to update call status to failed:', updateError);
      }
      
      throw elevenlabsError;
    }

    // Update call record with ElevenLabs response data
    try {
      const updates = {
        status: 'calling',
        elevenlabsCallId: callResponse.callId || callId,
        elevenlabsStatus: callResponse.status || 'initiated',
        updatedAt: new Date().toISOString(),
      };
      
      await updateCallRecord(callId, updates);
      console.log('✅ Call record updated with ElevenLabs data:', callId);
      console.log('📊 ElevenLabs Response Data:', {
        callId: callResponse.callId,
        status: callResponse.status,
        updates: updates
      });
    } catch (updateError) {
      console.error('⚠️ Failed to update call record with ElevenLabs data:', updateError);
      console.error('Update Error Details:', {
        message: updateError.message,
        code: updateError.code,
        stack: updateError.stack
      });
    }

    return res.status(200).json({
      success: true,
      callId: callId, // Use our generated call ID
      elevenlabsCallId: callResponse.callId || callId,
      status: 'calling', // Use our status
      elevenlabsStatus: callResponse.status || 'initiated',
      message: 'ElevenLabs call initiated successfully',
      agentName: 'Auralis AI',
      agentId: process.env.ELEVENLABS_AGENT_ID,
      fromNumber: process.env.TWILIO_NUMBER || undefined,
      phoneNumber: cleanPhoneNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in ElevenLabs call API:', error);
    
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
        error: 'Failed to make ElevenLabs call',
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
