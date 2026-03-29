import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';

import { auth } from '@/lib/firebase-client';
import { getPhonePasswordEmail } from '@/lib/phone-auth';

export const createUserWithPhonePassword = (phoneNumber: string, password: string) =>
  createUserWithEmailAndPassword(auth, getPhonePasswordEmail(phoneNumber), password);

export const attachPasswordToVerifiedPhone = async (phoneNumber: string, password: string) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('No verified user session found. Please sign in again.');
  }

  const credential = EmailAuthProvider.credential(getPhonePasswordEmail(phoneNumber), password);
  const hasPasswordProvider = currentUser.providerData.some((provider) => provider.providerId === 'password');

  if (hasPasswordProvider) {
    await updatePassword(currentUser, password);
    return;
  }

  try {
    await linkWithCredential(currentUser, credential);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = (error as { message?: string })?.message?.toLowerCase() ?? '';
    const alreadyLinkedByMessage = message.includes('already been linked') || message.includes('provider-already-linked');

    if (
      code === 'auth/provider-already-linked' ||
      code === 'auth/credential-already-in-use' ||
      code === 'auth/email-already-in-use' ||
      alreadyLinkedByMessage
    ) {
      await updatePassword(currentUser, password);
      return;
    }

    throw error;
  }
};

export const signInWithPhonePassword = (phoneNumber: string, password: string) =>
  signInWithEmailAndPassword(auth, getPhonePasswordEmail(phoneNumber), password);
