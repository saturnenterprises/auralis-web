import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Using the same project ID from the client config
const projectId = 'auralis-dcef5';

// Initialize Firebase Admin with Application Default Credentials
// This works when running in environments that have proper authentication
let adminApp;
let db;

try {
  if (admin.apps.length === 0) {
    // Try to initialize with Application Default Credentials first
    adminApp = admin.initializeApp({
      projectId: projectId,
    });
    console.log('✅ Firebase Admin SDK initialized with Application Default Credentials');
  } else {
    adminApp = admin.app();
    console.log('✅ Firebase Admin SDK already initialized');
  }
  
  db = admin.firestore();
  console.log('✅ Firestore database instance created');
  
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  
  // Fallback: try with explicit service account credentials if available
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('🔄 Trying to initialize with service account key...');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
      db = admin.firestore();
      console.log('✅ Firebase Admin SDK initialized with service account');
    } else {
      console.warn('⚠️ No service account key found in environment variables');
      console.warn('⚠️ Firebase Admin SDK will not be available for server-side operations');
    }
  } catch (fallbackError) {
    console.error('❌ Failed to initialize Firebase Admin SDK with service account:', fallbackError);
    db = null;
  }
}

export {
  admin,
  db,
  isInitialized: () => db !== null && adminApp !== null
};

