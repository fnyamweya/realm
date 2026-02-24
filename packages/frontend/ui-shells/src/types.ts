import type { ReactNode } from 'react';

export interface NavItem {
  title: string;
  href: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string;
  children?: NavItem[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export interface ShellConfig {
  appName: string;
  appDescription?: string;
  logo?: ReactNode;
  navSections: NavSection[];
  userMenu?: {
    name: string;
    email?: string;
    avatarUrl?: string;
    avatarFallback?: string;
  };
}
