import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Award, BarChart2, Brain, Eye, EyeOff,
  Flame, RefreshCw, Shield, Target, TrendingUp,
  Trophy, Users, Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AuthHook } from '../../hooks/useAuth';
import type { JournalStore } from '../../hooks/useJournalStore';
import type { PublicSnapshot } from '../../types';
import {
  buildSnapshot, loadAllSnapshots, removeSnapshot,
  saveSnapshot, sortSnapshots, type LeaderboardSort,
} from '../../utils/arenaStore';
import { formatMoney, formatPercent } from '../../utils/stats';
import { GlassCard } from '../ui/GlassCard';
import { WaterButton } from '../ui/WaterButton';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface Props { store: JournalStore; auth: AuthHook; }

const SORT_OPTIONS: { key: LeaderboardSort; label: string; icon: typeof Trophy; unit?: string }[] = [
  { key: 'totalPnl',       label: 'Total PnL',      icon: TrendingUp },
  { key: 'winRate',        label: 'Win Rate',        icon: Target,    unit: '%' },
  { key: 'profitFactor',   label: 'Profit Factor',  icon: Zap },
  { key: 'expectancy',     label: 'Expectancy',     icon: Award },
  { key: 'totalTrades',    label: 'Total Trades',   icon: BarChart2 },
  { key: 'planAdherence',  label: 'Discipline',     icon: Brain,     unit: '%' },
  { key: 'totalPips',      label: 'Total Pips',     icon: Flame },
];

const PERIOD_OPTIONS = ['All Time', 'This Year', 'This Month', 'This Week'] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

const MEDAL_COLORS = ['#fbbf24', '#94a3b8', '#cd7f32'];
const MEDAL_ICONS  = ['🥇', '🥈', '🥉'];

/* ─── tooltip ─── */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1220]/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="mt-1 font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? (p.value > 1000 || p.value < -1000 ? formatMoney(p.value) : p.value.toFixed(1)) : p.value}
        </p>
      ))}
    </div>
  );
}

