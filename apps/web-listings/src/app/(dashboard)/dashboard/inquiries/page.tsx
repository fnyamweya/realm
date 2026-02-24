import type { Metadata } from 'next';
import Link from 'next/link';
import { Filter, MessageSquareMore } from 'lucide-react';
import { Panel, Pill } from '@/components/portal/ui';
import { dashboardLeads, getListingBySlug } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Dashboard Inquiries',
  description: 'Lead inbox for listing inquiries, tour scheduling, and conversion workflow tracking.',
};

export default function DashboardLeadInboxPage() {
  const grouped = {
    New: dashboardLeads.filter((lead) => lead.stage === 'New'),
    Qualified: dashboardLeads.filter((lead) => lead.stage === 'Qualified'),
    'Tour Scheduled': dashboardLeads.filter((lead) => lead.stage === 'Tour Scheduled'),
    Offer: dashboardLeads.filter((lead) => lead.stage === 'Offer'),
  } as const;

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <MessageSquareMore className="h-3.5 w-3.5" /> Lead inbox
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Inquiries & pipeline</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">Track source attribution, response times, and next actions from the same dashboard route structure as listing operations.</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
            <Filter className="h-4 w-4" /> Filter queue
          </button>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-4">
        {Object.entries(grouped).map(([stage, leads]) => (
          <div key={stage} className="space-y-3">
            <div className="flex items-center justify-between px-1 text-sm text-white/70">
              <span>{stage}</span>
              <Pill tone={stage === 'Offer' ? 'emerald' : stage === 'Tour Scheduled' ? 'sky' : 'slate'}>{leads.length}</Pill>
            </div>
            {leads.map((lead) => {
              const listing = getListingBySlug(lead.listingSlug);
              return (
                <Panel key={lead.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-white">{lead.name}</div>
                    <Pill tone={stage === 'Offer' ? 'emerald' : stage === 'Tour Scheduled' ? 'sky' : 'slate'}>{lead.stage}</Pill>
                  </div>
                  <div className="mt-2 text-sm text-white/60">{listing?.title ?? 'Unknown listing'}</div>
                  <div className="mt-1 text-xs text-white/45">{lead.source} • {lead.lastTouch}</div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                    Budget {lead.budget.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={listing ? `/listings/${listing.slug}` : '/listings'} className="inline-flex rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">Open listing</Link>
                    {listing ? (
                      <Link href={`/listings/${listing.slug}/schedule-tour`} className="inline-flex rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">Schedule</Link>
                    ) : null}
                  </div>
                </Panel>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
