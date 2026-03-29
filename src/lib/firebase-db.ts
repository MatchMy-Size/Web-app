import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';

export { db, doc, serverTimestamp, setDoc };
export { collection, onSnapshot, orderBy, query };

export const getDocById = async (collectionName: string, docId: string) => {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? snap.data() : null;
};

export const subscribeDocById = (
  collectionName: string,
  docId: string,
  onData: (data: Record<string, unknown> | null) => void,
  onError?: (error: Error) => void,
) =>
  onSnapshot(
    doc(db, collectionName, docId),
    (snap) => onData(snap.exists() ? (snap.data() as Record<string, unknown>) : null),
    (error) => onError?.(error),
  );
