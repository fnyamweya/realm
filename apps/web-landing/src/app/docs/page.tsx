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
} from '@realtyos/ui';
import { BookOpen, Code, Rocket, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Get started with RealtyOS. Explore guides, API references, and tutorials for property management integration.',
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

const sections = [
  {
    icon: Rocket,
    title: 'Getting Started',
    description:
      'Set up your RealtyOS account, configure your first property, and invite your team in minutes.',
    links: [
      { label: 'Quick Start Guide', href: '/docs/quickstart' },
      { label: 'Account Setup', href: '/docs/account-setup' },
      { label: 'Add Your First Property', href: '/docs/first-property' },
    ],
  },
  {
    icon: Code,
    title: 'API Reference',
    description:
      'Integrate RealtyOS with your existing tools using our REST API. Available on Professional and Enterprise plans.',
    links: [
      { label: 'Authentication', href: '/docs/api/auth' },
      { label: 'Properties API', href: '/docs/api/properties' },
      { label: 'Leases API', href: '/docs/api/leases' },
    ],
  },
  {
    icon: BookOpen,
    title: 'Guides',
    description:
      'Step-by-step guides for common workflows like lease management, rent collection, and maintenance tracking.',
    links: [
      { label: 'Lease Management', href: '/docs/guides/leases' },
      { label: 'Rent Collection', href: '/docs/guides/rent' },
      { label: 'Maintenance Workflows', href: '/docs/guides/maintenance' },
    ],
  },
  {
    icon: FileText,
    title: 'Platform Concepts',
    description:
      'Understand core concepts like organizations, properties, units, roles, and permissions.',
    links: [
      { label: 'Organizations & Teams', href: '/docs/concepts/orgs' },
      { label: 'Roles & Permissions', href: '/docs/concepts/rbac' },
      { label: 'Data Model', href: '/docs/concepts/data-model' },
    ],
  },
];

export default function DocsPage() {
  return (
    <LandingShell
      className="landing-glass-shell"
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
              Documentation
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to set up, integrate, and get the most out of
              RealtyOS.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.title} className="border-border/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                  <ul className="mt-4 space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {link.label} →
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
