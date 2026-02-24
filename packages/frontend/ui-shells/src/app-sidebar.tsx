"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@realtyos/ui";
import type { ReactNode } from "react";
import type { NavItem, NavSection } from "./types";

export interface AppSidebarProps {
    appName: string;
    logo?: ReactNode;
    navSections: NavSection[];
    /** Rendered inside SidebarHeader – typically an OrgSwitcher */
    headerContent?: ReactNode;
    /** Rendered inside SidebarFooter – typically a NavUser */
    footerContent?: ReactNode;
}

export function AppSidebar({
    appName,
    logo,
    navSections,
    headerContent,
    footerContent,
}: AppSidebarProps) {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                {headerContent ?? (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href="/">
                                    {logo && <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">{logo}</span>}
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{appName}</span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarHeader>

            <SidebarContent className="overflow-x-hidden">
                {navSections.map((section, sectionIndex) => (
                    <SidebarGroup key={section.label ?? sectionIndex}>
                        {section.label && (
                            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                        )}
                        <SidebarMenu>
                            {section.items.map((item) => (
                                <NavItemRenderer
                                    key={item.href}
                                    item={item}
                                    pathname={pathname}
                                />
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            {footerContent && (
                <SidebarFooter>
                    {footerContent}
                </SidebarFooter>
            )}

            <SidebarRail />
        </Sidebar>
    );
}

/* ------------------------------------------------------------------ */
/*  Nav item with optional collapsible children                        */
/* ------------------------------------------------------------------ */

function NavItemRenderer({
    item,
    pathname,
}: {
    item: NavItem;
    pathname: string;
}) {
    const isActive =
        pathname === item.href || pathname.startsWith(item.href + "/");
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
        return (
            <Collapsible
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
            >
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                            {item.icon}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.children!.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.href}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={pathname === subItem.href}
                                    >
                                        <Link href={subItem.href}>
                                            <span>{subItem.title}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
            >
                <Link href={item.href}>
                    {item.icon}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
