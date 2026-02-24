'use client';

import type { ReactNode } from 'react';
import { cn } from '@realtyos/frontend-utils';
import { DashboardShell } from './dashboard-shell';
import type { BreadcrumbEntry } from './header';
import type { NavSection, ShellConfig } from './types';

export type CommandEnvironment = 'development' | 'uat' | 'production';

const envBannerStyles: Record<CommandEnvironment, string> = {
  development: 'bg-blue-600 text-white',
  uat: 'bg-amber-500 text-black',
  production: 'bg-red-600 text-white',
};

const envLabels: Record<CommandEnvironment, string> = {
  development: 'Development',
  uat: 'UAT',
  production: 'Production',
};

export interface CommandShellProps {
  environment?: CommandEnvironment;
  navSections: NavSection[];
  breadcrumbs?: BreadcrumbEntry[];
  showSearch?: boolean;
  headerActions?: ReactNode;
  userMenu?: ShellConfig['userMenu'];
  logo?: ReactNode;
  children: ReactNode;
}

export function CommandShell({
  environment = 'development',
  navSections,
  breadcrumbs,
  showSearch,
  headerActions,
  userMenu,
  logo,
  children,
}: CommandShellProps) {
  const config: ShellConfig = {
    appName: 'RealtyOS Command',
    appDescription: 'Admin command panel',
    logo,
    navSections,
    userMenu,
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Environment banner */}
      <div
        className={cn(
          'flex h-7 items-center justify-center text-xs font-semibold',
          envBannerStyles[environment],
        )}
        role="status"
        aria-label={`Environment: ${envLabels[environment]}`}
      >
        {envLabels[environment]} Environment
      </div>

      <DashboardShell
        config={config}
        breadcrumbs={breadcrumbs}
        showSearch={showSearch}
        headerActions={headerActions}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
