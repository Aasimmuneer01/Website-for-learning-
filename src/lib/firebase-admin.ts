import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import rawConfig from '../../firebase-applet-config.json';

const adminApp = getApps().length === 0 
  ? initializeApp() 
  : getApp();

export const adminDb = getFirestore(adminApp, rawConfig.firestoreDatabaseId || '(default)');
export const adminAuth = getAuth(adminApp);
