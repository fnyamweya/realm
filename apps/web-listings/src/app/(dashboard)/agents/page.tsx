import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Languages, Phone } from 'lucide-react';
import { AgentCard, PageSection, Panel } from '@/components/portal/ui';
import { agents } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Agents',
  description: 'Browse real estate agents by market, specialty, and performance metrics.',
};

export default function AgentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Agent directory</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/65">
          Match with specialists by market, property type, and workflow preference. Profiles are route-based and ready for live reviews, calendars, and listing feeds.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
          {['Luxury Condos', 'First-time Buyers', 'New Development', 'Relocation', 'Investment'].map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{tag}</span>
          ))}
        </div>
      </Panel>

      <PageSection
        eyebrow="Featured agents"
        title="High-signal advisors across core markets"
        description="Use profiles to review specialties, market coverage, and active inventory before contacting an agent."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="How matching works"
        title="Future-ready routing for agent collaboration"
        description="This portal can evolve into assignment logic based on market, budget, language, and service-level preferences."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Phone className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="mt-3 text-lg font-semibold text-white">Direct routing</div>
            <p className="mt-2 text-sm text-white/65">Send requests to the primary listing agent with a fallback SLA queue for fast response coverage.</p>
          </Panel>
          <Panel className="p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Languages className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="mt-3 text-lg font-semibold text-white">Language-aware matching</div>
            <p className="mt-2 text-sm text-white/65">Profile routes include language support to guide international and relocation buyers into the right flow.</p>
          </Panel>
          <Panel className="p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <ArrowRight className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="mt-3 text-lg font-semibold text-white">CRM handoff</div>
            <p className="mt-2 text-sm text-white/65">Route IDs and query params can map directly to CRM records, stages, and attribution sources.</p>
          </Panel>
        </div>
        <div className="mt-4">
          <Link href="/dashboard/inquiries" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
            See lead inbox routing example <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
