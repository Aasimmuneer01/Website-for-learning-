import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import rawConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: rawConfig.apiKey,
  authDomain: rawConfig.authDomain,
  projectId: rawConfig.projectId,
  storageBucket: rawConfig.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId,
  appId: rawConfig.appId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, rawConfig.firestoreDatabaseId);
export const storage = getStorage(app);
storage.maxUploadRetryTime = 10000;
storage.maxOperationRetryTime = 10000;
