'use client';
import { useSession } from './session';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

export interface RouteGuardProps {
  children: ReactNode;
  audience: 'console' | 'resident' | 'command';
  loginPath: string;
  fallback?: ReactNode;
}

export function RouteGuard({ children, audience, loginPath, fallback }: RouteGuardProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session?.authenticated) {
      router.replace(loginPath);
    }
    if (!isLoading && session?.authenticated && session.audience !== audience) {
      const redirectMap: Record<string, string> = {
        console: '/console/login',
        resident: '/resident/login',
        command: '/command/login',
      };
      const target = redirectMap[session.audience ?? ''];
      if (target) {
        router.replace(target);
      }
    }
  }, [session, isLoading, audience, loginPath, router]);

  if (isLoading) {
    return <>{fallback ?? null}</>;
  }

  if (!session?.authenticated || session.audience !== audience) {
    return <>{fallback ?? null}</>;
  }

  return <>{children}</>;
}

export interface ObligationGuardProps {
  children: ReactNode;
  onMfaRequired?: () => void;
  onSelectClient?: () => void;
}

export function ObligationGuard({ children, onMfaRequired, onSelectClient }: ObligationGuardProps) {
  const { session } = useSession();

  const obligations = session?.obligations ?? [];
  const hasMfa = obligations.some(o => o.type === 'mfa_required');
  const hasSelectClient = obligations.some(o => o.type === 'select_client');

  useEffect(() => {
    if (hasMfa && onMfaRequired) onMfaRequired();
    if (hasSelectClient && onSelectClient) onSelectClient();
  }, [hasMfa, hasSelectClient, onMfaRequired, onSelectClient]);

  if (hasMfa || hasSelectClient) {
    return null;
  }

  return <>{children}</>;
}
