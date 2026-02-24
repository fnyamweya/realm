import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, CheckCircle2, Clock3, Video } from 'lucide-react';
import { Breadcrumbs, GradientPhoto, Panel, Pill } from '@/components/portal/ui';
import { resolveParams } from '@/lib/next-page';
import { formatCurrency, getListingBySlug, listings } from '@/lib/portal-data';

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

  return {
    title: listing ? `Schedule Tour • ${listing.title}` : 'Schedule Tour',
  };
}

export default async function ScheduleTourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await resolveParams(params);
  const listing = getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Listings', href: '/listings' },
          { label: listing.title, href: `/listings/${listing.slug}` },
          { label: 'Schedule Tour' },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
            <Calendar className="h-3.5 w-3.5" /> Route-based tour workflow
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Schedule a showing</h1>
          <p className="mt-2 text-sm text-white/65">
            Request an in-person, live video, or virtual tour for {listing.title}. This page is structured for future calendar sync and agent assignment automation.
          </p>

          <form className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name"><input type="text" placeholder="Alex" className={inputClass} /></Field>
              <Field label="Last name"><input type="text" placeholder="Morgan" className={inputClass} /></Field>
              <Field label="Email"><input type="email" placeholder="alex@example.com" className={inputClass} /></Field>
              <Field label="Phone"><input type="tel" placeholder="(555) 555-5555" className={inputClass} /></Field>
              <Field label="Preferred date"><input type="date" className={inputClass} /></Field>
              <Field label="Preferred time"><input type="time" className={inputClass} /></Field>
            </div>

            <Field label="Tour type">
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: 'In-person', icon: Calendar },
                  { label: 'Live video', icon: Video },
                  { label: 'Self-guided request', icon: CheckCircle2 },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <label key={option.label} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/80">
                      <input type="radio" name="tourType" value={option.label} className="h-4 w-4" defaultChecked={option.label === 'In-person'} />
                      <Icon className="h-4 w-4 text-cyan-200" />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Buying timeline">
                <select className={inputClass} defaultValue="3-6 months">
                  <option>0-30 days</option>
                  <option>1-3 months</option>
                  <option>3-6 months</option>
                  <option>6+ months</option>
                </select>
              </Field>
              <Field label="Financing status">
                <select className={inputClass} defaultValue="Pre-qualified">
                  <option>Cash buyer</option>
                  <option>Pre-qualified</option>
                  <option>Need lender intro</option>
                  <option>Just exploring</option>
                </select>
              </Field>
            </div>

            <Field label="Notes for the agent">
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Tell us what you want to focus on during the tour (layout, natural light, commute, renovation potential, etc.)."
              />
            </Field>

            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4 text-sm text-cyan-50/90">
              <div className="font-medium">What happens next</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <StepCard label="1" title="Request received" body="The request is routed to the listing agent and backup coordinator." />
                <StepCard label="2" title="Time confirmation" body="You receive confirmation or alternate slots by email/text." />
                <StepCard label="3" title="Tour prep" body="We send disclosures, parking info, and a comparison shortlist." />
              </div>
            </div>

            <button type="button" className="inline-flex items-center rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
              Submit tour request
            </button>
          </form>
        </Panel>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel className="p-0 overflow-hidden">
            <GradientPhoto palette={listing.heroPalette} className="h-40 rounded-none" label="Touring" />
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={listing.intent === 'rent' ? 'sky' : 'slate'}>{listing.intent === 'rent' ? 'Rental' : 'For Sale'}</Pill>
                <Pill>{listing.propertyType}</Pill>
              </div>
              <div className="mt-3 text-lg font-semibold text-white">{listing.title}</div>
              <div className="mt-1 text-sm text-white/60">{listing.address}, {listing.city}, {listing.state}</div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Price</div>
                <div className="mt-1 text-xl font-semibold text-white">{formatCurrency(listing.price, listing.intent)}</div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-white/75">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span>Bedrooms</span><span className="font-semibold text-white">{listing.beds}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span>Bathrooms</span><span className="font-semibold text-white">{listing.baths}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span>Sqft</span><span className="font-semibold text-white">{listing.sqft.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2 text-sm text-white/75"><Clock3 className="h-4 w-4 text-cyan-200" /> Availability snapshot</div>
            <div className="mt-3 space-y-2">
              {listing.openHouse.length > 0 ? (
                listing.openHouse.map((slot) => (
                  <div key={`${slot.date}-${slot.start}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                    <div className="font-medium text-white">{slot.date}</div>
                    <div className="text-white/55">{slot.start} - {slot.end}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/65">
                  No public open house slots posted. Private showings available on request.
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-white/60">
              Need a faster decision flow? <Link href={`/compare?ids=${listing.slug}`} className="text-cyan-200 hover:text-cyan-100">Start a compare sheet</Link> before touring.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35';

function StepCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-xs font-semibold text-cyan-100">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{title}</div>
      <div className="mt-1 text-xs text-white/60">{body}</div>
    </div>
  );
}
