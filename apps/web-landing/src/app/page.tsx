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
import { Building2, Shield, BarChart3, Users } from 'lucide-react';

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
      { label: 'Guides', href: '/docs#guides' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

const features = [
  {
    icon: Building2,
    title: 'Property Management',
    description:
      'Manage your entire portfolio from a single dashboard. Track units, leases, and maintenance requests with ease.',
  },
  {
    icon: Users,
    title: 'Resident Portal',
    description:
      'Give residents a modern self-service portal for payments, maintenance requests, and communication.',
  },
  {
    icon: BarChart3,
    title: 'Financial Insights',
    description:
      'Real-time financial reporting, automated rent collection, and comprehensive accounting tools.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Bank-grade encryption, role-based access control, and full audit logging to keep your data safe.',
  },
];

export default function HomePage() {
  return (
    <LandingShell
      siteName="RealtyOS"
      navLinks={navLinks}
      ctaButton={{ label: 'Get Started', href: '/login' }}
      footerColumns={footerColumns}
      footerNote="© 2025 RealtyOS. All rights reserved."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Modern Property Management,{' '}
              <span className="text-primary">Reimagined</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              RealtyOS is the all-in-one platform that simplifies property
              management for owners, managers, and residents. Streamline
              operations, automate workflows, and deliver exceptional
              experiences.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/login"
                className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Start Free Trial
              </a>
              <a
                href="/docs"
                className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors"
              >
                Read the Docs <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to manage properties
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete suite of tools designed for modern property management
              teams.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the portal that fits your role and start managing
              properties the modern way.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Property Console</CardTitle>
                  <CardDescription>
                    For property managers and owners. Manage units, leases,
                    finances, and maintenance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    Open Console
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Resident Portal</CardTitle>
                  <CardDescription>
                    For tenants and residents. Pay rent, submit requests, and
                    view documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-md border border-primary bg-background px-4 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-accent transition-colors"
                  >
                    Open Resident Portal
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
