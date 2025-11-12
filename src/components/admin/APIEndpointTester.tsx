import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Globe, Loader2, Play, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  description: string;
  category: 'ElevenLabs' | 'Twilio' | 'Firebase';
  requiredEnvVars: string[];
}

interface TestResult {
  endpointId: string;
  status: 'pending' | 'testing' | 'success' | 'error';
  responseTime?: number;
  statusCode?: number;
  error?: string;
  data?: any;
}

export const APIEndpointTester = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const endpoints: APIEndpoint[] = [
    {
      id: 'elevenlabs-call',
      name: 'ElevenLabs Call',
      url: '/api/elevenlabs-call',
      method: 'POST',
      description: 'Initiate outbound calls using ElevenLabs agents',
      category: 'ElevenLabs',
      requiredEnvVars: ['ELEVENLABS_API_KEY', 'ELEVENLABS_AGENT_ID', 'ELEVENLABS_PHONE_NUMBER_ID']
    },
    {
      id: 'elevenlabs-agents',
      name: 'ElevenLabs Agents',
      url: '/api/elevenlabs-agents',
      method: 'GET',
      description: 'Fetch all available ElevenLabs agents',
      category: 'ElevenLabs',
      requiredEnvVars: ['ELEVENLABS_API_KEY']
    },
    {
      id: 'elevenlabs-conversations',
      name: 'ElevenLabs Conversations',
      url: '/api/elevenlabs-conversations',
      method: 'GET',
      description: 'Fetch conversation history from ElevenLabs',
      category: 'ElevenLabs',
      requiredEnvVars: ['ELEVENLABS_API_KEY']
    },
    {
      id: 'twilio-calls',
      name: 'Twilio Calls',
      url: '/api/twilio-calls',
      method: 'GET',
      description: 'Fetch call logs from Twilio',
      category: 'Twilio',
      requiredEnvVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
    },
    {
      id: 'twilio-recordings',
      name: 'Twilio Recordings',
      url: '/api/twilio-recordings',
      method: 'GET',
      description: 'Fetch call recordings from Twilio',
      category: 'Twilio',
      requiredEnvVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
    }
  ];

  const updateTestResult = (endpointId: string, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.endpointId === endpointId);
      if (existing) {
        return prev.map(r => 
          r.endpointId === endpointId 
            ? { ...r, ...result }
            : r
        );
      } else {
        return [...prev, { endpointId, status: 'pending', ...result }];
      }
    });
  };

  const testEndpoint = async (endpoint: APIEndpoint) => {
    const startTime = Date.now();
    updateTestResult(endpoint.id, { status: 'testing' });

    try {
      console.log(`🧪 Testing endpoint: ${endpoint.name}`);

      let response;
      if (endpoint.method === 'GET') {
        response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else if (endpoint.method === 'POST' && endpoint.id === 'elevenlabs-call') {
        // For call endpoint, use test phone number
        response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: '+1-555-TEST-123' // Test number that should fail gracefully
          }),
        });
      }

      const responseTime = Date.now() - startTime;
      const data = await response?.json();

      if (response?.ok) {
        updateTestResult(endpoint.id, {
          status: 'success',
          responseTime,
          statusCode: response.status,
          data
        });
        console.log(`✅ ${endpoint.name}: Success (${responseTime}ms)`);
      } else {
        // Some errors are expected (like invalid test phone number)
        const isExpectedError = 
          endpoint.id === 'elevenlabs-call' && 
          (data?.error?.includes('phone') || data?.error?.includes('number'));

        updateTestResult(endpoint.id, {
          status: isExpectedError ? 'success' : 'error',
          responseTime,
          statusCode: response?.status,
          error: data?.error || 'Unknown error',
          data
        });

        if (isExpectedError) {
          console.log(`✅ ${endpoint.name}: Expected validation error (${responseTime}ms)`);
        } else {
          console.log(`❌ ${endpoint.name}: Error - ${data?.error}`);
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      
      updateTestResult(endpoint.id, {
        status: 'error',
        responseTime,
        error: errorMessage
      });
      
      console.error(`❌ ${endpoint.name}: ${errorMessage}`);
    }
  };

  const testAllEndpoints = async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    console.log('🚀 Starting API endpoints test suite...');
    
    try {
      // Test all endpoints in parallel
      await Promise.all(
        endpoints.map(endpoint => testEndpoint(endpoint))
      );
      
      console.log('✅ API endpoint testing completed');
    } catch (error) {
      console.error('❌ Error during API testing:', error);
    } finally {
      setIsTestingAll(false);
    }
  };

  const getTestResult = (endpointId: string): TestResult | undefined => {
    return testResults.find(r => r.endpointId === endpointId);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'testing':
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
      case 'testing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Testing</Badge>;
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  const getCategoryColor = (category: APIEndpoint['category']) => {
    switch (category) {
      case 'ElevenLabs':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Twilio':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Firebase':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalTests = endpoints.length;
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
                <Globe className="h-5 w-5 mr-2" />
                API Endpoints Testing
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Test all API endpoints to ensure proper integration with ElevenLabs and Twilio
              </p>
            </div>
            <Button
              onClick={testAllEndpoints}
              disabled={isTestingAll}
              className="ring-focus"
              variant="coral"
            >
              {isTestingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test All Endpoints
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

          {/* API Endpoints List */}
          <div className="space-y-3">
            {endpoints.map((endpoint) => {
              const result = getTestResult(endpoint.id);
              
              return (
                <div key={endpoint.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result?.status || 'pending')}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{endpoint.name}</h4>
                          <Badge variant="outline" className={getCategoryColor(endpoint.category)}>
                            {endpoint.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {endpoint.method}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">{endpoint.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result?.responseTime && (
                        <span className="text-xs text-muted-foreground">
                          {result.responseTime}ms
                        </span>
                      )}
                      {getStatusBadge(result?.status || 'pending')}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testEndpoint(endpoint)}
                        disabled={result?.status === 'testing'}
                      >
                        {result?.status === 'testing' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Required Environment Variables */}
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Required environment variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.requiredEnvVars.map(envVar => (
                        <Badge key={envVar} variant="outline" className="text-xs">
                          {envVar}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Error Details */}
                  {result?.error && result.status === 'error' && (
                    <Alert className="mt-3 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-700 text-sm">
                        <strong>Error:</strong> {result.error}
                        {result.statusCode && <span className="ml-2">(Status: {result.statusCode})</span>}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Details */}
                  {result?.status === 'success' && result.data && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <p className="text-green-700 font-medium">Response:</p>
                      <pre className="text-green-600 mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2).substring(0, 300)}
                        {JSON.stringify(result.data).length > 300 ? '...' : ''}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Setup Instructions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Configure your ElevenLabs API key in environment variables</li>
              <li>2. Set up your Twilio Account SID and Auth Token</li>
              <li>3. Ensure your ElevenLabs agent and phone number are configured</li>
              <li>4. Test endpoints individually or run the full test suite</li>
              <li>5. Check error messages for specific configuration issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};