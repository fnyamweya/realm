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
  CardFooter,
} from '@realtyos/ui';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for property management teams of every size. Start free and scale as you grow.',
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

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for individual landlords with a small portfolio.',
    features: [
      'Up to 10 units',
      'Resident portal',
      'Online rent collection',
      'Maintenance tracking',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'For growing property management companies.',
    features: [
      'Up to 100 units',
      'Everything in Starter',
      'Financial reporting',
      'Document management',
      'API access',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large portfolios with advanced requirements.',
    features: [
      'Unlimited units',
      'Everything in Professional',
      'Custom integrations',
      'SSO & SCIM',
      'Dedicated account manager',
      'SLA guarantee',
      'Audit log exports',
    ],
    cta: 'Contact Sales',
  },
];

export default function PricingPage() {
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
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free and scale as your portfolio grows. No hidden fees, no
              long-term contracts.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlighted
                    ? 'border-primary shadow-lg ring-1 ring-primary'
                    : 'border-border/50'
                }
              >
                <CardHeader>
                  {tier.highlighted && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      Most Popular
                    </p>
                  )}
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-foreground">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-muted-foreground">
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-2 text-base">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a
                    href="/login"
                    className={`inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${
                      tier.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-primary bg-background text-primary hover:bg-accent'
                    }`}
                  >
                    {tier.cta}
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="mx-auto mt-24 max-w-4xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
              Compare plans
            </h2>
            <div className="mt-8 overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                      Starter
                    </th>
                    <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                      Professional
                    </th>
                    <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Units', '10', '100', 'Unlimited'],
                    ['Resident Portal', '✓', '✓', '✓'],
                    ['Online Payments', '✓', '✓', '✓'],
                    ['Financial Reports', '—', '✓', '✓'],
                    ['API Access', '—', '✓', '✓'],
                    ['SSO / SCIM', '—', '—', '✓'],
                    ['Custom Integrations', '—', '—', '✓'],
                    ['SLA Guarantee', '—', '—', '✓'],
                  ].map(([feature, starter, pro, enterprise]) => (
                    <tr key={feature} className="border-b last:border-0">
                      <td className="px-6 py-3 font-medium text-foreground">
                        {feature}
                      </td>
                      <td className="px-6 py-3 text-center text-muted-foreground">
                        {starter}
                      </td>
                      <td className="px-6 py-3 text-center text-muted-foreground">
                        {pro}
                      </td>
                      <td className="px-6 py-3 text-center text-muted-foreground">
                        {enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
