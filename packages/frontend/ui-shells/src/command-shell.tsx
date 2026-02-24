"use client";

import type { ReactNode } from "react";
import { cn } from "@realtyos/frontend-utils";
import { SidebarProvider, SidebarInset } from "@realtyos/ui";
import { AppSidebar } from "./app-sidebar";
import { Header, type BreadcrumbEntry } from "./header";
import type { NavSection } from "./types";
import type { OrgData } from "./org-switcher";
import type { NavUserData } from "./nav-user";
import { OrgSwitcher } from "./org-switcher";
import { NavUser } from "./nav-user";

export type CommandEnvironment = "development" | "uat" | "production";

const envBannerStyles: Record<CommandEnvironment, string> = {
  development: "bg-blue-600 text-white",
  uat: "bg-amber-500 text-black",
  production: "bg-red-600 text-white",
};

const envLabels: Record<CommandEnvironment, string> = {
  development: "Development",
  uat: "UAT",
  production: "Production",
};

export interface CommandShellProps {
  environment?: CommandEnvironment;
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

export function CommandShell({
  environment = "development",
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
}: CommandShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Environment banner */}
      <div
        className={cn(
          "flex h-7 items-center justify-center text-xs font-semibold",
          envBannerStyles[environment],
        )}
        role="status"
        aria-label={`Environment: ${envLabels[environment]}`}
      >
        {envLabels[environment]} Environment
      </div>

      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          appName="RealtyOS Command"
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
    </div>
  );
}
