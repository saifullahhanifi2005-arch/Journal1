import {
  Activity,
  Crosshair,
  Percent,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { JournalStore } from '../../hooks/useJournalStore';
import { equityCurve, formatMoney, formatPercent, pnlByPair, pnlBySession } from '../../utils/stats';
import { GlassCard } from '../ui/GlassCard';
import { StatCard } from '../ui/StatCard';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';

interface Props {
  store: JournalStore;
}

const SESSION_COLORS: Record<string, string> = {
  asian: '#a78bfa',
  london: '#22d3ee',
  newyork: '#34d399',
  overlap: '#fbbf24',
};

export function DashboardView({ store }: Props) {
  const { trades, stats, settings } = store;
  const curve = equityCurve(trades);
  const pairs = pnlByPair(trades).slice(0, 6);
  const sessions = pnlBySession(trades);
  const recent = [...trades]
    .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime())
    .slice(0, 6);
  const balance = settings.accountBalance + stats.totalPnl;

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/20">
        {/* Anime trading room background */}
        <img
          src="/images/trading-anime-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-luminosity"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a14] via-[#070d18]/92 to-[#050a14]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a14]/80 via-transparent to-transparent" />
        {/* Gold top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        {/* Ambient orbs */}
        <div className="absolute -left-10 top-4 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-20 bottom-0 h-32 w-64 rounded-full bg-cyan-400/8 blur-3xl" />

        <div className="relative grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] md:p-8 lg:p-10">
          <div>
            {/* Group identity */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-3 py-1">
                <span className="text-amber-300 text-xs">♦</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
                  The Fools Hunting Room
                </span>
                <span className="text-amber-300 text-xs">♦</span>
              </div>
              <Badge tone="info">Live Local Vault</Badge>
            </div>

            <h3
              className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl"
              style={{ textShadow: '0 0 40px rgba(251,191,36,0.3)' }}
            >
              Welcome, {settings.traderName}
            </h3>
            <p className="mt-1 text-sm font-medium text-amber-300/70 tracking-wide">
              Hunt the markets. Master the mind. Compound the edge.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
              Your elite execution cockpit — track every hunt, measure every edge, and expose the
              patterns that separate the fools who lose from the fools who win.
            </p>

            {/* Equity pills */}
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300/60">Net Equity</p>
                <p className="text-2xl font-bold text-white">
                  {formatMoney(balance, settings.accountCurrency)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Realized PnL</p>
                <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatMoney(stats.totalPnl, settings.accountCurrency)}
                </p>
              </div>
            </div>

            {/* Creator tag */}
            <div className="mt-5 flex items-center gap-2">
              <img
                src="/images/creator-avatar.png"
                alt="Saifullah Hanifi"
                className="h-6 w-6 rounded-full object-cover ring-1 ring-amber-300/40"
              />
              <p className="text-[11px] text-slate-500">
                Built by <span className="font-semibold text-amber-300/70">Saifullah Hanifi</span>
                {' '}· Team of 3 hunters
              </p>
            </div>
          </div>

          {/* Right quick stats */}
          <div className="grid grid-cols-2 gap-3 self-end">
            <HeroMini label="Win Rate" value={formatPercent(stats.winRate)} color="#22d3ee" />
            <HeroMini label="Profit Factor" value={stats.profitFactor.toFixed(2)} color="#fbbf24" />
            <HeroMini label="Expectancy" value={formatMoney(stats.expectancy, settings.accountCurrency)} color="#34d399" />
            <HeroMini label="Plan Adherence" value={formatPercent(stats.planAdherence)} color="#a78bfa" />
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total PnL"
          value={formatMoney(stats.totalPnl, settings.accountCurrency)}
          hint={`${stats.closedTrades} closed trades`}
          icon={Wallet}
          trend={stats.totalPnl >= 0 ? 'up' : 'down'}
          accent="#34d399"
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(stats.winRate)}
          hint={`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`}
          icon={Percent}
          accent="#22d3ee"
        />
        <StatCard
          label="Avg R:R"
          value={stats.avgRiskReward ? `1:${stats.avgRiskReward.toFixed(2)}` : '—'}
          hint={`Best ${formatMoney(stats.bestTrade, settings.accountCurrency)}`}
          icon={Target}
          accent="#fbbf24"
        />
        <StatCard
          label="Max Drawdown"
          value={formatMoney(stats.maxDrawdown, settings.accountCurrency)}
          hint={`${stats.consecutiveWins} max win streak`}
          icon={TrendingDown}
          trend="down"
          accent="#f87171"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <GlassCard className="min-h-[340px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">Equity Curve</h4>
              <p className="text-xs text-slate-400">Cumulative realized performance</p>
            </div>
            <TrendingUp className="h-5 w-5 text-amber-300" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve}>
                <defs>
                  <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="equity" stroke="#fbbf24" strokeWidth={2.5} fill="url(#eqFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="min-h-[340px]">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-white">Session Edge</h4>
            <p className="text-xs text-slate-400">PnL by market hunting window</p>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessions}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="session" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip valueKey="pnl" />} />
                <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                  {sessions.map((s) => (
                    <Cell key={s.session} fill={SESSION_COLORS[s.session] || '#fbbf24'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <GlassCard>
          <div className="mb-4 flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-amber-300" />
            <h4 className="text-lg font-semibold text-white">Top Hunted Pairs</h4>
          </div>
          <div className="space-y-3">
            {pairs.map((p) => (
              <div
                key={p.pair}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 transition hover:border-amber-300/15 hover:bg-white/[0.04]"
              >
                <div>
                  <p className="font-bold text-white">{p.pair}</p>
                  <p className="text-xs text-slate-500">{p.count} hunts</p>
                </div>
                <p className={`font-bold ${p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatMoney(p.pnl, settings.accountCurrency)}
                </p>
              </div>
            ))}
            {!pairs.length && <p className="text-sm text-slate-500">No closed trades yet.</p>}
          </div>
        </GlassCard>

        <GlassCard padding="none">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-300" />
              <h4 className="text-lg font-semibold text-white">Recent Hunts</h4>
            </div>
            <Badge tone="info">{stats.openTrades} open</Badge>
          </div>
          <div className="divide-y divide-white/5">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-white/[0.02]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{t.pair}</p>
                    <Badge tone={t.direction === 'long' ? 'success' : 'danger'}>{t.direction}</Badge>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {t.strategy} · {format(new Date(t.openTime), 'MMM d, HH:mm')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${(t.pnl ?? 0) > 0 ? 'text-emerald-300' : (t.pnl ?? 0) < 0 ? 'text-rose-300' : 'text-slate-300'}`}>
                    {t.pnl != null ? formatMoney(t.pnl, settings.accountCurrency) : t.status}
                  </p>
                  <p className="text-[11px] text-slate-500">{t.followedPlan ? '✓ Plan' : '✗ Plan'}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Bottom Quick Stats ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-sm text-slate-400">Risk per hunt</p>
          <p className="text-2xl font-bold text-white">{settings.riskPerTrade}%</p>
        </GlassCard>
        <GlassCard>
          <Target className="h-5 w-5 text-amber-300" />
          <p className="mt-3 text-sm text-slate-400">Avg win / avg loss</p>
          <p className="text-2xl font-bold text-white">
            {formatMoney(stats.avgWin, settings.accountCurrency)}
            <span className="mx-1 text-slate-500">/</span>
            <span className="text-rose-300">{formatMoney(-stats.avgLoss, settings.accountCurrency)}</span>
          </p>
        </GlassCard>
        <GlassCard>
          <Activity className="h-5 w-5 text-cyan-300" />
          <p className="mt-3 text-sm text-slate-400">Total pips captured</p>
          <p className="text-2xl font-bold text-white">{stats.totalPips.toFixed(1)}</p>
        </GlassCard>
      </div>
    </div>
  );
}

function HeroMini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md transition hover:border-amber-300/20">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-white" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, valueKey = 'equity' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-amber-300/20 bg-[#0b1220]/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-amber-300">
        {typeof payload[0].payload[valueKey] === 'number'
          ? formatMoney(payload[0].payload[valueKey])
          : payload[0].value}
      </p>
    </div>
  );
}
