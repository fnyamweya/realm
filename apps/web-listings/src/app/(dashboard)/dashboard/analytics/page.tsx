import type { Metadata } from 'next';
import { LineChart } from 'lucide-react';
import { Panel, Pill, SparkBarChart } from '@/components/portal/ui';

export const metadata: Metadata = {
  title: 'Dashboard Analytics',
  description: 'Operational analytics for listing performance, lead response velocity, and conversion rates.',
};

export default function DashboardAnalyticsPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <LineChart className="h-3.5 w-3.5" /> Ops analytics
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Performance analytics</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">Track the health of your listing funnel with response SLA, inquiry conversion, and exposure metrics.</p>
          </div>
          <Pill tone="emerald">Response SLA: 92%</Pill>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,.6fr)]">
        <Panel>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-lg font-semibold text-white">Exposure to inquiry conversion</div>
              <div className="text-sm text-white/55">Rolling 30-day trend</div>
            </div>
            <Pill tone="emerald">+0.8 pts</Pill>
          </div>
          <SparkBarChart values={[22, 24, 25, 27, 26, 29, 31, 30, 34, 36, 35, 37, 39, 41, 44]} className="mt-4 h-40" />
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
            <AnalyticCard label="Listing views" value="24,306" detail="+12.8%" />
            <AnalyticCard label="Inquiries" value="312" detail="+6.1%" />
            <AnalyticCard label="Tour conversion" value="13.8%" detail="+2.4 pts" />
          </div>
        </Panel>
        <Panel>
          <div className="text-lg font-semibold text-white">Channel mix</div>
          <div className="mt-4 space-y-3 text-sm text-white/75">
            <ChannelRow label="Portal search" pct={48} tone="bg-cyan-400" />
            <ChannelRow label="Organic / direct" pct={21} tone="bg-emerald-400" />
            <ChannelRow label="Paid campaigns" pct={18} tone="bg-amber-400" />
            <ChannelRow label="Referrals" pct={13} tone="bg-fuchsia-400" />
          </div>
          <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4 text-sm text-cyan-50/90">
            Recommendation: increase weekend map-view promotion for RiNo + Mueller listings where tour conversion outperforms baseline.
          </div>
        </Panel>
      </div>

      <Panel className="p-6">
        <div className="text-lg font-semibold text-white">Funnel risks and opportunities</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
          <RiskCard title="Slow response pockets" body="Open-house leads after 5pm are breaching SLA. Add overflow routing or auto-ack sequences." tone="amber" />
          <RiskCard title="Pricing review candidates" body="Three listings show high views but low inquiry rate, suggesting price/positioning friction." tone="sky" />
          <RiskCard title="High-converting segment" body="Energy-efficient 3BR townhomes are converting to tours above portfolio average." tone="emerald" />
        </div>
      </Panel>
    </div>
  );
}

function AnalyticCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-white/45">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-emerald-200">{detail}</div>
    </div>
  );
}

function ChannelRow({ label, pct, tone }: { label: string; pct: number; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><span>{label}</span><span className="font-semibold text-white">{pct}%</span></div>
      <div className="h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function RiskCard({ title, body, tone }: { title: string; body: string; tone: 'amber' | 'sky' | 'emerald' }) {
  const classes = tone === 'amber'
    ? 'border-amber-300/20 bg-amber-400/10'
    : tone === 'sky'
      ? 'border-cyan-300/20 bg-cyan-400/10'
      : 'border-emerald-300/20 bg-emerald-400/10';

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <div className="font-semibold text-white">{title}</div>
      <p className="mt-2 text-white/80">{body}</p>
    </div>
  );
}
