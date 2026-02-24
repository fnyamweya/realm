'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@realtyos/frontend-utils';
import { Sidebar } from './sidebar';
import { Header, type BreadcrumbEntry } from './header';
import type { ShellConfig } from './types';

export interface DashboardShellProps {
  config: ShellConfig;
  breadcrumbs?: BreadcrumbEntry[];
  showSearch?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({
  config,
  breadcrumbs = [],
  showSearch = false,
  headerActions,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="relative flex min-h-screen">
      <Sidebar
        appName={config.appName}
        logo={config.logo}
        navSections={config.navSections}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          // On desktop reserve space for the sidebar
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0',
        )}
      >
        <Header
          breadcrumbs={breadcrumbs}
          onMobileMenuToggle={() => setSidebarOpen((v) => !v)}
          showSearch={showSearch}
          userMenu={config.userMenu}
          actions={headerActions}
        />

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
