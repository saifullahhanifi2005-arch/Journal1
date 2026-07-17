/**
 * Arena Store — Public Snapshot System
 *
 * Each user can OPT IN to share their anonymised performance stats.
 * ONLY aggregated stats are stored — no individual trade prices,
 * sizes, tickets or notes. Privacy is preserved.
 *
 * Storage key: fhr-arena-snapshots-v1
 * Structure:  { [userId]: PublicSnapshot }
 */

import type { PublicSnapshot, Trade } from '../types';
import { computeStats, equityCurve, pnlByPair, pnlByStrategy, emotionImpact } from './stats';
import { format, getISOWeek, getYear } from 'date-fns';
import { fetchCloudSnapshots, syncCloudSnapshot } from './apiClient';

const ARENA_KEY = 'fhr-arena-snapshots-v1';

export function loadAllSnapshots(): Record<string, PublicSnapshot> {
  try {
    const raw = localStorage.getItem(ARENA_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, PublicSnapshot>) : {};

    // Background pull from cloud database
    setTimeout(() => {
      fetchCloudSnapshots().then((cloudSnapshots) => {
        if (cloudSnapshots && typeof cloudSnapshots === 'object') {
          const merged = { ...parsed, ...cloudSnapshots };
          if (Object.keys(merged).length !== Object.keys(parsed).length) {
            localStorage.setItem(ARENA_KEY, JSON.stringify(merged));
          }
        }
      }).catch(() => {});
    }, 10);

    return parsed;
  } catch { return {}; }
}

export function loadSnapshot(userId: string): PublicSnapshot | null {
  return loadAllSnapshots()[userId] ?? null;
}

export function saveSnapshot(snapshot: PublicSnapshot): void {
  const all = loadAllSnapshots();
  all[snapshot.userId] = snapshot;
  localStorage.setItem(ARENA_KEY, JSON.stringify(all));
  syncCloudSnapshot(snapshot).catch(() => {});
}

export function removeSnapshot(userId: string): void {
  const all = loadAllSnapshots();
  delete all[userId];
  localStorage.setItem(ARENA_KEY, JSON.stringify(all));
}

/* Build snapshot from raw trade array — no private data exposed */
export function buildSnapshot(opts: {
  userId: string;
  displayName: string;
  avatarUrl: string;
  accentColor: string;
  role: string;
  trades: Trade[];
  shareEnabled: boolean;
}): PublicSnapshot {
  const { trades, userId, displayName, avatarUrl, accentColor, role, shareEnabled } = opts;
  const s    = computeStats(trades);
  const curve = equityCurve(trades);
  const pairs = pnlByPair(trades).slice(0, 8).map((p) => ({
    pair: p.pair, pnl: p.pnl, trades: p.count,
    winRate: trades.filter(t => t.pair === p.pair && t.status === 'closed').length > 0
      ? (trades.filter(t => t.pair === p.pair && t.result === 'win').length /
         trades.filter(t => t.pair === p.pair && t.status === 'closed').length) * 100
      : 0,
  }));
  const strategies = pnlByStrategy(trades).map((s) => ({
    name: s.strategy, pnl: s.pnl, winRate: s.winRate, trades: s.count,
  }));
  const emotions = emotionImpact(trades).map((e) => ({
    emotion: e.emotion, pnl: e.pnl, winRate: e.winRate,
  }));

  /* monthly */
  const monthMap = new Map<string, { pnl: number; trades: number; wins: number }>();
  for (const t of trades.filter(x => x.status === 'closed')) {
    const m = format(new Date(t.closeTime || t.openTime), 'yyyy-MM');
    const cur = monthMap.get(m) || { pnl: 0, trades: 0, wins: 0 };
    cur.pnl += t.pnl ?? 0; cur.trades += 1;
    if (t.result === 'win') cur.wins += 1;
    monthMap.set(m, cur);
  }
  const monthly = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month, pnl: Math.round(v.pnl * 100) / 100,
      trades: v.trades, winRate: v.trades ? (v.wins / v.trades) * 100 : 0,
    }));

  /* weekly */
  const weekMap = new Map<string, { pnl: number; trades: number }>();
  for (const t of trades.filter(x => x.status === 'closed')) {
    const d  = new Date(t.closeTime || t.openTime);
    const wk = `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
    const cur = weekMap.get(wk) || { pnl: 0, trades: 0 };
    cur.pnl += t.pnl ?? 0; cur.trades += 1;
    weekMap.set(wk, cur);
  }
  const weekly = [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-16)
    .map(([week, v]) => ({ week, pnl: Math.round(v.pnl * 100) / 100, trades: v.trades }));

  return {
    userId, displayName, avatarUrl, accentColor, role, shareEnabled,
    updatedAt: new Date().toISOString(),
    stats: {
      totalTrades: s.totalTrades, closedTrades: s.closedTrades,
      winRate: s.winRate, totalPnl: s.totalPnl,
      profitFactor: s.profitFactor, avgRiskReward: s.avgRiskReward,
      expectancy: s.expectancy, maxDrawdown: s.maxDrawdown,
      totalPips: s.totalPips, planAdherence: s.planAdherence,
      bestTrade: s.bestTrade, consecutiveWins: s.consecutiveWins,
      avgWin: s.avgWin, avgLoss: s.avgLoss,
    },
    equityCurve: curve.map(c => ({ date: c.date, equity: c.equity })),
    monthly, weekly, topPairs: pairs, strategies, emotions,
  };
}

/* Leaderboard sort options */
export type LeaderboardSort =
  | 'totalPnl' | 'winRate' | 'profitFactor'
  | 'expectancy' | 'totalTrades' | 'planAdherence' | 'totalPips';

export function sortSnapshots(
  snapshots: PublicSnapshot[],
  by: LeaderboardSort
): PublicSnapshot[] {
  return [...snapshots].sort((a, b) => (b.stats[by] ?? 0) - (a.stats[by] ?? 0));
}

export function getRank(snapshots: PublicSnapshot[], userId: string, by: LeaderboardSort): number {
  const sorted = sortSnapshots(snapshots, by);
  return sorted.findIndex(s => s.userId === userId) + 1;
}
