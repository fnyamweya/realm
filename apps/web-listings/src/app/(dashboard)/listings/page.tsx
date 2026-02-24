import type { Metadata } from 'next';
import Link from 'next/link';
import { Filter, Layers3, ListFilter, MapPinned, SlidersHorizontal } from 'lucide-react';
import {
    ActiveFilterChips,
    ListingCard,
    ListingsFilterForm,
    MapPanel,
    MetricTile,
    Panel,
} from '@/components/portal/ui';
import { resolveSearchParams } from '@/lib/next-page';
import {
    buildSearchQuery,
    cityHeadline,
    filterListings,
    listings,
    parseListingsFilters,
    uniqueCities,
} from '@/lib/portal-data';

export const metadata: Metadata = {
    title: 'Listings',
    description: 'Search homes and rentals with filters, map view, and market-aware ranking.',
};

export default async function ListingsPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const raw = await resolveSearchParams(searchParams);
    const filters = parseListingsFilters(raw);
    const results = filterListings(listings, filters);
    const cities = uniqueCities();

    const avgPrice =
        results.length > 0
            ? Math.round(results.reduce((sum, item) => sum + item.price, 0) / results.length)
            : 0;
    const sortedByDays = [...results].sort((a, b) => a.daysOnMarket - b.daysOnMarket);
    const medianDays = sortedByDays[Math.floor(sortedByDays.length / 2)]?.daysOnMarket ?? 0;

    const baseQuery = {
        ...filters,
    };

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Panel className="relative overflow-hidden p-5 sm:p-6">
                    <div className="absolute right-[-8%] top-[-15%] h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="relative">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                            <ListFilter className="h-3.5 w-3.5" />
                            Listing discovery engine
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Modern real estate search, built for decisions</h1>
                        <p className="mt-2 max-w-3xl text-sm text-white/65 sm:text-base">
                            {filters.city !== 'all'
                                ? cityHeadline(filters.city)
                                : 'Browse all modeled listings. Use route-driven filters to switch between grid and map search, compare homes, and schedule tours.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                href={`/listings${buildSearchQuery({ ...baseQuery, view: 'grid' })}`}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${filters.view === 'grid' ? 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-white/70 hover:text-white'}`}
                            >
                                <Filter className="h-4 w-4" /> Grid view
                            </Link>
                            <Link
                                href={`/listings${buildSearchQuery({ ...baseQuery, view: 'map' })}`}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${filters.view === 'map' ? 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-white/70 hover:text-white'}`}
                            >
                                <MapPinned className="h-4 w-4" /> Map + list
                            </Link>
                            <Link
                                href="/compare"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 hover:text-white"
                            >
                                <Layers3 className="h-4 w-4" /> Compare homes
                            </Link>
                        </div>
                        <div className="mt-4">
                            <ActiveFilterChips filters={filters} />
                        </div>
                    </div>
                </Panel>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                    <MetricTile label="Results" value={String(results.length)} detail="Filtered listings" />
                    <MetricTile label="Avg price" value={avgPrice ? `$${avgPrice.toLocaleString()}` : 'N/A'} detail="Current search set" />
                    <MetricTile label="Median DOM" value={medianDays ? `${medianDays} days` : 'N/A'} detail="Days on market" className="hidden lg:block" />
                    <MetricTile label="Sort" value={filters.sort.replace('-', ' ')} detail="Query param driven" className="hidden lg:block" />
                </div>
            </div>

            <div className={`grid gap-6 ${filters.view === 'map' ? 'xl:grid-cols-[340px_minmax(0,1fr)_420px]' : 'xl:grid-cols-[340px_minmax(0,1fr)]'}`}>
                <div className="xl:sticky xl:top-24 xl:self-start">
                    <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/50">
                        <SlidersHorizontal className="h-4 w-4" /> Filters
                    </div>
                    <ListingsFilterForm filters={filters} cities={cities} />
                </div>

                <div className="space-y-4">
                    {results.length > 0 ? (
                        results.map((listing) => <ListingCard key={listing.slug} listing={listing} compact={filters.view === 'map'} />)
                    ) : (
                        <Panel className="p-6 text-center">
                            <div className="text-lg font-semibold text-white">No listings match this filter set</div>
                            <p className="mt-2 text-sm text-white/65">
                                Try widening your price range, removing the city filter, or switching off eco/open-house-only filters.
                            </p>
                            <div className="mt-4">
                                <Link href="/listings" className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                                    Reset search
                                </Link>
                            </div>
                        </Panel>
                    )}
                </div>

                {filters.view === 'map' ? (
                    <div className="xl:sticky xl:top-24 xl:self-start">
                        <MapPanel items={results.slice(0, 12)} className="overflow-hidden" />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
