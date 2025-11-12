import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase Web App configuration - Auralis project
const firebaseConfig = {
  apiKey: "AIzaSyBNIgeaSnhO25CXNqND6eRopJF6iqdBX7w",
  authDomain: "auralis-dcef5.firebaseapp.com",
  projectId: "auralis-dcef5",
  storageBucket: "auralis-dcef5.firebasestorage.app",
  messagingSenderId: "54155664299",
  appId: "1:54155664299:web:c8013c3b5c3cb4fafa10ee",
  measurementId: "G-MDNLBX5SR3",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;


