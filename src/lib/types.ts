export type CallStatus = 'calling' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'queued' | 'ringing';

export interface CallRecord {
  callId: string; // ElevenLabs callId
  twilioCallSid?: string;
  agentId?: string;
  toNumber: string;
  fromNumber?: string;
  status: CallStatus;
  startedAt?: string; // ISO string
  endedAt?: string; // ISO string
  durationSec?: number;
  recording?: {
    recordingSid?: string;
    recordingUrl?: string;
    status?: 'completed' | 'failed' | 'processing';
    durationSec?: number;
  };
  sentimentSummary?: string;
  errorCode?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ConversationMessage {
  id: string;
  type: 'ai' | 'human' | 'system';
  content: string;
  timestamp: string; // ISO string
  sentiment?: 'positive' | 'neutral' | 'negative';
  sourceIds?: {
    conversationId?: string;
    twilioEventId?: string;
  };
}

export interface AgentRecord {
  id: string;
  name: string;
  email: string;
  status: 'available' | 'busy' | 'break' | 'offline';
  callsToday: number;
  totalDurationSec: number;
  rating?: number;
  location?: string;
  shiftStart?: string;
  shiftEnd?: string;
  updatedAt: string;
}

// Enhanced types for dynamic data

export interface ConversationRecord {
  id: string;
  conversationId: string; // ElevenLabs conversation ID
  callId?: string; // Link to call record
  agentId: string;
  status: 'active' | 'completed' | 'failed';
  startedAt: string;
  endedAt?: string;
  messages: ConversationMessage[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  analysis?: {
    summary: string;
    keyPoints: string[];
    issues: string[];
    customerSatisfaction?: number;
    aiPerformance?: number;
  };
  metadata?: {
    customerPhone?: string;
    customerName?: string;
    source?: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedAgentRecord extends AgentRecord {
  // Additional fields for ElevenLabs agent data
  elevenLabsAgentId?: string;
  configuration?: {
    language: string;
    voice?: string;
    personality?: string;
    instructions?: string;
  };
  metrics?: {
    totalConversations: number;
    avgConversationDuration: number;
    successRate: number;
    customerSatisfaction: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  realTimeStatus?: {
    isActive: boolean;
    currentConversations: number;
    lastActive?: string;
  };
}

export interface CallAnalytics {
  id: string;
  callId: string;
  conversationId?: string;
  // Twilio metrics
  twilioMetrics?: {
    qualityScore: number;
    networkLatency: number;
    jitter: number;
    packetLoss: number;
    codecUsed: string;
    region: string;
    issues: string[];
  };
  // ElevenLabs metrics
  elevenLabsMetrics?: {
    aiResponseTime: number;
    voiceQuality: number;
    naturalness: number;
    accuracy: number;
    conversationFlow: number;
  };
  // User feedback
  userFeedback?: {
    rating: number;
    comments?: string;
    issues?: string[];
  };
  // Cost analysis
  costAnalysis?: {
    twilioCharges: number;
    elevenLabsCharges: number;
    totalCost: number;
    costPerMinute: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKPIs {
  totalCallsToday: number;
  totalCallsChange: number;
  activeAgents: number;
  activeAgentsChange: number;
  avgCallDuration: number;
  avgCallDurationChange: number;
  callQualityScore: number;
  callQualityChange: number;
  successRate: number;
  successRateChange: number;
  totalCost: number;
  totalCostChange: number;
  customerSatisfaction: number;
  customerSatisfactionChange: number;
  timestamp: string;
}

export interface CallTrends {
  dailyStats: Array<{
    date: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    totalCost: number;
    avgQualityScore: number;
  }>;
  weeklyComparison: {
    thisWeek: {
      calls: number;
      duration: number;
      cost: number;
      quality: number;
    };
    lastWeek: {
      calls: number;
      duration: number;
      cost: number;
      quality: number;
    };
    percentChange: {
      calls: number;
      duration: number;
      cost: number;
      quality: number;
    };
  };
}

export interface RecordingRecord {
  id: string;
  recordingId: string; // Twilio recording SID
  callId: string;
  conversationId?: string;
  status: 'processing' | 'completed' | 'failed' | 'deleted';
  duration?: number;
  fileSize?: number;
  mediaUrl?: string;
  transcriptUrl?: string;
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics?: string[];
  speakers?: Array<{
    speaker: 'agent' | 'customer';
    segments: Array<{
      start: number;
      end: number;
      text: string;
      confidence: number;
    }>;
  }>;
  analysis?: {
    keyPoints: string[];
    actionItems: string[];
    issues: string[];
    resolution?: string;
  };
  privacy?: {
    isRedacted: boolean;
    redactionRules: string[];
    retentionDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  type: 'call_completed' | 'call_failed' | 'agent_offline' | 'quality_alert' | 'cost_alert' | 'system_alert';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  relatedId?: string; // callId, agentId, etc.
  relatedType?: 'call' | 'agent' | 'conversation' | 'system';
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

export interface SystemSettings {
  id: string;
  // Call settings
  callSettings: {
    maxConcurrentCalls: number;
    defaultCallTimeout: number;
    recordingEnabled: boolean;
    transcriptionEnabled: boolean;
    qualityMonitoringEnabled: boolean;
  };
  // Agent settings
  agentSettings: {
    autoAssignCalls: boolean;
    maxCallsPerAgent: number;
    idleTimeout: number;
    performanceMonitoring: boolean;
  };
  // Analytics settings
  analyticsSettings: {
    dataRetentionDays: number;
    realTimeUpdatesEnabled: boolean;
    exportEnabled: boolean;
    aiInsightsEnabled: boolean;
  };
  // Notification settings
  notificationSettings: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    webhookUrl?: string;
    alertThresholds: {
      callFailureRate: number;
      avgCallDuration: number;
      qualityScore: number;
      costPerCall: number;
    };
  };
  // Integration settings
  integrationSettings: {
    elevenLabs: {
      agentId: string;
      phoneNumberId: string;
      webhookEnabled: boolean;
    };
    twilio: {
      recordingEnabled: boolean;
      transcriptionEnabled: boolean;
      insightsEnabled: boolean;
    };
    firebase: {
      realTimeSyncEnabled: boolean;
      backupEnabled: boolean;
      dataExportEnabled: boolean;
    };
  };
  updatedAt: string;
  updatedBy: string;
}

