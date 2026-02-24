"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Separator,
    SidebarTrigger,
} from "@realtyos/ui";
import { ThemeModeToggle } from "./theme-mode-toggle";
import { ThemeSelector } from "./theme-selector";

export interface BreadcrumbEntry {
    label: string;
    href?: string;
}

export interface HeaderProps {
    breadcrumbs?: BreadcrumbEntry[];
    actions?: ReactNode;
}

export function Header({ breadcrumbs = [], actions }: HeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                {breadcrumbs.length > 0 && (
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, i) => {
                                const isLast = i === breadcrumbs.length - 1;
                                return (
                                    <Fragment key={`${crumb.label}-${i}`}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={crumb.href ?? "#"}>{crumb.label}</Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>

            <div className="flex items-center gap-2 px-4">
                {actions}
                <ThemeModeToggle />
                <ThemeSelector />
            </div>
        </header>
    );
}
