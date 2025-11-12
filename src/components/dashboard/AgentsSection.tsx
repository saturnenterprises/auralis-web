import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Clock, UserPlus, Settings, RefreshCw, MoreVertical } from 'lucide-react';
import { dashboardService } from '@/lib/dashboardService';
import type { EnhancedAgentRecord } from '@/lib/types';

export const AgentsSection = () => {
  const [agents, setAgents] = useState<EnhancedAgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Load agent data
  const loadAgentData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      console.log('📊 Loading enhanced agent data...');
      
      const agentData = await dashboardService.getEnhancedAgentData();
      
      // If no agents from ElevenLabs, create some sample data
      if (agentData.length === 0) {
        console.log('ℹ️ No ElevenLabs agents found, creating sample data...');
        const sampleAgents: EnhancedAgentRecord[] = [
          {
            id: 'sample-1',
            name: 'Auralis AI Agent',
            email: 'agent@auralis.com',
            status: 'available',
            callsToday: 12,
            totalDurationSec: 12540,
            elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID || 'agent_6501k548aqy7en9tp4vkv13w7jak',
            configuration: {
              language: 'en',
              voice: 'Professional',
              personality: 'Helpful Assistant',
              instructions: 'AI voice assistant for customer support'
            },
            metrics: {
              totalConversations: 45,
              avgConversationDuration: 278,
              successRate: 92,
              customerSatisfaction: 85,
              sentimentDistribution: {
                positive: 70,
                neutral: 25,
                negative: 5
              }
            },
            realTimeStatus: {
              isActive: true,
              currentConversations: 2,
              lastActive: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          },
          {
            id: 'sample-2',
            name: 'Support Agent',
            email: 'support@auralis.com',
            status: 'busy',
            callsToday: 8,
            totalDurationSec: 8650,
            elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID || 'agent_7501k548aqy7en9tp4vkv13w7jak',
            configuration: {
              language: 'en',
              voice: 'Friendly',
              personality: 'Support Specialist',
              instructions: 'Handles customer inquiries and support'
            },
            metrics: {
              totalConversations: 32,
              avgConversationDuration: 320,
              successRate: 88,
              customerSatisfaction: 82,
              sentimentDistribution: {
                positive: 65,
                neutral: 28,
                negative: 7
              }
            },
            realTimeStatus: {
              isActive: true,
              currentConversations: 1,
              lastActive: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          },
          {
            id: 'sample-3',
            name: 'Sales Agent',
            email: 'sales@auralis.com',
            status: 'break',
            callsToday: 5,
            totalDurationSec: 4200,
            elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID || 'agent_8501k548aqy7en9tp4vkv13w7jak',
            configuration: {
              language: 'en',
              voice: 'Confident',
              personality: 'Sales Representative',
              instructions: 'Handles sales inquiries and conversions'
            },
            metrics: {
              totalConversations: 28,
              avgConversationDuration: 250,
              successRate: 85,
              customerSatisfaction: 80,
              sentimentDistribution: {
                positive: 60,
                neutral: 30,
                negative: 10
              }
            },
            realTimeStatus: {
              isActive: false,
              currentConversations: 0,
              lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            },
            updatedAt: new Date().toISOString()
          }
        ];
        setAgents(sampleAgents);
      } else {
        setAgents(agentData);
      }
      
      console.log('✅ Agent data loaded successfully:', agentData.length);
    } catch (err) {
      console.error('❌ Error loading agent data:', err);
      setError('Failed to load agent data');
      
      // Fallback to sample data on error
      const fallbackAgents: EnhancedAgentRecord[] = [
        {
          id: 'fallback-1',
          name: 'AI Agent (Offline)',
          email: 'agent@auralis.com',
          status: 'offline',
          callsToday: 0,
          totalDurationSec: 0,
          updatedAt: new Date().toISOString()
        }
      ];
      setAgents(fallbackAgents);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAgentData();
  }, []);

  // Calculate agent stats
  const agentStats = {
    available: agents.filter(a => a.realTimeStatus?.isActive && a.status === 'available').length,
    busy: agents.filter(a => a.realTimeStatus?.currentConversations > 0 || a.status === 'busy').length,
    onBreak: agents.filter(a => a.status === 'break').length,
    offline: agents.filter(a => !a.realTimeStatus?.isActive || a.status === 'offline').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'busy': return 'destructive';
      case 'break': return 'secondary';
      case 'offline': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-blue-600">Agents Management</h2>
          <p className="text-muted-foreground text-sm md:text-base">Monitor and manage agent performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="ring-focus" 
            onClick={loadAgentData} 
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          <Button variant="outline" size="sm" className="ring-focus">
            <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Shifts</span>
          </Button>
          <Button variant="default" size="sm" className="ring-focus bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Add Agent</span>
          </Button>
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-sm border-blue-100 bg-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Available</p>
                <p className="text-lg md:text-xl font-bold text-gray-800">
                  {loading ? (
                    <span className="animate-pulse bg-gray-200 h-5 md:h-6 w-6 md:w-8 rounded inline-block"></span>
                  ) : (
                    agentStats.available
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-blue-100 bg-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Busy</p>
                <p className="text-lg md:text-xl font-bold text-gray-800">
                  {loading ? (
                    <span className="animate-pulse bg-gray-200 h-5 md:h-6 w-6 md:w-8 rounded inline-block"></span>
                  ) : (
                    agentStats.busy
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-blue-100 bg-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">On Break</p>
                <p className="text-lg md:text-xl font-bold text-gray-800">
                  {loading ? (
                    <span className="animate-pulse bg-gray-200 h-5 md:h-6 w-6 md:w-8 rounded inline-block"></span>
                  ) : (
                    agentStats.onBreak
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-blue-100 bg-white">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Offline</p>
                <p className="text-lg md:text-xl font-bold text-gray-800">
                  {loading ? (
                    <span className="animate-pulse bg-gray-200 h-5 md:h-6 w-6 md:w-8 rounded inline-block"></span>
                  ) : (
                    agentStats.offline
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card className="shadow-sm border-blue-100 bg-white">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center justify-between text-lg md:text-xl">
            Agent Directory
            {error && (
              <Badge variant="destructive" className="text-xs">
                {error}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-3 md:space-y-4">
            {loading ? (
              // Loading skeleton
              <div className="space-y-3 md:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24 md:w-32 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-32 md:w-48 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-20 md:w-24 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between sm:block sm:text-center space-x-2 sm:space-x-0">
                      <div className="h-6 bg-gray-200 rounded w-16 md:w-20 animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 md:w-16 animate-pulse"></div>
                    </div>
                    <div className="hidden sm:block text-right">
                      <div className="h-4 bg-gray-200 rounded w-16 md:w-20 animate-pulse mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 md:w-16 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : agents.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No agents found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Check your ElevenLabs configuration or try refreshing
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 ring-focus" 
                  onClick={loadAgentData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
            ) : (
              // Agent list
              agents.map((agent) => {
                const actualStatus = agent.realTimeStatus?.isActive 
                  ? (agent.realTimeStatus.currentConversations > 0 ? 'busy' : 'available')
                  : agent.status;

                const isExpanded = expandedAgent === agent.id;

                return (
                  <div key={agent.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-gray-50 transition-all cursor-pointer"
                      onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    >
                      <div className="flex items-center space-x-3 mb-3 sm:mb-0 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-semibold text-blue-800">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white ${getStatusColor(actualStatus)}`}>
                            {agent.realTimeStatus?.isActive && (
                              <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-75"></div>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 truncate">{agent.name}</p>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{agent.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {agent.configuration && (
                              <p className="text-xs text-gray-500">
                                {agent.configuration.language?.toUpperCase()} • {agent.configuration.voice}
                              </p>
                            )}
                            {agent.realTimeStatus?.currentConversations > 0 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {agent.realTimeStatus.currentConversations} active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6">
                        <div className="text-center hidden xs:block">
                          <Badge variant={getStatusVariant(actualStatus)} className="mb-1 text-xs">
                            {actualStatus}
                          </Badge>
                          {agent.metrics && (
                            <p className="text-xs text-gray-500">
                              Sat: {agent.metrics.customerSatisfaction}%
                            </p>
                          )}
                        </div>

                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-gray-800">
                            {agent.callsToday || agent.metrics?.totalConversations || 0} calls
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDuration(agent.totalDurationSec)}
                          </p>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1 h-8 w-8 ring-focus"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAgent(isExpanded ? null : agent.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded mobile view */}
                    {isExpanded && (
                      <div className="p-3 md:p-4 bg-blue-50 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <Badge variant={getStatusVariant(actualStatus)} className="mt-1">
                              {actualStatus}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Calls Today</p>
                            <p className="text-sm font-medium text-gray-800 mt-1">
                              {agent.callsToday || agent.metrics?.totalConversations || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Duration</p>
                            <p className="text-sm text-gray-800 mt-1">
                              {formatDuration(agent.totalDurationSec)}
                            </p>
                          </div>
                          {agent.metrics && (
                            <div>
                              <p className="text-xs text-gray-500">Satisfaction</p>
                              <p className="text-sm text-gray-800 mt-1">
                                {agent.metrics.customerSatisfaction}%
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="flex-1 ring-focus text-xs">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" className="ring-focus text-xs">
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};