export function ArenaView({ store, auth }: Props) {
  const [snapshots, setSnapshots] = useState<PublicSnapshot[]>([]);
  const [sortBy,    setSortBy]    = useState<LeaderboardSort>('totalPnl');
  const [period,    setPeriod]    = useState<Period>('All Time');
  const [selected,  setSelected]  = useState<string | null>(null);
  const [comparing, setComparing] = useState<string[]>([]);
  const [sharing,   setSharing]   = useState(false);
  const [tab,       setTab]       = useState<'leaderboard' | 'compare' | 'detail' | 'insights'>('leaderboard');
  const [refreshing, setRefreshing] = useState(false);

  /* ── load snapshots ── */
  const reload = () => {
    const all = loadAllSnapshots();
    setSnapshots(Object.values(all).filter(s => s.shareEnabled));
  };

  useEffect(() => { reload(); }, []);

  /* ── check if current user is sharing ── */
  useEffect(() => {
    if (!auth.session) return;
    const snap = loadAllSnapshots()[auth.session.userId];
    setSharing(!!snap?.shareEnabled);
  }, [auth.session]);

  /* ── publish / unpublish own snapshot ── */
  const handleToggleShare = () => {
    if (!auth.session) return;
    if (sharing) {
      removeSnapshot(auth.session.userId);
      setSharing(false);
      reload();
    } else {
      const snap = buildSnapshot({
        userId: auth.session.userId,
        displayName: auth.session.displayName,
        avatarUrl: auth.session.avatarUrl,
        accentColor: auth.session.accentColor,
        role: auth.session.role,
        trades: store.trades,
        shareEnabled: true,
      });
      saveSnapshot(snap);
      setSharing(true);
      reload();
    }
  };

  const handleRefreshMyStats = () => {
    if (!auth.session || !sharing) return;
    setRefreshing(true);
    const snap = buildSnapshot({
      userId: auth.session.userId,
      displayName: auth.session.displayName,
      avatarUrl: auth.session.avatarUrl,
      accentColor: auth.session.accentColor,
      role: auth.session.role,
      trades: store.trades,
      shareEnabled: true,
    });
    saveSnapshot(snap);
    reload();
    setTimeout(() => setRefreshing(false), 800);
  };

  /* ── sorted leaderboard ── */
  const ranked = useMemo(() => sortSnapshots(snapshots, sortBy), [snapshots, sortBy]);

  /* ── selected detail ── */
  const detailSnap = useMemo(
    () => snapshots.find(s => s.userId === selected) ?? null,
    [snapshots, selected]
  );

  /* ── compare data ── */
  const compareSnaps = useMemo(
    () => snapshots.filter(s => comparing.includes(s.userId)),
    [snapshots, comparing]
  );

  const toggleCompare = (uid: string) => {
    setComparing(prev =>
      prev.includes(uid)
        ? prev.filter(x => x !== uid)
        : prev.length < 4 ? [...prev, uid] : prev
    );
  };

  /* ── combined equity for comparison ── */
  const combinedEquity = useMemo(() => {
    if (compareSnaps.length === 0) return [];
    const allDates = [...new Set(
      compareSnaps.flatMap(s => s.equityCurve.map(c => c.date))
    )].sort();
    return allDates.map(date => {
      const row: Record<string, string | number> = { date };
      for (const s of compareSnaps) {
        const pt = s.equityCurve.find(c => c.date === date);
        row[s.displayName] = pt?.equity ?? 0;
      }
      return row;
    });
  }, [compareSnaps]);

  /* ── global insights ── */
  const insights = useMemo(() => {
    if (!snapshots.length) return null;
    const avgWR  = snapshots.reduce((a, s) => a + s.stats.winRate, 0) / snapshots.length;
    const avgPF  = snapshots.reduce((a, s) => a + s.stats.profitFactor, 0) / snapshots.length;
    const avgPnl = snapshots.reduce((a, s) => a + s.stats.totalPnl, 0) / snapshots.length;
    const topWR  = [...snapshots].sort((a, b) => b.stats.winRate - a.stats.winRate)[0];
    const topPF  = [...snapshots].sort((a, b) => b.stats.profitFactor - a.stats.profitFactor)[0];
    const topPnl = [...snapshots].sort((a, b) => b.stats.totalPnl - a.stats.totalPnl)[0];
    const topDisc= [...snapshots].sort((a, b) => b.stats.planAdherence - a.stats.planAdherence)[0];
    return { avgWR, avgPF, avgPnl, topWR, topPF, topPnl, topDisc };
  }, [snapshots]);

  return (
    <div className="space-y-6 pb-8">

      {/* ══ HERO HEADER ══ */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/25">
        <img src="/images/trading-anime-bg.jpg" alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a14] via-[#050a14]/90 to-[#050a14]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a14]/80 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
        <div className="absolute -left-10 top-4 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative px-6 py-8 md:px-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-amber-300" style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }} />
                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300/70">
                  Public Leaderboard
                </span>
              </div>
              <h2 className="text-4xl font-extrabold text-white leading-tight"
                style={{ textShadow: '0 0 40px rgba(251,191,36,0.35)' }}>
                Hunter's Arena
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-400 leading-relaxed">
                Compare performance across all hunters — equity curves, win rates, discipline scores and more.
                Share your stats to join the leaderboard. Your individual trade details remain private.
              </p>

              {/* Stats pills */}
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Hunters Live</p>
                  <p className="text-xl font-bold text-white">{snapshots.length}</p>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-2.5 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-amber-400/60">Your Status</p>
                  <p className="text-xl font-bold" style={{ color: sharing ? '#34d399' : '#94a3b8' }}>
                    {sharing ? '✓ Published' : 'Private'}
                  </p>
                </div>
              </div>
            </div>

            {/* Share toggle */}
            <div className="flex flex-col items-end gap-3">
              <WaterButton
                variant={sharing ? 'danger' : 'gold'}
                onClick={handleToggleShare}
              >
                {sharing ? <><EyeOff className="h-4 w-4" /> Hide My Stats</> : <><Eye className="h-4 w-4" /> Publish My Stats</>}
              </WaterButton>
              {sharing && (
                <WaterButton variant="secondary" size="sm" onClick={handleRefreshMyStats} disabled={refreshing}>
                  <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                  {refreshing ? 'Updating…' : 'Update Stats'}
                </WaterButton>
              )}
              <p className="text-[11px] text-slate-600 max-w-[200px] text-right">
                Only aggregate stats shared. Trade details always private.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-1.5">
        {([
          ['leaderboard', '🏆 Leaderboard'],
          ['compare',     '⚔️ Compare'],
          ['detail',      '🔍 Hunter Profile'],
          ['insights',    '💡 Group Insights'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all min-w-[120px]',
              tab === id
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'text-slate-400 hover:text-white'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════
          TAB: LEADERBOARD
      ════════════════════════════ */}
      {tab === 'leaderboard' && (
        <div className="space-y-5">
          {/* Sort + Period */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.key} onClick={() => setSortBy(opt.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                      sortBy === opt.key
                        ? 'border-amber-400/40 bg-amber-400/12 text-amber-300'
                        : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-white'
                    )}>
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {PERIOD_OPTIONS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn('rounded-lg border px-3 py-1.5 text-xs font-bold transition',
                    period === p ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'border-white/8 text-slate-500 hover:text-white')}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {ranked.length === 0 && (
            <GlassCard className="py-16 text-center">
              <Trophy className="mx-auto h-12 w-12 text-amber-300/30 mb-4" />
              <h3 className="text-lg font-bold text-white">Arena is Empty</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                No hunters have published their stats yet. Click <span className="text-amber-300 font-bold">"Publish My Stats"</span> above to be the first on the leaderboard!
              </p>
            </GlassCard>
          )}

          {/* Top 3 podium */}
          {ranked.length >= 2 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {ranked.slice(0, 3).map((snap, i) => (
                <div key={snap.userId}
                  className={cn(
                    'relative overflow-hidden rounded-3xl border p-5 text-center cursor-pointer transition-all hover:-translate-y-1',
                    i === 0 ? 'border-amber-300/40 sm:order-2' : i === 1 ? 'border-slate-400/25 sm:order-1' : 'border-amber-700/30 sm:order-3'
                  )}
                  style={{ background: `radial-gradient(ellipse at top, ${MEDAL_COLORS[i]}15, transparent 65%)` }}
                  onClick={() => { setSelected(snap.userId); setTab('detail'); }}>
                  <div className="absolute inset-x-0 top-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${MEDAL_COLORS[i]}60, transparent)` }} />

                  <div className="text-4xl mb-3">{MEDAL_ICONS[i]}</div>
                  <div className="relative mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border-2 shadow-xl"
                    style={{ borderColor: MEDAL_COLORS[i] + '60', boxShadow: `0 0 20px ${MEDAL_COLORS[i]}40` }}>
                    {snap.avatarUrl
                      ? <img src={snap.avatarUrl} alt={snap.displayName} className="h-full w-full object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                      : <div className="flex h-full w-full items-center justify-center text-xl font-black"
                          style={{ background: snap.accentColor + '20', color: snap.accentColor }}>
                          {snap.displayName.charAt(0)}
                        </div>}
                  </div>

                  <p className="font-extrabold text-white text-sm leading-tight">{snap.displayName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{snap.role}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MiniStat label="Win Rate" value={formatPercent(snap.stats.winRate)}
                      positive={snap.stats.winRate >= 50} />
                    <MiniStat label="PnL" value={formatMoney(snap.stats.totalPnl)}
                      positive={snap.stats.totalPnl >= 0} />
                    <MiniStat label="PF" value={snap.stats.profitFactor.toFixed(2)}
                      positive={snap.stats.profitFactor >= 1} />
                    <MiniStat label="Trades" value={String(snap.stats.closedTrades)} />
                  </div>

                  {snap.userId === auth.session?.userId && (
                    <div className="mt-3">
                      <Badge tone="gold">You</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Full leaderboard table */}
          {ranked.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto custom-scroll">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Rank</th>
                      <th className="px-4 py-3 font-bold">Hunter</th>
                      <th className="px-4 py-3 font-bold">PnL</th>
                      <th className="px-4 py-3 font-bold">Win Rate</th>
                      <th className="px-4 py-3 font-bold">Profit Factor</th>
                      <th className="px-4 py-3 font-bold">Avg R:R</th>
                      <th className="px-4 py-3 font-bold">Trades</th>
                      <th className="px-4 py-3 font-bold">Pips</th>
                      <th className="px-4 py-3 font-bold">Discipline</th>
                      <th className="px-4 py-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((snap, i) => {
                      const isSelf = snap.userId === auth.session?.userId;
                      const isComparing = comparing.includes(snap.userId);
                      return (
                        <tr key={snap.userId}
                          className={cn('border-t border-white/5 transition',
                            isSelf ? 'bg-amber-300/[0.04]' : 'hover:bg-white/[0.02]')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{i < 3 ? MEDAL_ICONS[i] : ''}</span>
                              <span className={cn('text-sm font-black',
                                i === 0 ? 'text-amber-300' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500')}>
                                #{i + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border"
                                style={{ borderColor: snap.accentColor + '50', boxShadow: `0 0 10px ${snap.accentColor}30` }}>
                                {snap.avatarUrl
                                  ? <img src={snap.avatarUrl} alt="" className="h-full w-full object-cover"
                                      onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                                  : <div className="flex h-full w-full items-center justify-center text-sm font-black"
                                      style={{ background: snap.accentColor + '18', color: snap.accentColor }}>
                                      {snap.displayName.charAt(0)}
                                    </div>}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-white text-sm">{snap.displayName}</p>
                                  {isSelf && <Badge tone="gold">You</Badge>}
                                </div>
                                <p className="text-[11px] text-slate-500 capitalize">{snap.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className={cn('px-4 py-3 font-bold text-sm',
                            snap.stats.totalPnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                            {formatMoney(snap.stats.totalPnl)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/8 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                                  style={{ width: `${Math.min(100, snap.stats.winRate)}%` }} />
                              </div>
                              <span className="text-sm font-bold text-white">{formatPercent(snap.stats.winRate)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-white text-sm">
                            {snap.stats.profitFactor.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm">
                            {snap.stats.avgRiskReward ? `1:${snap.stats.avgRiskReward.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{snap.stats.closedTrades}</td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{snap.stats.totalPips.toFixed(0)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 rounded-full bg-white/8 overflow-hidden">
                                <div className="h-full rounded-full bg-violet-400"
                                  style={{ width: `${Math.min(100, snap.stats.planAdherence)}%` }} />
                              </div>
                              <span className="text-xs text-slate-400">{formatPercent(snap.stats.planAdherence)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <WaterButton variant="ghost" size="sm"
                                onClick={() => { setSelected(snap.userId); setTab('detail'); }}>
                                <Eye className="h-3.5 w-3.5" /> View
                              </WaterButton>
                              <button
                                onClick={() => toggleCompare(snap.userId)}
                                className={cn(
                                  'rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition',
                                  isComparing
                                    ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-300'
                                    : 'border-white/10 text-slate-500 hover:text-white'
                                )}>
                                {isComparing ? '✓ Added' : '+ Compare'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════
          TAB: COMPARE
      ════════════════════════════ */}
      {tab === 'compare' && (
        <div className="space-y-5">
          {/* Select hunters */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-cyan-300" />
              <h3 className="font-bold text-white">Select Hunters to Compare (max 4)</h3>
            </div>
            {snapshots.length === 0 && (
              <p className="text-sm text-slate-500">No hunters have published stats yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {snapshots.map(snap => {
                const sel = comparing.includes(snap.userId);
                return (
                  <button key={snap.userId}
                    onClick={() => toggleCompare(snap.userId)}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all',
                      sel
                        ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-300'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                    )}>
                    <div className="h-7 w-7 overflow-hidden rounded-full border"
                      style={{ borderColor: snap.accentColor + '50' }}>
                      {snap.avatarUrl
                        ? <img src={snap.avatarUrl} alt="" className="h-full w-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                        : <div className="flex h-full w-full items-center justify-center text-xs font-black"
                            style={{ color: snap.accentColor }}>
                            {snap.displayName.charAt(0)}
                          </div>}
                    </div>
                    {snap.displayName}
                    {sel && ' ✓'}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {compareSnaps.length < 2 && (
            <GlassCard className="py-12 text-center">
              <p className="text-slate-400">Select at least 2 hunters above to compare.</p>
            </GlassCard>
          )}

          {compareSnaps.length >= 2 && (
            <>
              {/* Equity curves overlay */}
              <GlassCard className="min-h-[380px]">
                <h4 className="mb-1 text-lg font-bold text-white">Equity Curve Comparison</h4>
                <p className="mb-4 text-xs text-slate-400">Cumulative PnL over time for selected hunters</p>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedEquity}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Legend />
                      {compareSnaps.map(s => (
                        <Line key={s.userId} type="monotone" dataKey={s.displayName}
                          stroke={s.accentColor} strokeWidth={2.5} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Stats comparison table */}
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="overflow-x-auto custom-scroll">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-bold text-left">Metric</th>
                        {compareSnaps.map(s => (
                          <th key={s.userId} className="px-4 py-3 font-bold text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-7 w-7 overflow-hidden rounded-full border"
                                style={{ borderColor: s.accentColor + '60' }}>
                                {s.avatarUrl
                                  ? <img src={s.avatarUrl} alt="" className="h-full w-full object-cover"
                                      onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                                  : <div className="flex h-full w-full items-center justify-center text-xs font-black"
                                      style={{ color: s.accentColor }}>{s.displayName.charAt(0)}</div>}
                              </div>
                              <span style={{ color: s.accentColor }}>{s.displayName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Total PnL',     key: 'totalPnl',      fmt: (v: number) => formatMoney(v),          good: (v: number) => v >= 0 },
                        { label: 'Win Rate',      key: 'winRate',       fmt: (v: number) => formatPercent(v),         good: (v: number) => v >= 50 },
                        { label: 'Profit Factor', key: 'profitFactor',  fmt: (v: number) => v.toFixed(2),             good: (v: number) => v >= 1 },
                        { label: 'Avg R:R',       key: 'avgRiskReward', fmt: (v: number) => v ? `1:${v.toFixed(2)}` : '—', good: () => true },
                        { label: 'Expectancy',    key: 'expectancy',    fmt: (v: number) => formatMoney(v),           good: (v: number) => v >= 0 },
                        { label: 'Max Drawdown',  key: 'maxDrawdown',   fmt: (v: number) => formatMoney(v),           good: (v: number) => v < 500 },
                        { label: 'Total Pips',    key: 'totalPips',     fmt: (v: number) => v.toFixed(1),             good: (v: number) => v >= 0 },
                        { label: 'Discipline',    key: 'planAdherence', fmt: (v: number) => formatPercent(v),         good: (v: number) => v >= 70 },
                        { label: 'Total Trades',  key: 'totalTrades',   fmt: (v: number) => String(v),                good: () => true },
                        { label: 'Best Trade',    key: 'bestTrade',     fmt: (v: number) => formatMoney(v),           good: (v: number) => v >= 0 },
                      ].map(row => {
                        const vals = compareSnaps.map(s => (s.stats as any)[row.key] as number);
                        const best = Math.max(...vals);
                        return (
                          <tr key={row.key} className="border-t border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-slate-400 font-medium">{row.label}</td>
                            {compareSnaps.map((s, i) => {
                              const v = vals[i];
                              const isBest = v === best && vals.filter(x => x === best).length === 1;
                              return (
                                <td key={s.userId} className="px-4 py-3 text-center">
                                  <span className={cn('font-bold text-sm',
                                    isBest ? 'text-amber-300' : row.good(v) ? 'text-emerald-300' : 'text-rose-300')}>
                                    {row.fmt(v)}
                                    {isBest && ' 👑'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly PnL bar chart */}
              <GlassCard className="min-h-[320px]">
                <h4 className="mb-1 text-lg font-bold text-white">Monthly PnL Comparison</h4>
                <p className="mb-4 text-xs text-slate-400">Side-by-side monthly performance</p>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const months = [...new Set(compareSnaps.flatMap(s => s.monthly.map(m => m.month)))].sort().slice(-6);
                      return months.map(m => {
                        const row: Record<string, string | number> = { month: m };
                        compareSnaps.forEach(s => {
                          const mo = s.monthly.find(x => x.month === m);
                          row[s.displayName] = mo?.pnl ?? 0;
                        });
                        return row;
                      });
                    })()}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Legend />
                      {compareSnaps.map(s => (
                        <Bar key={s.userId} dataKey={s.displayName} fill={s.accentColor} radius={[6,6,0,0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════
          TAB: HUNTER DETAIL
      ════════════════════════════ */}
      {tab === 'detail' && (
        <div className="space-y-5">
          {/* Hunter selector */}
          <GlassCard>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Select a Hunter to View
            </p>
            <div className="flex flex-wrap gap-2">
              {snapshots.map(snap => (
                <button key={snap.userId}
                  onClick={() => setSelected(snap.userId)}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-all',
                    selected === snap.userId
                      ? 'border-amber-400/40 bg-amber-400/12 text-amber-300'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                  )}>
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border"
                    style={{ borderColor: snap.accentColor + '50' }}>
                    {snap.avatarUrl
                      ? <img src={snap.avatarUrl} alt="" className="h-full w-full object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                      : <div className="flex h-full w-full items-center justify-center text-xs font-black"
                          style={{ color: snap.accentColor }}>{snap.displayName.charAt(0)}</div>}
                  </div>
                  {snap.displayName}
                </button>
              ))}
            </div>
          </GlassCard>

          {!detailSnap && (
            <GlassCard className="py-12 text-center">
              <p className="text-slate-400">Select a hunter above to view their public profile.</p>
            </GlassCard>
          )}

          {detailSnap && (
            <>
              {/* Profile header */}
              <div className="relative overflow-hidden rounded-3xl border p-6"
                style={{ borderColor: detailSnap.accentColor + '35',
                  background: `radial-gradient(ellipse at top left, ${detailSnap.accentColor}12, transparent 60%)` }}>
                <div className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${detailSnap.accentColor}60, transparent)` }} />
                <div className="flex flex-wrap items-center gap-5">
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full blur-xl"
                      style={{ background: detailSnap.accentColor + '30' }} />
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 shadow-xl"
                      style={{ borderColor: detailSnap.accentColor + '60', boxShadow: `0 0 28px ${detailSnap.accentColor}40` }}>
                      {detailSnap.avatarUrl
                        ? <img src={detailSnap.avatarUrl} alt={detailSnap.displayName} className="h-full w-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                        : <div className="flex h-full w-full items-center justify-center text-3xl font-black"
                            style={{ color: detailSnap.accentColor }}>{detailSnap.displayName.charAt(0)}</div>}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-2xl font-extrabold text-white">{detailSnap.displayName}</h3>
                      {detailSnap.userId === auth.session?.userId && <Badge tone="gold">You</Badge>}
                    </div>
                    <p className="text-sm capitalize mt-0.5" style={{ color: detailSnap.accentColor }}>
                      {detailSnap.role}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Last updated {format(new Date(detailSnap.updatedAt), 'PPpp')}
                    </p>
                  </div>
                </div>

                {/* Key stats */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {[
                    { label: 'Total PnL',      value: formatMoney(detailSnap.stats.totalPnl),                 pos: detailSnap.stats.totalPnl >= 0 },
                    { label: 'Win Rate',       value: formatPercent(detailSnap.stats.winRate),                pos: detailSnap.stats.winRate >= 50 },
                    { label: 'Profit Factor',  value: detailSnap.stats.profitFactor.toFixed(2),               pos: detailSnap.stats.profitFactor >= 1 },
                    { label: 'Avg R:R',        value: detailSnap.stats.avgRiskReward ? `1:${detailSnap.stats.avgRiskReward.toFixed(2)}` : '—', pos: true },
                    { label: 'Expectancy',     value: formatMoney(detailSnap.stats.expectancy),               pos: detailSnap.stats.expectancy >= 0 },
                    { label: 'Total Pips',     value: detailSnap.stats.totalPips.toFixed(0),                  pos: detailSnap.stats.totalPips >= 0 },
                    { label: 'Discipline',     value: formatPercent(detailSnap.stats.planAdherence),          pos: detailSnap.stats.planAdherence >= 70 },
                  ].map(({ label, value, pos }) => (
                    <div key={label} className="rounded-xl border border-white/8 bg-white/[0.04] p-3 text-center">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
                      <p className={cn('mt-1 text-base font-bold', pos ? 'text-emerald-300' : 'text-rose-300')}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity curve */}
              <GlassCard className="min-h-[320px]">
                <h4 className="mb-1 font-bold text-white">Equity Curve</h4>
                <p className="mb-4 text-xs text-slate-400">Cumulative realized PnL</p>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={detailSnap.equityCurve}>
                      <defs>
                        <linearGradient id={`fill-${detailSnap.userId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={detailSnap.accentColor} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={detailSnap.accentColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="equity"
                        stroke={detailSnap.accentColor} strokeWidth={2.5}
                        fill={`url(#fill-${detailSnap.userId})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Monthly + Weekly */}
              <div className="grid gap-4 lg:grid-cols-2">
                <GlassCard className="min-h-[280px]">
                  <h4 className="mb-4 font-bold text-white">Monthly PnL</h4>
                  <div className="h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={detailSnap.monthly.slice(-12)}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTip />} />
                        <Bar dataKey="pnl" radius={[6,6,0,0]}>
                          {detailSnap.monthly.slice(-12).map((m, i) => (
                            <Cell key={i} fill={m.pnl >= 0 ? '#34d399' : '#f87171'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
                <GlassCard className="min-h-[280px]">
                  <h4 className="mb-4 font-bold text-white">Weekly PnL (last 16 weeks)</h4>
                  <div className="h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={detailSnap.weekly}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTip />} />
                        <Bar dataKey="pnl" radius={[5,5,0,0]}>
                          {detailSnap.weekly.map((w, i) => (
                            <Cell key={i} fill={w.pnl >= 0 ? detailSnap.accentColor : '#f87171'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </div>

              {/* Top pairs + Strategies */}
              <div className="grid gap-4 lg:grid-cols-2">
                <GlassCard>
                  <h4 className="mb-4 font-bold text-white">Top Instruments</h4>
                  <div className="space-y-2">
                    {detailSnap.topPairs.map((p) => (
                      <div key={p.pair} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                        <div>
                          <p className="font-bold text-white text-sm">{p.pair}</p>
                          <p className="text-[11px] text-slate-500">{p.trades} trades · {formatPercent(p.winRate)} WR</p>
                        </div>
                        <p className={cn('font-bold text-sm', p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                          {formatMoney(p.pnl)}
                        </p>
                      </div>
                    ))}
                    {!detailSnap.topPairs.length && <p className="text-sm text-slate-500">No data.</p>}
                  </div>
                </GlassCard>
                <GlassCard>
                  <h4 className="mb-4 font-bold text-white">Strategy Breakdown</h4>
                  <div className="space-y-2">
                    {detailSnap.strategies.map((s) => (
                      <div key={s.name} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-white text-sm">{s.name}</p>
                          <p className={cn('font-bold text-sm', s.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                            {formatMoney(s.pnl)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, s.winRate)}%` }} />
                          </div>
                          <p className="text-[11px] text-slate-500">{formatPercent(s.winRate)} WR · {s.trades} trades</p>
                        </div>
                      </div>
                    ))}
                    {!detailSnap.strategies.length && <p className="text-sm text-slate-500">No data.</p>}
                  </div>
                </GlassCard>
              </div>

              {/* Emotion impact */}
              {detailSnap.emotions.length > 0 && (
                <GlassCard>
                  <h4 className="mb-4 font-bold text-white">Emotion Impact</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {detailSnap.emotions.map(e => (
                      <div key={e.emotion} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
                        <p className="text-xs font-bold capitalize text-white">{e.emotion}</p>
                        <p className={cn('mt-1 text-base font-bold', e.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                          {formatMoney(e.pnl)}
                        </p>
                        <p className="text-[10px] text-slate-500">{formatPercent(e.winRate)} WR</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════
          TAB: GROUP INSIGHTS
      ════════════════════════════ */}
      {tab === 'insights' && (
        <div className="space-y-5">
          {!insights && (
            <GlassCard className="py-16 text-center">
              <p className="text-slate-400">No hunters have published stats yet to generate insights.</p>
            </GlassCard>
          )}

          {insights && (
            <>
              {/* Awards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: '💰', label: 'Most Profitable',   name: insights.topPnl.displayName,  val: formatMoney(insights.topPnl.stats.totalPnl),            accent: insights.topPnl.accentColor },
                  { icon: '🎯', label: 'Highest Win Rate',  name: insights.topWR.displayName,   val: formatPercent(insights.topWR.stats.winRate),             accent: insights.topWR.accentColor },
                  { icon: '⚡', label: 'Best Profit Factor',name: insights.topPF.displayName,   val: insights.topPF.stats.profitFactor.toFixed(2),             accent: insights.topPF.accentColor },
                  { icon: '🧠', label: 'Most Disciplined',  name: insights.topDisc.displayName, val: formatPercent(insights.topDisc.stats.planAdherence), accent: insights.topDisc.accentColor },
                ].map(award => (
                  <div key={award.label} className="relative overflow-hidden rounded-3xl border p-5 text-center"
                    style={{ borderColor: award.accent + '35', background: `radial-gradient(ellipse at top, ${award.accent}10, transparent 65%)` }}>
                    <div className="absolute inset-x-0 top-0 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${award.accent}60, transparent)` }} />
                    <div className="text-4xl mb-3">{award.icon}</div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{award.label}</p>
                    <p className="mt-2 text-base font-extrabold text-white">{award.name}</p>
                    <p className="mt-1 text-lg font-black" style={{ color: award.accent }}>{award.val}</p>
                  </div>
                ))}
              </div>

              {/* Group averages */}
              <GlassCard>
                <h4 className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
                  <Shield className="h-5 w-5 text-cyan-300" /> Group Averages ({snapshots.length} hunters)
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Avg Win Rate',       value: formatPercent(insights.avgWR),                   color: '#22d3ee' },
                    { label: 'Avg Profit Factor',  value: insights.avgPF.toFixed(2),                       color: '#fbbf24' },
                    { label: 'Avg Total PnL',      value: formatMoney(insights.avgPnl),                    color: insights.avgPnl >= 0 ? '#34d399' : '#f87171' },
                  ].map(m => (
                    <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{m.label}</p>
                      <p className="mt-2 text-3xl font-black" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Group win rate chart */}
              <GlassCard className="min-h-[320px]">
                <h4 className="mb-1 font-bold text-white">Win Rate Comparison — All Hunters</h4>
                <p className="mb-4 text-xs text-slate-400">Group performance at a glance</p>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={snapshots.map(s => ({
                      name: s.displayName,
                      'Win Rate': Math.round(s.stats.winRate * 10) / 10,
                      'Plan Adherence': Math.round(s.stats.planAdherence * 10) / 10,
                    }))} layout="vertical">
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Legend />
                      <Bar dataKey="Win Rate" fill="#22d3ee" radius={[0,6,6,0]} />
                      <Bar dataKey="Plan Adherence" fill="#a78bfa" radius={[0,6,6,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* All equity on one chart */}
              <GlassCard className="min-h-[360px]">
                <h4 className="mb-1 font-bold text-white">All Equity Curves</h4>
                <p className="mb-4 text-xs text-slate-400">Every published hunter's journey</p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(() => {
                      const dates = [...new Set(snapshots.flatMap(s => s.equityCurve.map(c => c.date)))].sort();
                      return dates.map(date => {
                        const row: Record<string, string | number> = { date };
                        snapshots.forEach(s => {
                          const pt = s.equityCurve.find(c => c.date === date);
                          row[s.displayName] = pt?.equity ?? 0;
                        });
                        return row;
                      });
                    })()}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Legend />
                      {snapshots.map(s => (
                        <Line key={s.userId} type="monotone" dataKey={s.displayName}
                          stroke={s.accentColor} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Privacy notice */}
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-emerald-300">Privacy Guarantee</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      The Arena shows only <span className="font-bold text-white">aggregate statistics</span> — total PnL, win rate, profit factor, discipline score etc.
                      No individual trade details, entry prices, lot sizes, notes or timestamps are ever shared.
                      Each user's full vault remains <span className="font-bold text-white">AES-256 encrypted</span> and completely private.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* helper */
function MiniStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/30 p-2 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={cn('mt-0.5 text-sm font-bold',
        positive === undefined ? 'text-white' : positive ? 'text-emerald-300' : 'text-rose-300')}>
        {value}
      </p>
    </div>
  );
}
