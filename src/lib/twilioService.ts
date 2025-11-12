// Twilio Service for dynamic call management and analytics

export interface TwilioCall {
  callSid: string;
  to: string;
  from: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  direction: 'inbound' | 'outbound' | 'inbound-api' | 'outbound-api';
  startTime: string;
  endTime?: string;
  duration?: number;
  price?: string;
  priceUnit?: string;
  answeredBy?: 'human' | 'machine_start' | 'machine_end_beep' | 'machine_end_silence' | 'machine_end_other' | 'fax';
  phoneNumberSid?: string;
  parentCallSid?: string;
  forwardedFrom?: string;
  callerName?: string;
  queueTime?: number;
  trunkSid?: string;
}

export interface TwilioRecording {
  sid: string;
  accountSid: string;
  callSid: string;
  conferenceSid?: string;
  status: 'processing' | 'completed' | 'deleted' | 'failed';
  dateCreated: string;
  dateUpdated: string;
  startTime?: string;
  duration?: number;
  channels: number;
  source: 'DialVerb' | 'Conference' | 'OutboundAPI' | 'Trunking' | 'RecordVerb' | 'StartCallRecordingAPI' | 'StartConferenceRecordingAPI';
  errorCode?: number;
  uri: string;
  encryptionDetails?: any;
  priceUnit?: string;
  price?: string;
  mediaUrl?: string;
  links?: any;
}

export interface TwilioCallAnalytics {
  callSid: string;
  qualityScore?: number;
  networkLatency?: number;
  jitter?: number;
  packetLoss?: number;
  codecUsed?: string;
  region?: string;
  edge?: string;
  issues: string[];
}

export interface CallFilters {
  status?: string;
  dateAfter?: string;
  dateBefore?: string;
  to?: string;
  from?: string;
  pageSize?: number;
}

// Fetch calls with advanced filtering
export async function listTwilioCalls(filters: CallFilters = {}): Promise<{
  calls: TwilioCall[];
  totalCount: number;
}> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const resp = await fetch('/api/twilio/calls?' + params.toString());
  if (!resp.ok) throw new Error('Failed to fetch Twilio calls');
  
  const data = await resp.json();
  return {
    calls: data.calls || [],
    totalCount: data.totalCount || 0
  };
}

// Get specific call details
export async function getTwilioCall(callSid: string): Promise<TwilioCall> {
  const resp = await fetch(`/api/twilio/calls?callSid=${encodeURIComponent(callSid)}`);
  if (!resp.ok) throw new Error('Failed to fetch Twilio call details');
  
  const data = await resp.json();
  return data.call;
}

// Fetch recordings for a specific call or all recordings
export async function listTwilioRecordings(filters: {
  callSid?: string;
  recordingSid?: string;
  pageSize?: number;
  dateAfter?: string;
  dateBefore?: string;
} = {}): Promise<{
  recordings: TwilioRecording[];
  totalCount: number;
}> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const resp = await fetch('/api/twilio/recordings?' + params.toString());
  if (!resp.ok) throw new Error('Failed to fetch Twilio recordings');
  
  const data = await resp.json();
  return {
    recordings: data.recordings || [],
    totalCount: data.totalCount || 0
  };
}

// Get specific recording details
export async function getTwilioRecording(recordingSid: string): Promise<TwilioRecording> {
  const resp = await fetch(`/api/twilio/recordings?recordingSid=${encodeURIComponent(recordingSid)}`);
  if (!resp.ok) throw new Error('Failed to fetch Twilio recording details');
  
  const data = await resp.json();
  return data.recording;
}

// Get call analytics and quality metrics
export async function getTwilioCallAnalytics(callSid: string): Promise<TwilioCallAnalytics> {
  // This would integrate with Twilio's Insights API
  // For now, we'll provide basic analytics based on call data
  const call = await getTwilioCall(callSid);
  
  // Mock analytics data - would be replaced with real Twilio Insights API
  const analytics: TwilioCallAnalytics = {
    callSid,
    qualityScore: Math.random() * 100, // 0-100 quality score
    networkLatency: Math.random() * 200, // ms
    jitter: Math.random() * 50, // ms
    packetLoss: Math.random() * 5, // percentage
    codecUsed: 'PCMU',
    region: 'us-east-1',
    edge: 'ashburn',
    issues: []
  };
  
  // Determine issues based on call data
  if (call.status === 'failed') {
    analytics.issues.push('Call failed to connect');
  }
  if (call.status === 'busy') {
    analytics.issues.push('Recipient was busy');
  }
  if (call.status === 'no-answer') {
    analytics.issues.push('No answer from recipient');
  }
  if (analytics.qualityScore && analytics.qualityScore < 70) {
    analytics.issues.push('Poor call quality detected');
  }
  if (analytics.packetLoss && analytics.packetLoss > 3) {
    analytics.issues.push('High packet loss detected');
  }
  
  return analytics;
}

