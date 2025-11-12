import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  HelpCircle, MessageSquare, FileText, Mail, Phone, 
  Clock, RefreshCw, ExternalLink, Send 
} from 'lucide-react';
import { listNotifications, createNotification } from '@/lib/enhancedFirebaseService';
import type { NotificationRecord } from '@/lib/types';

export const SupportSection = () => {
  const [supportTickets, setSupportTickets] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    priority: 'medium' as const,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load support tickets
  const loadSupportTickets = async () => {
    try {
      setRefreshing(true);
      const notifications = await listNotifications({ limit: 20 });
      setSupportTickets(notifications);
    } catch (error) {
      console.error('❌ Error loading support tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSupportTickets();
  }, []);

  // Submit ticket
  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

    try {
      setSubmitting(true);
      const ticketData: Omit<NotificationRecord, 'id' | 'createdAt'> = {
        type: 'system_alert',
        severity: newTicket.priority === 'high' ? 'error' : newTicket.priority === 'low' ? 'info' : 'warning',
        title: newTicket.subject,
        message: newTicket.description,
        isRead: false,
        actionRequired: true,
        relatedType: 'system',
        metadata: {
          priority: newTicket.priority,
          assignee: 'Support Team',
          userSubmitted: true
        }
      };
      await createNotification(ticketData);
      setNewTicket({ subject: '', priority: 'medium', description: '' });
      await loadSupportTickets();
    } catch (error) {
      console.error('❌ Error submitting support ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const faqItems = [
    { question: 'How do I reset my password?', answer: 'Go to Settings > Account > Change Password and follow the instructions.' },
    { question: 'Why can’t I hear the caller?', answer: 'Check your audio settings and ensure your microphone/speakers are properly configured.' },
    { question: 'How do I access call recordings?', answer: 'Navigate to Call Logs section and click the Play button next to recorded calls.' },
    { question: 'What to do if the system is down?', answer: 'Contact our 24/7 support team immediately at +1-800-BUDDHI or use emergency backup procedures.' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in-progress': return 'secondary';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-white to-blue-50 p-4 sm:p-6 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">Support Center</h2>
          <p className="text-blue-600">Get help and manage support tickets</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <MessageSquare className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets */}
        <Card className="bg-white shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-blue-500">Loading...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {supportTickets.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-10 w-10 mx-auto text-blue-400 mb-2" />
                    <p className="text-blue-600">No support tickets found</p>
                    <p className="text-sm text-blue-400">Create your first ticket using the form.</p>
                  </div>
                ) : (
                  supportTickets.map((ticket) => {
                    const priority = (ticket.metadata?.priority as string) || 'medium';
                    const assignee = (ticket.metadata?.assignee as string) || 'Support Team';
                    const status = ticket.isRead ? 'resolved' : ticket.actionRequired ? 'open' : 'in-progress';

                    return (
                      <div key={ticket.id} className="p-4 rounded-xl border border-blue-200 hover:bg-blue-50 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-blue-800">{ticket.title}</p>
                            <p className="text-xs text-blue-500">#{ticket.id.slice(-8)}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getPriorityColor(priority)}>{priority}</Badge>
                            <Badge variant={getStatusColor(status)}>{status}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-blue-600 mb-2">{ticket.message}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-blue-500 gap-1">
                          <span>Assigned to: {assignee}</span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {ticket.actionUrl && (
                          <div className="mt-2">
                            <a 
                              href={ticket.actionUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <span>Take Action</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Refresh */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSupportTickets}
                disabled={refreshing}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New Ticket */}
        <Card className="bg-white shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-blue-700">Submit Support Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-blue-800">Subject</label>
              <Input
                placeholder="Brief description of the issue"
                className="mt-1 border-blue-300 focus:ring-blue-400"
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-blue-800">Priority</label>
              <select
                className="w-full mt-1 p-2 border border-blue-300 rounded-md bg-white focus:ring-blue-400"
                value={newTicket.priority}
                onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-800">Description</label>
              <Textarea
                placeholder="Please provide details..."
                rows={4}
                className="mt-1 border-blue-300 focus:ring-blue-400"
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSubmitTicket}
              disabled={submitting || !newTicket.subject.trim() || !newTicket.description.trim()}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md rounded-xl text-center">
          <CardContent className="p-4">
            <Phone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-blue-800">Emergency Support</h3>
            <p className="text-sm text-blue-600">24/7 Hotline</p>
            <p className="font-medium text-blue-900">+1-800-BUDDHI</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md rounded-xl text-center">
          <CardContent className="p-4">
            <Mail className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-blue-800">Email Support</h3>
            <p className="text-sm text-blue-600">Response in 2-4 hours</p>
            <p className="font-medium text-blue-900">support@auralis.com</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md rounded-xl text-center">
          <CardContent className="p-4">
            <MessageSquare className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-blue-800">Live Chat</h3>
            <p className="text-sm text-blue-600">Available 9 AM - 9 PM</p>
            <Button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white">
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="bg-white shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                <h4 className="font-medium text-blue-800 mb-2">{faq.question}</h4>
                <p className="text-sm text-blue-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
