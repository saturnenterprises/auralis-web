# Deployment Guide for Firestore Integration

## Quick Deployment Checklist

### 1. Environment Variables
Ensure these environment variables are set in your deployment platform (Vercel/Netlify/etc.):

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_PHONE_NUMBER_ID=your_phone_number_id

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_NUMBER=your_twilio_phone_number

# Firebase Configuration (Optional - for enhanced server-side writes)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"auralis-dcef5",...}
# OR
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 2. Twilio Webhook Configuration
In your Twilio Console, set these webhook URLs:

1. **Status Callback URL**: `https://yourdomain.com/api/twilio/status-callback`
2. **Recording Callback URL**: `https://yourdomain.com/api/twilio/recording-callback`

### 3. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `auralis-dcef5`
3. Go to Project Settings → Service Accounts
4. Generate a new private key (JSON file)
5. Add the JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable

### 4. Deploy the Code
```bash
# Install dependencies
npm install

# Deploy to your platform
# For Vercel:
vercel --prod

# For Netlify:
netlify deploy --prod
```

### 5. Test the Integration
1. **Make a test call** through your UI
2. **Check Firestore** console for the new call record
3. **Verify dashboard** shows the call
4. **Test webhook** by checking call status updates

### 6. Monitor Deployment
Check these logs for successful deployment:
- `✅ Call record written to Firestore: {callId}`
- `✅ Updated call {callId} with status: {status}`
- `📞 Twilio status webhook received`

## Troubleshooting Deployment Issues

### Issue: Calls not appearing in dashboard
**Solution:**
1. Check if Firestore writes are working:
   ```bash
   curl -X POST https://yourdomain.com/api/sync-calls \
     -H "Content-Type: application/json" \
     -d '{"limit": 5, "daysBack": 1}'
   ```

2. Verify environment variables are set correctly

3. Check Firebase Admin SDK initialization logs

### Issue: Webhook not updating call status
**Solution:**
1. Verify webhook URLs in Twilio console
2. Check webhook processing logs
3. Test webhook endpoint manually

### Issue: Firebase Admin SDK errors
**Solution:**
1. Verify service account credentials
2. Check Firebase project permissions
3. Ensure proper environment variable format

## Rollback Plan
If issues occur, you can temporarily disable server-side writes by:
1. Commenting out Firestore writes in `api/elevenlabs-call.js`
2. The frontend will still write to Firestore as a fallback
3. Dashboard will fallback to Twilio API for data

## Performance Monitoring
Monitor these metrics after deployment:
- Call creation success rate
- Webhook processing latency
- Dashboard load times
- Firestore write/read operations

## Security Checklist
- [ ] Firestore rules are properly configured
- [ ] Environment variables are secure
- [ ] Webhook endpoints are protected
- [ ] API rate limiting is in place
- [ ] CORS headers are properly set

## Support
If you encounter issues:
1. Check the logs in your deployment platform
2. Run the test script: `node scripts/test-call-integration.js`
3. Verify all environment variables are set
4. Check Firebase console for any errors
5. Review the troubleshooting section in `FIRESTORE_INTEGRATION.md`

