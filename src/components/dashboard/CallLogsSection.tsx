import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Phone, Search, Filter, Download, Play, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { listRecentCalls, subscribeRecentCalls, fetchTwilioRecentCalls, upsertCalls, enrichCallsWithRecordings } from '@/lib/callsService';
import type { CallRecord } from '@/lib/types';

export const CallLogsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setError(null);

    const unsub = subscribeRecentCalls(30, 50, (records) => {
      if (!mounted) return;
      setCalls(records);
      setLoading(false);
      setError(null);
    }, async () => {
      try {
        const data = await listRecentCalls(30, 50);
        if (!mounted) return;

        if (data.length > 0) {
          setCalls(data);
        } else {
          let twilioCalls = await fetchTwilioRecentCalls(50);
          twilioCalls = await enrichCallsWithRecordings(twilioCalls);
          if (!mounted) return;
          setCalls(twilioCalls);
          upsertCalls(twilioCalls).catch(() => {});
        }
      } catch (err) {
        if (!mounted) return;
        try {
          let twilioCalls = await fetchTwilioRecentCalls(50);
          twilioCalls = await enrichCallsWithRecordings(twilioCalls);
          if (!mounted) return;
          setCalls(twilioCalls);
          upsertCalls(twilioCalls).catch(() => {});
        } catch (twilioErr) {
          if (!mounted) return;
          setError('Failed to load call logs. Please check your API configuration.');
          setCalls([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });
    return () => { mounted = false; unsub && unsub(); };
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return calls.filter(c =>
      (c.toNumber || '').toLowerCase().includes(term) ||
      (c.fromNumber || '').toLowerCase().includes(term) ||
      (c.status || '').toLowerCase().includes(term) ||
      (c.agentId || '').toLowerCase().includes(term)
    );
  }, [calls, searchTerm]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      let twilioCalls = await fetchTwilioRecentCalls(50);
      twilioCalls = await enrichCallsWithRecordings(twilioCalls);
      setCalls(twilioCalls);
      upsertCalls(twilioCalls).catch(() => {});
    } catch (err) {
      setError('Failed to refresh call logs. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-blue-700">Call Logs</h2>
          <p className="text-blue-500">View and manage all call records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Card */}
      <Card className="bg-white border border-blue-200 shadow-sm rounded-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-blue-700">Recent Call History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input 
                  placeholder="Search calls..." 
                  className="pl-10 border-blue-300 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center justify-center py-6 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {loading && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
              <span className="text-blue-500">Loading call logs...</span>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                calls.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 mx-auto text-blue-300 mb-3" />
                    <p className="text-blue-500">No call logs available</p>
                    <p className="text-sm text-blue-400 mt-1">Call logs will appear here as they are made.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-blue-300 mb-3" />
                    <p className="text-blue-500">No calls match your search</p>
                    <p className="text-sm text-blue-400 mt-1">Try adjusting your search terms.</p>
                  </div>
                )
              ) : (
                filtered.map((call) => (
                  <div 
                    key={call.callId} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all"
                  >
                    {/* Call info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-700">{call.toNumber}</p>
                        {call.fromNumber && (
                          <p className="text-sm text-blue-500">From: {call.fromNumber}</p>
                        )}
                        {call.agentId && (
                          <p className="text-xs text-blue-400">Agent: {call.agentId}</p>
                        )}
                      </div>
                    </div>

                    {/* Duration + Status */}
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-700">
                        {call.durationSec ? `${Math.floor(call.durationSec/60)}:${String(call.durationSec%60).padStart(2,'0')}` : '-'}
                      </p>
                      <Badge variant={
                        call.status === 'completed' ? 'default' : 
                        call.status === 'failed' || call.status === 'no-answer' ? 'destructive' : 'secondary'
                      }>
                        {call.status}
                      </Badge>
                    </div>

                    {/* Date + Recording */}
                    <div className="text-center">
                      <p className="text-sm text-blue-500">{call.createdAt?.replace('T',' ').slice(0,19)}</p>
                      {call.recording?.recordingUrl && (
                        <Button variant="ghost" size="sm" className="mt-1 text-blue-600 hover:bg-blue-100">
                          <Play className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
