import type { Metadata } from 'next';
import Link from 'next/link';
import { Bookmark, Layers3, Share2 } from 'lucide-react';
import { ListingCard, PageSection, Panel, Pill } from '@/components/portal/ui';
import { resolveSearchParams } from '@/lib/next-page';
import { parseSlugList, pickListingsBySlugs } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Saved Homes',
  description: 'Review saved homes, build a shortlist, and move listings into compare workflows.',
};

export default async function SavedHomesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await resolveSearchParams(searchParams);
  const requested = parseSlugList(raw);
  const saved = pickListingsBySlugs(requested, 4);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Bookmark className="h-3.5 w-3.5" /> Saved collection
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Your saved homes</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Build a decision-ready shortlist and hand it off to compare, tour scheduling, or an agent collaboration workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/compare?ids=${saved.map((item) => item.slug).join(',')}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
              <Layers3 className="h-4 w-4" /> Compare all
            </Link>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
              <Share2 className="h-4 w-4" /> Share list
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill tone="emerald">{saved.length} homes saved</Pill>
          <Pill tone="sky">2 open houses this week</Pill>
          <Pill>Sync-ready for CRM / account persistence</Pill>
        </div>
      </Panel>

      <PageSection
        eyebrow="Shortlist"
        title="Decision-ready queue"
        description="Use compare routes for pricing and feature breakdowns, then submit tour requests directly from each listing."
      >
        <div className="grid gap-4">
          {saved.map((listing) => (
            <ListingCard key={listing.slug} listing={listing} compact />
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Next steps"
        title="Suggested actions"
        description="The portal can evolve this section into personalized nudges, financing prompts, and deadline alerts."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Run compare sheet',
              body: 'Stack pricing, HOA, energy score, and commute context for your top 3 homes.',
              href: `/compare?ids=${saved.slice(0, 3).map((item) => item.slug).join(',')}`,
            },
            {
              title: 'Book a tour block',
              body: 'Schedule multiple showings for one weekend and group by neighborhood.',
              href: saved[0] ? `/listings/${saved[0].slug}/schedule-tour` : '/listings',
            },
            {
              title: 'Track this market',
              body: 'Create an alert flow for price drops, new comps, and open-house launches.',
              href: '/market-insights',
            },
          ].map((item) => (
            <Panel key={item.title} className="p-4">
              <div className="text-lg font-semibold text-white">{item.title}</div>
              <p className="mt-2 text-sm text-white/65">{item.body}</p>
              <Link href={item.href} className="mt-4 inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                Open
              </Link>
            </Panel>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
