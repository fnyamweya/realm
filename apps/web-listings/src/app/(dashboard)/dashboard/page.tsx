import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CircleCheck, Sparkles } from 'lucide-react';
import { GradientPhoto, ListingCard, MetricTile, Panel, Pill, SparkBarChart } from '@/components/portal/ui';
import { dashboardKpis, dashboardLeads, getListingBySlug, listings } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Listing operations workspace overview with pipeline, tasks, and performance signals.',
};

export default function DashboardOverviewPage() {
  const kpis = dashboardKpis();
  const upcomingTours = dashboardLeads.filter((lead) => lead.stage === 'Tour Scheduled');
  const spotlightListings = listings.slice(0, 2);

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5" /> Workspace overview
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Listing operations dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Monitor inventory health, lead response velocity, and tour pipeline from a single route group (`/dashboard/*`).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/listings" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
              Manage listings <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/inquiries" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
              Lead inbox
            </Link>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <MetricTile key={kpi.label} label={kpi.label} value={kpi.value} detail={kpi.detail} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <Panel>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-lg font-semibold text-white">Pipeline velocity (30d)</div>
              <div className="text-sm text-white/55">Inquiries to tours to offers</div>
            </div>
            <Pill tone="emerald">+12.4%</Pill>
          </div>
          <SparkBarChart values={[18, 21, 25, 24, 28, 31, 29, 36, 34, 38, 41, 45, 44, 49]} className="mt-4 h-32" />
          <div className="mt-4 grid gap-2 md:grid-cols-3 text-sm">
            <StatusBox label="New inquiries" value="312" tone="sky" />
            <StatusBox label="Tours booked" value="43" tone="emerald" />
            <StatusBox label="Offers" value="9" tone="amber" />
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-white">Action queue</div>
          <div className="mt-4 space-y-2 text-sm text-white/75">
            {[
              'Follow up with 7 open-house leads in under 15 minutes.',
              'Publish media set for Riverfront Modern Townhome.',
              'Review pricing strategy on 2 listings > 20 DOM.',
              'Confirm weekend tour schedule blocks with showing assistants.',
            ].map((task, index) => (
              <div key={task} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/70">{index + 1}</span>
                <span>{task}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-semibold text-white">Upcoming tours</div>
            <Link href="/dashboard/inquiries" className="text-sm text-cyan-200 hover:text-cyan-100">Open inbox</Link>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingTours.map((lead) => {
              const listing = getListingBySlug(lead.listingSlug);
              return (
                <div key={lead.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-white">{lead.name}</div>
                      <div className="mt-1 text-sm text-white/55">{listing?.title ?? 'Listing'} • {lead.lastTouch}</div>
                    </div>
                    <Pill tone="emerald">{lead.stage}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{lead.source}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Budget {lead.budget.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="text-lg font-semibold text-white">Listing spotlight</div>
          <div className="mt-4 space-y-4">
            {spotlightListings.map((listing) => (
              <div key={listing.slug} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <GradientPhoto palette={listing.heroPalette} className="h-28 sm:h-full" label={listing.city} />
                  <div>
                    <div className="flex flex-wrap gap-2"><Pill>{listing.propertyType}</Pill><Pill tone="sky">{listing.daysOnMarket} DOM</Pill></div>
                    <div className="mt-2 text-base font-semibold text-white">{listing.title}</div>
                    <div className="mt-1 text-sm text-white/55">Response quality is improving for this listing's recent inquiries.</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/listings/${listing.slug}`} className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10">View public page</Link>
                      <Link href={`/dashboard/listings`} className="inline-flex items-center rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20">Open ops view</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-0 overflow-hidden">
        <div className="p-4">
          <div className="text-lg font-semibold text-white">Recommended listings to watch</div>
          <div className="text-sm text-white/55">Public portal cards rendered inside the ops workspace for a consistent design system.</div>
        </div>
        <div className="space-y-4 px-4 pb-4">
          {listings.slice(2, 4).map((listing) => (
            <ListingCard key={listing.slug} listing={listing} compact />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StatusBox({ label, value, tone }: { label: string; value: string; tone: 'sky' | 'emerald' | 'amber' }) {
  const toneClass = tone === 'emerald'
    ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
    : tone === 'amber'
      ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
      : 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.16em] opacity-75">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
