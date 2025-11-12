/**
 * Script to initialize Firebase with sample data
 * Run this script to populate Firebase with sample data for testing
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { 
  ConversationRecord, 
  AgentRecord, 
  CallRecord, 
  NotificationRecord,
  ConversationMessage,
  Recording,
  AnalyticsRecord,
  UserSettings 
} from '../lib/types';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data generators
const generateSampleAgents = (): Omit<AgentRecord, 'id' | 'createdAt' | 'updatedAt'>[] => [
  {
    agentId: 'agent_sarah_customer_service',
    name: 'Sarah - Customer Service',
    description: 'Friendly customer service representative specializing in order inquiries and support',
    voiceId: 'voice_21m00Tcm4TlvDq8ikWAM',
    voiceSettings: {
      stability: 0.85,
      similarity_boost: 0.75,
      style: 0.65,
      use_speaker_boost: true
    },
    status: 'active',
    conversationConfig: {
      systemPrompt: 'You are Sarah, a helpful customer service representative.',
      temperature: 0.7,
      maxTokens: 500
    },
    metadata: {
      department: 'Customer Service',
      language: 'en-US',
      specialties: ['orders', 'billing', 'general_support']
    }
  },
  {
    agentId: 'agent_james_tech_support',
    name: 'James - Technical Support',
    description: 'Expert technical support agent for troubleshooting and technical issues',
    voiceId: 'voice_29vD33N1CtxCmqQRPOHJ',
    voiceSettings: {
      stability: 0.90,
      similarity_boost: 0.80,
      style: 0.70,
      use_speaker_boost: true
    },
    status: 'active',
    conversationConfig: {
      systemPrompt: 'You are James, a technical support specialist.',
      temperature: 0.6,
      maxTokens: 600
    },
    metadata: {
      department: 'Technical Support',
      language: 'en-US',
      specialties: ['troubleshooting', 'software_issues', 'hardware_support']
    }
  },
  {
    agentId: 'agent_maria_sales',
    name: 'Maria - Sales Representative',
    description: 'Enthusiastic sales agent focused on product demonstrations and customer acquisition',
    voiceId: 'voice_EXAVITQu4vr4xnSDxMaL',
    voiceSettings: {
      stability: 0.75,
      similarity_boost: 0.85,
      style: 0.80,
      use_speaker_boost: true
    },
    status: 'inactive',
    conversationConfig: {
      systemPrompt: 'You are Maria, an enthusiastic sales representative.',
      temperature: 0.8,
      maxTokens: 450
    },
    metadata: {
      department: 'Sales',
      language: 'en-US',
      specialties: ['product_demos', 'lead_qualification', 'closing_deals']
    }
  }
];

const generateSampleCalls = (): Omit<CallRecord, 'createdAt' | 'updatedAt'>[] => [
  {
    callId: 'call_001',
    agentId: 'agent_sarah_customer_service',
    toNumber: '+1-555-0123',
    fromNumber: '+1-800-BUDDHI',
    status: 'completed',
    durationSec: 145,
    cost: 0.12,
    recording: {
      recordingUrl: 'https://example.com/recordings/call_001.mp3',
      durationSec: 145,
      transcription: 'Customer called about order status. Issue resolved successfully.'
    }
  },
  {
    callId: 'call_002',
    agentId: 'agent_james_tech_support',
    toNumber: '+1-555-0456',
    fromNumber: '+1-800-BUDDHI',
    status: 'completed',
    durationSec: 267,
    cost: 0.18
  },
  {
    callId: 'call_003',
    agentId: 'agent_sarah_customer_service',
    toNumber: '+1-555-0789',
    fromNumber: '+1-800-BUDDHI',
    status: 'no-answer',
    durationSec: 0,
    cost: 0.05
  },
  {
    callId: 'call_004',
    agentId: 'agent_maria_sales',
    toNumber: '+1-555-0321',
    fromNumber: '+1-800-BUDDHI',
    status: 'completed',
    durationSec: 342,
    cost: 0.23,
    recording: {
      recordingUrl: 'https://example.com/recordings/call_004.mp3',
      durationSec: 342,
      transcription: 'Sales call with potential customer. Demo scheduled for next week.'
    }
  }
];

const generateSampleConversations = (): Omit<ConversationRecord, 'id' | 'createdAt' | 'updatedAt'>[] => [
  {
    conversationId: 'conv_001',
    agentId: 'agent_sarah_customer_service',
    callId: 'call_001',
    status: 'completed',
    duration: 145,
    messageCount: 8,
    summary: 'Customer inquiry about order #12345. Order status provided and shipping details confirmed.',
    sentiment: 'positive',
    metadata: {
      customerSatisfaction: 5,
      issueResolved: true,
      followUpRequired: false
    }
  },
  {
    conversationId: 'conv_002',
    agentId: 'agent_james_tech_support',
    callId: 'call_002',
    status: 'completed',
    duration: 267,
    messageCount: 12,
    summary: 'Technical support for software installation issue. Remote assistance provided.',
    sentiment: 'neutral',
    metadata: {
      customerSatisfaction: 4,
      issueResolved: true,
      followUpRequired: true
    }
  }
];

const generateSampleMessages = (): Array<{
  callId: string;
  messages: Omit<ConversationMessage, 'id'>[];
}> => [
  {
    callId: 'call_001',
    messages: [
      {
        type: 'ai',
        content: 'Hello! Thank you for calling Auralis. This is Sarah. How can I help you today?',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        sentiment: 'positive'
      },
      {
        type: 'human',
        content: 'Hi Sarah, I wanted to check on my order status. My order number is 12345.',
        timestamp: new Date(Date.now() - 280000).toISOString(),
        sentiment: 'neutral'
      },
      {
        type: 'ai',
        content: 'Of course! Let me look that up for you. Order #12345 is currently being processed and will ship within the next 24 hours.',
        timestamp: new Date(Date.now() - 260000).toISOString(),
        sentiment: 'positive'
      },
      {
        type: 'human',
        content: 'Great! Do you have the tracking information?',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        sentiment: 'positive'
      },
      {
        type: 'ai',
        content: 'The tracking number will be sent to your email once the package is shipped. You should receive it by tomorrow morning.',
        timestamp: new Date(Date.now() - 220000).toISOString(),
        sentiment: 'positive'
      },
      {
        type: 'human',
        content: 'Perfect! Thank you so much for your help.',
        timestamp: new Date(Date.now() - 200000).toISOString(),
        sentiment: 'positive'
      },
      {
        type: 'ai',
        content: 'You\'re very welcome! Is there anything else I can help you with today?',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        sentiment: 'positive'
      },
      {
        type: 'human',
        content: 'No, that\'s all. Thank you!',
        timestamp: new Date(Date.now() - 160000).toISOString(),
        sentiment: 'positive'
      }
    ]
  },
  {
    callId: 'call_002',
    messages: [
      {
        type: 'ai',
        content: 'Hello, this is James from technical support. I understand you\'re having some software installation issues?',
        timestamp: new Date(Date.now() - 400000).toISOString(),
        sentiment: 'neutral'
      },
      {
        type: 'human',
        content: 'Yes, I\'m trying to install the latest version but it keeps failing during the setup process.',
        timestamp: new Date(Date.now() - 380000).toISOString(),
        sentiment: 'negative'
      },
      {
        type: 'ai',
        content: 'I can definitely help you with that. Let me walk you through some troubleshooting steps. First, can you tell me what operating system you\'re using?',
        timestamp: new Date(Date.now() - 360000).toISOString(),
        sentiment: 'positive'
      },
      {
        type: 'human',
        content: 'I\'m using Windows 11.',
        timestamp: new Date(Date.now() - 340000).toISOString(),
        sentiment: 'neutral'
      }
    ]
  }
];

const generateSampleNotifications = (): Omit<NotificationRecord, 'id' | 'createdAt'>[] => [
  {
    type: 'system_alert',
    severity: 'warning',
    title: 'API Rate Limit Approaching',
    message: 'ElevenLabs API usage is at 85% of the monthly limit. Consider upgrading your plan.',
    isRead: false,
    actionRequired: true,
    actionUrl: 'https://elevenlabs.io/pricing',
    relatedType: 'system',
    metadata: {
      priority: 'medium',
      assignee: 'Technical Team'
    }
  },
  {
    type: 'call_quality',
    severity: 'error',
    title: 'Poor Call Quality Detected',
    message: 'Multiple calls reported audio issues in the last hour. Network connectivity may be affected.',
    isRead: false,
    actionRequired: true,
    relatedType: 'call',
    relatedId: 'call_002',
    metadata: {
      priority: 'high',
      assignee: 'Support Team',
      affectedCalls: 3
    }
  },
  {
    type: 'agent_status',
    severity: 'info',
    title: 'Agent Successfully Activated',
    message: 'Agent "Sarah - Customer Service" has been successfully activated and is ready to take calls.',
    isRead: true,
    actionRequired: false,
    relatedType: 'agent',
    relatedId: 'agent_sarah_customer_service',
    metadata: {
      priority: 'low',
      assignee: 'System'
    }
  }
];

const generateSampleAnalytics = (): Omit<AnalyticsRecord, 'id' | 'createdAt'>[] => [
  {
    type: 'daily_summary',
    date: new Date().toISOString().split('T')[0],
    metrics: {
      totalCalls: 127,
      completedCalls: 98,
      averageDuration: 145,
      totalCost: 12.45,
      successRate: 0.77
    },
    agentMetrics: {
      'agent_sarah_customer_service': {
        callsHandled: 45,
        averageDuration: 132,
        successRate: 0.89,
        cost: 5.23
      },
      'agent_james_tech_support': {
        callsHandled: 32,
        averageDuration: 178,
        successRate: 0.78,
        cost: 4.67
      },
      'agent_maria_sales': {
        callsHandled: 21,
        averageDuration: 201,
        successRate: 0.67,
        cost: 2.55
      }
    }
  }
];

const generateUserSettings = (): Omit<UserSettings, 'id' | 'updatedAt'> => ({
  userId: 'user_demo',
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    dashboard: {
      defaultView: 'overview',
      refreshInterval: 30,
      showRealTimeUpdates: true
    },
    calling: {
      defaultCountryCode: '+1',
      recordCalls: true,
      enableTranscription: true
    }
  },
  apiKeys: {
    elevenLabs: {
      isConfigured: true,
      lastVerified: new Date().toISOString()
    },
    twilio: {
      isConfigured: true,
      lastVerified: new Date().toISOString()
    }
  }
});

// Initialize data
export const initializeSampleData = async () => {
  console.log('🚀 Initializing Firebase with sample data...');

  try {
    // 1. Add sample agents
    console.log('👤 Creating sample agents...');
    const agents = generateSampleAgents();
    for (const agent of agents) {
      await setDoc(doc(db, 'agents', agent.agentId), {
        ...agent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log(`✅ Created ${agents.length} agents`);

    // 2. Add sample calls
    console.log('📞 Creating sample calls...');
    const calls = generateSampleCalls();
    for (const call of calls) {
      await setDoc(doc(db, 'calls', call.callId), {
        ...call,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log(`✅ Created ${calls.length} calls`);

    // 3. Add sample conversations
    console.log('💬 Creating sample conversations...');
    const conversations = generateSampleConversations();
    for (const conversation of conversations) {
      await addDoc(collection(db, 'conversations'), {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log(`✅ Created ${conversations.length} conversations`);

    // 4. Add sample messages
    console.log('📝 Creating sample messages...');
    const messageGroups = generateSampleMessages();
    for (const group of messageGroups) {
      for (const message of group.messages) {
        await addDoc(collection(db, 'messages'), {
          callId: group.callId,
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      }
    }
    console.log(`✅ Created messages for ${messageGroups.length} calls`);

    // 5. Add sample notifications
    console.log('🔔 Creating sample notifications...');
    const notifications = generateSampleNotifications();
    for (const notification of notifications) {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp()
      });
    }
    console.log(`✅ Created ${notifications.length} notifications`);

    // 6. Add sample analytics
    console.log('📊 Creating sample analytics...');
    const analytics = generateSampleAnalytics();
    for (const analytic of analytics) {
      await addDoc(collection(db, 'analytics'), {
        ...analytic,
        createdAt: serverTimestamp()
      });
    }
    console.log(`✅ Created ${analytics.length} analytics records`);

    // 7. Add user settings
    console.log('⚙️ Creating user settings...');
    const settings = generateUserSettings();
    await setDoc(doc(db, 'settings', 'user_demo'), {
      ...settings,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Created user settings');

    console.log('🎉 Sample data initialization completed successfully!');
    console.log('📊 Summary:');
    console.log(`  • ${agents.length} Agents`);
    console.log(`  • ${calls.length} Calls`);
    console.log(`  • ${conversations.length} Conversations`);
    console.log(`  • ${messageGroups.reduce((acc, g) => acc + g.messages.length, 0)} Messages`);
    console.log(`  • ${notifications.length} Notifications`);
    console.log(`  • ${analytics.length} Analytics Records`);
    console.log('  • 1 User Settings Record');

  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    throw error;
  }
};

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeSampleData()
    .then(() => {
      console.log('✨ All done! Your Firebase is now populated with sample data.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to initialize sample data:', error);
      process.exit(1);
    });
}