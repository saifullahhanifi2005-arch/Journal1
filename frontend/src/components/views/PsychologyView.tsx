import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Brain, HeartPulse, ShieldAlert, Sparkles } from 'lucide-react';
import { EMOTION_OPTIONS } from '../../data/sampleData';
import type { JournalStore } from '../../hooks/useJournalStore';
import { emotionImpact, formatMoney, formatPercent } from '../../utils/stats';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

interface Props {
  store: JournalStore;
}

export function PsychologyView({ store }: Props) {
  const data = emotionImpact(store.trades);
  const closed = store.trades.filter((t) => t.status === 'closed');
  const planBreaks = closed.filter((t) => !t.followedPlan);
  const planBreakPnl = planBreaks.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const followed = closed.filter((t) => t.followedPlan);
  const followedPnl = followed.reduce((a, t) => a + (t.pnl ?? 0), 0);

  const toxic = data.filter((d) => ['fomo', 'revenge', 'greedy', 'fearful'].includes(d.emotion));
  const elite = data.filter((d) => ['disciplined', 'patient', 'calm', 'confident'].includes(d.emotion));

  const lessons = closed
    .filter((t) => t.lessons?.trim())
    .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <HeartPulse className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">When plan followed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">
            {formatMoney(followedPnl, store.settings.accountCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{followed.length} trades</p>
        </GlassCard>
        <GlassCard>
          <ShieldAlert className="h-5 w-5 text-rose-300" />
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">When plan broken</p>
          <p className="mt-1 text-2xl font-bold text-rose-300">
            {formatMoney(planBreakPnl, store.settings.accountCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{planBreaks.length} trades</p>
        </GlassCard>
        <GlassCard>
          <Brain className="h-5 w-5 text-cyan-300" />
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">Plan adherence</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatPercent(store.stats.planAdherence)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Discipline score</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <GlassCard className="min-h-[360px]">
          <h4 className="mb-1 text-lg font-semibold text-white">Emotion → PnL Impact</h4>
          <p className="mb-4 text-xs text-slate-400">Which mental states print and which bleed</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="emotion" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0b1220',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                  {data.map((d) => {
                    const meta = EMOTION_OPTIONS.find((e) => e.id === d.emotion);
                    return <Cell key={d.emotion} fill={meta?.color || '#22d3ee'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h4 className="font-semibold text-white">Elite States</h4>
            </div>
            <div className="space-y-2">
              {elite.map((e) => (
                <div key={e.emotion} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone="success">{e.emotion}</Badge>
                    <span className="text-xs text-slate-500">{formatPercent(e.winRate)} WR</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-300">
                    {formatMoney(e.pnl, store.settings.accountCurrency)}
                  </span>
                </div>
              ))}
              {!elite.length && <p className="text-sm text-slate-500">Log emotions on trades to unlock insights.</p>}
            </div>
          </GlassCard>
          <GlassCard>
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-300" />
              <h4 className="font-semibold text-white">Toxic Patterns</h4>
            </div>
            <div className="space-y-2">
              {toxic.map((e) => (
                <div key={e.emotion} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone="danger">{e.emotion}</Badge>
                    <span className="text-xs text-slate-500">{e.count} trades</span>
                  </div>
                  <span className="text-sm font-semibold text-rose-300">
                    {formatMoney(e.pnl, store.settings.accountCurrency)}
                  </span>
                </div>
              ))}
              {!toxic.length && <p className="text-sm text-slate-500">No toxic tags logged — keep it that way.</p>}
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard>
        <h4 className="mb-4 text-lg font-semibold text-white">Recent Lessons Vault</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {lessons.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">{t.pair}</p>
                <Badge tone={t.result === 'win' ? 'success' : t.result === 'loss' ? 'danger' : 'warning'}>
                  {t.result || t.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{t.lessons}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.emotions.map((e) => (
                  <Badge key={e} tone="info">
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {!lessons.length && (
            <p className="text-sm text-slate-500">Capture lessons after each trade to compound wisdom.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
