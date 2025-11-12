import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecentCalls, subscribeToCalls, getCallStatistics, createCallRecord, updateCallRecord } from '@/lib/firebaseService';

export const FirebaseTest = () => {
  const [calls, setCalls] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testCallId, setTestCallId] = useState<string | null>(null);

  // Load calls on component mount
  useEffect(() => {
    loadCalls();
    loadStats();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToCalls((newCalls) => {
      setCalls(newCalls);
    }, 20);

    return () => unsubscribe();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const recentCalls = await getRecentCalls(20);
      setCalls(recentCalls);
      console.log('✅ Loaded calls:', recentCalls);
    } catch (error) {
      console.error('❌ Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await getCallStatistics();
      setStats(statistics);
      console.log('✅ Loaded stats:', statistics);
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  };

  const createTestCall = async () => {
    try {
      setLoading(true);
      const callId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const testCall = {
        callId,
        agentId: 'test-agent',
        toNumber: '+1234567890',
        fromNumber: '+0987654321',
        status: 'initiating',
        startedAt: new Date().toISOString(),
      };

      await createCallRecord(testCall);
      setTestCallId(callId);
      console.log('✅ Test call created:', callId);
      
      // Simulate call progression
      setTimeout(() => updateCallStatus(callId, 'ringing'), 1000);
      setTimeout(() => updateCallStatus(callId, 'in-progress'), 3000);
      setTimeout(() => updateCallStatus(callId, 'completed'), 10000);
      
    } catch (error) {
      console.error('❌ Failed to create test call:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCallStatus = async (callId: string, status: string) => {
    try {
      await updateCallRecord(callId, {
        status: status as any,
        updatedAt: new Date().toISOString(),
        ...(status === 'completed' && { endedAt: new Date().toISOString() })
      });
      console.log(`✅ Call ${callId} updated to ${status}`);
    } catch (error) {
      console.error('❌ Failed to update call status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'in-progress': return 'bg-blue-500';
      case 'ringing': return 'bg-yellow-500';
      case 'initiating': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadCalls} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Calls'}
            </Button>
            <Button onClick={createTestCall} disabled={loading}>
              Create Test Call
            </Button>
            <Button onClick={loadStats} disabled={loading}>
              Load Stats
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
                <div className="text-sm text-gray-500">Total Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedCalls}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failedCalls}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.averageDuration}s</div>
                <div className="text-sm text-gray-500">Avg Duration</div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Recent Calls ({calls.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {calls.map((call) => (
                <div key={call.id || call.callId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{call.callId}</div>
                    <div className="text-sm text-gray-500">
                      {call.toNumber} → {call.fromNumber}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(call.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(call.status)} text-white`}>
                      {call.status}
                    </Badge>
                    {call.durationSec && (
                      <span className="text-sm text-gray-500">
                        {Math.floor(call.durationSec / 60)}:{(call.durationSec % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {calls.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No calls found. Create a test call to see data.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};