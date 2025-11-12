import { useState, useEffect, useCallback } from 'react';
import { 
  subscribeToNotifications, 
  subscribeToConversations,
  markNotificationAsRead as markNotificationAsReadInDB
} from '@/lib/enhancedFirebaseService';
import type { NotificationRecord, ConversationRecord } from '@/lib/types';

export interface RealTimeData {
  notifications: NotificationRecord[];
  unreadNotificationsCount: number;
  activeConversations: ConversationRecord[];
  recentActivity: Array<{
    type: 'call_started' | 'call_ended' | 'agent_online' | 'agent_offline' | 'quality_alert';
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export const useRealTimeUpdates = () => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    notifications: [],
    unreadNotificationsCount: 0,
    activeConversations: [],
    recentActivity: [],
    connectionStatus: 'connecting'
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setRealTimeData(prev => ({ ...prev, connectionStatus: 'connecting' }));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setRealTimeData(prev => ({ ...prev, connectionStatus: 'disconnected' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!isOnline) return;

    console.log('🔔 Setting up real-time notifications subscription...');

    const unsubscribeNotifications = subscribeToNotifications((notifications) => {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      setRealTimeData(prev => ({
        ...prev,
        notifications,
        unreadNotificationsCount: unreadCount,
        connectionStatus: 'connected'
      }));

      // Add to recent activity
      notifications.slice(0, 3).forEach(notification => {
        if (notification.createdAt > new Date(Date.now() - 60000).toISOString()) {
          setRealTimeData(prev => ({
            ...prev,
            recentActivity: [
              {
                type: getActivityType(notification.type),
                message: notification.title,
                timestamp: notification.createdAt,
                severity: notification.severity
              },
              ...prev.recentActivity.slice(0, 9) // Keep last 10 activities
            ]
          }));
        }
      });
    }, { limit: 50 });

    return () => {
      console.log('🔕 Cleaning up notifications subscription');
      unsubscribeNotifications();
    };
  }, [isOnline]);

  // Subscribe to active conversations
  useEffect(() => {
    if (!isOnline) return;

    console.log('💬 Setting up active conversations subscription...');

    const unsubscribeConversations = subscribeToConversations((conversations) => {
      const activeConversations = conversations.filter(c => c.status === 'active');
      
      setRealTimeData(prev => ({
        ...prev,
        activeConversations
      }));

      // Generate activity for new conversations
      const newConversations = activeConversations.filter(conv => 
        conv.startedAt > new Date(Date.now() - 30000).toISOString()
      );

      newConversations.forEach(conversation => {
        setRealTimeData(prev => ({
          ...prev,
          recentActivity: [
            {
              type: 'call_started',
              message: `New conversation started by ${conversation.agentId}`,
              timestamp: conversation.startedAt,
              severity: 'info'
            },
            ...prev.recentActivity.slice(0, 9)
          ]
        }));
      });
    }, { limit: 20 });

    return () => {
      console.log('💬 Cleaning up conversations subscription');
      unsubscribeConversations();
    };
  }, [isOnline]);

  // Helper function to map notification types to activity types
  const getActivityType = (notificationType: string): RealTimeData['recentActivity'][0]['type'] => {
    switch (notificationType) {
      case 'call_completed':
        return 'call_ended';
      case 'call_failed':
        return 'call_ended';
      case 'agent_offline':
        return 'agent_offline';
      case 'quality_alert':
        return 'quality_alert';
      default:
        return 'call_started';
    }
  };

  // Function to create a test notification (for development)
  const createTestNotification = useCallback(() => {
    const testNotification: NotificationRecord = {
      id: `test-${Date.now()}`,
      type: 'system_alert',
      severity: 'info',
      title: 'Test Notification',
      message: 'This is a test notification to verify real-time updates',
      isRead: false,
      actionRequired: false,
      createdAt: new Date().toISOString()
    };

    setRealTimeData(prev => ({
      ...prev,
      notifications: [testNotification, ...prev.notifications],
      unreadNotificationsCount: prev.unreadNotificationsCount + 1,
      recentActivity: [
        {
          type: 'call_started',
          message: testNotification.title,
          timestamp: testNotification.createdAt,
          severity: testNotification.severity
        },
        ...prev.recentActivity.slice(0, 9)
      ]
    }));
  }, []);

  // Function to mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      // Update in Firebase first
      await markNotificationAsReadInDB(notificationId);
      
      // Update local state immediately for better UX
      setRealTimeData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadNotificationsCount: Math.max(0, prev.unreadNotificationsCount - 1)
      }));
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Could show a toast notification here
    }
  }, []);

  // Function to clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      // Mark all unread notifications as read in Firebase
      const unreadNotifications = realTimeData.notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(notification => 
          markNotificationAsReadInDB(notification.id)
        )
      );
      
      // Update local state
      setRealTimeData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadNotificationsCount: 0
      }));
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }, [realTimeData.notifications]);

  // Function to get connection status info
  const getConnectionInfo = useCallback(() => {
    return {
      isOnline,
      status: realTimeData.connectionStatus,
      lastUpdate: new Date().toISOString(),
      activeSubscriptions: isOnline ? 2 : 0 // notifications + conversations
    };
  }, [isOnline, realTimeData.connectionStatus]);

  return {
    realTimeData,
    isOnline,
    createTestNotification,
    markNotificationAsRead,
    clearAllNotifications,
    getConnectionInfo
  };
};