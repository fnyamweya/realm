import type { Metadata } from 'next';
import { Building2, CalendarClock, WandSparkles } from 'lucide-react';
import { DevelopmentCard, PageSection, Panel } from '@/components/portal/ui';
import { developments } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'New Developments',
  description: 'Explore upcoming developments with delivery windows, pricing, and amenity previews.',
};

export default function NewDevelopmentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">New developments</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Track pipeline inventory early. Development pages can extend into waitlists, reservation workflows, and construction updates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Pre-sales ready</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Interest capture</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Delivery tracking</span>
          </div>
        </div>
      </Panel>

      <PageSection
        eyebrow="Pipeline"
        title="Upcoming inventory across growth markets"
        description="Designed to evolve into a full new-development funnel with floorplans, availability, and reservation deposits."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {developments.map((development) => (
            <div id={development.slug} key={development.slug}>
              <DevelopmentCard development={development} />
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Workflow model"
        title="How the route can scale"
        description="Prototype feature modules you can add next without changing the IA."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Card icon={CalendarClock} title="Reservation windows" body="Time-boxed release rounds with unit selection order and waitlist promotion rules." />
          <Card icon={Building2} title="Construction updates" body="Milestone updates, punch-list status, and projected delivery changes per project." />
          <Card icon={WandSparkles} title="Unit recommendations" body="Match floorplans to lifestyle, budget, and commute preferences using explainable ranking." />
        </div>
      </PageSection>
    </div>
  );
}

function Card({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Panel className="p-4">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Icon className="h-5 w-5 text-cyan-200" />
      </div>
      <div className="mt-3 text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-white/65">{body}</p>
    </Panel>
  );
}
