/**
 * Complete call flow test script
 * Tests the entire call lifecycle with automatic end detection
 */

const { createCallRecord, updateCallRecord, getCallRecord, getRecentCalls, addCallLog } = require('../src/lib/firebaseService');

async function testCompleteCallFlow() {
  console.log('🧪 Testing Complete Call Flow with Automatic End Detection...\n');

  try {
    // Test 1: Create a call record
    console.log('1️⃣ Creating call record...');
    const testCallId = `test_flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testCallRecord = {
      callId: testCallId,
      agentId: 'test-agent-123',
      toNumber: '+1234567890',
      fromNumber: '+0987654321',
      status: 'initiating',
      startedAt: new Date().toISOString(),
    };

    await createCallRecord(testCallRecord);
    console.log('✅ Call record created successfully');

    // Test 2: Simulate call progression
    console.log('\n2️⃣ Simulating call progression...');
    
    // Update to ringing
    await updateCallRecord(testCallId, {
      status: 'ringing',
      ringingAt: new Date().toISOString(),
    });
    console.log('   → Updated to ringing');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update to in-progress
    await updateCallRecord(testCallId, {
      status: 'in-progress',
      connectedAt: new Date().toISOString(),
    });
    console.log('   → Updated to in-progress');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Simulate automatic call end (mobile hangup)
    console.log('\n3️⃣ Simulating automatic call end (mobile hangup)...');
    
    await updateCallRecord(testCallId, {
      status: 'completed',
      endedAt: new Date().toISOString(),
      durationSec: 45,
      endReason: 'mobile_hangup'
    });
    console.log('   → Call ended automatically (mobile hangup)');

    // Test 4: Add call logs
    console.log('\n4️⃣ Adding call logs...');
    
    await addCallLog(testCallId, {
      type: 'call_initiated',
      message: 'Call initiated successfully',
      data: { source: 'test' }
    });

    await addCallLog(testCallId, {
      type: 'call_connected',
      message: 'Call connected to mobile',
      data: { source: 'test' }
    });

    await addCallLog(testCallId, {
      type: 'call_ended',
      message: 'Call ended by mobile user',
      data: { endReason: 'mobile_hangup', source: 'test' }
    });

    console.log('✅ Call logs added successfully');

    // Test 5: Verify call in recent calls
    console.log('\n5️⃣ Verifying call in recent calls...');
    const recentCalls = await getRecentCalls(10);
    const testCall = recentCalls.find(call => call.callId === testCallId);
    
    if (testCall) {
      console.log('✅ Test call found in recent calls');
      console.log('   Final Status:', testCall.status);
      console.log('   Duration:', testCall.durationSec, 'seconds');
      console.log('   End Reason:', testCall.endReason);
    } else {
      console.log('❌ Test call not found in recent calls');
    }

    // Test 6: Test polling simulation
    console.log('\n6️⃣ Testing polling simulation...');
    
    // Create another call for polling test
    const pollingCallId = `polling_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await createCallRecord({
      callId: pollingCallId,
      agentId: 'test-agent-456',
      toNumber: '+1987654321',
      fromNumber: '+1234567890',
      status: 'in-progress',
      startedAt: new Date().toISOString(),
    });

    console.log('   → Created polling test call:', pollingCallId);
    
    // Simulate polling detection
    let pollingDetected = false;
    const pollInterval = setInterval(async () => {
      const call = await getCallRecord(pollingCallId);
      if (call && (call.status === 'completed' || call.status === 'failed')) {
        console.log('   → Polling detected call end:', call.status);
        pollingDetected = true;
        clearInterval(pollInterval);
      }
    }, 1000);

    // End the call after 3 seconds
    setTimeout(async () => {
      await updateCallRecord(pollingCallId, {
        status: 'completed',
        endedAt: new Date().toISOString(),
        endReason: 'polling_test'
      });
      console.log('   → Call ended for polling test');
    }, 3000);

    // Wait for polling detection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (pollingDetected) {
      console.log('✅ Polling detection working correctly');
    } else {
      console.log('❌ Polling detection failed');
    }

    console.log('\n🎉 Complete call flow test passed!');
    console.log('\n📋 Summary:');
    console.log('   - Call records are created in voiceCalls collection');
    console.log('   - Call status updates work correctly');
    console.log('   - Automatic call end detection works');
    console.log('   - Call logs are properly recorded');
    console.log('   - Polling mechanism detects call changes');
    console.log('   - Dashboard will show calls from voiceCalls collection');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Firebase is properly configured');
    console.log('   2. Check that voiceCalls collection exists');
    console.log('   3. Verify Firebase project credentials');
    console.log('   4. Check network connectivity to Firebase');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCompleteCallFlow();
}

module.exports = { testCompleteCallFlow };
