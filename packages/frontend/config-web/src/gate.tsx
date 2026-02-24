'use client';
import { useFeatureFlag } from './flags';
import type { ReactNode } from 'react';

export interface FeatureGateProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback }: FeatureGateProps) {
  const enabled = useFeatureFlag(flag);
  if (!enabled) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
