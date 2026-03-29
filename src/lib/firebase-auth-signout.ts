import { signOut } from 'firebase/auth';

import { auth } from '@/lib/firebase-client';

export const signOutUser = async () => {
  await signOut(auth);
};
