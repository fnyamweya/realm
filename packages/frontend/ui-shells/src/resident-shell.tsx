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

export interface ResidentShellProps {
  navSections: NavSection[];
  breadcrumbs?: BreadcrumbEntry[];
  headerActions?: ReactNode;
  logo?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  orgs?: OrgData[];
  activeOrgIndex?: number;
  onOrgChange?: (index: number) => void;
  user?: NavUserData;
  onAccount?: () => void;
  onLogout?: () => void;
}

export function ResidentShell({
  navSections,
  breadcrumbs,
  headerActions,
  logo,
  defaultOpen = true,
  children,
  orgs,
  activeOrgIndex,
  onOrgChange,
  user,
  onAccount,
  onLogout,
}: ResidentShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        appName="RealtyOS Resident"
        logo={logo}
        navSections={navSections}
        headerContent={
          orgs && orgs.length > 0 ? (
            <OrgSwitcher
              orgs={orgs}
              activeOrgIndex={activeOrgIndex}
              onOrgChange={onOrgChange}
            />
          ) : undefined
        }
        footerContent={
          user ? (
            <NavUser user={user} onAccount={onAccount} onLogout={onLogout} />
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
