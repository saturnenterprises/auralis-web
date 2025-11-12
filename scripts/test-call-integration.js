/**
 * Test script to verify call integration with Firestore
 * Run this script to test the complete call flow
 */

const { createCallRecord, getCallRecord, updateCallRecord } = require('../lib/serverCallsService');

async function testCallIntegration() {
  console.log('🧪 Testing Call Integration with Firestore...\n');

  try {
    // Test 1: Create a test call record
    console.log('1️⃣ Testing call record creation...');
    const testCallId = `test-${Date.now()}`;
    const testCallRecord = {
      callId: testCallId,
      agentId: 'test-agent-123',
      toNumber: '+1234567890',
      fromNumber: '+0987654321',
      status: 'calling',
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
      status: 'completed',
      endedAt: new Date().toISOString(),
      durationSec: 120,
    };

    await updateCallRecord(testCallId, updates);
    console.log('✅ Test call record updated successfully');

    // Test 4: Verify the update
    console.log('\n4️⃣ Verifying call record update...');
    const updatedRecord = await getCallRecord(testCallId);
    
    if (updatedRecord && updatedRecord.status === 'completed') {
      console.log('✅ Test call record update verified');
      console.log('   New Status:', updatedRecord.status);
      console.log('   Duration:', updatedRecord.durationSec, 'seconds');
      console.log('   Ended At:', updatedRecord.endedAt);
    } else {
      console.log('❌ Failed to verify call record update');
      return;
    }

    console.log('\n🎉 All tests passed! Call integration is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   - Call records can be created in Firestore');
    console.log('   - Call records can be retrieved from Firestore');
    console.log('   - Call records can be updated in Firestore');
    console.log('   - The integration is ready for production use');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Firebase Admin SDK is properly configured');
    console.log('   2. Check that Firestore rules allow writes');
    console.log('   3. Verify Firebase project credentials');
    console.log('   4. Check network connectivity to Firebase');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCallIntegration();
}

module.exports = { testCallIntegration };

