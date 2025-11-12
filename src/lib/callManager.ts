// Enhanced call management service
import { createCallRecord, updateCallRecord, getCallRecord, addCallLog } from './firebaseService';
import type { CallRecord } from './types';

class CallManager {
  private activeCalls = new Map<string, CallRecord>();
  private callTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Initiate a new call
   * @param callData - Call data
   * @returns Promise<string> - Call ID
   */
  async initiateCall(callData: Partial<CallRecord>): Promise<string> {
    try {
      console.log('🚀 Initiating call:', callData);
      
      // Generate a unique call ID if not provided
      const callId = callData.callId || this.generateCallId();
      
      // Prepare call record
      const record: Partial<CallRecord> = {
        callId,
        agentId: callData.agentId || '',
        toNumber: callData.toNumber || '',
        fromNumber: callData.fromNumber || '',
        status: 'initiating',
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create call record in Firestore
      await createCallRecord(record);
      
      // Store in active calls
      this.activeCalls.set(callId, record as CallRecord);
      
      // Add call log
      await addCallLog(callId, {
        type: 'call_initiated',
        message: `Call initiated to ${callData.toNumber}`,
        data: { toNumber: callData.toNumber, fromNumber: callData.fromNumber }
      });

      console.log('✅ Call initiated successfully:', callId);
      return callId;
    } catch (error) {
      console.error('❌ Failed to initiate call:', error);
      throw error;
    }
  }

  /**
   * Update call status
   * @param callId - Call ID
   * @param status - New status
   * @param additionalData - Additional data to update
   * @returns Promise<void>
   */
  async updateCallStatus(callId: string, status: string, additionalData: Partial<CallRecord> = {}): Promise<void> {
    try {
      console.log(`🔄 Updating call status: ${callId} -> ${status}`);
      
      const updates: Partial<CallRecord> = {
        status: status as any,
        updatedAt: new Date().toISOString(),
        ...additionalData
      };

      // Add status-specific timestamps
      if (status === 'ringing') {
        updates.ringingAt = new Date().toISOString();
      } else if (status === 'in-progress') {
        updates.connectedAt = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed' || status === 'no-answer') {
        updates.endedAt = new Date().toISOString();
        
        // Calculate duration if we have start time
        const callRecord = await getCallRecord(callId);
        if (callRecord && callRecord.startedAt) {
          const startTime = new Date(callRecord.startedAt);
          const endTime = new Date();
          updates.durationSec = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
        }
      }

      // Update in Firestore
      await updateCallRecord(callId, updates);
      
      // Update local cache
      const activeCall = this.activeCalls.get(callId);
      if (activeCall) {
        Object.assign(activeCall, updates);
        this.activeCalls.set(callId, activeCall);
      }

      // Add call log
      await addCallLog(callId, {
        type: 'status_update',
        message: `Call status updated to ${status}`,
        data: { status, ...additionalData }
      });

      console.log(`✅ Call status updated: ${callId} -> ${status}`);
    } catch (error) {
      console.error('❌ Failed to update call status:', error);
      throw error;
    }
  }

  /**
   * End a call
   * @param callId - Call ID
   * @param reason - Reason for ending call
   * @returns Promise<void>
   */
  async endCall(callId: string, reason: string = 'user_ended'): Promise<void> {
    try {
      console.log(`🔚 Ending call: ${callId} (${reason})`);
      
      await this.updateCallStatus(callId, 'completed', {
        endReason: reason,
        endedAt: new Date().toISOString()
      });

      // Remove from active calls
      this.activeCalls.delete(callId);
      
      // Clear any timeouts
      const timeout = this.callTimeouts.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        this.callTimeouts.delete(callId);
      }

      console.log(`✅ Call ended: ${callId}`);
    } catch (error) {
      console.error('❌ Failed to end call:', error);
      throw error;
    }
  }

  /**
   * Fail a call
   * @param callId - Call ID
   * @param reason - Failure reason
   * @param errorCode - Error code
   * @returns Promise<void>
   */
  async failCall(callId: string, reason: string = 'unknown_error', errorCode: string | null = null): Promise<void> {
    try {
      console.log(`❌ Failing call: ${callId} (${reason})`);
      
      await this.updateCallStatus(callId, 'failed', {
        endReason: reason,
        errorCode,
        endedAt: new Date().toISOString()
      });

      // Remove from active calls
      this.activeCalls.delete(callId);
      
      // Clear any timeouts
      const timeout = this.callTimeouts.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        this.callTimeouts.delete(callId);
      }

      console.log(`✅ Call failed: ${callId}`);
    } catch (error) {
      console.error('❌ Failed to fail call:', error);
      throw error;
    }
  }

  /**
   * Get active call
   * @param callId - Call ID
   * @returns CallRecord | null
   */
  getActiveCall(callId: string): CallRecord | null {
    return this.activeCalls.get(callId) || null;
  }

  /**
   * Get all active calls
   * @returns CallRecord[]
   */
  getActiveCalls(): CallRecord[] {
    return Array.from(this.activeCalls.values());
  }

  /**
   * Generate a unique call ID
   * @returns string
   */
  generateCallId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `call_${timestamp}_${random}`;
  }

  /**
   * Simulate call progression (for testing)
   * @param callId - Call ID
   * @param duration - Call duration in seconds
   * @returns Promise<void>
   */
  async simulateCallProgression(callId: string, duration: number = 30): Promise<void> {
    try {
      console.log(`🎭 Simulating call progression: ${callId} (${duration}s)`);
      
      // Update to ringing
      await this.updateCallStatus(callId, 'ringing');
      await this.delay(2000);
      
      // Update to in-progress
      await this.updateCallStatus(callId, 'in-progress');
      await this.delay(duration * 1000);
      
      // Update to completed
      await this.updateCallStatus(callId, 'completed');
      
      console.log(`✅ Call simulation completed: ${callId}`);
    } catch (error) {
      console.error('❌ Call simulation failed:', error);
      await this.failCall(callId, 'simulation_error');
    }
  }

  /**
   * Delay utility
   * @param ms - Milliseconds to delay
   * @returns Promise<void>
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const callManager = new CallManager();
export default callManager;
