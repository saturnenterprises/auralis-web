// Hook for polling call status and detecting automatic call end
import { useEffect, useRef, useState } from 'react';
import { updateCallRecord, getCallRecord } from '@/lib/firebaseService';

interface UseCallStatusPollingProps {
  callId: string | null;
  isCallActive: boolean;
  onCallEnd: () => void;
  pollingInterval?: number; // in milliseconds
}

export function useCallStatusPolling({
  callId,
  isCallActive,
  onCallEnd,
  pollingInterval = 5000 // Poll every 5 seconds
}: UseCallStatusPollingProps) {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!callId || !isCallActive) {
      // Stop polling if no call or call is not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
      return;
    }

    // Start polling
    setIsPolling(true);
    console.log(`🔄 Starting call status polling for call: ${callId}`);

    const pollCallStatus = async () => {
      try {
        const callRecord = await getCallRecord(callId);
        
        if (!callRecord) {
          console.warn(`⚠️ Call record not found for ${callId}, stopping polling`);
          onCallEnd();
          return;
        }

        const currentStatus = callRecord.status;
        const previousStatus = lastStatusRef.current;
        
        console.log(`📊 Call status check: ${callId} -> ${currentStatus} (was: ${previousStatus})`);

        // Check if call has ended
        if (currentStatus === 'completed' || currentStatus === 'failed' || currentStatus === 'no-answer') {
          console.log(`🔚 Call ended automatically: ${callId} -> ${currentStatus}`);
          
          // Update frontend state
          onCallEnd();
          
          // Stop polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsPolling(false);
          
          return;
        }

        // Update last known status
        lastStatusRef.current = currentStatus;

        // If status changed, update the UI
        if (previousStatus && previousStatus !== currentStatus) {
          console.log(`📞 Call status changed: ${previousStatus} -> ${currentStatus}`);
          
          // You can add additional UI updates here if needed
          // For example, show different status messages
        }

      } catch (error) {
        console.error('❌ Error polling call status:', error);
      }
    };

    // Start polling immediately
    pollCallStatus();

    // Set up interval for continued polling
    intervalRef.current = setInterval(pollCallStatus, pollingInterval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [callId, isCallActive, onCallEnd, pollingInterval]);

  // Manual call end function
  const endCallManually = async () => {
    if (!callId) return;

    try {
      console.log(`🔚 Manually ending call: ${callId}`);
      
      // Update call status to completed
      await updateCallRecord(callId, {
        status: 'completed',
        endedAt: new Date().toISOString(),
        endReason: 'user_ended'
      });

      // Stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);

      // Update frontend state
      onCallEnd();
      
    } catch (error) {
      console.error('❌ Error ending call manually:', error);
    }
  };

  return {
    isPolling,
    endCallManually
  };
}
