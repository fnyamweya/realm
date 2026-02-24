import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Camera, ClipboardList, Home, LineChart, Sparkles } from 'lucide-react';
import { PageSection, Panel, Pill } from '@/components/portal/ui';

export const metadata: Metadata = {
  title: 'Sell With Realm',
  description: 'Seller landing and intake experience for property valuation, preparation, and listing launch.',
};

export default function SellPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute right-[-8%] top-[-10%] h-44 w-44 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute left-[20%] bottom-[-18%] h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> Seller launch workflow
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">List smarter, price faster, launch with confidence.</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
              This seller route is designed to grow into valuation APIs, prep checklists, media scheduling, and multi-channel listing distribution.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="emerald">Valuation intake</Pill>
              <Pill tone="sky">Launch checklist</Pill>
              <Pill>Performance tracking</Pill>
            </div>
          </div>
          <Panel className="p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Instant home estimate (prototype)</div>
            <form className="mt-3 space-y-3">
              <input type="text" placeholder="Property address" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Beds" className={inputClass} />
                <input type="number" placeholder="Baths" className={inputClass} />
                <input type="number" placeholder="Sqft" className={inputClass} />
                <select className={inputClass} defaultValue="Single-family">
                  <option>Single-family</option>
                  <option>Condo</option>
                  <option>Townhome</option>
                  <option>Loft</option>
                </select>
              </div>
              <button type="button" className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
                Get estimate range
              </button>
            </form>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              Example output: <span className="font-semibold text-white">$1.12M - $1.19M</span> based on comps, recency, and finish quality assumptions.
            </div>
          </Panel>
        </div>
      </Panel>

      <PageSection
        eyebrow="Launch process"
        title="Seller workflow designed for scale"
        description="This route structure supports self-serve intake while giving teams room to automate and coordinate launch tasks."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Step icon={Home} title="Property intake" body="Collect address, specs, ownership goals, and timeline in a structured form." />
          <Step icon={LineChart} title="Pricing strategy" body="Generate comp-driven ranges and scenario pricing for fast market entry." />
          <Step icon={Camera} title="Media & prep" body="Coordinate photography, staging, and repairs with vendor scheduling hooks." />
          <Step icon={ClipboardList} title="Launch & monitor" body="Publish to channels and track inquiries, showings, and conversion in `/dashboard/*`." />
        </div>
      </PageSection>

      <PageSection
        eyebrow="What comes next"
        title="Connect seller intake to listing operations"
        description="Once a seller submits intake, route them into your CRM and create a draft listing record for the operations dashboard."
      >
        <Panel className="p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <div className="text-lg font-semibold text-white">Prototype-to-production path</div>
              <p className="mt-2 text-sm text-white/65">
                The IA already separates public discovery routes, detail routes, and dashboard operations routes, which makes adding authenticated seller portals and staff workflows straightforward.
              </p>
            </div>
            <Link href="/dashboard/listings" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
              Open listing operations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>
      </PageSection>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35';

function Step({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
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
