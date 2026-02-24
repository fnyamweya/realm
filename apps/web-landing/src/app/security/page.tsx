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
import { Shield, Lock, FileCheck, Eye, Server, KeyRound } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security',
  description:
    'Learn about the security measures RealtyOS uses to protect your property data, including encryption, access controls, and audit logging.',
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

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encryption at Rest & in Transit',
    description:
      'All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Sensitive fields like SSNs and bank accounts receive additional application-layer encryption.',
  },
  {
    icon: KeyRound,
    title: 'Role-Based Access Control',
    description:
      'Fine-grained permissions ensure users only access the data they need. Support for custom roles, team hierarchies, and property-level isolation.',
  },
  {
    icon: Eye,
    title: 'Comprehensive Audit Logging',
    description:
      'Every action is recorded with immutable audit logs. Track who accessed what, when, and from where with full traceability.',
  },
  {
    icon: Shield,
    title: 'Multi-Factor Authentication',
    description:
      'Protect accounts with TOTP-based MFA. Enterprise plans support SSO via SAML 2.0 and OIDC with automatic provisioning via SCIM.',
  },
  {
    icon: Server,
    title: 'Infrastructure Security',
    description:
      "Deployed on Cloudflare's global edge network with DDoS protection, WAF, and automatic failover. SOC 2 Type II compliant infrastructure.",
  },
  {
    icon: FileCheck,
    title: 'Compliance & Privacy',
    description:
      'Designed with privacy-by-default principles. PII redaction, data retention policies, and tools to help meet GDPR and CCPA requirements.',
  },
];

export default function SecurityPage() {
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
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Security you can trust
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your property data deserves bank-grade protection. RealtyOS is
              built with security at every layer.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature) => (
              <Card key={feature.title} className="border-border/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Compliance Badges */}
          <div className="mx-auto mt-24 max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Compliance & Certifications
            </h2>
            <p className="mt-4 text-muted-foreground">
              We maintain industry-standard certifications and undergo regular
              third-party audits.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              {['SOC 2 Type II', 'GDPR Ready', 'CCPA Compliant', 'ISO 27001'].map(
                (badge) => (
                  <div
                    key={badge}
                    className="flex h-24 w-36 items-center justify-center rounded-lg border bg-muted/30 px-4"
                  >
                    <span className="text-center text-sm font-semibold text-muted-foreground">
                      {badge}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mx-auto mt-24 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Have security questions?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our security team is happy to discuss our practices, provide
              documentation, or schedule a review.
            </p>
            <div className="mt-8">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Contact Security Team
              </a>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
