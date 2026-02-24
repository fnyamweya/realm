import type { Metadata } from 'next';
import { TrendingUp } from 'lucide-react';
import { PageSection, Panel, Pill, SparkBarChart } from '@/components/portal/ui';
import { formatCompactCurrency, formatPercent, marketCityMetrics } from '@/lib/portal-data';

export const metadata: Metadata = {
  title: 'Market Insights',
  description: 'Market analytics for listing demand, price trend monitoring, and city-level comparisons.',
};

export default function MarketInsightsPage() {
  const momentumSeries = [62, 64, 66, 69, 72, 75, 77, 79, 82, 81, 84, 86];
  const supplySeries = [71, 69, 67, 65, 63, 61, 60, 58, 57, 59, 60, 58];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <TrendingUp className="h-3.5 w-3.5" /> Analytics + market context
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Market insights</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              A future-focused analytics layer for discovery, pricing strategy, and pipeline decision-making across markets.
            </p>
          </div>
          <Pill tone="emerald">Daily refresh-ready architecture</Pill>
        </div>
      </Panel>

      <PageSection
        eyebrow="Signals"
        title="Demand, supply, and conversion momentum"
        description="Illustrative trend views that can be wired to MLS, CRM, or product analytics feeds."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-lg font-semibold text-white">Demand Momentum</div>
                <div className="text-sm text-white/55">Buyer activity, saved searches, and tour requests</div>
              </div>
              <Pill tone="emerald">+6.2%</Pill>
            </div>
            <SparkBarChart values={momentumSeries} className="mt-4 h-36" />
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-lg font-semibold text-white">Supply Pressure</div>
                <div className="text-sm text-white/55">Inventory availability vs. absorption</div>
              </div>
              <Pill tone="amber">Tightening</Pill>
            </div>
            <SparkBarChart values={supplySeries} className="mt-4 h-36" />
          </Panel>
        </div>
      </PageSection>

      <PageSection
        eyebrow="City benchmark"
        title="Cross-market comparison"
        description="Use this layout for market ranking, expansion decisions, and pricing strategy review."
      >
        <div className="grid gap-4">
          {marketCityMetrics.map((metric) => (
            <Panel key={metric.city} className="p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(5,minmax(0,150px))] md:items-center">
                <div>
                  <div className="text-lg font-semibold text-white">{metric.city}</div>
                  <div className="text-sm text-white/55">{metric.activeListings.toLocaleString()} active listings</div>
                </div>
                <DataPill label="Median" value={formatCompactCurrency(metric.medianPrice)} />
                <DataPill label="YoY" value={formatPercent(metric.yoyPct)} tone={metric.yoyPct >= 0 ? 'emerald' : 'amber'} />
                <DataPill label="DOM" value={`${metric.avgDays}`} />
                <DataPill label="Demand" value={`${metric.demandIndex}/100`} />
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                  <div className="mb-1 text-white/45">Signal</div>
                  <div className="text-white">{metric.demandIndex > 78 ? 'High-intent market' : metric.demandIndex > 72 ? 'Balanced activity' : 'Selective demand'}</div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </PageSection>
    </div>
  );
}

function DataPill({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'emerald' | 'amber' }) {
  const toneClass = tone === 'emerald'
    ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
    : tone === 'amber'
      ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
      : 'border-white/10 bg-black/20 text-white';
  return (
    <div className={`rounded-xl border p-3 text-sm ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.16em] opacity-70">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
