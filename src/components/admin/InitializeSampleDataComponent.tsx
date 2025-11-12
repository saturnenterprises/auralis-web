import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, Loader2, Play } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import Firebase functions
import { 
  createAgent, 
  upsertCalls, 
  createNotification,
  storeAnalytics,
  updateUserSettings
} from '@/lib/enhancedFirebaseService';
import { addMessage } from '@/lib/messagesService';
import type { 
  AgentRecord, 
  CallRecord, 
  NotificationRecord,
  ConversationMessage,
  AnalyticsRecord,
  UserSettings 
} from '@/lib/types';

interface InitializationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  count?: number;
  error?: string;
}

export const InitializeSampleDataComponent = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [steps, setSteps] = useState<InitializationStep[]>([
    { id: 'agents', name: 'AI Agents', status: 'pending' },
    { id: 'calls', name: 'Call Records', status: 'pending' },
    { id: 'messages', name: 'Conversation Messages', status: 'pending' },
    { id: 'notifications', name: 'Notifications', status: 'pending' },
    { id: 'analytics', name: 'Analytics Data', status: 'pending' },
    { id: 'settings', name: 'User Settings', status: 'pending' }
  ]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const updateStepStatus = (stepId: string, status: InitializationStep['status'], count?: number, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, count, error }
        : step
    ));
  };

  // Sample data generators (simplified versions)
  const generateSampleAgents = (): Omit<AgentRecord, 'id' | 'createdAt' | 'updatedAt'>[] => [
    {
      agentId: 'agent_sarah_cs',
      name: 'Sarah - Customer Service',
      description: 'Friendly customer service representative',
      voiceId: 'voice_21m00Tcm4TlvDq8ikWAM',
      voiceSettings: {
        stability: 0.85,
        similarity_boost: 0.75,
        style: 0.65,
        use_speaker_boost: true
      },
      status: 'active',
      conversationConfig: {
        systemPrompt: 'You are Sarah, a helpful customer service representative.',
        temperature: 0.7,
        maxTokens: 500
      },
      metadata: {
        department: 'Customer Service',
        language: 'en-US',
        specialties: ['orders', 'billing', 'support']
      }
    },
    {
      agentId: 'agent_james_tech',
      name: 'James - Technical Support',
      description: 'Expert technical support specialist',
      voiceId: 'voice_29vD33N1CtxCmqQRPOHJ',
      voiceSettings: {
        stability: 0.90,
        similarity_boost: 0.80,
        style: 0.70,
        use_speaker_boost: true
      },
      status: 'active',
      conversationConfig: {
        systemPrompt: 'You are James, a technical support specialist.',
        temperature: 0.6,
        maxTokens: 600
      },
      metadata: {
        department: 'Technical Support',
        language: 'en-US',
        specialties: ['troubleshooting', 'software', 'hardware']
      }
    },
    {
      agentId: 'agent_maria_sales',
      name: 'Maria - Sales Representative',
      description: 'Enthusiastic sales representative',
      voiceId: 'voice_EXAVITQu4vr4xnSDxMaL',
      voiceSettings: {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.80,
        use_speaker_boost: true
      },
      status: 'inactive',
      conversationConfig: {
        systemPrompt: 'You are Maria, a sales representative.',
        temperature: 0.8,
        maxTokens: 450
      },
      metadata: {
        department: 'Sales',
        language: 'en-US',
        specialties: ['demos', 'lead_qualification', 'closing']
      }
    }
  ];

  const generateSampleCalls = (): CallRecord[] => [
    {
      callId: 'call_sample_001',
      agentId: 'agent_sarah_cs',
      toNumber: '+1-555-0123',
      fromNumber: '+1-800-BUDDHI',
      status: 'completed',
      durationSec: 145,
      cost: 0.12,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      recording: {
        recordingUrl: 'https://example.com/recordings/call_001.mp3',
        durationSec: 145,
        transcription: 'Customer inquiry about order status. Issue resolved.'
      }
    },
    {
      callId: 'call_sample_002',
      agentId: 'agent_james_tech',
      toNumber: '+1-555-0456',
      fromNumber: '+1-800-BUDDHI',
      status: 'completed',
      durationSec: 267,
      cost: 0.18,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      callId: 'call_sample_003',
      agentId: 'agent_sarah_cs',
      toNumber: '+1-555-0789',
      fromNumber: '+1-800-BUDDHI',
      status: 'no-answer',
      durationSec: 0,
      cost: 0.05,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  const generateSampleMessages = (): Array<{ callId: string; messages: ConversationMessage[] }> => [
    {
      callId: 'call_sample_001',
      messages: [
        {
          id: 'msg_001_1',
          type: 'ai',
          content: 'Hello! Thank you for calling Auralis. This is Sarah. How can I help you today?',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          sentiment: 'positive'
        },
        {
          id: 'msg_001_2',
          type: 'human',
          content: 'Hi Sarah, I wanted to check on my order status. My order number is 12345.',
          timestamp: new Date(Date.now() - 280000).toISOString(),
          sentiment: 'neutral'
        },
        {
          id: 'msg_001_3',
          type: 'ai',
          content: 'Let me look that up for you. Order #12345 is being processed and will ship within 24 hours.',
          timestamp: new Date(Date.now() - 260000).toISOString(),
          sentiment: 'positive'
        },
        {
          id: 'msg_001_4',
          type: 'human',
          content: 'Perfect! Thank you so much.',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          sentiment: 'positive'
        }
      ]
    }
  ];

  const generateSampleNotifications = (): Omit<NotificationRecord, 'id' | 'createdAt'>[] => [
    {
      type: 'system_alert',
      severity: 'warning',
      title: 'API Rate Limit Warning',
      message: 'ElevenLabs API usage is at 75% of the monthly limit.',
      isRead: false,
      actionRequired: true,
      actionUrl: 'https://elevenlabs.io/pricing',
      relatedType: 'system',
      metadata: { priority: 'medium', assignee: 'Technical Team' }
    },
    {
      type: 'agent_status',
      severity: 'info',
      title: 'Agent Activated',
      message: 'Agent "Sarah - Customer Service" is now active and ready.',
      isRead: true,
      actionRequired: false,
      relatedType: 'agent',
      relatedId: 'agent_sarah_cs',
      metadata: { priority: 'low', assignee: 'System' }
    },
    {
      type: 'call_quality',
      severity: 'error',
      title: 'Call Quality Issue',
      message: 'Poor audio quality detected on recent calls.',
      isRead: false,
      actionRequired: true,
      relatedType: 'call',
      metadata: { priority: 'high', assignee: 'Support Team' }
    }
  ];

  const initializeSampleData = async () => {
    setIsInitializing(true);
    setGlobalError(null);

    try {
      // Step 1: Create Agents
      updateStepStatus('agents', 'running');
      const agents = generateSampleAgents();
      for (const agent of agents) {
        await createAgent(agent);
      }
      updateStepStatus('agents', 'completed', agents.length);

      // Step 2: Create Calls
      updateStepStatus('calls', 'running');
      const calls = generateSampleCalls();
      await upsertCalls(calls);
      updateStepStatus('calls', 'completed', calls.length);

      // Step 3: Create Messages
      updateStepStatus('messages', 'running');
      const messageGroups = generateSampleMessages();
      let totalMessages = 0;
      for (const group of messageGroups) {
        for (const message of group.messages) {
          await addMessage(group.callId, message);
          totalMessages++;
        }
      }
      updateStepStatus('messages', 'completed', totalMessages);

      // Step 4: Create Notifications
      updateStepStatus('notifications', 'running');
      const notifications = generateSampleNotifications();
      for (const notification of notifications) {
        await createNotification(notification);
      }
      updateStepStatus('notifications', 'completed', notifications.length);

      // Step 5: Create Analytics
      updateStepStatus('analytics', 'running');
      const analyticsData: AnalyticsRecord = {
        id: 'analytics_sample',
        type: 'daily_summary',
        date: new Date().toISOString().split('T')[0],
        metrics: {
          totalCalls: 127,
          completedCalls: 98,
          averageDuration: 145,
          totalCost: 12.45,
          successRate: 0.77
        },
        agentMetrics: {
          'agent_sarah_cs': {
            callsHandled: 45,
            averageDuration: 132,
            successRate: 0.89,
            cost: 5.23
          },
          'agent_james_tech': {
            callsHandled: 32,
            averageDuration: 178,
            successRate: 0.78,
            cost: 4.67
          }
        },
        createdAt: new Date().toISOString()
      };
      await storeAnalytics(analyticsData);
      updateStepStatus('analytics', 'completed', 1);

      // Step 6: Create User Settings
      updateStepStatus('settings', 'running');
      const settings: Omit<UserSettings, 'id' | 'updatedAt'> = {
        userId: 'demo_user',
        preferences: {
          notifications: { email: true, push: true, sms: false },
          dashboard: { defaultView: 'overview', refreshInterval: 30, showRealTimeUpdates: true },
          calling: { defaultCountryCode: '+1', recordCalls: true, enableTranscription: true }
        },
        apiKeys: {
          elevenLabs: { isConfigured: true, lastVerified: new Date().toISOString() },
          twilio: { isConfigured: true, lastVerified: new Date().toISOString() }
        }
      };
      await updateUserSettings('demo_user', settings);
      updateStepStatus('settings', 'completed', 1);

      console.log('🎉 Sample data initialization completed successfully!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error initializing sample data:', error);
      setGlobalError(errorMessage);
      
      // Mark current running step as error
      setSteps(prev => prev.map(step => 
        step.status === 'running' 
          ? { ...step, status: 'error', error: errorMessage }
          : step
      ));
    } finally {
      setIsInitializing(false);
    }
  };

  const getStepIcon = (status: InitializationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepBadge = (status: InitializationStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Running</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const totalCompleted = steps.filter(s => s.status === 'completed').length;
  const hasErrors = steps.some(s => s.status === 'error');

  return (
    <div className="space-y-6">
      <Card className="floating-card glass fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Initialize Sample Data
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Populate Firebase with sample data for testing the dynamic components
              </p>
            </div>
            <Button
              onClick={initializeSampleData}
              disabled={isInitializing}
              className="ring-focus"
              variant={totalCompleted === steps.length ? "secondary" : "coral"}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : totalCompleted === steps.length ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Re-initialize
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Initialize Data
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Summary */}
          {(isInitializing || totalCompleted > 0) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {totalCompleted} of {steps.length} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(totalCompleted / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Global Error */}
          {globalError && (
            <Alert className="border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                {globalError}
              </AlertDescription>
            </Alert>
          )}

          {/* Initialization Steps */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  {getStepIcon(step.status)}
                  <div>
                    <span className="font-medium">{step.name}</span>
                    {step.count && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({step.count} items)
                      </span>
                    )}
                    {step.error && (
                      <p className="text-sm text-red-600 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
                {getStepBadge(step.status)}
              </div>
            ))}
          </div>

          {/* Success Message */}
          {totalCompleted === steps.length && !hasErrors && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                🎉 Sample data has been successfully initialized! Your Firebase database now contains sample agents, calls, conversations, and more. You can now test all the dynamic components.
              </AlertDescription>
            </Alert>
          )}

          {/* What's included */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">What's included in the sample data:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 3 AI agents (Sarah, James, Maria) with different specialties</li>
              <li>• 3 call records with various statuses and recordings</li>
              <li>• Conversation messages between AI agents and customers</li>
              <li>• System notifications and alerts</li>
              <li>• Analytics data with KPIs and metrics</li>
              <li>• User settings and preferences</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};