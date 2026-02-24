'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { cn } from '@realtyos/frontend-utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@realtyos/ui';

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

export interface HeaderProps {
  breadcrumbs?: BreadcrumbEntry[];
  onMobileMenuToggle: () => void;
  showSearch?: boolean;
  userMenu?: {
    name: string;
    email?: string;
    avatarUrl?: string;
    avatarFallback?: string;
  };
  actions?: ReactNode;
}

export function Header({
  breadcrumbs = [],
  onMobileMenuToggle,
  showSearch = false,
  userMenu,
  actions,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Toggle sidebar menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <BreadcrumbItem key={crumb.label}>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href ?? '#'}>{crumb.label}</Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Optional search */}
      {showSearch && (
        <div className="hidden w-full max-w-xs md:block">
          <Input
            type="search"
            placeholder="Search…"
            className="h-8"
            aria-label="Search"
          />
        </div>
      )}

      {/* Extra actions slot */}
      {actions}

      {/* User menu */}
      {userMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="size-8">
                {userMenu.avatarUrl && <AvatarImage src={userMenu.avatarUrl} alt={userMenu.name} />}
                <AvatarFallback>
                  {userMenu.avatarFallback ?? userMenu.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{userMenu.name}</p>
              {userMenu.email && (
                <p className="text-xs text-muted-foreground">{userMenu.email}</p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/api/auth/signout">Sign out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
