'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Building2, Heart, Layers3, Menu, Search, Sparkles } from 'lucide-react';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean): string {
  return active
    ? 'border-white/20 bg-white/10 text-white shadow-sm shadow-black/20'
    : 'border-white/10 bg-white/0 text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white';
}

const primaryNav = [
  { href: '/listings', label: 'Listings' },
  { href: '/agents', label: 'Agents' },
  { href: '/neighborhoods', label: 'Neighborhoods' },
  { href: '/market-insights', label: 'Market' },
  { href: '/new-developments', label: 'Developments' },
  { href: '/sell', label: 'Sell' },
] as const;

const utilityNav = [
  { href: '/saved', label: 'Saved', icon: Heart },
  { href: '/compare', label: 'Compare', icon: Layers3 },
  { href: '/dashboard', label: 'Dashboard', icon: Building2 },
] as const;

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-12%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[15%] h-[24rem] w-[24rem] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="group inline-flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/20">
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-white">Realm Listings</div>
                <div className="text-xs text-white/50">Search, compare, close smarter</div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-2 lg:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl border px-3 py-2 text-sm transition ${navLinkClass(isActive(pathname, item.href))}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/listings?view=map"
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:border-white/20 hover:text-white md:inline-flex"
            >
              <Search className="h-4 w-4" />
              Explore map
            </Link>
            {utilityNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${navLinkClass(isActive(pathname, item.href))}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20"
            >
              <Bell className="h-4 w-4" />
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 text-sm text-white/70 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="space-y-2">
            <div className="text-base font-semibold text-white">Realm Listings</div>
            <p className="max-w-xs text-white/60">
              A future-ready real estate discovery portal with agent workflows, listing intelligence, and market analytics in one place.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Discover</div>
            <div className="space-y-2">
              <Link href="/listings" className="block hover:text-white">All listings</Link>
              <Link href="/buy" className="block hover:text-white">Buy</Link>
              <Link href="/rent" className="block hover:text-white">Rent</Link>
              <Link href="/map" className="block hover:text-white">Map search</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Intelligence</div>
            <div className="space-y-2">
              <Link href="/market-insights" className="block hover:text-white">Market insights</Link>
              <Link href="/neighborhoods" className="block hover:text-white">Neighborhood guides</Link>
              <Link href="/new-developments" className="block hover:text-white">New developments</Link>
              <Link href="/compare" className="block hover:text-white">Compare homes</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Workspace</div>
            <div className="space-y-2">
              <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
              <Link href="/dashboard/listings" className="block hover:text-white">Listing operations</Link>
              <Link href="/dashboard/inquiries" className="block hover:text-white">Lead inbox</Link>
              <Link href="/dashboard/analytics" className="block hover:text-white">Performance analytics</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const dashboardNav = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/listings', label: 'Listings Ops' },
  { href: '/dashboard/inquiries', label: 'Lead Inbox' },
  { href: '/dashboard/analytics', label: 'Analytics' },
] as const;

export function DashboardWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl lg:p-4">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/25 to-emerald-400/25 text-sm font-semibold text-white">
                RL
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Listing Ops</div>
                <div className="text-xs text-white/50">Brokerage workspace</div>
              </div>
            </div>
            <nav className="space-y-2">
              {dashboardNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl border px-3 py-2 text-sm transition ${navLinkClass(isActive(pathname, item.href))}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Focus</div>
              <p className="mt-2 text-sm text-cyan-100/90">
                Prioritize sub-15 minute response times for open-house leads to improve conversion velocity.
              </p>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
