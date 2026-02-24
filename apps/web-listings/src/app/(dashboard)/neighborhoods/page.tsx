import type { Metadata } from 'next';
import { NeighborhoodCard, PageSection, Panel } from '@/components/portal/ui';
import { neighborhoods } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Neighborhoods',
  description: 'Explore neighborhood guides with pricing, demand, commute, and future signals.',
};

export default function NeighborhoodsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Neighborhood guides</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/65">
          Compare submarkets using lifestyle scores, price trends, demand indicators, and forward-looking development signals.
        </p>
      </Panel>

      <PageSection
        eyebrow="Coverage"
        title="Neighborhood intelligence built into the search funnel"
        description="Neighborhood pages connect directly to filtered listings and agent routes so buyers can move from research to action quickly."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {neighborhoods.map((neighborhood) => (
            <NeighborhoodCard key={neighborhood.slug} neighborhood={neighborhood} />
          ))}
        </div>
      </PageSection>
    </div>
  );
}
