import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { firebaseWebConfig } from '@/lib/firebase-config';

const app = getApps().length ? getApp() : initializeApp(firebaseWebConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
