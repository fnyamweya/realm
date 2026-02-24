import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  Bike,
  Building2,
  Calendar,
  Car,
  Compass,
  Home,
  Leaf,
  MapPin,
  MoveRight,
  Ruler,
  School,
  Sparkles,
  Train,
  Trees,
} from 'lucide-react';
import {
  type Agent,
  type Development,
  type Listing,
  type ListingsFilters,
  type Neighborhood,
  buildSearchQuery,
  formatCompactCurrency,
  formatCurrency,
  formatInteger,
  listingStatusLabel,
  statusTone,
  toneClasses,
  propertyTypes,
  sortOptions,
} from '@/lib/portal-data';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function PageSection({
  title,
  eyebrow,
  description,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm text-white/65">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = 'slate',
  className,
}: {
  children: React.ReactNode;
  tone?: Parameters<typeof toneClasses>[0];
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        toneClasses(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}) {
  return (
    <Panel className={cx('p-4', className)}>
      <div className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {detail ? <div className="mt-1 text-sm text-white/60">{detail}</div> : null}
    </Panel>
  );
}

export function GradientPhoto({
  palette,
  className,
  label,
}: {
  palette: [string, string, string] | [string, string];
  className?: string;
  label?: string;
}) {
  const [a, b, c] = palette;
  const background = c
    ? `radial-gradient(circle at 20% 20%, ${c}33, transparent 45%), linear-gradient(135deg, ${a}, ${b})`
    : `linear-gradient(135deg, ${a}, ${b})`;

  return (
    <div className={cx('relative overflow-hidden rounded-2xl border border-white/10', className)}>
      <div className="absolute inset-0" style={{ backgroundImage: background }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.16),transparent_40%),linear-gradient(to_top,rgba(0,0,0,.35),transparent_60%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:20px_20px]" />
      {label ? (
        <div className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs text-white/85 backdrop-blur">
          {label}
        </div>
      ) : null}
    </div>
  );
}

