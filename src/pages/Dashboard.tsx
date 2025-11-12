import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Phone, 
  Users, 
  Clock, 
  TrendingUp, 
  Settings, 
  Bell,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronDown,
  Play,
  Pause,
  Volume2,
  HelpCircle,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { CallLogsSection } from '@/components/dashboard/CallLogsSection';
import { AgentsSection } from '@/components/dashboard/AgentsSection';
import { SupportSection } from '@/components/dashboard/SupportSection';
import { SettingsSection } from '@/components/dashboard/SettingsSection';
import { ConvoLogsSection } from '@/components/dashboard/ConvoLogsSection';
import { CallInterface } from '@/components/sections/CallInterface';
import { listRecentCalls, fetchTwilioRecentCalls, upsertCalls, enrichCallsWithRecordings } from '@/lib/callsService';
import { getRecentCalls, subscribeToCalls, getCallStatistics } from '@/lib/firebaseService';
import { dashboardService } from '@/lib/dashboardService';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import type { CallRecord, DashboardKPIs, EnhancedAgentRecord } from '@/lib/types';

export const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isCallActive, setIsCallActive] = useState(false);
  const [quickRange, setQuickRange] = useState<'today' | '7d' | '30d'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Real-time updates
  const { 
    realTimeData, 
    isOnline, 
    markNotificationAsRead, 
    clearAllNotifications 
  } = useRealTimeUpdates();

  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [enhancedAgents, setEnhancedAgents] = useState<EnhancedAgentRecord[]>([]);
  const [realTimeActivity, setRealTimeActivity] = useState<{
    activeCalls: number;
    callsInQueue: number;
    avgWaitTime: number;
    peakHourActivity: boolean;
  } | null>(null);

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Helper function to format percentage change
  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Helper function to get change icon
  const getChangeIcon = (change: number) => {
    if (change > 0.5) return ArrowUp;
    if (change < -0.5) return ArrowDown;
    return Minus;
  };

  // Helper function to get change color
  const getChangeColor = (change: number): string => {
    if (change > 0.5) return 'text-green-600';
    if (change < -0.5) return 'text-red-600';
    return 'text-muted-foreground';
  };

  // Handle closing dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdowns if clicking outside
      if (!event.target) return;
      
      const target = event.target as Element;
      
      // Check if click is outside notifications dropdown
      if (showNotifications && !target.closest('[data-notifications-dropdown]')) {
        setShowNotifications(false);
      }
      
      // Check if click is outside profile dropdown
      if (showProfileMenu && !target.closest('[data-profile-dropdown]')) {
        setShowProfileMenu(false);
      }
      
      // Check if click is outside mobile sidebar
      if (mobileSidebarOpen && !target.closest('[data-mobile-sidebar]') && !target.closest('[data-mobile-menu-button]')) {
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfileMenu, mobileSidebarOpen]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Loading dashboard data...');

      // Load data in parallel
      const [kpisData, agentsData, activityData, callsData] = await Promise.all([
        dashboardService.calculateDashboardKPIs(),
        dashboardService.getEnhancedAgentData(),
        dashboardService.getRealTimeCallActivity(),
        loadRecentCalls()
      ]);

      setKpis(kpisData);
      setEnhancedAgents(agentsData);
      setRealTimeActivity(activityData);
      setRecentCalls(callsData);

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load recent calls (enhanced with new Firebase service)
  const loadRecentCalls = async (): Promise<CallRecord[]> => {
    try {
      console.log('🔄 Loading recent calls from Firebase...');
      
      // Try to get calls from new Firebase service first (voiceCalls collection)
      let calls = await getRecentCalls(10);
      
      if (calls.length === 0) {
        console.log('⚠️ No calls found in Firebase, trying legacy service...');
        // Fallback to legacy service
        calls = await listRecentCalls(1, 10);
        
        if (calls.length === 0) {
          console.log('⚠️ No calls found in legacy service, trying Twilio...');
          // Fallback to Twilio and backfill Firestore
          let twilioCalls = await fetchTwilioRecentCalls(10);
          twilioCalls = await enrichCallsWithRecordings(twilioCalls);
          await upsertCalls(twilioCalls);
          calls = twilioCalls;
        }
      }
      
      console.log(`✅ Loaded ${calls.length} recent calls`);
      return calls;
    } catch (error) {
      console.error('❌ Error loading recent calls:', error);
      return [];
    }
  };

  // Initial data load
  useEffect(() => {
    loadDashboardData();

    // Set up real-time KPI updates
    const unsubscribe = dashboardService.subscribeToKPIUpdates((updatedKpis) => {
      if (updatedKpis) {
        setKpis(updatedKpis);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-refresh data every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing) {
        loadDashboardData();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshing]);

  // Create stats array from KPIs
  const stats = useMemo(() => {
    if (!kpis) {
      return [
        { title: 'Total Calls Today', value: '-', change: '+0%', icon: Phone, color: 'text-blue-600', changeIcon: Minus },
        { title: 'Active Agents', value: '-', change: '+0%', icon: Users, color: 'text-green-600', changeIcon: Minus },
        { title: 'Avg Call Duration', value: '-', change: '+0%', icon: Clock, color: 'text-purple-600', changeIcon: Minus },
        { title: 'Call Quality Score', value: '-', change: '+0%', icon: TrendingUp, color: 'text-blue-500', changeIcon: Minus },
      ];
    }

    return [
      {
        title: 'Total Calls Today',
        value: kpis.totalCallsToday.toString(),
        change: formatChange(kpis.totalCallsChange),
        icon: Phone,
        color: 'text-blue-600',
        changeIcon: getChangeIcon(kpis.totalCallsChange),
        changeColor: getChangeColor(kpis.totalCallsChange)
      },
      {
        title: 'Active Agents',
        value: kpis.activeAgents.toString(),
        change: formatChange(kpis.activeAgentsChange),
        icon: Users,
        color: 'text-green-600',
        changeIcon: getChangeIcon(kpis.activeAgentsChange),
        changeColor: getChangeColor(kpis.activeAgentsChange)
      },
      {
        title: 'Avg Call Duration',
        value: formatDuration(Math.round(kpis.avgCallDuration)),
        change: formatChange(kpis.avgCallDurationChange),
        icon: Clock,
        color: 'text-purple-600',
        changeIcon: getChangeIcon(kpis.avgCallDurationChange),
        changeColor: getChangeColor(kpis.avgCallDurationChange)
      },
      {
        title: 'Call Quality Score',
        value: `${Math.round(kpis.callQualityScore)}%`,
        change: formatChange(kpis.callQualityChange),
        icon: TrendingUp,
        color: 'text-blue-500',
        changeIcon: getChangeIcon(kpis.callQualityChange),
        changeColor: getChangeColor(kpis.callQualityChange)
      },
    ];
  }, [kpis]);

  // Use enhanced agents data or fallback
  const activeAgentsData = useMemo(() => {
    if (enhancedAgents.length > 0) {
      return enhancedAgents.slice(0, 4).map(agent => ({
        name: agent.name,
        status: agent.realTimeStatus?.isActive 
          ? (agent.realTimeStatus.currentConversations > 0 ? 'busy' : 'available')
          : agent.status,
        calls: agent.callsToday || agent.metrics?.totalConversations || 0,
        duration: formatDuration(agent.totalDurationSec || 0),
        isActive: agent.realTimeStatus?.isActive || false,
        currentConversations: agent.realTimeStatus?.currentConversations || 0
      }));
    }
    
    // Fallback data if no enhanced agents loaded yet
    return [
      { name: 'Loading...', status: 'offline', calls: 0, duration: '0:00', isActive: false, currentConversations: 0 }
    ];
  }, [enhancedAgents, formatDuration]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'make-call', label: 'Make Call', icon: Phone },
    { id: 'call-logs', label: 'Call Logs', icon: Phone },
    { id: 'agents', label: 'Agents', icon: Users },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'convo-logs', label: 'Convo Logs', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredRecentCalls = useMemo(() => {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const windowMs = quickRange === 'today' ? msInDay : quickRange === '7d' ? 7 * msInDay : 30 * msInDay;
    return recentCalls.filter(c => now - new Date(c.createdAt).getTime() <= windowMs);
  }, [quickRange, recentCalls]);

  const timeAgo = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(diff / (60 * 1000));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'make-call':
        return <CallInterface />;
      case 'call-logs':
        return <CallLogsSection />;
      case 'agents':
        return <AgentsSection />;
      case 'support':
        return <SupportSection />;
      case 'convo-logs':
        return <ConvoLogsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="shadow-sm border-blue-100 bg-white fade-in">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground/80 truncate">{stat.title}</p>
                        <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 mt-1">
                          {isLoading ? (
                            <span className="animate-pulse bg-gray-200 h-6 md:h-8 w-12 md:w-16 rounded inline-block"></span>
                          ) : (
                            stat.value
                          )}
                        </p>
                        <div className={`mt-1 text-xs md:text-sm flex items-center space-x-1 ${(stat as any).changeColor || 'text-muted-foreground'}`}>
                          {!isLoading && (stat as any).changeIcon && (() => {
                            const ChangeIcon = (stat as any).changeIcon;
                            return <ChangeIcon className="h-3 w-3" />;
                          })()}
                          <span className="truncate">{stat.change} from yesterday</span>
                          {refreshing && (
                            <div className="ml-2 animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="p-2 md:p-3 rounded-xl bg-blue-50 ml-2">
                        <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Recent Calls */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm border-blue-100 bg-white fade-in">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                    <CardTitle className="text-lg">Recent Calls</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="inline-flex items-center rounded-full border border-gray-200 p-1 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuickRange('today')}
                          className={`px-2 h-7 md:h-8 text-xs md:text-sm flex items-center gap-1 transition-all ${
                            quickRange === 'today' 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'text-foreground hover:bg-gray-100'
                          }`}
                        >
                          <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden xs:inline">Today</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickRange('7d')}
                          className={`px-2 h-7 md:h-8 text-xs md:text-sm transition-all ${
                            quickRange === '7d' 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'text-foreground hover:bg-gray-100'
                          }`}
                        >
                          7d
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickRange('30d')}
                          className={`px-2 h-7 md:h-8 text-xs md:text-sm transition-all ${
                            quickRange === '30d' 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'text-foreground hover:bg-gray-100'
                          }`}
                        >
                          30d
                        </button>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 md:h-8 text-xs md:text-sm ring-focus">
                        <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 md:h-8 text-xs md:text-sm ring-focus">
                        <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredRecentCalls.map((call) => (
                        <div key={call.callId} className="flex flex-col xs:flex-row xs:items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3 mb-2 xs:mb-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Phone className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate">{call.toNumber}</p>
                              {call.fromNumber && (
                                <p className="text-xs text-muted-foreground truncate">From: {call.fromNumber}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex xs:flex-col xs:items-end justify-between xs:justify-center xs:space-y-1">
                            <p className="text-xs md:text-sm font-medium">{call.durationSec ? `${Math.floor(call.durationSec/60)}:${String(call.durationSec%60).padStart(2,'0')}` : '-'}</p>
                            <Badge variant={call.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {call.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 xs:mt-0 xs:text-right xs:self-start">{timeAgo(new Date(call.createdAt).getTime())}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Agents */}
              <div className="space-y-4 md:space-y-6">
                <Card className="shadow-sm border-blue-100 bg-white fade-in">
                  <CardHeader>
                    <CardTitle className="text-lg">Active Agents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isLoading ? (
                        <div className="text-center py-2">
                          <div className="animate-pulse space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-1">
                                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                                  <div className="h-2 bg-gray-200 rounded w-16"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        activeAgentsData.map((agent, index) => (
                          <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="relative">
                                <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-800">
                                  {agent.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white ${
                                  agent.status === 'available' ? 'bg-green-500' :
                                  agent.status === 'busy' ? 'bg-red-500' : 
                                  agent.status === 'break' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}>
                                  {agent.isActive && (
                                    <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20"></div>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{agent.name}</p>
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-muted-foreground capitalize truncate">{agent.status}</p>
                                  {agent.currentConversations > 0 && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      {agent.currentConversations} active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-xs font-medium text-gray-800">{agent.calls} calls</p>
                              <p className="text-xs text-muted-foreground">{agent.duration}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Live Activity Monitor */}
                <Card className="shadow-sm border-blue-100 bg-white fade-in">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Real-time Activity
                      {realTimeData.activeConversations.length > 0 && (
                        <Badge variant="default" className="animate-pulse">
                          {realTimeData.activeConversations.length} active
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Real-time Stats */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                          <p className="text-xl md:text-2xl font-bold text-blue-600">{realTimeActivity?.activeCalls || 0}</p>
                          <p className="text-xs text-muted-foreground">Active Calls</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                          <p className="text-xl md:text-2xl font-bold text-green-600">{realTimeData.activeConversations.length}</p>
                          <p className="text-xs text-muted-foreground">Conversations</p>
                        </div>
                      </div>
                      
                      {/* Recent Activity Feed */}
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Activity</p>
                        {realTimeData.recentActivity.length > 0 ? (
                          realTimeData.recentActivity.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 rounded-md bg-gray-50">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.severity === 'error' ? 'bg-red-500' :
                                activity.severity === 'warning' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{activity.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">No recent activity</p>
                        )}
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex space-x-2">
                        <Button 
                          variant="default"
                          size="sm"
                          className="flex-1 ring-focus bg-blue-600 hover:bg-blue-700"
                          onClick={() => loadDashboardData()}
                          disabled={refreshing}
                        >
                          <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ring-focus"
                          onClick={() => clearAllNotifications()}
                          disabled={realTimeData.unreadNotificationsCount === 0}
                        >
                          <Bell className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button 
              data-mobile-menu-button
              className="md:hidden p-1 rounded-md hover:bg-gray-100"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xl md:text-2xl font-bold text-blue-600">Auralis</div>
            <Badge variant="secondary" className="rounded-full hidden sm:inline-flex">Dashboard</Badge>
            {kpis && (
              <Badge variant="outline" className="text-xs px-2 py-1 hidden md:inline-flex">
                Last updated: {new Date(kpis.timestamp).toLocaleTimeString()}
              </Badge>
            )}
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                !isOnline ? 'bg-gray-400' :
                realTimeData.connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                realTimeData.connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-xs text-muted-foreground hidden xs:inline">
                {!isOnline ? 'Offline' : realTimeData.connectionStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 w-40 md:w-64 ring-focus" />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`ring-focus h-9 w-9 ${refreshing ? 'animate-spin' : ''}`}
              onClick={() => !refreshing && loadDashboardData()}
              disabled={refreshing}
            >
              <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="relative" data-notifications-dropdown>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ring-focus relative h-9 w-9"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className={`h-4 w-4 md:h-5 md:w-5 ${realTimeData.unreadNotificationsCount > 0 ? 'text-blue-600' : ''}`} />
                {realTimeData.unreadNotificationsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 animate-pulse"
                  >
                    {realTimeData.unreadNotificationsCount > 99 ? '99+' : realTimeData.unreadNotificationsCount}
                  </Badge>
                )}
              </Button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowNotifications(false)}
                  />
                  
                  {/* Notifications Card */}
                  <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 z-40 shadow-lg border border-gray-200 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                      <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {realTimeData.unreadNotificationsCount} new
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            clearAllNotifications();
                            setShowNotifications(false);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          Mark all read
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-80 overflow-y-auto">
                        {realTimeData.notifications.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {realTimeData.notifications.slice(0, 10).map((notification, index) => {
                              const getSeverityIcon = (severity: string) => {
                                switch (severity) {
                                  case 'error':
                                    return (
                                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    );
                                  case 'warning':
                                    return (
                                      <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    );
                                  default:
                                    return (
                                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    );
                                }
                              };

                              const getTimeAgo = (dateString: string) => {
                                const now = new Date();
                                const date = new Date(dateString);
                                const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
                                
                                if (diffInMinutes < 1) return 'just now';
                                if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                                if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
                                return `${Math.floor(diffInMinutes / 1440)}d ago`;
                              };

                              const truncateMessage = (message: string, maxLength: number = 60) => {
                                return message.length > maxLength 
                                  ? message.substring(0, maxLength) + '...'
                                  : message;
                              };

                              return (
                                <div 
                                  key={notification.id || index}
                                  className={`group p-3 hover:bg-gray-50 transition-all cursor-pointer relative ${
                                    !notification.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                                  }`}
                                  onClick={() => {
                                    if (!notification.isRead) {
                                      markNotificationAsRead(notification.id);
                                    }
                                  }}
                                >
                                  {/* Unread indicator */}
                                  {!notification.isRead && (
                                    <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  
                                  <div className="flex items-start space-x-3">
                                    {/* Severity Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                      {getSeverityIcon(notification.severity)}
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                      {/* Header: Title and Priority */}
                                      <div className="flex items-start justify-between">
                                        <h4 className={`text-sm font-medium text-gray-900 leading-tight ${
                                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                        }`}>
                                          {notification.title}
                                        </h4>
                                        
                                        {notification.metadata?.priority && (
                                        <Badge 
                                        variant={notification.metadata.priority === 'high' ? 'destructive' : 
                                               notification.metadata.priority === 'medium' ? 'default' : 'secondary'}
                                        className="ml-2 text-xs px-1.5 py-0.5 flex-shrink-0"
                                        >
                                        {notification.metadata.priority}
                                        </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Message Preview */}
                                      <p className="text-xs text-gray-600 leading-relaxed">
                                        {truncateMessage(notification.message)}
                                      </p>
                                      
                                      {/* Footer: Time and Assignee */}
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2 text-gray-500">
                                          <span>{getTimeAgo(notification.createdAt)}</span>
                                          {notification.metadata?.assignee && (
                                            <>
                                              <span>•</span>
                                              <span className="font-medium">
                                                {notification.metadata.assignee}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        
                                        {/* Action Link */}
                                        {notification.actionRequired && notification.actionUrl && (
                                          <a 
                                            href={notification.actionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Action →
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                              <Bell className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 mb-1">All caught up!</p>
                            <p className="text-xs text-gray-400">No new notifications</p>
                          </div>
                        )}
                      </div>
                      
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ring-focus h-9 w-9"
              onClick={() => setActiveSection('settings')}
              title="Settings"
            >
              <Settings className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="relative" data-profile-dropdown>
              <button 
                className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  JD
                </div>
                <span className="text-sm font-medium hidden md:inline">John Doe</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:inline" />
              </button>
              
              {/* Profile Dropdown */}
              {showProfileMenu && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowProfileMenu(false)}
                  />
                  
                  {/* Profile Menu Card */}
                  <Card className="absolute right-0 top-full mt-2 w-64 z-40 shadow-lg border border-gray-200 bg-white">
                    <CardContent className="p-0">
                      {/* Profile Header */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            JD
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">John Doe</p>
                            <p className="text-sm text-gray-600">Administrator</p>
                            <p className="text-xs text-gray-500">john.doe@auralis.com</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="p-2">
                        <button 
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => {
                            setActiveSection('settings');
                            setShowProfileMenu(false);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Account Settings</span>
                        </button>
                        
                        <button 
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => {
                            setActiveSection('support');
                            setShowProfileMenu(false);
                          }}
                        >
                          <HelpCircle className="h-4 w-4" />
                          <span>Help & Support</span>
                        </button>
                        
                        <button 
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => {
                            console.log('Activity log clicked');
                            setShowProfileMenu(false);
                          }}
                        >
                          <Clock className="h-4 w-4" />
                          <span>Activity Log</span>
                        </button>
                        
                        <div className="h-px bg-gray-200 my-2"></div>
                        
                        <button 
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-left hover:bg-red-50 text-red-600 rounded-md transition-colors"
                          onClick={() => {
                            if (confirm('Are you sure you want to logout?')) {
                              // Handle logout logic here
                              window.location.href = '/';
                            }
                            setShowProfileMenu(false);
                          }}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>
                      
                      {/* Status Footer */}
                      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              !isOnline ? 'bg-gray-400' :
                              realTimeData.connectionStatus === 'connected' ? 'bg-green-500' :
                              'bg-red-500'
                            }`}></div>
                            <span>{!isOnline ? 'Offline' : realTimeData.connectionStatus}</span>
                          </div>
                          <span>v1.0.0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 h-[calc(100vh-64px)] sticky top-16 hidden md:block">
          <div className="h-full p-4 overflow-y-auto">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <Button 
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className={`w-full justify-start ${activeSection === item.id ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>

            <div className="mt-6 border-t border-gray-200" />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileSidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}></div>
            <aside 
              data-mobile-sidebar
              className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 md:hidden transform transition-transform duration-300 ease-in-out shadow-lg"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="text-xl font-bold text-blue-600">Auralis</div>
                <button onClick={() => setMobileSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="h-full p-4 overflow-y-auto">
                <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                    <Button 
                      key={item.id}
                      variant={activeSection === item.id ? 'default' : 'ghost'}
                      className={`w-full justify-start ${activeSection === item.id ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileSidebarOpen(false);
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;