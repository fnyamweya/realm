'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { SessionResponse } from '@realtyos/sdk';
import type { ApiClient } from '@realtyos/sdk';

export interface SessionState {
  session: SessionResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export const SessionProvider = SessionContext.Provider;

export function useSession(): SessionState {
  const state = useContext(SessionContext);
  if (!state) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return state;
}

export function useSessionLoader(client: ApiClient): SessionState {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await client.get<SessionResponse>('/v1/auth/session');
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session load failed');
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { session, isLoading, error, refresh };
}