export function ListingCard({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  return (
    <Panel className={cx('overflow-hidden p-0', compact && 'rounded-2xl')}>
      <div className={cx('grid gap-0', compact ? 'md:grid-cols-[180px_minmax(0,1fr)]' : 'md:grid-cols-[240px_minmax(0,1fr)]')}>
        <GradientPhoto
          palette={listing.heroPalette}
          className={cx('min-h-44 md:min-h-full', compact ? 'rounded-none' : 'rounded-none')}
          label={`${listing.neighborhoodName} • ${listing.city}`}
        />
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={statusTone(listing.status)}>{listingStatusLabel(listing.status)}</Pill>
            <Pill tone={listing.intent === 'rent' ? 'sky' : 'slate'}>
              {listing.intent === 'rent' ? 'For Rent' : 'For Sale'}
            </Pill>
            {listing.badges.slice(0, 2).map((badge) => (
              <Pill key={badge}>{badge}</Pill>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link href={`/listings/${listing.slug}`} className="text-lg font-semibold text-white hover:text-cyan-200">
                {listing.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-white/65">
                <MapPin className="h-4 w-4" />
                <span>{listing.address}, {listing.city}, {listing.state}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-white">{formatCurrency(listing.price, listing.intent)}</div>
              <div className="text-xs text-white/55">{listing.daysOnMarket} days on market</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-white/80 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="flex items-center gap-2 text-white/50"><BedDouble className="h-4 w-4" /> Beds</div>
              <div className="mt-1 font-semibold text-white">{listing.beds}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="flex items-center gap-2 text-white/50"><Home className="h-4 w-4" /> Baths</div>
              <div className="mt-1 font-semibold text-white">{listing.baths}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="flex items-center gap-2 text-white/50"><Ruler className="h-4 w-4" /> Sqft</div>
              <div className="mt-1 font-semibold text-white">{formatInteger(listing.sqft)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="flex items-center gap-2 text-white/50"><Leaf className="h-4 w-4" /> Energy</div>
              <div className="mt-1 font-semibold text-white">{listing.energyScore}/100</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/listings/${listing.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20"
            >
              View details <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/listings/${listing.slug}/schedule-tour`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              <Calendar className="h-4 w-4" /> Schedule tour
            </Link>
            <Link
              href={`/saved?ids=${listing.slug}`}
              className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:border-white/20 hover:text-white"
            >
              Save
            </Link>
            <Link
              href={`/compare?ids=${listing.slug}`}
              className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:border-white/20 hover:text-white"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Panel className="p-0 overflow-hidden">
      <GradientPhoto palette={agent.palette} className="h-28 rounded-none" label={agent.team} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/agents/${agent.slug}`} className="text-lg font-semibold text-white hover:text-cyan-200">
              {agent.name}
            </Link>
            <div className="text-sm text-white/60">{agent.title}</div>
          </div>
          <Pill tone="sky">{agent.rating.toFixed(1)} ★</Pill>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
          {agent.specialties.slice(0, 3).map((specialty) => (
            <span key={specialty} className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              {specialty}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl border border-white/10 bg-black/20 p-2">
            <div className="text-white/50">Listings</div>
            <div className="font-semibold text-white">{agent.activeListings}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-2">
            <div className="text-white/50">Years</div>
            <div className="font-semibold text-white">{agent.yearsExperience}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-2">
            <div className="text-white/50">Volume</div>
            <div className="font-semibold text-white">${agent.salesVolumeM}M</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function NeighborhoodCard({ neighborhood }: { neighborhood: Neighborhood }) {
  return (
    <Panel className="p-0 overflow-hidden">
      <GradientPhoto palette={neighborhood.palette} className="h-36 rounded-none" label={`${neighborhood.city}, ${neighborhood.state}`} />
      <div className="p-4">
        <Link href={`/neighborhoods/${neighborhood.slug}`} className="text-lg font-semibold text-white hover:text-cyan-200">
          {neighborhood.name}
        </Link>
        <p className="mt-2 text-sm text-white/65">{neighborhood.tagline}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <StatBox label="Median sale" value={formatCompactCurrency(neighborhood.medianSalePrice)} />
          <StatBox label="Median rent" value={`${formatCurrency(neighborhood.medianRent, 'rent')}`} />
          <StatBox label="YoY" value={`${neighborhood.yoyChangePct >= 0 ? '+' : ''}${neighborhood.yoyChangePct.toFixed(1)}%`} />
          <StatBox label="Demand" value={`${neighborhood.demandIndex}/100`} />
        </div>
      </div>
    </Panel>
  );
}

export function DevelopmentCard({ development }: { development: Development }) {
  return (
    <Panel className="p-0 overflow-hidden">
      <GradientPhoto palette={development.palette} className="h-32 rounded-none" label={development.deliveryWindow} />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">{development.name}</div>
            <div className="text-sm text-white/60">{development.city}, {development.state}</div>
          </div>
          <Pill tone="violet">{development.unitsAvailable} units</Pill>
        </div>
        <p className="mt-3 text-sm text-white/65">{development.concept}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/75">
          {development.amenities.slice(0, 3).map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">From</div>
            <div className="text-lg font-semibold text-white">{formatCurrency(development.priceFrom)}</div>
          </div>
          <Link href={`/new-developments#${development.slug}`} className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
            Register interest <MoveRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2">
      <div className="text-xs text-white/45">{label}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

export function MiniScoreGrid({ listing }: { listing: Listing }) {
  const rows = [
    { label: 'Walk', value: listing.walkScore, icon: Compass },
    { label: 'Transit', value: listing.transitScore, icon: Train },
    { label: 'Bike', value: listing.bikeScore, icon: Bike },
    { label: 'Schools', value: listing.schoolsScore * 10, icon: School },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between text-sm text-white/75">
              <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" /> {row.label}</span>
              <span className="font-semibold text-white">{row.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${Math.min(100, row.value)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SparkBarChart({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);

  return (
    <div className={cx('grid h-28 grid-flow-col items-end gap-1', className)}>
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="rounded-t bg-gradient-to-t from-cyan-500/25 to-cyan-300/70"
          style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function MapPanel({
  items,
  selectedSlug,
  className,
}: {
  items: Listing[];
  selectedSlug?: string;
  className?: string;
}) {
  return (
    <Panel className={cx('p-0 overflow-hidden', className)}>
      <div className="relative h-[420px] bg-[linear-gradient(120deg,rgba(14,165,233,.15),rgba(168,85,247,.1)),radial-gradient(circle_at_20%_20%,rgba(34,197,94,.15),transparent_35%),#060a12]">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_15%_25%,rgba(255,255,255,.3)_1px,transparent_1px),radial-gradient(circle_at_65%_40%,rgba(255,255,255,.3)_1px,transparent_1px),radial-gradient(circle_at_45%_80%,rgba(255,255,255,.3)_1px,transparent_1px)]" />
        <div className="absolute left-3 top-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/80 backdrop-blur">
          Map preview • {items.length} results
        </div>
        {items.map((listing) => {
          const active = listing.slug === selectedSlug;
          return (
            <Link
              key={listing.slug}
              href={`/listings/${listing.slug}`}
              className={cx(
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-xs font-medium shadow-lg shadow-black/30 transition hover:scale-105',
                active
                  ? 'border-cyan-200/70 bg-cyan-300 text-slate-950'
                  : 'border-white/20 bg-black/60 text-white backdrop-blur',
              )}
              style={{ left: `${listing.mapX}%`, top: `${listing.mapY}%` }}
            >
              {formatCompactCurrency(listing.price)}
              {listing.intent === 'rent' ? '/mo' : ''}
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export function ListingsFilterForm({
  filters,
  cities,
  actionPath = '/listings',
}: {
  filters: ListingsFilters;
  cities: string[];
  actionPath?: string;
}) {
  return (
    <Panel className="p-4">
      <form action={actionPath} method="get" className="space-y-4">
        <div>
          <label htmlFor="q" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="City, neighborhood, feature, address..."
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-white/35 focus:border-cyan-300/35"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Intent">
            <select name="intent" defaultValue={filters.intent} className={fieldSelectClass}>
              <option value="all">Buy + Rent</option>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </Field>
          <Field label="City">
            <select name="city" defaultValue={filters.city} className={fieldSelectClass}>
              <option value="all">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </Field>
          <Field label="Property type">
            <select name="type" defaultValue={filters.propertyType} className={fieldSelectClass}>
              <option value="all">Any type</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Min beds">
            <select name="beds" defaultValue={String(filters.minBeds)} className={fieldSelectClass}>
              {[0, 1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>{count === 0 ? 'Any' : `${count}+`}</option>
              ))}
            </select>
          </Field>
          <Field label="Min price">
            <input name="minPrice" type="number" min={0} defaultValue={filters.minPrice ?? ''} className={fieldInputClass} placeholder="No min" />
          </Field>
          <Field label="Max price">
            <input name="maxPrice" type="number" min={0} defaultValue={filters.maxPrice ?? ''} className={fieldInputClass} placeholder="No max" />
          </Field>
          <Field label="Sort">
            <select name="sort" defaultValue={filters.sort} className={fieldSelectClass}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="View">
            <select name="view" defaultValue={filters.view} className={fieldSelectClass}>
              <option value="grid">Grid</option>
              <option value="map">Map + List</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-2 text-sm text-white/75">
          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <input type="checkbox" name="openHouse" value="1" defaultChecked={filters.openHouseOnly} className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Open houses only
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <input type="checkbox" name="eco" value="1" defaultChecked={filters.ecoOnly} className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Eco-forward homes (EV-ready / high energy score)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="inline-flex items-center rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
            Apply filters
          </button>
          <Link href={actionPath} className="inline-flex items-center rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75 hover:border-white/20 hover:text-white">
            Reset
          </Link>
        </div>
      </form>
    </Panel>
  );
}

const fieldInputClass =
  'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35';
const fieldSelectClass = fieldInputClass;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{label}</span>
      {children}
    </label>
  );
}

export function ActiveFilterChips({ filters, basePath = '/listings' }: { filters: ListingsFilters; basePath?: string }) {
  const chips: Array<{ label: string; href: string }> = [];
  const resetBase = { ...filters };

  if (filters.q) {
    chips.push({ label: `"${filters.q}"`, href: `${basePath}${buildSearchQuery({ ...resetBase, q: '' })}` });
  }
  if (filters.city !== 'all') {
    chips.push({ label: filters.city, href: `${basePath}${buildSearchQuery({ ...resetBase, city: 'all' })}` });
  }
  if (filters.intent !== 'all') {
    chips.push({ label: filters.intent === 'buy' ? 'Buy' : 'Rent', href: `${basePath}${buildSearchQuery({ ...resetBase, intent: 'all' })}` });
  }
  if (filters.propertyType !== 'all') {
    chips.push({ label: filters.propertyType, href: `${basePath}${buildSearchQuery({ ...resetBase, propertyType: 'all' })}` });
  }
  if (filters.minBeds > 0) {
    chips.push({ label: `${filters.minBeds}+ beds`, href: `${basePath}${buildSearchQuery({ ...resetBase, minBeds: 0 })}` });
  }
  if (filters.openHouseOnly) {
    chips.push({ label: 'Open house', href: `${basePath}${buildSearchQuery({ ...resetBase, openHouseOnly: false })}` });
  }
  if (filters.ecoOnly) {
    chips.push({ label: 'Eco', href: `${basePath}${buildSearchQuery({ ...resetBase, ecoOnly: false })}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={`${chip.label}-${chip.href}`}
          href={chip.href}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:border-white/20 hover:text-white"
        >
          {chip.label} <span className="ml-2 text-white/45">x</span>
        </Link>
      ))}
    </div>
  );
}

export function HeroSearchCtas() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/listings" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
        Browse all listings <ArrowRight className="h-4 w-4" />
      </Link>
      <Link href="/listings?view=map" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10">
        <MapPin className="h-4 w-4" /> Explore map
      </Link>
      <Link href="/compare" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75 hover:border-white/20 hover:text-white">
        Compare homes
      </Link>
    </div>
  );
}

export function FeatureGrid() {
  const items = [
    {
      icon: Sparkles,
      title: 'AI Match Explanations',
      body: 'Each listing includes transparent match reasons like commute fit, inventory scarcity, and energy profile.',
    },
    {
      icon: Trees,
      title: 'Climate + Efficiency Lens',
      body: 'Evaluate resilience and operating costs with climate risk, EV readiness, and energy signals in one view.',
    },
    {
      icon: Car,
      title: 'Tour Scheduling Workflow',
      body: 'Route-based scheduling pages support in-person, virtual, and live video walkthrough requests.',
    },
    {
      icon: Building2,
      title: 'Portal + Ops Workspace',
      body: 'A unified `/dashboard/*` area lets teams manage inventory, inquiries, and performance without a separate app.',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Panel key={item.title} className="p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Icon className="h-5 w-5 text-cyan-200" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-white/65">{item.body}</p>
          </Panel>
        );
      })}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/55">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="hover:text-white">{item.label}</Link>
          ) : (
            <span className="text-white/80">{item.label}</span>
          )}
          {index < items.length - 1 ? <span className="text-white/25">/</span> : null}
        </div>
      ))}
    </div>
  );
}
