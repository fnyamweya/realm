import type { Metadata } from 'next';
import Link from 'next/link';
import { Eye, Megaphone, PencilLine, Plus } from 'lucide-react';
import { GradientPhoto, Panel, Pill } from '@/components/portal/ui';
import { formatCurrency, listings, listingStatusLabel } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Dashboard Listings',
  description: 'Operations view for managing listing quality, publication status, and next actions.',
};

export default function DashboardListingsOpsPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Listing operations</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Manage publishing, media readiness, pricing, and showing availability while keeping public listing routes in sync.
            </p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
            <Plus className="h-4 w-4" /> New listing draft
          </button>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickMetric label="Active" value="28" detail="Publicly visible" />
        <QuickMetric label="Coming soon" value="7" detail="Launch prep" />
        <QuickMetric label="Needs media" value="5" detail="Photography/staging" />
        <QuickMetric label="Price review" value="3" detail=">20 DOM" />
      </div>

      <Panel className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-white/55">
                <th className="px-3 py-2 font-medium">Listing</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Demand</th>
                <th className="px-3 py-2 font-medium">Readiness</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.slug} className="border-t border-white/10 align-top">
                  <td className="px-3 py-3">
                    <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                      <GradientPhoto palette={listing.heroPalette} className="h-20" label={listing.city} />
                      <div>
                        <div className="font-medium text-white">{listing.title}</div>
                        <div className="mt-1 text-xs text-white/50">{listing.neighborhoodName} • {listing.propertyType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={listing.status === 'active' ? 'emerald' : listing.status === 'coming-soon' ? 'amber' : 'violet'}>
                      {listingStatusLabel(listing.status)}
                    </Pill>
                    <div className="mt-2 text-xs text-white/50">{listing.daysOnMarket} DOM</div>
                  </td>
                  <td className="px-3 py-3 text-white">{formatCurrency(listing.price, listing.intent)}</td>
                  <td className="px-3 py-3">
                    <div className="text-white">{listing.walkScore + listing.transitScore}</div>
                    <div className="text-xs text-white/50">location signal</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75">Photos</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75">Copy</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75">Tour slots</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/listings/${listing.slug}`} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10"><Eye className="h-3.5 w-3.5" /> View</Link>
                      <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80"><PencilLine className="h-3.5 w-3.5" /> Edit</button>
                      <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100"><Megaphone className="h-3.5 w-3.5" /> Promote</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function QuickMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Panel className="p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/60">{detail}</div>
    </Panel>
  );
}
