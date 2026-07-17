import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { JournalStore } from '../../hooks/useJournalStore';
import {
  equityCurve,
  formatMoney,
  formatPercent,
  pnlByPair,
  pnlBySession,
  pnlByStrategy,
} from '../../utils/stats';
import { GlassCard } from '../ui/GlassCard';
import { StatCard } from '../ui/StatCard';
import { Award, Flame, Scale, Zap } from 'lucide-react';

interface Props {
  store: JournalStore;
}

const COLORS = ['#22d3ee', '#34d399', '#a78bfa', '#fbbf24', '#f87171', '#60a5fa', '#fb7185'];

export function AnalyticsView({ store }: Props) {
  const { trades, stats, settings } = store;
  const curve = equityCurve(trades);
  const pairs = pnlByPair(trades);
  const strategies = pnlByStrategy(trades);
  const sessions = pnlBySession(trades);

  const winLossData = [
    { name: 'Wins', value: stats.wins, color: '#34d399' },
    { name: 'Losses', value: stats.losses, color: '#f87171' },
    { name: 'BE', value: stats.breakevens, color: '#fbbf24' },
  ];

  const directionData = ['long', 'short'].map((d) => {
    const subset = trades.filter((t) => t.direction === d && t.status === 'closed');
    const pnl = subset.reduce((a, t) => a + (t.pnl ?? 0), 0);
    const wins = subset.filter((t) => t.result === 'win').length;
    return {
      direction: d,
      pnl,
      winRate: subset.length ? (wins / subset.length) * 100 : 0,
      count: subset.length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          hint="Gross win / gross loss"
          icon={Scale}
          accent="#22d3ee"
        />
        <StatCard
          label="Expectancy"
          value={formatMoney(stats.expectancy, settings.accountCurrency)}
          hint="Average $ per trade"
          icon={Zap}
          trend={stats.expectancy >= 0 ? 'up' : 'down'}
          accent="#34d399"
        />
        <StatCard
          label="Best Trade"
          value={formatMoney(stats.bestTrade, settings.accountCurrency)}
          hint={`Worst ${formatMoney(stats.worstTrade, settings.accountCurrency)}`}
          icon={Award}
          accent="#fbbf24"
        />
        <StatCard
          label="Win Streak"
          value={String(stats.consecutiveWins)}
          hint={`Loss streak ${stats.consecutiveLosses}`}
          icon={Flame}
          accent="#fb7185"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="min-h-[360px]">
          <h4 className="mb-1 text-lg font-semibold text-white">Equity Trajectory</h4>
          <p className="mb-4 text-xs text-slate-400">Closed-trade cumulative curve</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0b1220',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <Line type="monotone" dataKey="equity" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="min-h-[360px]">
          <h4 className="mb-1 text-lg font-semibold text-white">Win / Loss Distribution</h4>
          <p className="mb-4 text-xs text-slate-400">Outcome mix across closed trades</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {winLossData.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0b1220',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="min-h-[360px]">
          <h4 className="mb-1 text-lg font-semibold text-white">PnL by Instrument</h4>
          <p className="mb-4 text-xs text-slate-400">Where your edge concentrates</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pairs} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="pair"
                  width={70}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0b1220',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="pnl" radius={[0, 8, 8, 0]}>
                  {pairs.map((p, i) => (
                    <Cell key={p.pair} fill={p.pnl >= 0 ? COLORS[i % COLORS.length] : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="min-h-[360px]">
          <h4 className="mb-1 text-lg font-semibold text-white">Strategy Scoreboard</h4>
          <p className="mb-4 text-xs text-slate-400">PnL and win rate by playbook</p>
          <div className="space-y-3">
            {strategies.map((s, i) => (
              <div key={s.strategy} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <div>
                      <p className="font-semibold text-white">{s.strategy}</p>
                      <p className="text-xs text-slate-500">
                        {s.count} trades · WR {formatPercent(s.winRate)}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${s.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatMoney(s.pnl, settings.accountCurrency)}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, s.winRate)}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
            {!strategies.length && <p className="text-sm text-slate-500">No strategy data yet.</p>}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h4 className="mb-4 text-lg font-semibold text-white">Direction Bias</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {directionData.map((d) => (
              <div key={d.direction} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{d.direction}</p>
                <p className={`mt-2 text-2xl font-semibold ${d.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatMoney(d.pnl, settings.accountCurrency)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {d.count} trades · {formatPercent(d.winRate)} WR
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h4 className="mb-4 text-lg font-semibold text-white">Session Breakdown</h4>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.session} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-3">
                <div>
                  <p className="font-medium capitalize text-white">{s.session}</p>
                  <p className="text-xs text-slate-500">{s.count} trades</p>
                </div>
                <p className={`font-semibold ${s.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatMoney(s.pnl, settings.accountCurrency)}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
