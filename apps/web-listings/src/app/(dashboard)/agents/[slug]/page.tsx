import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, Phone, Star } from 'lucide-react';
import { AgentCard, Breadcrumbs, ListingCard, PageSection, Panel, Pill } from '@/components/portal/ui';
import { resolveParams } from '@/lib/next-page';
import { agents, formatCurrency, getAgentBySlug, listings } from '@/lib/portal-data';

export async function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const agent = getAgentBySlug(slug);
  return { title: agent ? `${agent.name} • Agent Profile` : 'Agent Profile' };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await resolveParams(params);
  const agent = getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const activeInventory = listings.filter((listing) => listing.agentSlug === agent.slug);
  const averageRepresentedPrice =
    activeInventory.length > 0
      ? formatCurrency(
          Math.round(
            activeInventory.reduce((sum, listing) => sum + listing.price, 0) /
              activeInventory.length,
          ),
          activeInventory[0]?.intent ?? 'buy',
        )
      : 'N/A';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Agents', href: '/agents' }, { label: agent.name }]} />
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <AgentCard agent={agent} />
          <Panel>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Contact</div>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"><Phone className="h-4 w-4 text-cyan-200" /> {agent.phone}</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"><Mail className="h-4 w-4 text-cyan-200" /> {agent.email}</div>
            </div>
            <Link href="/listings" className="mt-4 inline-flex items-center rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
              Browse agent listings
            </Link>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="p-6">
            <h1 className="text-3xl font-semibold tracking-tight text-white">{agent.name}</h1>
            <p className="mt-2 text-sm text-white/60">{agent.title} • {agent.team}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="sky"><Star className="mr-1 h-3.5 w-3.5" /> {agent.rating.toFixed(1)} ({agent.reviewCount} reviews)</Pill>
              <Pill>{agent.yearsExperience} years experience</Pill>
              <Pill>${agent.salesVolumeM}M closed volume</Pill>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">{agent.bio}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Markets</div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/80">
                  {agent.markets.map((market) => (
                    <span key={market} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{market}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">Specialties</div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/80">
                  {agent.specialties.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{item}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4 text-sm text-cyan-50/90">
              <div className="font-medium">Collaboration-ready routing</div>
              <p className="mt-2">Future integrations can route inquiries to {agent.name.split(' ')[0]} by neighborhood, language, price band, and response SLA with automatic reassignment logic.</p>
            </div>
          </Panel>

          <PageSection
            eyebrow="Active inventory"
            title={`${agent.name.split(' ')[0]}'s current listings`}
            description="Sample inventory mapped to this agent profile."
          >
            <div className="grid gap-4">
              {activeInventory.map((listing) => (
                <ListingCard key={listing.slug} listing={listing} compact />
              ))}
            </div>
          </PageSection>

          <Panel className="p-6">
            <h2 className="text-xl font-semibold text-white">Performance snapshot</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/45">Active listings</div>
                <div className="mt-1 text-2xl font-semibold text-white">{agent.activeListings}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/45">Closed volume</div>
                <div className="mt-1 text-2xl font-semibold text-white">${agent.salesVolumeM}M</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/45">Avg. represented price*</div>
                <div className="mt-1 text-2xl font-semibold text-white">{averageRepresentedPrice}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/45">*Based on sample active inventory in this prototype portal.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
