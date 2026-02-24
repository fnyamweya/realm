'use client';

import type { ReactNode } from 'react';
import { DashboardShell } from './dashboard-shell';
import type { BreadcrumbEntry } from './header';
import type { NavSection, ShellConfig } from './types';

export interface ResidentShellProps {
  navSections: NavSection[];
  breadcrumbs?: BreadcrumbEntry[];
  showSearch?: boolean;
  headerActions?: ReactNode;
  userMenu?: ShellConfig['userMenu'];
  logo?: ReactNode;
  children: ReactNode;
}

export function ResidentShell({
  navSections,
  breadcrumbs,
  showSearch,
  headerActions,
  userMenu,
  logo,
  children,
}: ResidentShellProps) {
  const config: ShellConfig = {
    appName: 'RealtyOS Resident',
    appDescription: 'Resident portal',
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
