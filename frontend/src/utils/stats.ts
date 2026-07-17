import type { PerformanceStats, Trade } from '../types';

export function computeStats(trades: Trade[]): PerformanceStats {
  const closed = trades.filter((t) => t.status === 'closed');
  const open = trades.filter((t) => t.status === 'open');
  const wins = closed.filter((t) => t.result === 'win');
  const losses = closed.filter((t) => t.result === 'loss');
  const breakevens = closed.filter((t) => t.result === 'breakeven');

  const winPnls = wins.map((t) => t.pnl ?? 0);
  const lossPnls = losses.map((t) => Math.abs(t.pnl ?? 0));
  const totalWin = winPnls.reduce((a, b) => a + b, 0);
  const totalLoss = lossPnls.reduce((a, b) => a + b, 0);
  const totalPnl = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const totalPips = closed.reduce((a, t) => a + (t.pips ?? 0), 0);

  const avgWin = wins.length ? totalWin / wins.length : 0;
  const avgLoss = losses.length ? totalLoss / losses.length : 0;
  const profitFactor = totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? 99 : 0;

  const rrValues = closed
    .filter((t) => typeof t.riskReward === 'number')
    .map((t) => t.riskReward as number);
  const avgRiskReward = rrValues.length
    ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length
    : 0;

  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const expectancy =
    closed.length > 0
      ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
      : 0;

  const sorted = [...closed].sort(
    (a, b) => new Date(a.closeTime || a.openTime).getTime() - new Date(b.closeTime || b.openTime).getTime()
  );

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    equity += t.pnl ?? 0;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let curW = 0;
  let curL = 0;
  for (const t of sorted) {
    if (t.result === 'win') {
      curW += 1;
      curL = 0;
      consecutiveWins = Math.max(consecutiveWins, curW);
    } else if (t.result === 'loss') {
      curL += 1;
      curW = 0;
      consecutiveLosses = Math.max(consecutiveLosses, curL);
    } else {
      curW = 0;
      curL = 0;
    }
  }

  const planned = closed.filter((t) => t.followedPlan).length;
  const planAdherence = closed.length ? (planned / closed.length) * 100 : 0;

  const pnls = closed.map((t) => t.pnl ?? 0);

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: open.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate,
    totalPnl,
    avgWin,
    avgLoss,
    profitFactor,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    avgRiskReward,
    expectancy,
    maxDrawdown,
    consecutiveWins,
    consecutiveLosses,
    totalPips,
    planAdherence,
  };
}

export function equityCurve(trades: Trade[]): { date: string; equity: number; pnl: number }[] {
  const closed = [...trades]
    .filter((t) => t.status === 'closed')
    .sort(
      (a, b) =>
        new Date(a.closeTime || a.openTime).getTime() -
        new Date(b.closeTime || b.openTime).getTime()
    );

  let equity = 0;
  return closed.map((t) => {
    equity += t.pnl ?? 0;
    return {
      date: (t.closeTime || t.openTime).slice(0, 10),
      equity: Math.round(equity * 100) / 100,
      pnl: t.pnl ?? 0,
    };
  });
}

export function pnlByPair(trades: Trade[]): { pair: string; pnl: number; count: number }[] {
  const map = new Map<string, { pnl: number; count: number }>();
  for (const t of trades.filter((x) => x.status === 'closed')) {
    const cur = map.get(t.pair) || { pnl: 0, count: 0 };
    cur.pnl += t.pnl ?? 0;
    cur.count += 1;
    map.set(t.pair, cur);
  }
  return [...map.entries()]
    .map(([pair, v]) => ({ pair, ...v }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function pnlByStrategy(trades: Trade[]): { strategy: string; pnl: number; winRate: number; count: number }[] {
  const map = new Map<string, { pnl: number; wins: number; count: number }>();
  for (const t of trades.filter((x) => x.status === 'closed')) {
    const cur = map.get(t.strategy) || { pnl: 0, wins: 0, count: 0 };
    cur.pnl += t.pnl ?? 0;
    cur.count += 1;
    if (t.result === 'win') cur.wins += 1;
    map.set(t.strategy, cur);
  }
  return [...map.entries()]
    .map(([strategy, v]) => ({
      strategy,
      pnl: v.pnl,
      count: v.count,
      winRate: v.count ? (v.wins / v.count) * 100 : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function pnlBySession(trades: Trade[]): { session: string; pnl: number; count: number }[] {
  const map = new Map<string, { pnl: number; count: number }>();
  for (const t of trades.filter((x) => x.status === 'closed')) {
    const cur = map.get(t.session) || { pnl: 0, count: 0 };
    cur.pnl += t.pnl ?? 0;
    cur.count += 1;
    map.set(t.session, cur);
  }
  return [...map.entries()].map(([session, v]) => ({ session, ...v }));
}

export function emotionImpact(trades: Trade[]): { emotion: string; pnl: number; count: number; winRate: number }[] {
  const map = new Map<string, { pnl: number; wins: number; count: number }>();
  for (const t of trades.filter((x) => x.status === 'closed')) {
    for (const e of t.emotions) {
      const cur = map.get(e) || { pnl: 0, wins: 0, count: 0 };
      cur.pnl += t.pnl ?? 0;
      cur.count += 1;
      if (t.result === 'win') cur.wins += 1;
      map.set(e, cur);
    }
  }
  return [...map.entries()]
    .map(([emotion, v]) => ({
      emotion,
      pnl: v.pnl,
      count: v.count,
      winRate: v.count ? (v.wins / v.count) * 100 : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function calendarHeatmap(trades: Trade[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of trades.filter((x) => x.status === 'closed')) {
    const d = (t.closeTime || t.openTime).slice(0, 10);
    map[d] = (map[d] || 0) + (t.pnl ?? 0);
  }
  return map;
}

export function formatMoney(n: number, currency = 'USD'): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPips(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function calcPips(pair: string, entry: number, exit: number, direction: 'long' | 'short'): number {
  const isJpy = pair.includes('JPY');
  const isGold = pair.includes('XAU') || pair.includes('XAG');
  const isIndex = ['NAS', 'US30', 'GER', 'SPX'].some((x) => pair.includes(x));
  let multiplier = 10000;
  if (isJpy) multiplier = 100;
  if (isGold || isIndex) multiplier = 1;
  const raw = direction === 'long' ? exit - entry : entry - exit;
  return Math.round(raw * multiplier * 10) / 10;
}

export function calcRR(entry: number, stop: number, tp: number, direction: 'long' | 'short'): number {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  // Validate direction consistency lightly
  void direction;
  return Math.round((reward / risk) * 100) / 100;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
