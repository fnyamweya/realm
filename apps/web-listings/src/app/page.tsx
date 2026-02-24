import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import { PortalShell } from '@/components/portal/chrome';
import {
    DevelopmentCard,
    FeatureGrid,
    HeroSearchCtas,
    ListingCard,
    MetricTile,
    NeighborhoodCard,
    PageSection,
    Panel,
    SparkBarChart,
} from '@/components/portal/ui';
import {
    developments,
    formatCompactCurrency,
    listings,
    marketCityMetrics,
    neighborhoods,
} from '@/lib/portal-data';

export const metadata: Metadata = {
    title: 'Future-Ready Real Estate Portal',
    description:
        'Discover, compare, and schedule tours across a modern real estate listing portal with market intelligence and agent workflows.',
};

export default function HomePage() {
    const featuredListings = listings.slice(0, 4);
    const featuredNeighborhoods = neighborhoods.slice(0, 3);
    const featuredDevelopments = developments.slice(0, 3);

    return (
        <PortalShell>
            <section className="mx-auto w-full max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8 lg:pt-12">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
                    <Panel className="relative overflow-hidden p-6 sm:p-8">
                        <div className="absolute right-[-8%] top-[-10%] h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
                        <div className="absolute bottom-[-12%] left-[12%] h-44 w-44 rounded-full bg-fuchsia-400/10 blur-3xl" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                                <Sparkles className="h-3.5 w-3.5" />
                                Future-focused listing portal UX
                            </div>
                            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Search homes with context, not just filters.
                            </h1>
                            <p className="mt-4 max-w-2xl text-base text-white/65 sm:text-lg">
                                Realm combines modern listing discovery, neighborhood intelligence, AI match explanations, tour scheduling, and an operations dashboard in one web experience.
                            </p>

                            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                                <form action="/listings" method="get" className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_160px_140px_auto]">
                                    <input
                                        type="search"
                                        name="q"
                                        placeholder="Search city, neighborhood, address, features"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35"
                                    />
                                    <select
                                        name="intent"
                                        defaultValue="all"
                                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                                    >
                                        <option value="all">Buy + Rent</option>
                                        <option value="buy">Buy</option>
                                        <option value="rent">Rent</option>
                                    </select>
                                    <select
                                        name="view"
                                        defaultValue="map"
                                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                                    >
                                        <option value="map">Map + List</option>
                                        <option value="grid">Grid</option>
                                    </select>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20"
                                    >
                                        <Compass className="h-4 w-4" /> Search
                                    </button>
                                </form>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                                    {['EV-ready homes', 'Open houses this weekend', 'Work-from-home layouts', 'Transit-friendly condos'].map((term) => (
                                        <Link
                                            key={term}
                                            href={`/listings?q=${encodeURIComponent(term)}`}
                                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:border-white/20 hover:text-white"
                                        >
                                            {term}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <HeroSearchCtas />
                            </div>
                        </div>
                    </Panel>

                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <MetricTile label="Live inventory" value="9,223" detail="Across modeled markets" />
                            <MetricTile label="Tours booked" value="1,428" detail="Last 30 days" />
                            <MetricTile label="Median close time" value="21 days" detail="Portal-assisted pipeline" />
                            <MetricTile label="Tracked value" value="$8.4B" detail="Saved + compared inventory" />
                        </div>
                        <Panel>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Market pulse</div>
                                    <div className="mt-1 text-lg font-semibold text-white">Demand velocity rising in urban infill + new-build segments</div>
                                </div>
                                <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
                                    +6.2%
                                </div>
                            </div>
                            <SparkBarChart values={[42, 46, 51, 48, 57, 61, 59, 68, 73, 78, 74, 82]} className="mt-4 h-24" />
                            <div className="mt-4 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
                                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div className="text-white/45">Top search theme</div>
                                    <div className="mt-1 font-medium text-white">Energy-efficient 3BR homes under $1M</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div className="text-white/45">Emerging signal</div>
                                    <div className="mt-1 font-medium text-white">Transit-oriented townhomes converting 18% faster</div>
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>
            </section>

            <PageSection
                eyebrow="Future-ready features"
                title="A listing portal designed for how buyers and teams actually work"
                description="Search and transaction experiences are route-based, composable, and ready to grow into live data integrations, CRM sync, and personalization."
            >
                <FeatureGrid />
            </PageSection>

            <PageSection
                eyebrow="Featured listings"
                title="Curated inventory across high-demand neighborhoods"
                description="Modern homes and rentals selected to demonstrate filtering, compare, schedule-tour, and detail route flows."
                action={
                    <Link href="/listings" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10">
                        View all listings <ArrowRight className="h-4 w-4" />
                    </Link>
                }
            >
                <div className="grid gap-4">
                    {featuredListings.map((listing) => (
                        <ListingCard key={listing.slug} listing={listing} compact />
                    ))}
                </div>
            </PageSection>

            <PageSection
                eyebrow="Neighborhood intelligence"
                title="Compare submarkets before you book tours"
                description="Each neighborhood guide includes demand, price trends, commute context, and future signals to support better decisions."
            >
                <div className="grid gap-4 lg:grid-cols-3">
                    {featuredNeighborhoods.map((neighborhood) => (
                        <NeighborhoodCard key={neighborhood.slug} neighborhood={neighborhood} />
                    ))}
                </div>
            </PageSection>

            <PageSection
                eyebrow="Development pipeline"
                title="New construction projects with forward-looking amenities"
                description="Track delivery windows, price-from ranges, and unit availability for upcoming inventory."
            >
                <div className="grid gap-4 lg:grid-cols-3">
                    {featuredDevelopments.map((development) => (
                        <DevelopmentCard key={development.slug} development={development} />
                    ))}
                </div>
            </PageSection>

            <PageSection
                eyebrow="Market coverage"
                title="Regional snapshots built for expansion"
                description="The portal is structured around typed datasets and route-driven discovery, making it straightforward to plug in live MLS, brokerage, or analytics feeds later."
            >
                <div className="grid gap-4 lg:grid-cols-3">
                    {marketCityMetrics.map((city) => (
                        <Panel key={city.city} className="p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-lg font-semibold text-white">{city.city}</div>
                                    <div className="text-sm text-white/55">{city.activeListings.toLocaleString()} active listings</div>
                                </div>
                                <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-200">
                                    {city.yoyPct >= 0 ? '+' : ''}{city.yoyPct.toFixed(1)}% YoY
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                                    <div className="text-white/45">Median</div>
                                    <div className="font-semibold text-white">{formatCompactCurrency(city.medianPrice)}</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                                    <div className="text-white/45">DOM</div>
                                    <div className="font-semibold text-white">{city.avgDays}</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                                    <div className="text-white/45">Demand</div>
                                    <div className="font-semibold text-white">{city.demandIndex}</div>
                                </div>
                            </div>
                        </Panel>
                    ))}
                </div>
            </PageSection>

            <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
                <Panel className="relative overflow-hidden p-6 sm:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,197,94,.15),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,.15),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,.12),transparent_40%)]" />
                    <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                                <ShieldCheck className="h-4 w-4" /> Production-minded architecture
                            </div>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Ready to plug this UI into live inventory, CRM, and valuation services.
                            </h2>
                            <p className="mt-3 max-w-2xl text-white/65">
                                The refactor uses reusable route components and typed domain models, so the next step is data integration rather than another redesign cycle.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-3 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
                                Open dashboard <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href="/sell" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10">
                                List a property <Building2 className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </Panel>
            </section>
        </PortalShell>
    );
}
