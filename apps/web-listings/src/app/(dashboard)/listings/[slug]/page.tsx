import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Banknote,
  BedDouble,
  Calendar,
  Check,
  Clock3,
  Home,
  Leaf,
  MapPin,
  Ruler,
  Shield,
  Wifi,
  Zap,
} from 'lucide-react';
import {
  Breadcrumbs,
  GradientPhoto,
  ListingCard,
  MiniScoreGrid,
  PageSection,
  Panel,
  Pill,
  SparkBarChart,
} from '@/components/portal/ui';
import { resolveParams } from '@/lib/next-page';
import {
  estimateMonthlyPayment,
  formatCurrency,
  formatInteger,
  getRelatedListings,
  getListingBySlug,
  listingAgent,
  listingNeighborhood,
  listings,
  listingStatusLabel,
  statusTone,
  toneClasses,
} from '@/lib/portal-data';

export async function generateStaticParams() {
  return listings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const listing = getListingBySlug(slug);

  if (!listing) {
    return { title: 'Listing Not Found' };
  }

  return {
    title: `${listing.title} • ${listing.city}`,
    description: `${listing.beds} bed, ${listing.baths} bath ${listing.propertyType.toLowerCase()} in ${listing.neighborhoodName}, ${listing.city}. ${formatCurrency(listing.price, listing.intent)}.`,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await resolveParams(params);
  const listing = getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const agent = listingAgent(listing);
  const neighborhood = listingNeighborhood(listing);
  const related = getRelatedListings(listing.slug, 3);
  const estPayment = Math.round(estimateMonthlyPayment(listing));
  const priceHistoryValues = listing.priceHistory.map((item) => item.price);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Listings', href: '/listings' },
          { label: listing.city, href: `/listings?city=${encodeURIComponent(listing.city)}` },
          { label: listing.title },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={statusTone(listing.status)}>{listingStatusLabel(listing.status)}</Pill>
              <Pill tone={listing.intent === 'rent' ? 'sky' : 'slate'}>
                {listing.intent === 'rent' ? 'For Rent' : 'For Sale'}
              </Pill>
              {listing.badges.map((badge) => (
                <Pill key={badge}>{badge}</Pill>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{listing.title}</h1>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/65">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.address}, {listing.city}, {listing.state}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold text-white">{formatCurrency(listing.price, listing.intent)}</div>
                <div className="mt-1 text-xs text-white/55">Est. monthly {formatCurrency(estPayment, 'rent')}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                <div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-white/50" /> Beds</div>
                <div className="mt-1 text-lg font-semibold text-white">{listing.beds}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                <div className="flex items-center gap-2"><Home className="h-4 w-4 text-white/50" /> Baths</div>
                <div className="mt-1 text-lg font-semibold text-white">{listing.baths}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-white/50" /> Interior</div>
                <div className="mt-1 text-lg font-semibold text-white">{formatInteger(listing.sqft)} sqft</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-white/50" /> Market time</div>
                <div className="mt-1 text-lg font-semibold text-white">{listing.daysOnMarket} days</div>
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,.6fr)]">
            <GradientPhoto palette={listing.heroPalette} className="h-[340px]" label="Primary gallery image" />
            <div className="grid gap-4">
              <GradientPhoto palette={listing.heroPalette} className="h-[106px]" label="Kitchen + living" />
              <GradientPhoto palette={listing.heroPalette} className="h-[106px]" label="Primary suite" />
              <GradientPhoto palette={listing.heroPalette} className="h-[106px]" label="Outdoor space" />
            </div>
          </div>

          <Panel>
            <h2 className="text-xl font-semibold text-white">Overview</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">{listing.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Highlights</div>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {listing.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Amenities</div>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {listing.amenities.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-white">Location & lifestyle</h2>
                <Pill tone="sky">{listing.neighborhoodName}</Pill>
              </div>
              <p className="mt-2 text-sm text-white/65">{neighborhood.tagline}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                  <div className="mb-2 flex items-center gap-2 text-white/50"><MapPin className="h-4 w-4" /> Commute</div>
                  <div className="font-semibold text-white">{neighborhood.commuteDowntownMin} min to downtown</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                  <div className="mb-2 flex items-center gap-2 text-white/50"><Shield className="h-4 w-4" /> Climate risk</div>
                  <div className="font-semibold text-white">{listing.climateRisk}</div>
                </div>
              </div>
              <div className="mt-4">
                <MiniScoreGrid listing={listing} />
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-white">Tech + efficiency</h2>
                <Pill tone="emerald">{listing.energyScore}/100 energy score</Pill>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-white/75">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="inline-flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-300" /> Climate + energy profile</span>
                  <span className="font-semibold text-white">{listing.climateRisk} risk</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="inline-flex items-center gap-2"><Wifi className="h-4 w-4 text-cyan-300" /> Fiber readiness</span>
                  <span className={listing.fiberReady ? 'font-semibold text-emerald-300' : 'font-semibold text-white/50'}>{listing.fiberReady ? 'Ready' : 'Not listed'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300" /> EV charging</span>
                  <span className={listing.evReady ? 'font-semibold text-emerald-300' : 'font-semibold text-white/50'}>{listing.evReady ? 'Installed / ready' : 'Not available'}</span>
                </div>
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">AI Match Reasons</div>
                  <ul className="mt-3 space-y-2 text-sm text-cyan-50/90">
                    {listing.aiMatchReasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 text-cyan-200" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Panel>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-white">Price history</h2>
                <Pill tone="slate">Last 4 months</Pill>
              </div>
              <SparkBarChart values={priceHistoryValues} className="mt-4 h-32" />
              <div className="mt-4 space-y-2">
                {listing.priceHistory.map((event) => (
                  <div key={`${event.date}-${event.note}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                    <div>
                      <div className="text-white">{event.note}</div>
                      <div className="text-xs text-white/50">{event.date}</div>
                    </div>
                    <div className="font-semibold text-white">{formatCurrency(event.price, listing.intent)}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <h2 className="text-xl font-semibold text-white">Open house & showing windows</h2>
              {listing.openHouse.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {listing.openHouse.map((slot) => (
                    <div key={`${slot.date}-${slot.start}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-white">{slot.date}</div>
                          <div className="mt-1 text-sm text-white/60">{slot.start} - {slot.end}</div>
                        </div>
                        <Pill tone="emerald">Open House</Pill>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-white/65">No public open house is scheduled currently. Use the scheduling route to request a private tour.</p>
              )}
              <div className="mt-4">
                <Link href={`/listings/${listing.slug}/schedule-tour`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
                  <Calendar className="h-4 w-4" /> Schedule a tour
                </Link>
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Panel>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Contact agent</div>
            <div className="mt-2 text-xl font-semibold text-white">{agent.name}</div>
            <div className="text-sm text-white/60">{agent.title} • {agent.team}</div>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">{agent.phone}</div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">{agent.email}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="text-white/45">Rating</div>
                <div className="font-semibold text-white">{agent.rating.toFixed(1)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="text-white/45">Reviews</div>
                <div className="font-semibold text-white">{agent.reviewCount}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="text-white/45">Years</div>
                <div className="font-semibold text-white">{agent.yearsExperience}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Link href={`/listings/${listing.slug}/schedule-tour`} className="block rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-center text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
                Schedule tour
              </Link>
              <Link href={`/agents/${agent.slug}`} className="block rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-white/80 hover:bg-white/10">
                View agent profile
              </Link>
              <Link href={`/compare?ids=${listing.slug}`} className="block rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm text-white/70 hover:border-white/20 hover:text-white">
                Compare this home
              </Link>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2 text-sm text-white/70"><Banknote className="h-4 w-4 text-emerald-300" /> Financing snapshot</div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-white/45">Estimated monthly payment</div>
              <div className="mt-1 text-2xl font-semibold text-white">{formatCurrency(estPayment, 'rent')}</div>
              <div className="mt-1 text-xs text-white/50">Assumes 20% down, 30-year fixed at 6.35% plus taxes/HOA</div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span>Purchase price</span>
                <span className="font-semibold text-white">{formatCurrency(listing.price)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span>HOA</span>
                <span className="font-semibold text-white">{listing.hoaMonthly ? formatCurrency(listing.hoaMonthly, 'rent') : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span>Taxes (est.)</span>
                <span className="font-semibold text-white">{listing.estTaxMonthly ? formatCurrency(listing.estTaxMonthly, 'rent') : 'Included'}</span>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Neighborhood snapshot</div>
            <div className="mt-2 text-lg font-semibold text-white">{neighborhood.name}</div>
            <p className="mt-2 text-sm text-white/65">{neighborhood.tagline}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="text-white/45">Median sale</div>
                <div className="font-semibold text-white">{formatCurrency(neighborhood.medianSalePrice)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="text-white/45">Demand index</div>
                <div className="font-semibold text-white">{neighborhood.demandIndex}/100</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {neighborhood.futureSignals.slice(0, 3).map((signal) => (
                <div key={signal} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                  {signal}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href={`/neighborhoods/${neighborhood.slug}`} className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
                Open neighborhood guide <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Panel>
        </div>
      </div>

      {related.length > 0 ? (
        <PageSection
          eyebrow="Similar inventory"
          title="Related homes"
          description="Recommended based on city, price band, intent, and property type."
        >
          <div className="grid gap-4">
            {related.map((item) => (
              <ListingCard key={item.slug} listing={item} compact />
            ))}
          </div>
        </PageSection>
      ) : null}
    </div>
  );
}
