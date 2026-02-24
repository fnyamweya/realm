import {
  LandingShell,
  type LandingNavLink,
  type FooterColumn,
} from '@realtyos/ui-shells';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@realtyos/ui';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Clock3,
  Gauge,
  Globe2,
  Layers3,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

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

const platformFeatures = [
  {
    icon: Building2,
    title: 'Property Management',
    description:
      'Manage units, leases, maintenance, and operations in one place without jumping between tools.',
  },
  {
    icon: Users,
    title: 'Resident Experience',
    description:
      'Give residents a simple portal for payments, requests, messages, and documents on any device.',
  },
  {
    icon: BarChart3,
    title: 'Financial Visibility',
    description:
      'Track collections, portfolio performance, and reporting with real-time visibility and audit history.',
  },
  {
    icon: Shield,
    title: 'Security by Default',
    description:
      'Role-based access, encryption, and activity logs built in from day one for growing teams.',
  },
];

const rolePaths = [
  {
    icon: Building2,
    title: 'Property Managers',
    subtitle: 'Daily operations',
    description:
      'Run leasing, maintenance, team workflows, and resident communications from one clear workspace.',
    bullets: ['Leases and move-ins', 'Work orders and vendors', 'Team tasks and updates'],
    ctaLabel: 'Open Manager Console',
    href: '/login',
  },
  {
    icon: BarChart3,
    title: 'Owners & Asset Teams',
    subtitle: 'Performance and oversight',
    description:
      'Get a clean view of portfolio health, collections, and key operating signals without digging.',
    bullets: ['Portfolio reporting', 'Collections visibility', 'Exception tracking'],
    ctaLabel: 'View Owner Workspace',
    href: '/login',
  },
  {
    icon: Users,
    title: 'Residents',
    subtitle: 'Self-service portal',
    description:
      'Pay rent, submit maintenance requests, and access important documents with a friendly experience.',
    bullets: ['Payments and receipts', 'Requests and updates', 'Messages and documents'],
    ctaLabel: 'Open Resident Portal',
    href: '/login',
  },
];

const clarityPrinciples = [
  {
    icon: Layers3,
    title: 'Clear navigation',
    description: 'Simple labels, consistent layouts, and obvious next steps reduce training time.',
  },
  {
    icon: Gauge,
    title: 'Fast to use',
    description: 'Large touch targets and focused workflows help teams move quickly on desktop and mobile.',
  },
  {
    icon: Globe2,
    title: 'Built for every role',
    description: 'Owners, operators, and residents each get a tailored experience with the same data core.',
  },
  {
    icon: Shield,
    title: 'Future-ready foundation',
    description: 'Security controls and structured workflows scale from one property to a full portfolio.',
  },
];

const rolloutSteps = [
  {
    icon: Sparkles,
    title: 'Choose your workspace',
    detail: 'Start with a manager, owner, or resident view.',
  },
  {
    icon: Clock3,
    title: 'Set up core workflows',
    detail: 'Configure roles, properties, and day-to-day actions.',
  },
  {
    icon: Check,
    title: 'Go live with confidence',
    detail: 'Roll out clear processes with built-in security controls.',
  },
];

const heroSignals = [
  { label: 'One platform', value: '3 role-based experiences' },
  { label: 'Designed for clarity', value: 'Simple labels + clear actions' },
  { label: 'Works everywhere', value: 'Desktop and mobile ready' },
];

