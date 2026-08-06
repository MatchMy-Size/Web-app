import type { OtpPurpose, OtpSession } from '@/lib/auth-flow';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '';

const request = async <T,>(path: string, body: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: T;
  };

  if (!response.ok || payload.status === 'error' || !payload.data) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload.data;
};

export const requestOtpViaTextLk = (phoneNumber: string, purpose: OtpPurpose) =>
  request<OtpSession>('/api/otp/request', { phoneNumber, purpose });

export const verifyOtpSession = (session: OtpSession, code: string) =>
  request<{ verified: true; sessionId: string; purpose: OtpPurpose; phoneNumber: string }>(
    '/api/otp/verify',
    {
      sessionId: session.sessionId,
      purpose: session.purpose,
      phoneNumber: session.phoneNumber,
      code,
    },
  );
