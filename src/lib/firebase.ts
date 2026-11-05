import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// Firebase configuration from environment or fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (typeof window !== 'undefined' ? (window as any).__ENV__?.VITE_FIREBASE_API_KEY : ''),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'llm-arena-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'llm-arena-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'llm-arena-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-LLMARENA'
};

const hasValidConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);

let app: any = null;
let auth: any = null;
let googleProvider: any = null;

if (hasValidConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

// Log product analytics events
export async function trackFirebaseAnalytics(eventName: string, params: Record<string, any> = {}) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, params })
    });
  } catch (e) {
    // Analytics logging should never disrupt user experience
  }
}

export {
  app,
  auth,
  googleProvider,
  hasValidConfig,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
};
export type { FirebaseUser };
