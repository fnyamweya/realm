'use client';

import type { ReactNode } from 'react';
import { DashboardShell, type DashboardShellProps } from './dashboard-shell';
import type { BreadcrumbEntry } from './header';
import type { NavSection, ShellConfig } from './types';

export interface ConsoleShellProps {
  navSections: NavSection[];
  breadcrumbs?: BreadcrumbEntry[];
  showSearch?: boolean;
  headerActions?: ReactNode;
  userMenu?: ShellConfig['userMenu'];
  logo?: ReactNode;
  children: ReactNode;
}

export function ConsoleShell({
  navSections,
  breadcrumbs,
  showSearch,
  headerActions,
  userMenu,
  logo,
  children,
}: ConsoleShellProps) {
  const config: ShellConfig = {
    appName: 'RealtyOS Console',
    appDescription: 'Property management console',
    logo,
    navSections,
    userMenu,
  };

  return (
    <DashboardShell
      config={config}
      breadcrumbs={breadcrumbs}
      showSearch={showSearch}
      headerActions={headerActions}
    >
      {children}
    </DashboardShell>
  );
}
