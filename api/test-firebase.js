// Test API endpoint for Firebase integration
import { createCallRecord, updateCallRecord, getCallRecord, getRecentCalls, getCallStatistics, upsertCalls } from '../lib/serverCallsService.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'create-test-call':
        return await handleCreateTestCall(req, res);
      
      case 'get-recent-calls':
        return await handleGetRecentCalls(req, res);
      
      case 'get-statistics':
        return await handleGetStatistics(req, res);
      
      case 'update-call':
        return await handleUpdateCall(req, res);
      
      case 'test-admin-sdk':
        return await handleTestAdminSDK(req, res);
      
      default:
        return res.status(400).json({
          error: 'Invalid action',
          availableActions: ['create-test-call', 'get-recent-calls', 'get-statistics', 'update-call', 'test-admin-sdk']
        });
    }
  } catch (error) {
    console.error('❌ Test API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleCreateTestCall(req, res) {
  try {
    const testCallId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testCallRecord = {
      callId: testCallId,
      agentId: 'test-agent',
      toNumber: '+1234567890',
      fromNumber: '+0987654321',
      status: 'initiating',
      startedAt: new Date().toISOString(),
    };

    await createCallRecord(testCallRecord);
    
    console.log('✅ Test call created:', testCallId);
    
    return res.status(200).json({
      success: true,
      message: 'Test call created successfully',
      callId: testCallId,
      data: testCallRecord
    });
  } catch (error) {
    console.error('❌ Failed to create test call:', error);
    return res.status(500).json({
      error: 'Failed to create test call',
      details: error.message
    });
  }
}

async function handleGetRecentCalls(req, res) {
  try {
    const { limit = 20 } = req.query;
    const calls = await getRecentCalls(parseInt(limit));
    
    console.log(`✅ Retrieved ${calls.length} recent calls`);
    
    return res.status(200).json({
      success: true,
      message: `Retrieved ${calls.length} recent calls`,
      calls: calls,
      count: calls.length
    });
  } catch (error) {
    console.error('❌ Failed to get recent calls:', error);
    return res.status(500).json({
      error: 'Failed to get recent calls',
      details: error.message
    });
  }
}

async function handleGetStatistics(req, res) {
  try {
    const stats = await getCallStatistics();
    
    console.log('✅ Retrieved call statistics:', stats);
    
    return res.status(200).json({
      success: true,
      message: 'Call statistics retrieved successfully',
      statistics: stats
    });
  } catch (error) {
    console.error('❌ Failed to get statistics:', error);
    return res.status(500).json({
      error: 'Failed to get statistics',
      details: error.message
    });
  }
}

async function handleTestAdminSDK(req, res) {
  try {
    const { isInitialized } = await import('../lib/firebaseAdmin.js');
    
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
}
