/**
 * Forex News & Weekly Forecast Store
 *
 * Connects to the BJournal backend for LIVE news.
 * Falls back to curated seed data when offline or backend unavailable.
 */

import type { ForexNewsItem, WeeklyForecast } from '../types';

const NEWS_KEY    = 'fhr-news-v1';
const FORECAST_KEY = 'fhr-forecast-v1';
const LAST_FETCH  = 'fhr-news-last-fetch';
// Use relative path — Vite dev server proxies /api to backend at localhost:3001
const BACKEND_URL = '';

const SEED_EVENTS: Omit<ForexNewsItem, 'id'>[] = [
  {
    title: 'US Non-Farm Payrolls',
    currency: 'USD', impact: 'high',
    forecast: '+180K', previous: '+227K',
    date: futureDate(2, 13, 30),
    source: 'Bureau of Labor Statistics',
    category: 'economic',
    description: 'Monthly change in the number of employed people, excluding the farming industry. Strongest USD-mover.',
    affectedPairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'],
  },
  {
    title: 'FOMC Interest Rate Decision',
    currency: 'USD', impact: 'high',
    forecast: '5.25%', previous: '5.25%',
    date: futureDate(1, 19, 0),
    source: 'Federal Reserve',
    category: 'central-bank',
    description: 'Federal Reserve interest rate decision. Volatility spike expected across all USD pairs.',
    affectedPairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100'],
  },
  {
    title: 'ECB Rate Statement',
    currency: 'EUR', impact: 'high',
    forecast: '4.00%', previous: '4.00%',
    date: futureDate(4, 13, 15),
    source: 'European Central Bank',
    category: 'central-bank',
    description: 'ECB policy rate announcement. Major EUR driver.',
    affectedPairs: ['EURUSD', 'EURJPY', 'EURGBP'],
  },
  {
    title: 'UK CPI YoY',
    currency: 'GBP', impact: 'high',
    forecast: '3.4%', previous: '3.6%',
    date: futureDate(3, 7, 0),
    source: 'ONS',
    category: 'economic',
    description: 'UK Consumer Price Index year-over-year. Influences BOE rate path expectations.',
    affectedPairs: ['GBPUSD', 'GBPJPY', 'EURGBP'],
  },
  {
    title: 'BOJ Policy Rate',
    currency: 'JPY', impact: 'high',
    forecast: '0.10%', previous: '0.10%',
    date: futureDate(5, 3, 0),
    source: 'Bank of Japan',
    category: 'central-bank',
    description: 'BOJ interest rate decision. JPY crosses react strongly to any policy shift.',
    affectedPairs: ['USDJPY', 'EURJPY', 'GBPJPY'],
  },
  {
    title: 'US CPI YoY',
    currency: 'USD', impact: 'high',
    forecast: '3.1%', previous: '3.2%',
    date: futureDate(6, 13, 30),
    source: 'BLS',
    category: 'economic',
    description: 'Consumer Price Index year-over-year. Key inflation gauge for Fed policy.',
    affectedPairs: ['EURUSD', 'XAUUSD', 'NAS100', 'USDJPY'],
  },
  {
    title: 'US Retail Sales m/m',
    currency: 'USD', impact: 'medium',
    forecast: '0.3%', previous: '0.6%',
    date: futureDate(4, 13, 30),
    source: 'Census Bureau',
    category: 'economic',
    description: 'Monthly retail sales change. Consumer health indicator.',
    affectedPairs: ['EURUSD', 'XAUUSD'],
  },
  {
    title: 'GBP GDP q/q',
    currency: 'GBP', impact: 'medium',
    forecast: '0.2%', previous: '0.0%',
    date: futureDate(2, 7, 0),
    source: 'ONS',
    category: 'economic',
    description: 'UK quarterly GDP growth. Recession-watch indicator.',
    affectedPairs: ['GBPUSD', 'GBPJPY'],
  },
  {
    title: 'China Trade Balance',
    currency: 'CNY', impact: 'medium',
    forecast: '$70.0B', previous: '$68.4B',
    date: futureDate(3, 5, 0),
    source: 'China Customs',
    category: 'economic',
    description: 'China trade surplus. Risk-on/off signal for AUD, NZD, gold.',
    affectedPairs: ['AUDUSD', 'NZDUSD', 'XAUUSD'],
  },
  {
    title: 'Geopolitical: Middle East Tensions',
    currency: 'GOLD', impact: 'high',
    forecast: 'Watch', previous: '—',
    date: futureDate(0, 9, 0),
    source: 'Reuters',
    category: 'geopolitical',
    description: 'Escalation in Middle East drives safe-haven flows into gold and USD.',
    affectedPairs: ['XAUUSD', 'XAGUSD', 'USOIL', 'USDJPY'],
  },
  {
    title: 'RBA Cash Rate',
    currency: 'AUD', impact: 'high',
    forecast: '4.35%', previous: '4.35%',
    date: futureDate(8, 3, 30),
    source: 'Reserve Bank of Australia',
    category: 'central-bank',
    description: 'RBA rate decision. AUD crosses react sharply.',
    affectedPairs: ['AUDUSD', 'AUDJPY', 'NZDUSD'],
  },
  {
    title: 'Weekly Forecast: Gold Outlook',
    currency: 'XAU', impact: 'high',
    forecast: 'Bullish', previous: '—',
    date: futureDate(0, 0, 0),
    source: 'Apex Journal AI',
    category: 'forecast',
    description: 'Gold bid into FOMC week. HTF structure remains bullish above 2300. Watch for liquidity sweep of equal lows into NY open.',
    affectedPairs: ['XAUUSD'],
  },
];

