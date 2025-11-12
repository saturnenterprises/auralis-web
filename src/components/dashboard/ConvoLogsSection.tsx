import { useState, useEffect, useRef } from 'react';
import { listRecentCalls, createCallRecord } from '@/lib/callsService';
import { listMessages, addMessage } from '@/lib/messagesService';
import type { CallRecord, ConversationMessage as DbMessage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Terminal, Play, Pause, Download, Trash2, Bot, Phone, PhoneCall, Clock,
  AlertCircle, CheckCircle, XCircle, RefreshCw, User
} from 'lucide-react';

// ---------------- Types ----------------
interface ConvoMessage {
  id: string;
  type: 'ai' | 'human';
  speaker: string;
  message: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: (phone: string) => string;
}

// ---------------- Country List ----------------
const countries: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', format: (p) => p.replace(/\D/g, '').replace(/(\d{5})(\d{5})/, '$1 $2') },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: (p) => p.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', format: (p) => p.replace(/\D/g, '').replace(/(\d{4})(\d{6})/, '$1 $2') },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: (p) => p.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') },
];

// ---------------- Component ----------------
export const ConvoLogsSection = () => {
  const [isLive, setIsLive] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'unknown' | 'active' | 'inactive' | 'error'>('unknown');
  const [agentStatusText, setAgentStatusText] = useState('Checking...');
  const [agentStatusColor, setAgentStatusColor] = useState('gray');
  const [messages, setMessages] = useState<ConvoMessage[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mock agent status
  const checkAgentStatus = async () => {
    setTimeout(() => {
      setAgentStatus('active');
      setAgentStatusText('Agent Online');
      setAgentStatusColor('green');
    }, 800);
  };

  // ---------------- Mock conversation loader ----------------
  const loadRecentConversation = async () => {
    setIsLoadingMessages(true);
    try {
      const fakeMsgs: ConvoMessage[] = [
        { id: '1', type: 'human', speaker: 'Customer', message: 'Hello, I need help with my order.', timestamp: '12:01:10', sentiment: 'neutral' },
        { id: '2', type: 'ai', speaker: 'Auralis AI', message: 'Sure, could you provide me your order ID?', timestamp: '12:01:20', sentiment: 'positive' },
      ];
      setMessages(fakeMsgs);
    } catch {
      setMessagesError('Failed to load messages.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, callStartTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMakeCall = () => {
    setIsCallActive(true);
    setCallStartTime(new Date());
    setCurrentCallSid('FAKE_CALL_ID');
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallStartTime(null);
  };

  // ---------------- UI ----------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conversation Logs</h2>
          <p className="text-muted-foreground">Real-time AI and human conversation monitoring</p>
        </div>
        <div className="flex space-x-2">
          <Button variant={isLive ? 'destructive' : 'default'} onClick={() => setIsLive(!isLive)}>
            {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isLive ? 'Stop Live' : 'Start Live'}
          </Button>
        </div>
      </div>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              AI Agent Status
            </div>
            <Button variant="outline" size="sm" onClick={checkAgentStatus}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${agentStatusColor === 'green' ? 'bg-green-500' : 'bg-gray-400'} ${agentStatus === 'active' ? 'animate-pulse' : ''}`} />
            <span>{agentStatusText}</span>
          </div>
        </CardContent>
      </Card>

      {/* Call */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Make a Call
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isCallActive}
            />
            {!isCallActive ? (
              <Button onClick={handleMakeCall}>
                <PhoneCall className="h-4 w-4 mr-2" /> Make Call
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleEndCall}>
                <Phone className="h-4 w-4 mr-2" /> End Call
              </Button>
            )}
          </div>
          {isCallActive && (
            <div className="mt-3 text-green-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Terminal className="h-5 w-5 mr-2" />
            Live Conversation
            {isLive && <Badge variant="destructive" className="ml-2 animate-pulse">LIVE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messagesError && (
            <div className="text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {messagesError}
            </div>
          )}
          <div ref={scrollRef} className="h-72 overflow-y-auto space-y-3 p-3 border rounded-md bg-gray-50">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="p-2 rounded bg-white shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {msg.type === 'human' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    <span className="font-medium">{msg.speaker}</span>
                    <span className="text-xs text-gray-400">{msg.timestamp}</span>
                  </div>
                  <p className="mt-1">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
