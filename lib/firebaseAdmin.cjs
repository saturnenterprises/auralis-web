const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Using the same project ID from the client config
const projectId = 'auralis-dcef5';

// Initialize Firebase Admin with Application Default Credentials
// This will work when running locally with Firebase CLI authentication
let adminApp;

try {
  if (admin.apps.length === 0) {
    // Try to initialize with Application Default Credentials first
    adminApp = admin.initializeApp({
      projectId: projectId,
      // Use Application Default Credentials (works with Firebase CLI auth)
    });
    console.log('✅ Firebase Admin initialized with Application Default Credentials');
  } else {
    adminApp = admin.app();
    console.log('✅ Firebase Admin app already initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin with ADC:', error);
  
  // Fallback: try with explicit service account credentials if available
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
      console.log('✅ Firebase Admin initialized with service account key');
    } else {
      console.warn('⚠️ No service account key found in environment variables');
    }
  } catch (fallbackError) {
    console.error('❌ Failed to initialize Firebase Admin with service account:', fallbackError);
  }
}

const db = adminApp ? admin.firestore() : null;

// Test the connection
if (db) {
  console.log('✅ Firebase Admin Firestore instance created');
  // Set a test to verify connection
  db.collection('_test').doc('connection').set({ 
    timestamp: new Date().toISOString(),
    status: 'connected'
  }).then(() => {
    console.log('✅ Firebase Admin Firestore connection test successful');
  }).catch((testError) => {
    console.error('❌ Firebase Admin Firestore connection test failed:', testError);
  });
} else {
  console.error('❌ Firebase Admin Firestore instance not created');
}

module.exports = {
  admin,
  db,
  isInitialized: () => db !== null
};

