import { apiRequest, ApiError } from '@/lib/api-client';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  toAppUser,
  type SessionResponse,
} from '@/lib/auth-session';

type AuthResult = { user: ReturnType<typeof toAppUser> };

const storeSession = (session: SessionResponse): AuthResult => ({
  user: toAppUser(setAuthSession(session).user),
});

export const signInWithPhonePassword = async (
  phoneNumber: string,
  password: string,
): Promise<AuthResult> => {
  const session = await apiRequest<SessionResponse>('/api/auth/login', {
    method: 'POST',
    authenticated: false,
    body: { phoneNumber, password },
  });
  return storeSession(session);
};

export const createUserWithPhonePassword = async (
  phoneNumber: string,
  password: string,
  otpSessionId: string,
): Promise<AuthResult> => {
  try {
    const session = await apiRequest<SessionResponse>('/api/auth/register', {
      method: 'POST',
      authenticated: false,
      body: { phoneNumber, password, otpSessionId },
    });
    return storeSession(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const conflict = new Error(error.message) as Error & { code?: string; status?: number };
      conflict.code = error.code === 'account_exists' ? 'auth/phone-already-in-use' : (error.code ?? 'auth/phone-already-in-use');
      conflict.status = error.status;
      throw conflict;
    }
    throw error;
  }
};

export const attachPasswordToVerifiedPhone = async (
  phoneNumber: string,
  password: string,
  otpSessionId: string,
) => {
  await apiRequest('/api/auth/password', {
    method: 'PUT',
    body: { phoneNumber, password, otpSessionId },
  });
};

export const resetPasswordWithVerifiedPhone = async (
  phoneNumber: string,
  password: string,
  otpSessionId: string,
) => {
  await apiRequest('/api/auth/password/reset', {
    method: 'POST',
    authenticated: false,
    body: { phoneNumber, password, otpSessionId },
  });
};

export const signOutUser = async () => {
  try {
    if (getAuthSession()) {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    }
  } finally {
    clearAuthSession();
  }
};
