/**
 * Weekly / Monthly Report Generator
 *
 * Produces a beautiful, self-contained HTML email file
 * that can be:
 *   - Downloaded as .html (open in any browser to print/save as PDF)
 *   - Emailed via mailto: link
 *   - Auto-sent via a backend SMTP integration (future)
 *
 * Uses each user's encrypted vault data — runs in-browser only.
 */

import type { Trade } from '../types';
import type { UserAccount } from './authStore';
import { computeStats, equityCurve, pnlByPair, pnlBySession } from './stats';

export type ReportPeriod = 'weekly' | 'monthly';

export interface ReportOptions {
  user: UserAccount;
  trades: Trade[];
  period: ReportPeriod;
  brandColor?: string;
}

export interface ReportSummary {
  period: string;
  totalPnl: number;
  winRate: number;
  trades: number;
  wins: number;
  losses: number;
  bestTrade: number;
  worstTrade: number;
  profitFactor: number;
  pairs: { pair: string; pnl: number; count: number }[];
  sessions: { session: string; pnl: number; count: number }[];
  topTrade: Trade | null;
  worstClosed: Trade | null;
  equity: { date: string; equity: number }[];
  isWin: boolean;
  currency: string;
}

function getDateRange(period: ReportPeriod): { from: Date; to: Date } {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const from = new Date(now); from.setDate(diff); from.setHours(0,0,0,0);
    const to = new Date(now); to.setHours(23,59,59,999);
    return { from, to };
  }
  // monthly
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

export function generateSummary(opts: ReportOptions): ReportSummary {
  const { trades, period } = opts;
  // user available via opts.user, period via opts.period — destructured elsewhere
  void opts.user; void opts.period;
  const { from, to } = getDateRange(period);
  const inRange = trades.filter(t => {
    const d = new Date(t.closeTime || t.openTime);
    return t.status === 'closed' && d >= from && d <= to;
  });

  const stats = computeStats(inRange);
  const equity = equityCurve(inRange);
  const pairs = pnlByPair(inRange);
  const sessions = pnlBySession(inRange);

  const sorted = [...inRange].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
  const topTrade = sorted[0] || null;
  const worstClosed = sorted[sorted.length - 1] || null;

  return {
    period: `${from.toLocaleDateString()} → ${to.toLocaleDateString()}`,
    totalPnl: stats.totalPnl,
    winRate: stats.winRate,
    trades: inRange.length,
    wins: stats.wins,
    losses: stats.losses,
    bestTrade: stats.bestTrade,
    worstTrade: stats.worstTrade,
    profitFactor: stats.profitFactor,
    pairs, sessions,
    topTrade, worstClosed,
    equity,
    isWin: stats.totalPnl >= 0,
    currency: 'USD',
  };
}