const SEED_FORECAST = (): WeeklyForecast => ({
  weekOf: mondayOfWeek(),
  summary: 'FOMC week ahead — expect USD volatility spike. London and NY sessions will be wild. Gold favoured to extend higher on any dovish Fed hints. Watch NFP Friday.',
  keyEvents: ['FOMC Rate Decision', 'US NFP', 'US CPI', 'BOJ Statement', 'UK CPI'],
  topPairs: [
    { pair: 'XAUUSD',  bias: 'bullish',  reason: 'Safe-haven bid into Fed uncertainty. HTF structure supports longs above 2300.' },
    { pair: 'EURUSD',  bias: 'bearish',  reason: 'DXY strength on Fed hawkish hold. ECB dovish undertone.' },
    { pair: 'GBPUSD',  bias: 'neutral',  reason: 'Range-bound 1.24-1.28 ahead of UK CPI. Wait for break.' },
    { pair: 'USDJPY',  bias: 'bullish',  reason: 'BOJ dovish vs Fed hawkish = uptrend continuation.' },
    { pair: 'NAS100',  bias: 'neutral',  reason: 'Tech earnings mixed. Watch NVDA support 18200.' },
  ],
  generatedAt: new Date().toISOString(),
});

function futureDate(days: number, hour: number, minute: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, minute, 0, 0); return d.toISOString();
}
function mondayOfWeek(): string {
  const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function uid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* ─── Fetch live news from backend ─── */
async function fetchLiveCalendar(): Promise<ForexNewsItem[]> {
  try {
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const resp = await fetch(`${BACKEND_URL}/api/news/calendar?from=${from}&to=${to}`, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.events?.length > 0 ? data.events as ForexNewsItem[] : [];
  } catch { return []; }
}

/* ─── public API ─── */
export async function loadNews(): Promise<{ news: ForexNewsItem[]; live: boolean }> {
  const liveEvents = await fetchLiveCalendar();
  if (liveEvents.length > 0) {
    localStorage.setItem(NEWS_KEY, JSON.stringify(liveEvents));
    localStorage.setItem(LAST_FETCH, new Date().toISOString());
    return { news: liveEvents, live: true };
  }
  try {
    const raw = localStorage.getItem(NEWS_KEY);
    if (raw) { const cached = JSON.parse(raw) as ForexNewsItem[]; if (cached.length > 0) return { news: cached, live: false }; }
  } catch { /* ignore */ }
  const seeded = seedNews();
  localStorage.setItem(NEWS_KEY, JSON.stringify(seeded));
  return { news: seeded, live: false };
}

export function loadForecast(): WeeklyForecast {
  try {
    const raw = localStorage.getItem(FORECAST_KEY);
    if (raw) { const f = JSON.parse(raw) as WeeklyForecast; if (new Date(f.weekOf).getTime() >= startOfThisWeek()) return f; }
  } catch { /* ignore */ }
  return seedForecast();
}

export async function refreshNews(): Promise<{ news: ForexNewsItem[]; live: boolean }> {
  const liveEvents = await fetchLiveCalendar();
  if (liveEvents.length > 0) {
    localStorage.setItem(NEWS_KEY, JSON.stringify(liveEvents));
    localStorage.setItem(LAST_FETCH, new Date().toISOString());
    return { news: liveEvents, live: true };
  }
  const news = seedNews();
  localStorage.setItem(NEWS_KEY, JSON.stringify(news));
  localStorage.setItem(LAST_FETCH, new Date().toISOString());
  return { news, live: false };
}

export function refreshForecast(): WeeklyForecast {
  const f = seedForecast(); localStorage.setItem(FORECAST_KEY, JSON.stringify(f)); return f;
}

export function getLastFetch(): string | null { return localStorage.getItem(LAST_FETCH); }

/** Send report email via backend */
export async function emailReportViaBackend(to: string, reportHtml: string, subject?: string): Promise<{ success: boolean; message: string }> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/email/report`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, reportHtml, subject }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await resp.json();
    return data.success ? { success: true, message: 'Report emailed successfully!' } : { success: false, message: data.error || data.message || 'Failed to send email' };
  } catch { return { success: false, message: 'Backend not reachable. Start the server: cd server && npm run dev' }; }
}

/** Send Excel report via backend */
export async function emailExcelViaBackend(to: string, excelBase64: string, filename?: string, subject?: string): Promise<{ success: boolean; message: string }> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/email/excel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, excelBase64, filename, subject }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await resp.json();
    return data.success ? { success: true, message: 'Excel report emailed successfully!' } : { success: false, message: data.error || data.message || 'Failed to send email' };
  } catch { return { success: false, message: 'Backend not reachable. Start the server: cd server && npm run dev' }; }
}

/** Check backend email status */
export async function checkBackendEmailStatus(): Promise<{ configured: boolean; message: string }> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/email/test`, { signal: AbortSignal.timeout(5000) });
    return await resp.json();
  } catch { return { configured: false, message: 'Backend not reachable' }; }
}

/** Check backend health */
export async function checkBackendHealth(): Promise<{ status: string; services: { news: boolean; email: boolean } } | null> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return await resp.json();
  } catch { return null; }
}

/* ─── seeders ─── */
function seedNews(): ForexNewsItem[] { return SEED_EVENTS.map(e => ({ ...e, id: uid() })); }
function seedForecast(): WeeklyForecast { const f = SEED_FORECAST(); localStorage.setItem(FORECAST_KEY, JSON.stringify(f)); return f; }
function startOfThisWeek(): number {
  const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0, 0, 0, 0); return d.getTime();
}
