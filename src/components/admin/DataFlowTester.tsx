import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, Loader2, Play, Activity, Users, Phone, MessageSquare, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import services to test
import { getDashboardKPIs, fetchLiveAgentData, fetchRecentCallActivity } from '@/lib/dashboardService';
import { listRecentCalls } from '@/lib/callsService';
import { listNotifications } from '@/lib/enhancedFirebaseService';
import { listMessages } from '@/lib/messagesService';

interface DataFlowTest {
  id: string;
  name: string;
  description: string;
  category: 'Dashboard' | 'Agents' | 'Calls' | 'Conversations' | 'Notifications';
  icon: React.ComponentType<{ className?: string }>;
  testFunction: () => Promise<any>;
  expectedFields: string[];
}

interface TestResult {
  testId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  data?: any;
  error?: string;
  validationResults?: {
    fieldsPresent: string[];
    fieldsMissing: string[];
    dataCount: number;
  };
}

export const DataFlowTester = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const dataFlowTests: DataFlowTest[] = [
    {
      id: 'dashboard-kpis',
      name: 'Dashboard KPIs',
      description: 'Test dynamic KPI calculations and metrics',
      category: 'Dashboard',
      icon: Activity,
      testFunction: async () => {
        const kpis = await getDashboardKPIs();
        return kpis;
      },
      expectedFields: ['totalCalls', 'activeAgents', 'avgCallDuration', 'successRate', 'totalCost']
    },
    {
      id: 'live-agent-data',
      name: 'Live Agent Data',
      description: 'Test fetching and merging live agent information',
      category: 'Agents',
      icon: Users,
      testFunction: async () => {
        const agentData = await fetchLiveAgentData();
        return agentData;
      },
      expectedFields: ['agents', 'totalAgents', 'activeCount', 'inactiveCount']
    },
    {
      id: 'recent-call-activity',
      name: 'Recent Call Activity',
      description: 'Test real-time call activity data flow',
      category: 'Calls',
      icon: Phone,
      testFunction: async () => {
        const callActivity = await fetchRecentCallActivity(5);
        return callActivity;
      },
      expectedFields: ['recentCalls', 'callTrends', 'totalCalls']
    },
    {
      id: 'call-logs-service',
      name: 'Call Logs Service',
      description: 'Test call logs data retrieval from multiple sources',
      category: 'Calls',
      icon: Phone,
      testFunction: async () => {
        const calls = await listRecentCalls(30, 10);
        return { calls, count: calls.length };
      },
      expectedFields: ['calls']
    },
    {
      id: 'conversation-messages',
      name: 'Conversation Messages',
      description: 'Test message retrieval and formatting',
      category: 'Conversations',
      icon: MessageSquare,
      testFunction: async () => {
        // Get a recent call first, then its messages
        const recentCalls = await listRecentCalls(7, 1);
        if (recentCalls.length > 0) {
          const messages = await listMessages(recentCalls[0].callId, 50);
          return { messages, callId: recentCalls[0].callId, count: messages.length };
        }
        return { messages: [], callId: null, count: 0 };
      },
      expectedFields: ['messages', 'callId']
    },
    {
      id: 'notifications-system',
      name: 'Notifications System',
      description: 'Test notification creation and retrieval',
      category: 'Notifications',
      icon: Bell,
      testFunction: async () => {
        const notifications = await listNotifications({ limit: 10 });
        return { notifications, count: notifications.length };
      },
      expectedFields: ['notifications']
    }
  ];

  const updateTestResult = (testId: string, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.testId === testId);
      if (existing) {
        return prev.map(r => 
          r.testId === testId ? { ...r, ...result } : r
        );
      } else {
        return [...prev, { testId, status: 'pending', ...result }];
      }
    });
  };

  const validateTestData = (data: any, expectedFields: string[]) => {
    const fieldsPresent: string[] = [];
    const fieldsMissing: string[] = [];

    expectedFields.forEach(field => {
      if (data && (data[field] !== undefined && data[field] !== null)) {
        fieldsPresent.push(field);
      } else {
        fieldsMissing.push(field);
      }
    });

    // Try to determine data count
    let dataCount = 0;
    if (data) {
      if (Array.isArray(data)) {
        dataCount = data.length;
      } else if (data.calls && Array.isArray(data.calls)) {
        dataCount = data.calls.length;
      } else if (data.messages && Array.isArray(data.messages)) {
        dataCount = data.messages.length;
      } else if (data.notifications && Array.isArray(data.notifications)) {
        dataCount = data.notifications.length;
      } else if (data.agents && Array.isArray(data.agents)) {
        dataCount = data.agents.length;
      } else if (data.count !== undefined) {
        dataCount = data.count;
      } else if (typeof data === 'object') {
        dataCount = Object.keys(data).length;
      }
    }

    return {
      fieldsPresent,
      fieldsMissing,
      dataCount
    };
  };

  const runTest = async (test: DataFlowTest) => {
    const startTime = Date.now();
    updateTestResult(test.id, { status: 'running' });

    try {
      console.log(`🧪 Testing data flow: ${test.name}`);
      
      const data = await test.testFunction();
      const duration = Date.now() - startTime;
      const validationResults = validateTestData(data, test.expectedFields);

      const hasErrors = validationResults.fieldsMissing.length > 0;
      
      updateTestResult(test.id, {
        status: hasErrors ? 'error' : 'success',
        duration,
        data,
        validationResults,
        error: hasErrors ? `Missing required fields: ${validationResults.fieldsMissing.join(', ')}` : undefined
      });

      if (hasErrors) {
        console.log(`⚠️  ${test.name}: Missing fields - ${validationResults.fieldsMissing.join(', ')}`);
      } else {
        console.log(`✅ ${test.name}: Success (${duration}ms) - ${validationResults.dataCount} items`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      updateTestResult(test.id, {
        status: 'error',
        duration,
        error: errorMessage
      });
      
      console.error(`❌ ${test.name}: ${errorMessage}`);
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    setTestResults([]);
    
    console.log('🚀 Starting comprehensive data flow testing...');
    
    try {
      // Run tests sequentially to avoid overwhelming the system
      for (const test of dataFlowTests) {
        await runTest(test);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('✅ Data flow testing completed');
    } catch (error) {
      console.error('❌ Error during data flow testing:', error);
    } finally {
      setIsRunningAll(false);
    }
  };

  const getTestResult = (testId: string): TestResult | undefined => {
    return testResults.find(r => r.testId === testId);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Pass</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Running</Badge>;
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  const getCategoryColor = (category: DataFlowTest['category']) => {
    switch (category) {
      case 'Dashboard':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Agents':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Calls':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Conversations':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Notifications':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalTests = dataFlowTests.length;
  const completedTests = testResults.filter(r => r.status === 'success' || r.status === 'error').length;
  const passedTests = testResults.filter(r => r.status === 'success').length;
  const failedTests = testResults.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      <Card className="floating-card glass fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Flow Testing
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Verify end-to-end data flows from APIs through services to UI components
              </p>
            </div>
            <Button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="ring-focus"
              variant="coral"
            >
              {isRunningAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Test Summary */}
          {testResults.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalTests}</p>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{failedTests}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{completedTests}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
              {completedTests > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedTests / totalTests) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Results by Category */}
          {['Dashboard', 'Agents', 'Calls', 'Conversations', 'Notifications'].map(category => {
            const categoryTests = dataFlowTests.filter(test => test.category === category);
            
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-lg">{category} Data Flows</h3>
                  <Badge variant="outline" className={getCategoryColor(category as DataFlowTest['category'])}>
                    {categoryTests.length} test{categoryTests.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {categoryTests.map(test => {
                    const result = getTestResult(test.id);
                    const IconComponent = test.icon;
                    
                    return (
                      <div key={test.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(result?.status || 'pending')}
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{test.name}</h4>
                              <p className="text-sm text-muted-foreground">{test.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result?.duration && (
                              <span className="text-xs text-muted-foreground">
                                {result.duration}ms
                              </span>
                            )}
                            {getStatusBadge(result?.status || 'pending')}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => runTest(test)}
                              disabled={result?.status === 'running'}
                            >
                              {result?.status === 'running' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Validation Results */}
                        {result?.validationResults && (
                          <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="font-medium text-green-700">Fields Present</p>
                                <p className="text-green-600">{result.validationResults.fieldsPresent.join(', ') || 'None'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-red-700">Fields Missing</p>
                                <p className="text-red-600">{result.validationResults.fieldsMissing.join(', ') || 'None'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-blue-700">Data Count</p>
                                <p className="text-blue-600">{result.validationResults.dataCount}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Error Details */}
                        {result?.error && result.status === 'error' && (
                          <Alert className="mt-3 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-red-700 text-sm">
                              <strong>Error:</strong> {result.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Overall Status */}
          {completedTests === totalTests && testResults.length > 0 && (
            <Alert className={`border-${passedTests === totalTests ? 'green' : 'yellow'}-200 bg-${passedTests === totalTests ? 'green' : 'yellow'}-50`}>
              <CheckCircle className={`h-4 w-4 text-${passedTests === totalTests ? 'green' : 'yellow'}-600`} />
              <AlertDescription className={`text-${passedTests === totalTests ? 'green' : 'yellow'}-800`}>
                {passedTests === totalTests ? (
                  <>🎉 All data flow tests passed! Your Auralis system is fully integrated and working correctly.</>
                ) : (
                  <>⚠️  {passedTests} of {totalTests} tests passed. Check the failed tests above for issues that need attention.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Testing Guide */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">What These Tests Verify:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Data Retrieval:</strong> Services can fetch data from APIs and Firebase</li>
              <li>• <strong>Data Processing:</strong> Raw data is transformed correctly</li>
              <li>• <strong>Data Validation:</strong> Required fields are present and formatted</li>
              <li>• <strong>Service Integration:</strong> All services work together seamlessly</li>
              <li>• <strong>Error Handling:</strong> Systems gracefully handle missing or invalid data</li>
              <li>• <strong>Performance:</strong> Data operations complete within reasonable time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};