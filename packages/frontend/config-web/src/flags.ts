'use client';
import { createContext, useContext } from 'react';

export interface FeatureFlags {
  [key: string]: boolean | undefined;
}

const FeatureFlagsContext = createContext<FeatureFlags>({});

export const FeatureFlagsProvider = FeatureFlagsContext.Provider;

export function useFeatureFlag(flag: string): boolean {
  const flags = useContext(FeatureFlagsContext);
  return flags[flag] === true;
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagsContext);
}
