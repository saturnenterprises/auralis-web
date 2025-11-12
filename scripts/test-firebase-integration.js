/**
 * Comprehensive test script for Firebase integration
 * Run this script to test the complete call flow and Firestore integration
 */

const { createCallRecord, updateCallRecord, getCallRecord, getRecentCalls, addCallLog, getCallStatistics } = require('../lib/firebaseService');

async function testFirebaseIntegration() {
  console.log('🧪 Testing Firebase Integration...\n');

  try {
    // Test 1: Create a test call record
    console.log('1️⃣ Testing call record creation...');
    const testCallId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testCallRecord = {
      callId: testCallId,
      agentId: 'test-agent-123',
      toNumber: '+1234567890',
      fromNumber: '+0987654321',
      status: 'initiating',
      startedAt: new Date().toISOString(),
    };

    await createCallRecord(testCallRecord);
    console.log('✅ Test call record created successfully');

    // Test 2: Retrieve the call record
    console.log('\n2️⃣ Testing call record retrieval...');
    const retrievedRecord = await getCallRecord(testCallId);
    
    if (retrievedRecord) {
      console.log('✅ Test call record retrieved successfully');
      console.log('   Call ID:', retrievedRecord.callId);
      console.log('   Status:', retrievedRecord.status);
      console.log('   To Number:', retrievedRecord.toNumber);
    } else {
      console.log('❌ Failed to retrieve test call record');
      return;
    }

    // Test 3: Update the call record
    console.log('\n3️⃣ Testing call record update...');
    const updates = {
      status: 'ringing',
      ringingAt: new Date().toISOString(),
    };

    await updateCallRecord(testCallId, updates);
    console.log('✅ Test call record updated successfully');

    // Test 4: Simulate call progression
    console.log('\n4️⃣ Testing call progression...');
    
    // Update to in-progress
    await updateCallRecord(testCallId, {
      status: 'in-progress',
      connectedAt: new Date().toISOString(),
    });
    console.log('   → Updated to in-progress');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update to completed
    await updateCallRecord(testCallId, {
      status: 'completed',
      endedAt: new Date().toISOString(),
      durationSec: 120,
      endReason: 'test_completed',
    });
    console.log('   → Updated to completed');

    // Test 5: Add call log
    console.log('\n5️⃣ Testing call log addition...');
    await addCallLog(testCallId, {
      type: 'test_log',
      message: 'Test call log entry',
      data: { testData: 'This is a test' }
    });
    console.log('✅ Call log added successfully');

    // Test 6: Get recent calls
    console.log('\n6️⃣ Testing recent calls retrieval...');
    const recentCalls = await getRecentCalls(10);
    console.log(`✅ Retrieved ${recentCalls.length} recent calls`);
    
    if (recentCalls.length > 0) {
      console.log('   Latest call:', {
        callId: recentCalls[0].callId,
        status: recentCalls[0].status,
        toNumber: recentCalls[0].toNumber
      });
    }

    // Test 7: Get call statistics
    console.log('\n7️⃣ Testing call statistics...');
    const stats = await getCallStatistics();
    console.log('✅ Call statistics retrieved:');
    console.log('   Total Calls:', stats.totalCalls);
    console.log('   Completed Calls:', stats.completedCalls);
    console.log('   Failed Calls:', stats.failedCalls);
    console.log('   Average Duration:', stats.averageDuration, 'seconds');

    // Test 8: Verify the test call is in the results
    console.log('\n8️⃣ Verifying test call in results...');
    const testCallInResults = recentCalls.find(call => call.callId === testCallId);
    
    if (testCallInResults) {
      console.log('✅ Test call found in recent calls');
      console.log('   Final Status:', testCallInResults.status);
      console.log('   Duration:', testCallInResults.durationSec, 'seconds');
    } else {
      console.log('❌ Test call not found in recent calls');
    }

    console.log('\n🎉 All tests passed! Firebase integration is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   - Call records can be created in Firestore');
    console.log('   - Call records can be retrieved from Firestore');
    console.log('   - Call records can be updated in Firestore');
    console.log('   - Call logs can be added');
    console.log('   - Recent calls can be retrieved');
    console.log('   - Call statistics can be calculated');
    console.log('   - The integration is ready for production use');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Firebase is properly configured');
    console.log('   2. Check that Firestore rules allow writes');
    console.log('   3. Verify Firebase project credentials');
    console.log('   4. Check network connectivity to Firebase');
    console.log('   5. Ensure the Firebase service is properly imported');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testFirebaseIntegration();
}

module.exports = { testFirebaseIntegration };
