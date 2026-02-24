import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import { GradientPhoto, Panel, Pill } from '@/components/portal/ui';
import { resolveSearchParams } from '@/lib/next-page';
import {
  estimateMonthlyPayment,
  formatCurrency,
  formatInteger,
  parseSlugList,
  pickListingsBySlugs,
} from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Compare Homes',
  description: 'Compare listing price, costs, location scores, and efficiency features side-by-side.',
};

export default async function CompareHomesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await resolveSearchParams(searchParams);
  const selected = pickListingsBySlugs(parseSlugList(raw), 3).slice(0, 3);

  const rows = [
    {
      label: 'Price',
      value: (slug: string) => {
        const item = selected.find((listing) => listing.slug === slug);
        return item ? formatCurrency(item.price, item.intent) : '-';
      },
    },
    {
      label: 'Est. monthly',
      value: (slug: string) => {
        const item = selected.find((listing) => listing.slug === slug);
        return item ? formatCurrency(Math.round(estimateMonthlyPayment(item)), 'rent') : '-';
      },
    },
    { label: 'Beds', value: (slug: string) => String(selected.find((l) => l.slug === slug)?.beds ?? '-') },
    { label: 'Baths', value: (slug: string) => String(selected.find((l) => l.slug === slug)?.baths ?? '-') },
    {
      label: 'Sqft',
      value: (slug: string) => {
        const item = selected.find((listing) => listing.slug === slug);
        return item ? formatInteger(item.sqft) : '-';
      },
    },
    { label: 'Days on market', value: (slug: string) => String(selected.find((l) => l.slug === slug)?.daysOnMarket ?? '-') },
    { label: 'Walk score', value: (slug: string) => String(selected.find((l) => l.slug === slug)?.walkScore ?? '-') },
    { label: 'Transit score', value: (slug: string) => String(selected.find((l) => l.slug === slug)?.transitScore ?? '-') },
    { label: 'Energy score', value: (slug: string) => String(selected.find((l) => l.slug === slug)?.energyScore ?? '-') },
    { label: 'Climate risk', value: (slug: string) => selected.find((l) => l.slug === slug)?.climateRisk ?? '-' },
    { label: 'Fiber ready', value: (slug: string) => (selected.find((l) => l.slug === slug)?.fiberReady ? 'Yes' : 'No') },
    { label: 'EV ready', value: (slug: string) => (selected.find((l) => l.slug === slug)?.evReady ? 'Yes' : 'No') },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Layers3 className="h-3.5 w-3.5" /> Compare workflow
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Compare homes side-by-side</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              The compare route is URL-driven (`ids=slug1,slug2,...`) so it can be shared, emailed, and attached to tour planning or offer discussions.
            </p>
          </div>
          <Link href="/listings" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
            Add more homes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Panel>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[900px] rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur">
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `240px repeat(${selected.length}, minmax(0, 1fr))` }}>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-white/70">Attributes</div>
            {selected.map((listing) => (
              <div key={listing.slug} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <GradientPhoto palette={listing.heroPalette} className="h-28" label={listing.city} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone={listing.intent === 'rent' ? 'sky' : 'slate'}>{listing.intent === 'rent' ? 'Rent' : 'Buy'}</Pill>
                  <Pill>{listing.propertyType}</Pill>
                </div>
                <Link href={`/listings/${listing.slug}`} className="mt-3 block text-sm font-semibold text-white hover:text-cyan-200">
                  {listing.title}
                </Link>
                <div className="mt-1 text-xs text-white/55">{listing.neighborhoodName}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/listings/${listing.slug}/schedule-tour`} className="inline-flex rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-100 hover:bg-cyan-400/20">
                    Schedule tour
                  </Link>
                  <Link href={`/saved?ids=${listing.slug}`} className="inline-flex rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75">
                    Save
                  </Link>
                </div>
              </div>
            ))}

            {rows.map((row) => (
              <div key={row.label} className="contents">
                <div key={`${row.label}-label`} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                  {row.label}
                </div>
                {selected.map((listing) => (
                  <div key={`${row.label}-${listing.slug}`} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white">
                    {row.value(listing.slug)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