// Get dashboard metrics from Twilio calls
export async function getTwilioDashboardMetrics(dateAfter?: string, dateBefore?: string): Promise<{
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  averageDuration: number;
  successRate: number;
  totalCost: number;
  averageQuality: number;
}> {
  const filters: CallFilters = {
    pageSize: 1000 // Get more data for accurate metrics
  };
  
  if (dateAfter) filters.dateAfter = dateAfter;
  if (dateBefore) filters.dateBefore = dateBefore;
  
  const { calls } = await listTwilioCalls(filters);
  
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const failedCalls = calls.filter(c => c.status === 'failed' || c.status === 'busy' || c.status === 'no-answer').length;
  
  const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
  
  // Calculate average duration (in seconds)
  const durationsSum = calls
    .filter(c => c.duration && c.duration > 0)
    .reduce((sum, c) => sum + (c.duration || 0), 0);
  const callsWithDuration = calls.filter(c => c.duration && c.duration > 0).length;
  const averageDuration = callsWithDuration > 0 ? durationsSum / callsWithDuration : 0;
  
  // Calculate total cost
  const totalCost = calls
    .filter(c => c.price && parseFloat(c.price) > 0)
    .reduce((sum, c) => sum + (parseFloat(c.price || '0') * -1), 0); // Twilio prices are negative
  
  // Mock average quality - would be calculated from actual Insights data
  const averageQuality = 85 + Math.random() * 10; // Mock 85-95% quality
  
  return {
    totalCalls,
    completedCalls,
    failedCalls,
    averageDuration,
    successRate,
    totalCost,
    averageQuality
  };
}

// Get call trends for analytics
export async function getTwilioCallTrends(days: number = 7): Promise<{
  dailyStats: Array<{
    date: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
  }>;
}> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  const { calls } = await listTwilioCalls({
    dateAfter: startDate.toISOString(),
    dateBefore: endDate.toISOString(),
    pageSize: 1000
  });
  
  // Group calls by date
  const dailyStats: { [key: string]: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    durations: number[];
  }} = {};
  
  calls.forEach(call => {
    const date = new Date(call.startTime).toISOString().split('T')[0];
    
    if (!dailyStats[date]) {
      dailyStats[date] = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        durations: []
      };
    }
    
    dailyStats[date].totalCalls++;
    
    if (call.status === 'completed') {
      dailyStats[date].successfulCalls++;
      if (call.duration) {
        dailyStats[date].durations.push(call.duration);
      }
    } else if (call.status === 'failed' || call.status === 'busy' || call.status === 'no-answer') {
      dailyStats[date].failedCalls++;
    }
  });
  
  // Convert to array format
  const result = Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    totalCalls: stats.totalCalls,
    successfulCalls: stats.successfulCalls,
    failedCalls: stats.failedCalls,
    averageDuration: stats.durations.length > 0 
      ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length 
      : 0
  })).sort((a, b) => a.date.localeCompare(b.date));
  
  return { dailyStats: result };
}

// Real-time call monitoring (would use webhooks in production)
export async function getActiveTwilioCalls(): Promise<TwilioCall[]> {
  const { calls } = await listTwilioCalls({
    status: 'in-progress',
    pageSize: 50
  });
  
  return calls;
}

// Cost analysis
export async function getTwilioCostAnalysis(dateAfter?: string, dateBefore?: string): Promise<{
  totalCost: number;
  costByDirection: {
    inbound: number;
    outbound: number;
  };
  costBreakdown: Array<{
    date: string;
    cost: number;
    callCount: number;
  }>;
}> {
  const filters: CallFilters = { pageSize: 1000 };
  if (dateAfter) filters.dateAfter = dateAfter;
  if (dateBefore) filters.dateBefore = dateBefore;
  
  const { calls } = await listTwilioCalls(filters);
  
  let totalCost = 0;
  let inboundCost = 0;
  let outboundCost = 0;
  
  const dailyCosts: { [key: string]: { cost: number; callCount: number } } = {};
  
  calls.forEach(call => {
    const cost = call.price ? parseFloat(call.price) * -1 : 0; // Convert negative to positive
    totalCost += cost;
    
    if (call.direction.includes('inbound')) {
      inboundCost += cost;
    } else {
      outboundCost += cost;
    }
    
    const date = new Date(call.startTime).toISOString().split('T')[0];
    if (!dailyCosts[date]) {
      dailyCosts[date] = { cost: 0, callCount: 0 };
    }
    dailyCosts[date].cost += cost;
    dailyCosts[date].callCount++;
  });
  
  const costBreakdown = Object.entries(dailyCosts).map(([date, data]) => ({
    date,
    cost: data.cost,
    callCount: data.callCount
  })).sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalCost,
    costByDirection: {
      inbound: inboundCost,
      outbound: outboundCost
    },
    costBreakdown
  };
}