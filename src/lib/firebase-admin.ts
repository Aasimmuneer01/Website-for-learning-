import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || 'ais-asia-east1-6f1f14a5394847f';

const adminApp = getApps().length === 0 
  ? initializeApp({ projectId })
  : getApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
