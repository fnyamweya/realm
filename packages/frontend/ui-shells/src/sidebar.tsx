'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@realtyos/frontend-utils';
import { Button, ScrollArea } from '@realtyos/ui';
import type { NavItem, NavSection } from './types';

/* ------------------------------------------------------------------ */
/*  Single nav item                                                   */
/* ------------------------------------------------------------------ */

function SidebarNavItem({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isActive && 'bg-accent text-accent-foreground',
            item.disabled && 'pointer-events-none opacity-50',
          )}
        >
          {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {item.badge}
                </span>
              )}
              <ChevronDown
                className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
              />
            </>
          )}
        </button>

        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.children!.map((child) => (
              <SidebarNavItem
                key={child.href}
                item={child}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      aria-disabled={item.disabled}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
        item.disabled && 'pointer-events-none opacity-50',
      )}
    >
      {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Section group                                                     */
/* ------------------------------------------------------------------ */

function SidebarNavSection({
  section,
  pathname,
  collapsed,
}: {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="space-y-1">
      {section.label && !collapsed && (
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {section.label}
        </p>
      )}
      {section.items.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                           */
/* ------------------------------------------------------------------ */

export interface SidebarProps {
  appName: string;
  logo?: ReactNode;
  navSections: NavSection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function Sidebar({
  appName,
  logo,
  navSections,
  open,
  onOpenChange,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          // Mobile: off-screen by default, slide in when open
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:relative lg:z-auto',
        )}
        aria-label="Sidebar navigation"
      >
        {/* Top: logo / app name + collapse toggle */}
        <div className="flex h-14 items-center gap-3 border-b px-4">
          {logo && <span className="size-6 shrink-0">{logo}</span>}
          {!collapsed && (
            <span className="truncate text-sm font-semibold">{appName}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('ml-auto size-7 shrink-0', collapsed && 'ml-0')}
            onClick={() => {
              onCollapsedChange(!collapsed);
              // On mobile close the overlay after collapsing
              if (open) onOpenChange(false);
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn('size-4 transition-transform', collapsed && 'rotate-180')}
            />
          </Button>
        </div>

        {/* Scrollable nav */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-4 px-2" aria-label="Main navigation">
            {navSections.map((section, i) => (
              <SidebarNavSection
                key={section.label ?? i}
                section={section}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
