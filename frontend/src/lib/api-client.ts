import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  type SessionResponse,
} from '@/lib/auth-session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || '';

type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  code?: string;
  data?: T;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  authenticated?: boolean;
};

let pendingRefresh: Promise<string> | null = null;

const refreshAccessToken = async () => {
  if (pendingRefresh) return pendingRefresh;
  const session = getAuthSession();
  if (!session?.refreshToken) {
    throw new ApiError('You must be signed in.', 401, 'missing_session');
  }

  pendingRefresh = apiRequest<SessionResponse>('/api/auth/refresh', {
    method: 'POST',
    authenticated: false,
    body: { refreshToken: session.refreshToken },
  })
    .then(response => setAuthSession(response).accessToken)
    .catch(error => {
      clearAuthSession();
      throw error;
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
};

export const apiRequest = async <T,>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { authenticated = true, body, headers, ...requestOptions } = options;

  const send = async (accessToken?: string) => {
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/json');
    if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
    if (accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`);

    return fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let accessToken: string | undefined;
  if (authenticated) {
    const session = getAuthSession();
    if (!session) throw new ApiError('You must be signed in.', 401, 'missing_session');
    accessToken = session.expiresAt <= Date.now() + 30_000
      ? await refreshAccessToken()
      : session.accessToken;
  }

  let response = await send(accessToken);
  if (authenticated && response.status === 401) {
    accessToken = await refreshAccessToken();
    response = await send(accessToken);
  }

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || payload.status === 'error') {
    throw new ApiError(
      payload.message || `Request failed with status ${response.status}.`,
      response.status,
      payload.code,
    );
  }

  return (payload.data ?? payload) as T;
};
