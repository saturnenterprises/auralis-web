import express from 'express';
import cors from 'cors';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import expressRaw from 'express';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(expressRaw.urlencoded({ extended: true }));

// Initialize ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// ElevenLabs API endpoint
app.post('/api/elevenlabs-call', async (req, res) => {
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
      const { createCallRecord } = await import('./lib/serverCallsService.js');
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
        const { createCallRecord } = await import('./lib/serverCallsService.js');
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
      const { updateCallRecord } = await import('./lib/serverCallsService.js');
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
});

// Twilio Status Callback (configure this URL in Twilio when possible)
app.post('/api/twilio/status-callback', async (req, res) => {
  try {
    const body = req.body || {};
    // Common Twilio fields
    const callSid = body.CallSid || body.CallSid?.toString();
    const callStatus = (body.CallStatus || '').toString();
    const fromNumber = body.From || '';
    const toNumber = body.To || '';
    const startTime = body.Timestamp || body.StartTime || undefined;
    const endTime = body.EndTime || undefined;
    const duration = body.CallDuration || body.Duration || undefined;

    console.log('[Twilio status-callback]', { callSid, callStatus, fromNumber, toNumber, startTime, endTime, duration });
    
    // Forward to the webhook handler
    const webhookHandler = require('./api/twilio/webhooks').default;
    req.query = { type: 'status' };
    await webhookHandler(req, res);
  } catch (err) {
    console.error('status-callback error', err);
    res.status(200).send('OK');
  }
});

// Twilio Recording Callback
app.post('/api/twilio/recording-callback', async (req, res) => {
  try {
    const body = req.body || {};
    const recordingSid = body.RecordingSid || '';
    const recordingUrl = body.RecordingUrl || '';
    const callSid = body.CallSid || '';
    const recordingStatus = body.RecordingStatus || '';
    const recordingDuration = body.RecordingDuration || '';
    console.log('[Twilio recording-callback]', { recordingSid, recordingUrl, callSid, recordingStatus, recordingDuration });
    
    // Forward to the webhook handler
    const webhookHandler = require('./api/twilio/webhooks').default;
    req.query = { type: 'recording' };
    await webhookHandler(req, res);
  } catch (err) {
    console.error('recording-callback error', err);
    res.status(200).send('OK');
  }
});

// ElevenLabs Conversations - list
app.get('/api/elevenlabs/conversations', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY missing' });
    }
    const { agentId, pageSize } = req.query;
    const response = await client.conversationalAi.conversations.list({
      agentId: agentId ? String(agentId) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list conversations', details: err?.message });
  }
});

// ElevenLabs Conversations - get by id
app.get('/api/elevenlabs/conversations/:id', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY missing' });
    }
    const convo = await client.conversationalAi.conversations.get(req.params.id);
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get conversation', details: err?.message });
  }
});

// Twilio Calls - list recent via REST (no SDK)
app.get('/api/twilio/calls', async (req, res) => {
  try {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return res.status(500).json({ error: 'Twilio credentials missing' });
    }
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 50;
    const url = new URL(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`);
    url.searchParams.set('PageSize', String(pageSize));
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'Twilio API error', details: text });
    }
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Twilio calls', details: err?.message });
  }
});

// Twilio Recordings for a CallSid
app.get('/api/twilio/recordings', async (req, res) => {
  try {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    const { callSid } = req.query;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return res.status(500).json({ error: 'Twilio credentials missing' });
    }
    if (!callSid) {
      return res.status(400).json({ error: 'callSid is required' });
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}/Recordings.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'Twilio API error', details: text });
    }
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recordings', details: err?.message });
  }
});

// Firebase Admin SDK test endpoint
app.get('/api/test-firebase', async (req, res) => {
  try {
    const { isInitialized } = await import('./lib/firebaseAdmin.js');
    
    if (isInitialized()) {
      console.log('✅ Firebase Admin SDK is properly initialized');
      return res.status(200).json({
        success: true,
        message: 'Firebase Admin SDK is properly initialized',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Firebase Admin SDK is not initialized');
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin SDK is not initialized',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error testing Firebase Admin SDK:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing Firebase Admin SDK',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log(`📞 ElevenLabs API endpoint: http://localhost:${PORT}/api/elevenlabs-call`);
  console.log(`🔥 Firebase test endpoint: http://localhost:${PORT}/api/test-firebase`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
