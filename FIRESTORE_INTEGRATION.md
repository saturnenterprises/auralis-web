# Firestore Integration for Call Management

This document describes the enhanced Firestore integration that ensures call data is properly written and updated in the database.

## Overview

The integration addresses the issue where calls made through the ElevenLabs API were not being properly stored in Firestore, causing the dashboard to not display recent calls.

## Architecture

### Components Added

1. **Firebase Admin SDK** (`lib/firebaseAdmin.js`)
   - Server-side Firebase initialization
   - Handles authentication and connection to Firestore

2. **Server Calls Service** (`lib/serverCallsService.js`)
   - Server-side functions for Firestore operations
   - CRUD operations for call records
   - Batch operations for bulk updates

3. **Enhanced ElevenLabs Call API** (`api/elevenlabs-call.js`)
   - Now writes call records to Firestore immediately after call initiation
   - Includes error handling for Firestore write failures

4. **Twilio Webhook Handler** (`api/twilio/webhooks.js`)
   - Processes Twilio status and recording callbacks
   - Updates call records with real-time status changes
   - Maps Twilio statuses to internal status format

5. **Call Sync API** (`api/sync-calls.js`)
   - Manual sync endpoint for backfilling call data
   - Useful for testing and data recovery

## Call Flow

### 1. Call Initiation
```
User clicks "Make Call" → CallInterface.tsx → /api/elevenlabs-call → ElevenLabs API
                                                      ↓
                                              Write to Firestore
                                                      ↓
                                              Return call data
```

### 2. Status Updates
```
Twilio Status Callback → /api/twilio/webhooks → Update Firestore → Dashboard reflects changes
```

### 3. Dashboard Display
```
Dashboard loads → Check Firestore first → Fallback to Twilio API if needed → Display calls
```

## Data Structure

### Call Record Format
```javascript
{
  callId: string,           // ElevenLabs call ID (used as document ID)
  twilioCallSid?: string,   // Twilio Call SID (for webhook matching)
  agentId?: string,         // ElevenLabs agent ID
  toNumber: string,         // Destination phone number
  fromNumber?: string,      // Source phone number (Twilio number)
  status: string,           // Current call status
  startedAt?: string,       // ISO timestamp when call started
  endedAt?: string,         // ISO timestamp when call ended
  durationSec?: number,     // Call duration in seconds
  recording?: {             // Recording information
    recordingSid?: string,
    recordingUrl?: string,
    status?: string,
    durationSec?: number
  },
  createdAt: string,        // ISO timestamp when record created
  updatedAt: string         // ISO timestamp when record last updated
}
```

## Status Mapping

Twilio statuses are mapped to internal statuses:

| Twilio Status | Internal Status |
|---------------|----------------|
| queued        | queued         |
| ringing       | ringing        |
| in-progress   | in-progress    |
| completed     | completed      |
| busy          | failed         |
| failed        | failed         |
| no-answer     | no-answer      |
| canceled      | failed         |

## Environment Variables

### Required
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `ELEVENLABS_AGENT_ID` - ElevenLabs agent ID
- `ELEVENLABS_PHONE_NUMBER_ID` - ElevenLabs phone number ID
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_NUMBER` - Twilio phone number

### Optional (for Firebase Admin)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON string of service account credentials
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key file

## Webhook Configuration

Configure these URLs in your Twilio console:

1. **Status Callback URL**: `https://yourdomain.com/api/twilio/status-callback`
2. **Recording Callback URL**: `https://yourdomain.com/api/twilio/recording-callback`

## Testing

### Manual Testing
1. Make a call through the UI
2. Check Firestore console for the new call record
3. Verify dashboard shows the call
4. Check call status updates via webhooks

### Automated Testing
Run the test script:
```bash
node scripts/test-call-integration.js
```

### Sync Testing
Use the sync API to backfill data:
```bash
curl -X POST https://yourdomain.com/api/sync-calls \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "daysBack": 1}'
```

## Error Handling

### Firestore Write Failures
- API calls continue even if Firestore writes fail
- Frontend fallback ensures data consistency
- Error logging helps with debugging

### Webhook Failures
- Always return 200 status to prevent Twilio retries
- Log errors for monitoring
- Graceful degradation if webhook processing fails

### Network Issues
- Retry logic for transient failures
- Fallback to Twilio API for data retrieval
- Caching to reduce API calls

## Monitoring

### Logs to Monitor
- `✅ Call record written to Firestore: {callId}`
- `✅ Updated call {callId} with status: {status}`
- `⚠️ Failed to write call record to Firestore: {error}`

### Metrics to Track
- Call creation success rate
- Webhook processing success rate
- Firestore write latency
- Dashboard load times

## Troubleshooting

### Common Issues

1. **Calls not appearing in dashboard**
   - Check Firestore write logs
   - Verify webhook configuration
   - Test sync API for backfilling

2. **Status updates not working**
   - Verify webhook URLs in Twilio console
   - Check webhook processing logs
   - Ensure proper status mapping

3. **Firebase Admin errors**
   - Verify service account credentials
   - Check Firebase project configuration
   - Ensure proper permissions

### Debug Commands
```bash
# Test Firebase connection
node scripts/test-call-integration.js

# Sync recent calls
curl -X POST /api/sync-calls -d '{"limit": 5}'

# Check webhook processing
tail -f logs/webhook.log
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live dashboard updates
2. **Analytics**: Call analytics and reporting features
3. **Recording Management**: Enhanced recording storage and playback
4. **Agent Management**: Real-time agent status tracking
5. **Performance Optimization**: Caching and query optimization

## Security Considerations

1. **Firestore Rules**: Ensure proper access control
2. **Webhook Security**: Validate webhook signatures
3. **API Rate Limiting**: Implement rate limiting for sync endpoints
4. **Data Privacy**: Handle PII data appropriately

## Deployment Notes

1. **Environment Setup**: Configure all required environment variables
2. **Webhook URLs**: Update Twilio webhook URLs for production
3. **Firebase Rules**: Deploy updated Firestore rules
4. **Monitoring**: Set up logging and monitoring
5. **Testing**: Run integration tests before going live