/* ─── Build a complete, self-contained HTML email ─── */
export function buildReportHTML(opts: ReportOptions): string {
  const { user, period, brandColor = '#fbbf24' } = opts;
  const s = generateSummary(opts);

  // Destructured to use in template literal at the bottom of the function
  void user; void period; void brandColor;

  const w = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const eqSparkline = s.equity.slice(-30).map((p, i) => {
    const max = Math.max(...s.equity.slice(-30).map(x => x.equity), 0);
    const min = Math.min(...s.equity.slice(-30).map(x => x.equity), 0);
    const range = max - min || 1;
    const y = 100 - ((p.equity - min) / range) * 100;
    const x = (i / Math.max(1, s.equity.slice(-30).length - 1)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${period === 'weekly' ? 'Weekly' : 'Monthly'} Trading Report — ${user.displayName}</title>
<style>
  body { margin:0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background:#050a14; color:#e2e8f0; }
  .container { max-width: 680px; margin: 0 auto; padding: 24px; background: linear-gradient(180deg, #0a1525 0%, #050a14 100%); }
  .header { text-align: center; padding: 32px 20px; border-radius: 16px;
    background: radial-gradient(ellipse at top, ${brandColor}20, transparent 65%), #060c17;
    border: 1px solid ${brandColor}30; margin-bottom: 24px; }
  .logo { font-size: 36px; margin-bottom: 8px; }
  .title { font-size: 28px; font-weight: 800; color: #fff; margin: 0; }
  .brand { color: ${brandColor}; font-size: 16px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
  .period { color: #94a3b8; font-size: 13px; margin-top: 8px; }
  .hero-pnl { font-size: 56px; font-weight: 900; margin: 24px 0 0; color: ${s.isWin ? '#34d399' : '#f87171'};
    text-shadow: 0 0 40px ${s.isWin ? '#34d39940' : '#f8717140'}; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 24px 0; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 16px; }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #94a3b8; }
  .card .value { font-size: 22px; font-weight: 700; color: #fff; margin-top: 4px; }
  .spark { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 20px; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }
  .row:last-child { border-bottom: 0; }
  .row .name { color: #fff; font-weight: 600; }
  .row .meta { color: #64748b; font-size: 12px; }
  .row .pnl { font-weight: 700; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px;
    font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
  .badge.win { background: #34d39920; color: #34d399; border: 1px solid #34d39940; }
  .badge.loss { background: #f8717120; color: #f87171; border: 1px solid #f8717140; }
  .footer { text-align: center; color: #64748b; font-size: 11px; margin-top: 32px; padding: 20px;
    border-top: 1px solid rgba(255,255,255,0.05); }
  .footer .brand-name { color: ${brandColor}; font-weight: 700; }
  @media print { body { background: #fff; color: #000; } .container { background: #fff; } .card, .spark { background: #f8fafc; border-color: #e2e8f0; } }
</style></head>
<body><div class="container">

  <div class="header">
    <div class="logo">⚔️</div>
    <h1 class="title">${period === 'weekly' ? 'Weekly' : 'Monthly'} Trading Report</h1>
    <p class="brand">The Fools Hunting Room</p>
    <p class="period">${s.period}</p>
    <p class="hero-pnl">${s.totalPnl >= 0 ? '+' : ''}$${w(s.totalPnl)}</p>
    <p style="color:#94a3b8; font-size:14px; margin:8px 0 0;">${s.trades} trades · ${s.wins}W / ${s.losses}L · ${s.winRate.toFixed(1)}% WR</p>
  </div>

  <div class="grid">
    <div class="card"><div class="label">Win Rate</div><div class="value">${s.winRate.toFixed(1)}%</div></div>
    <div class="card"><div class="label">Profit Factor</div><div class="value">${s.profitFactor.toFixed(2)}</div></div>
    <div class="card"><div class="label">Best Trade</div><div class="value" style="color:#34d399">+$${w(s.bestTrade)}</div></div>
    <div class="card"><div class="label">Worst Trade</div><div class="value" style="color:#f87171">-$${w(Math.abs(s.worstTrade))}</div></div>
  </div>

  ${s.equity.length >= 2 ? `
  <div class="spark">
    <p style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; margin:0 0 8px;">Equity Curve</p>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%; height:120px; display:block;">
      <defs><linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${s.isWin ? '#34d399' : '#f87171'}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${s.isWin ? '#34d399' : '#f87171'}" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon points="0,100 ${eqSparkline} 100,100" fill="url(#eqG)"/>
      <polyline points="${eqSparkline}" fill="none" stroke="${s.isWin ? '#34d399' : '#f87171'}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    </svg>
  </div>` : ''}

  ${s.pairs.length > 0 ? `
  <div class="card" style="margin-top:12px;">
    <p style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; margin:0 0 8px;">Pairs Traded</p>
    ${s.pairs.slice(0, 5).map(p => `
      <div class="row">
        <div><span class="name">${p.pair}</span><br><span class="meta">${p.count} trades</span></div>
        <div class="pnl" style="color:${p.pnl >= 0 ? '#34d399' : '#f87171'}">${p.pnl >= 0 ? '+' : ''}$${w(p.pnl)}</div>
      </div>`).join('')}
  </div>` : ''}

  ${s.sessions.length > 0 ? `
  <div class="card" style="margin-top:12px;">
    <p style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; margin:0 0 8px;">By Session</p>
    ${s.sessions.map(s => `
      <div class="row">
        <div><span class="name" style="text-transform:capitalize;">${s.session}</span><br><span class="meta">${s.count} trades</span></div>
        <div class="pnl" style="color:${s.pnl >= 0 ? '#34d399' : '#f87171'}">${s.pnl >= 0 ? '+' : ''}$${w(s.pnl)}</div>
      </div>`).join('')}
  </div>` : ''}

  ${s.topTrade ? `
  <div class="card" style="margin-top:12px; border-color:${s.isWin ? '#34d39940' : '#f8717140'};">
    <p style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; margin:0 0 8px;">Top Trade</p>
    <div class="row">
      <div>
        <span class="name">${s.topTrade.pair}</span>
        <span class="badge ${s.topTrade.result}" style="margin-left:8px;">${s.topTrade.result}</span>
        <br><span class="meta">${s.topTrade.strategy} · ${new Date(s.topTrade.closeTime || s.topTrade.openTime).toLocaleDateString()}</span>
      </div>
      <div class="pnl" style="color:#34d399; font-size:20px;">+$${w(s.topTrade.pnl ?? 0)}</div>
    </div>
  </div>` : ''}

  <div class="footer">
    <p class="brand-name">The Fools Hunting Room</p>
    <p>Report generated for <strong style="color:#fff">${user.displayName}</strong> (@${user.username})</p>
    <p style="margin-top:8px;">${new Date().toLocaleString()}</p>
    <p style="margin-top:12px;">Built by Saifullah Hanifi · Open this email in your browser to print or save as PDF</p>
  </div>
</div></body></html>`;
}

/* ─── Download as .html ─── */
export function downloadReportHTML(opts: ReportOptions): void {
  const html = buildReportHTML(opts);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fhr-${opts.period}-report-${opts.user.username}-${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Open mailto: link with text body ─── */
export function emailReportLink(opts: ReportOptions): string {
  const s = generateSummary(opts);
  const subject = `${opts.period === 'weekly' ? 'Weekly' : 'Monthly'} Trading Report — ${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toFixed(2)}`;
  const body = `Hey team,

Here's my ${opts.period} report from The Fools Hunting Room.

📊 Period: ${s.period}
💰 Total PnL: ${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toFixed(2)}
🎯 Win Rate: ${s.winRate.toFixed(1)}%
⚡ Profit Factor: ${s.profitFactor.toFixed(2)}
📈 Trades: ${s.trades} (${s.wins}W / ${s.losses}L)

Top trade: ${s.topTrade ? `${s.topTrade.pair} +$${(s.topTrade.pnl ?? 0).toFixed(2)}` : '—'}

The full graphical report has been attached as an HTML file. Open it in your browser for the full breakdown.

— ${opts.user.displayName}`;
  return `mailto:${opts.user.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
