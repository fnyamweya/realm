"use client";

import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@realtyos/ui";
import { AppSidebar, type AppSidebarProps } from "./app-sidebar";
import { Header, type BreadcrumbEntry } from "./header";

export interface DashboardShellProps {
    /** Props forwarded to the AppSidebar component */
    sidebarProps: AppSidebarProps;
    /** Whether sidebar starts open (persisted via cookie) */
    defaultOpen?: boolean;
    breadcrumbs?: BreadcrumbEntry[];
    headerActions?: ReactNode;
    children: ReactNode;
}

export function DashboardShell({
    sidebarProps,
    defaultOpen = true,
    breadcrumbs,
    headerActions,
    children,
}: DashboardShellProps) {
    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar {...sidebarProps} />
            <SidebarInset>
                <Header breadcrumbs={breadcrumbs} actions={headerActions} />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
