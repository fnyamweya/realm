import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@realtyos/frontend-utils';
import { Button } from '@realtyos/ui';

export interface LandingNavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: LandingNavLink[];
}

export interface LandingShellProps {
  logo?: ReactNode;
  siteName?: string;
  navLinks?: LandingNavLink[];
  ctaButton?: { label: string; href: string };
  footerColumns?: FooterColumn[];
  footerNote?: string;
  children: ReactNode;
  className?: string;
}

export function LandingShell({
  logo,
  siteName = 'RealtyOS',
  navLinks = [],
  ctaButton,
  footerColumns = [],
  footerNote,
  children,
  className,
}: LandingShellProps) {
  return (
    <div className={cn('flex min-h-screen flex-col', className)}>
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            {logo && <span className="size-6">{logo}</span>}
            <span className="text-sm font-bold">{siteName}</span>
          </Link>

          <nav className="ml-8 hidden gap-6 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {ctaButton && (
            <Button asChild size="sm">
              <Link href={ctaButton.href}>{ctaButton.label}</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {footerColumns.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {footerNote && (
            <p className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
              {footerNote}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