export default function HomePage() {
  return (
    <LandingShell
      className="landing-glass-shell"
      siteName="RealtyOS"
      navLinks={navLinks}
      ctaButton={{ label: 'Get Started', href: '/login' }}
      footerColumns={footerColumns}
      footerNote="© 2025 RealtyOS. All rights reserved."
    >
      <section className="px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="glass-panel p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground/85 shadow-sm backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Modern property software with a human-first UI
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Property management that feels
              <span className="block text-gradient-future">simple on day one</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              RealtyOS is built for every generation of user: clear navigation,
              readable screens, and obvious actions for managers, owners, and
              residents.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_34px_-18px_hsl(var(--primary)/0.65)] transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/75 bg-white/75 px-5 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur-xl transition hover:bg-white/90"
              >
                See Pricing
              </a>
              <a
                href="/docs"
                className="inline-flex min-h-11 items-center justify-center px-2 py-3 text-sm font-semibold text-foreground/80 transition hover:text-foreground"
              >
                Explore Docs
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {rolePaths.map((path) => (
                <a
                  key={path.title}
                  href={path.href}
                  className="group rounded-2xl border border-white/60 bg-white/55 p-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.7)] backdrop-blur-xl transition hover:bg-white/75"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/80">
                      <path.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {path.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{path.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Start here
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-2xl border border-white/60 bg-white/50 p-4 backdrop-blur-xl"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {signal.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-foreground">
                    {signal.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 sm:p-6">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_16px_38px_-28px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Quick Start
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    Get your team live with a clear rollout path
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {rolloutSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/80 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white">
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {index + 1}. {step.title}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-white/60 bg-gradient-to-r from-white/70 via-white/65 to-sky-50/70 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Need a guided evaluation?
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Compare pricing, security, and rollout details before choosing
                  the right starting point.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <a
                    href="/pricing"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_28px_-20px_hsl(var(--primary)/0.65)] transition hover:bg-primary/90"
                  >
                    Compare Plans
                  </a>
                  <a
                    href="/security"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white"
                  >
                    Review Security
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Gauge className="h-4 w-4 text-primary" />
                  Easy to learn
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Clear labels, readable layouts, and consistent actions reduce
                  confusion and hand-holding.
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  Safe to scale
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Role-based access and audit history help teams grow without
                  losing control of sensitive workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass-panel p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-foreground/85">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Choose your path
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Start with the workspace your users need most
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                  Each experience is role-specific, but they all stay connected
                  to the same property data so teams and residents stay in sync.
                </p>
              </div>
              <a
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/75 bg-white/75 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white/90"
              >
                Open RealtyOS
              </a>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {rolePaths.map((path) => (
                <Card
                  key={path.title}
                  className="glass-card gap-4 border-white/50 bg-white/55 py-5 shadow-[0_18px_40px_-28px_rgba(2,6,23,0.75)] backdrop-blur-xl"
                >
                  <CardHeader className="gap-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/80">
                        <path.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {path.subtitle}
                        </p>
                        <CardTitle className="mt-1 text-lg">{path.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-sm leading-6">
                      {path.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-5">
                    <ul className="space-y-2 text-sm text-foreground/85">
                      {path.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={path.href}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/85 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-white/70 transition hover:bg-white"
                    >
                      {path.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="glass-panel p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-foreground/85">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Designed for all generations
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Clear, modern UX without the learning curve
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              RealtyOS is intentionally simple to navigate while staying powerful
              enough for advanced teams. The result is a UI people can trust and
              use comfortably every day.
            </p>

            <div className="mt-6 grid gap-3">
              {clarityPrinciples.map((principle) => (
                <div
                  key={principle.title}
                  className="rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/80">
                      <principle.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {principle.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Core Platform
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  The tools teams use most, in one place
                </h3>
              </div>
              <a
                href="/docs"
                className="hidden min-h-11 items-center justify-center rounded-xl border border-white/75 bg-white/75 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white/90 sm:inline-flex"
              >
                View Docs
              </a>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {platformFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="glass-card gap-3 border-white/50 bg-white/55 py-5 shadow-[0_18px_40px_-30px_rgba(2,6,23,0.75)] backdrop-blur-xl"
                >
                  <CardHeader className="gap-3 px-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/80">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-6">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <a
              href="/docs"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/75 bg-white/75 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white/90 sm:hidden"
            >
              View Docs
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-10 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass-panel p-6 sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-foreground/85">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Clear next steps
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Ready to make property operations easier?
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Start with a role-specific workspace today, then expand to the
                  full RealtyOS platform when your team is ready.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href="/login"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-20px_hsl(var(--primary)/0.65)] transition hover:-translate-y-0.5 hover:bg-primary/90"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/75 bg-white/75 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white/90"
                  >
                    See Pricing
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-white/65 bg-white/60 p-5 shadow-[0_18px_40px_-30px_rgba(2,6,23,0.75)] backdrop-blur-xl">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Start with what matters most
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a
                    href="/login"
                    className="rounded-xl border border-white/70 bg-white/80 p-4 text-left transition hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-foreground">Operator workspace</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Leasing, maintenance, team workflows, and portfolio operations.
                    </p>
                  </a>
                  <a
                    href="/login"
                    className="rounded-xl border border-white/70 bg-white/80 p-4 text-left transition hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-foreground">Resident portal</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Payments, requests, messages, and documents with clear status updates.
                    </p>
                  </a>
                </div>
                <div className="mt-4 rounded-xl border border-white/60 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Need implementation details first?
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Review documentation, pricing, and security guidance before
                    rollout.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="/docs"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white"
                    >
                      Docs
                    </a>
                    <a
                      href="/security"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white"
                    >
                      Security
                    </a>
                    <a
                      href="/pricing"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white"
                    >
                      Pricing
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
