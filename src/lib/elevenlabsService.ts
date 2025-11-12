export interface ElevenLabsConversationSummary {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  agentId?: string;
}

export async function listElevenLabsConversations(agentId?: string, pageSize: number = 20): Promise<ElevenLabsConversationSummary[]> {
  const params = new URLSearchParams();
  if (agentId) params.set('agentId', agentId);
  if (pageSize) params.set('pageSize', String(pageSize));
  const resp = await fetch('/api/elevenlabs/conversations?' + params.toString());
  if (!resp.ok) throw new Error('Failed to list ElevenLabs conversations');
  const data = await resp.json();
  const items: any[] = data?.items || data?.conversations || data?.data || [];
  return items.map((it: any) => ({
    id: String(it?.id || it?.conversationId || it?.conversation_id || ''),
    createdAt: it?.createdAt || it?.created_at,
    updatedAt: it?.updatedAt || it?.updated_at,
    agentId: it?.agentId || it?.agent_id,
  })).filter(c => c.id);
}

export async function getElevenLabsConversation(conversationId: string): Promise<any> {
  const resp = await fetch('/api/elevenlabs/conversations/' + encodeURIComponent(conversationId));
  if (!resp.ok) throw new Error('Failed to get ElevenLabs conversation');
  return await resp.json();
}

// Enhanced ElevenLabs service methods for dynamic data

export interface ElevenLabsAgent {
  id: string;
  name: string;
  conversationConfig: any;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ElevenLabsConversation {
  conversationId: string;
  agentId: string;
  status: 'active' | 'completed' | 'failed';
  startedAt: string;
  endedAt?: string;
  metadata?: any;
  analysis?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    summary: string;
    issues?: string[];
  };
}

export interface ElevenLabsBatchCall {
  batchId: string;
  callName: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled';
  totalRecipients: number;
  completedRecipients: number;
  failedRecipients: number;
  createdAt: string;
  updatedAt: string;
}

// Fetch all workspace agents
export async function listElevenLabsAgents(): Promise<ElevenLabsAgent[]> {
  const resp = await fetch('/api/elevenlabs/agents');
  if (!resp.ok) throw new Error('Failed to list ElevenLabs agents');
  const data = await resp.json();
  return data.agents || [];
}

// Get specific agent details
export async function getElevenLabsAgent(agentId: string): Promise<ElevenLabsAgent> {
  const resp = await fetch(`/api/elevenlabs/agents?agentId=${encodeURIComponent(agentId)}`);
  if (!resp.ok) throw new Error('Failed to get ElevenLabs agent');
  const data = await resp.json();
  return data.agent;
}

// Get enhanced conversations with analysis
export async function listElevenLabsConversationsEnhanced(agentId?: string, pageSize: number = 20): Promise<{
  conversations: ElevenLabsConversation[];
  totalCount: number;
  hasMore: boolean;
}> {
  const params = new URLSearchParams();
  if (agentId) params.set('agentId', agentId);
  params.set('pageSize', String(pageSize));
  
  const resp = await fetch('/api/elevenlabs/conversations?' + params.toString());
  if (!resp.ok) throw new Error('Failed to list ElevenLabs conversations');
  const data = await resp.json();
  
  return {
    conversations: data.conversations || [],
    totalCount: data.totalCount || 0,
    hasMore: data.hasMore || false
  };
}

// Get conversation with detailed analysis
export async function getElevenLabsConversationWithAnalysis(conversationId: string): Promise<{
  conversation: any;
  analysis?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    summary: string;
    keyPoints: string[];
    duration?: number;
    messageCount?: number;
  };
}> {
  const resp = await fetch('/api/elevenlabs/conversations/' + encodeURIComponent(conversationId));
  if (!resp.ok) throw new Error('Failed to get ElevenLabs conversation');
  const data = await resp.json();
  
  // Basic analysis from conversation data
  const conversation = data.conversation;
  let analysis;
  
  if (conversation) {
    const messages = conversation.messages || [];
    analysis = {
      sentiment: 'neutral' as const, // Would be enhanced with actual AI analysis
      summary: `Conversation with ${messages.length} messages`,
      keyPoints: ['Conversation completed'],
      duration: conversation.duration,
      messageCount: messages.length
    };
  }
  
  return {
    conversation,
    analysis
  };
}

// Get agent performance metrics
export async function getElevenLabsAgentMetrics(agentId: string): Promise<{
  totalConversations: number;
  avgDuration: number;
  successRate: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  lastActive?: string;
}> {
  // This would integrate with actual ElevenLabs analytics APIs
  // For now, we'll calculate from available conversation data
  const conversations = await listElevenLabsConversationsEnhanced(agentId, 100);
  
  const totalConversations = conversations.totalCount;
  const completed = conversations.conversations.filter(c => c.status === 'completed');
  const successRate = totalConversations > 0 ? (completed.length / totalConversations) * 100 : 0;
  
  // Mock sentiment analysis - would be replaced with real data
  const sentimentDistribution = {
    positive: 60,
    neutral: 30,
    negative: 10
  };
  
  return {
    totalConversations,
    avgDuration: 0, // Would calculate from actual conversation durations
    successRate,
    sentimentDistribution,
    lastActive: conversations.conversations[0]?.startedAt
  };
}

// Real-time agent status
export async function getElevenLabsAgentStatus(agentId: string): Promise<{
  isActive: boolean;
  currentConversations: number;
  status: 'available' | 'busy' | 'offline';
}> {
  // This would integrate with ElevenLabs real-time APIs
  // For now, return mock data based on recent activity
  const conversations = await listElevenLabsConversationsEnhanced(agentId, 10);
  const activeConversations = conversations.conversations.filter(c => c.status === 'active');
  
  return {
    isActive: activeConversations.length > 0,
    currentConversations: activeConversations.length,
    status: activeConversations.length > 0 ? 'busy' : 'available'
  };
}

