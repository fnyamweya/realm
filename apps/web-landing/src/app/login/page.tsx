import type { Metadata } from 'next';
import {
  LandingShell,
  type LandingNavLink,
  type FooterColumn,
} from '@realtyos/ui-shells';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@realtyos/ui';
import { Building2, Home, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login',
  description:
    'Sign in to RealtyOS. Access the Console for property management, the Resident Portal, or the Command interface.',
};

const navLinks: LandingNavLink[] = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '/security' },
  { label: 'Docs', href: '/docs' },
  { label: 'Login', href: '/login' },
];

const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs#api' },
    ],
  },
];

const portals = [
  {
    icon: Building2,
    title: 'Console',
    description:
      'For property managers and owners. Manage your portfolio, leases, finances, and maintenance from a powerful dashboard.',
    href: '/console/login',
    cta: 'Sign in to Console',
    primary: true,
  },
  {
    icon: Home,
    title: 'Resident Portal',
    description:
      'For tenants and residents. Pay rent, submit maintenance requests, view lease documents, and communicate with management.',
    href: '/resident/login',
    cta: 'Sign in as Resident',
    primary: true,
  },
];

export default function LoginPage() {
  return (
    <LandingShell
      siteName="RealtyOS"
      navLinks={navLinks}
      ctaButton={{ label: 'Get Started', href: '/login' }}
      footerColumns={footerColumns}
      footerNote="© 2025 RealtyOS. All rights reserved."
    >
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Sign in to RealtyOS
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the portal that matches your role to get started.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
            {portals.map((portal) => (
              <Card
                key={portal.title}
                className="border-border/50 transition-shadow hover:shadow-md"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <portal.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{portal.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {portal.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href={portal.href}
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    {portal.cta}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Command login - smaller, footer-style */}
          <div className="mx-auto mt-12 max-w-md text-center">
            <div className="rounded-lg border border-dashed border-border/50 p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Terminal className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Platform Admin?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Access the Command interface for platform-level administration.
              </p>
              <a
                href="/command/login"
                className="mt-3 inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Sign in to Command →
              </a>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
