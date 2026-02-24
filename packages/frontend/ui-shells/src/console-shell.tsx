"use client";

import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@realtyos/ui";
import { AppSidebar } from "./app-sidebar";
import { Header, type BreadcrumbEntry } from "./header";
import type { NavSection } from "./types";
import type { OrgData } from "./org-switcher";
import type { NavUserData } from "./nav-user";
import { OrgSwitcher } from "./org-switcher";
import { NavUser } from "./nav-user";

export interface ConsoleShellProps {
  navSections: NavSection[];
  breadcrumbs?: BreadcrumbEntry[];
  headerActions?: ReactNode;
  logo?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  /** Org switcher data */
  orgs?: OrgData[];
  activeOrgIndex?: number;
  onOrgChange?: (index: number) => void;
  onAddOrg?: () => void;
  /** User nav data */
  user?: NavUserData;
  onAccount?: () => void;
  onBilling?: () => void;
  onNotifications?: () => void;
  onLogout?: () => void;
}

export function ConsoleShell({
  navSections,
  breadcrumbs,
  headerActions,
  logo,
  defaultOpen = true,
  children,
  orgs,
  activeOrgIndex,
  onOrgChange,
  onAddOrg,
  user,
  onAccount,
  onBilling,
  onNotifications,
  onLogout,
}: ConsoleShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        appName="RealtyOS Console"
        logo={logo}
        navSections={navSections}
        headerContent={
          orgs && orgs.length > 0 ? (
            <OrgSwitcher
              orgs={orgs}
              activeOrgIndex={activeOrgIndex}
              onOrgChange={onOrgChange}
              onAddOrg={onAddOrg}
            />
          ) : undefined
        }
        footerContent={
          user ? (
            <NavUser
              user={user}
              onAccount={onAccount}
              onBilling={onBilling}
              onNotifications={onNotifications}
              onLogout={onLogout}
            />
          ) : undefined
        }
      />
      <SidebarInset>
        <Header breadcrumbs={breadcrumbs} actions={headerActions} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
