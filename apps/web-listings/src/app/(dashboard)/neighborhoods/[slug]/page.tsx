import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock3, Compass, MapPin } from 'lucide-react';
import { Breadcrumbs, GradientPhoto, ListingCard, PageSection, Panel, Pill, SparkBarChart } from '@/components/portal/ui';
import { resolveParams } from '@/lib/next-page';
import { formatCurrency, getNeighborhoodBySlug, listings, neighborhoods } from '@/lib/portal-data';

export async function generateStaticParams() {
  return neighborhoods.map((neighborhood) => ({ slug: neighborhood.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const neighborhood = getNeighborhoodBySlug(slug);
  return {
    title: neighborhood ? `${neighborhood.name} • Neighborhood Guide` : 'Neighborhood Guide',
  };
}

export default async function NeighborhoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await resolveParams(params);
  const neighborhood = getNeighborhoodBySlug(slug);

  if (!neighborhood) {
    notFound();
  }

  const homes = listings.filter((listing) => listing.neighborhoodSlug === neighborhood.slug);
  const trendValues = [58, 61, 66, 64, 70, 73, 78, 76, 82, 84, 87, 89].map((v, i) => v + (i % 2 === 0 ? 0 : 2));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Neighborhoods', href: '/neighborhoods' }, { label: neighborhood.name }]} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel className="p-0 overflow-hidden">
            <GradientPhoto palette={neighborhood.palette} className="h-56 rounded-none" label={`${neighborhood.city}, ${neighborhood.state}`} />
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="sky">Demand {neighborhood.demandIndex}/100</Pill>
                <Pill tone={neighborhood.yoyChangePct >= 0 ? 'emerald' : 'amber'}>
                  {neighborhood.yoyChangePct >= 0 ? '+' : ''}{neighborhood.yoyChangePct.toFixed(1)}% YoY
                </Pill>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{neighborhood.name}</h1>
              <p className="mt-2 text-sm text-white/65">{neighborhood.tagline}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <Metric title="Median sale" value={formatCurrency(neighborhood.medianSalePrice)} />
                <Metric title="Median rent" value={formatCurrency(neighborhood.medianRent, 'rent')} />
                <Metric title="DOM" value={`${neighborhood.avgDaysOnMarket} days`} />
                <Metric title="Commute" value={`${neighborhood.commuteDowntownMin} min`} />
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <h2 className="text-xl font-semibold text-white">Livability scores</h2>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ['Walk score', neighborhood.walkScore],
                  ['Transit score', neighborhood.transitScore],
                  ['Bike score', neighborhood.bikeScore],
                  ['Schools score', neighborhood.schoolsScore * 10],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <div className="mb-1 flex items-center justify-between text-white/75"><span>{label}</span><span className="font-semibold text-white">{value}</span></div>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${Math.min(100, Number(value))}%` }} /></div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-white">Demand momentum</h2>
                <Pill tone="emerald">12-month trend</Pill>
              </div>
              <SparkBarChart values={trendValues} className="mt-4 h-32" />
              <p className="mt-3 text-sm text-white/65">Modeled buyer demand and viewing activity show resilient momentum in this submarket.</p>
            </Panel>
          </div>

          <Panel>
            <h2 className="text-xl font-semibold text-white">What makes this area future-ready</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Highlights</div>
                <div className="mt-3 space-y-2 text-sm text-white/75">
                  {neighborhood.highlights.map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">{item}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Future signals</div>
                <div className="mt-3 space-y-2 text-sm text-white/75">
                  {neighborhood.futureSignals.map((item) => (
                    <div key={item} className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 px-3 py-2">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Panel>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Quick facts</div>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <Fact icon={MapPin} label="City" value={`${neighborhood.city}, ${neighborhood.state}`} />
              <Fact icon={Clock3} label="Downtown commute" value={`${neighborhood.commuteDowntownMin} min`} />
              <Fact icon={Compass} label="Demand index" value={`${neighborhood.demandIndex}/100`} />
            </div>
            <div className="mt-4">
              <Link href={`/listings?city=${encodeURIComponent(neighborhood.city)}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
                Browse listings in {neighborhood.city} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Panel>
          <Panel>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Homes in this guide</div>
            <div className="mt-2 text-lg font-semibold text-white">{homes.length} active sample listings</div>
            <p className="mt-2 text-sm text-white/65">Neighborhood and listing routes are linked so users can move from research to action without losing context.</p>
          </Panel>
        </div>
      </div>

      <PageSection
        eyebrow="Inventory"
        title={`Listings in ${neighborhood.name}`}
        description="Filtered inventory tied to this neighborhood guide."
      >
        <div className="grid gap-4">
          {homes.map((home) => (
            <ListingCard key={home.slug} listing={home} compact />
          ))}
        </div>
      </PageSection>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-white/45">{title}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-200" /> {label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
