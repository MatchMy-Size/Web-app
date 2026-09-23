import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  type SessionResponse,
} from '@/lib/auth-session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || '';
const API_REQUEST_TIMEOUT_MS = 90_000;

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
  timeoutMs?: number;
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
  const {
    authenticated = true,
    body,
    headers,
    timeoutMs = API_REQUEST_TIMEOUT_MS,
    ...requestOptions
  } = options;

  const send = async (accessToken?: string) => {
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/json');
    if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
    if (accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`);

    const controller = new AbortController();
    const callerSignal = requestOptions.signal;
    const abortFromCaller = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) abortFromCaller();
    else callerSignal?.addEventListener('abort', abortFromCaller, { once: true });

    const timeout = window.setTimeout(() => controller.abort('api_timeout'), timeoutMs);

    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        signal: controller.signal,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      if (controller.signal.reason === 'api_timeout') {
        throw new ApiError(
          'The MatchMySize server is taking too long to respond. Please wait a moment and try again.',
          504,
          'api_timeout',
        );
      }
      if (error instanceof TypeError) {
        throw new ApiError(
          'Unable to reach the MatchMySize server. Please check your connection and try again.',
          503,
          'api_unavailable',
        );
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    }
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
