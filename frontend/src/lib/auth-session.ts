export type SessionUser = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
};

export type SessionResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
};

export type AuthSession = SessionResponse & {
  expiresAt: number;
};

export type AppUser = SessionUser & {
  uid: string;
  getIdToken: () => Promise<string>;
};

const SESSION_KEY = 'matchmysize.authSession';
const listeners = new Set<(session: AuthSession | null) => void>();

const isSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === 'string' &&
    typeof session.refreshToken === 'string' &&
    typeof session.expiresAt === 'number' &&
    !!session.user &&
    typeof session.user.id === 'string'
  );
};

export const getAuthSession = (): AuthSession | null => {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isSession(parsed)) return parsed;
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage may be unavailable or contain an invalid value.
  }
  return null;
};

const writeSession = (session: AuthSession | null) => {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } finally {
    listeners.forEach(listener => listener(session));
  }
};

export const setAuthSession = (response: SessionResponse) => {
  const session: AuthSession = {
    ...response,
    expiresAt: Date.now() + Math.max(response.expiresIn, 1) * 1000,
  };
  writeSession(session);
  return session;
};

export const replaceSessionUser = (user: SessionUser) => {
  const session = getAuthSession();
  if (session) writeSession({ ...session, user });
};

export const clearAuthSession = () => writeSession(null);

export const subscribeAuthSession = (listener: (session: AuthSession | null) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const toAppUser = (user: SessionUser): AppUser => ({
  ...user,
  uid: user.id,
  getIdToken: async () => {
    const session = getAuthSession();
    if (!session?.accessToken) throw new Error('No active session.');
    return session.accessToken;
  },
});
