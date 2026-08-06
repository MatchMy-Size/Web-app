import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiRequest } from '@/lib/api-client';
import {
  clearAuthSession,
  getAuthSession,
  replaceSessionUser,
  subscribeAuthSession,
  toAppUser,
  type AppUser,
  type SessionUser,
} from '@/lib/auth-session';

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialSession = getAuthSession();
  const [user, setUser] = useState<AppUser | null>(
    initialSession ? toAppUser(initialSession.user) : null,
  );
  const [loading, setLoading] = useState(!!initialSession);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeAuthSession(session => {
      if (active) setUser(session ? toAppUser(session.user) : null);
    });

    if (!getAuthSession()) {
      setLoading(false);
    } else {
      void apiRequest<SessionUser>('/api/auth/me')
        .then(currentUser => {
          if (!active) return;
          replaceSessionUser(currentUser);
        })
        .catch(() => {
          if (active) clearAuthSession();
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
