'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@realtyos/ui';

export interface OrgData {
    name: string;
    logo?: React.ReactNode;
    plan?: string;
}

export interface OrgSwitcherProps {
    /** List of available orgs/teams */
    orgs: OrgData[];
    /** Currently active org (index into orgs array) */
    activeOrgIndex?: number;
    /** Called when user selects a different org */
    onOrgChange?: (index: number) => void;
    /** Called when user clicks "Add Organization" */
    onAddOrg?: () => void;
}

export function OrgSwitcher({
    orgs,
    activeOrgIndex = 0,
    onOrgChange,
    onAddOrg,
}: OrgSwitcherProps) {
    const { isMobile } = useSidebar();
    const [activeIdx, setActiveIdx] = React.useState(activeOrgIndex);

    const activeOrg = orgs[activeIdx];

    const handleSelect = (idx: number) => {
        setActiveIdx(idx);
        onOrgChange?.(idx);
    };

    if (!activeOrg) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                {activeOrg.logo ?? (
                                    <span className="text-xs font-bold">
                                        {activeOrg.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {activeOrg.name}
                                </span>
                                {activeOrg.plan && (
                                    <span className="truncate text-xs">{activeOrg.plan}</span>
                                )}
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Organizations
                        </DropdownMenuLabel>
                        {orgs.map((org, index) => (
                            <DropdownMenuItem
                                key={org.name}
                                onClick={() => handleSelect(index)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border">
                                    {org.logo ?? (
                                        <span className="text-xs font-bold">
                                            {org.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {org.name}
                                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        {onAddOrg && (
                            <DropdownMenuItem className="gap-2 p-2" onClick={onAddOrg}>
                                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                    <Plus className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">
                                    Add organization
                                </div>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
