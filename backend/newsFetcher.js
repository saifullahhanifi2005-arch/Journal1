/**
 * News Fetcher — Live Forex Economic Calendar & Market News
 *
 * Sources:
 *   1. Finnhub (free tier: 60 req/min, economic calendar + forex news)
 *   2. ForexFactory (public JSON feed for weekly view, no key needed)
 */

// ─── Finnhub Economic Calendar ────────────────────

export async function fetchFinnhubCalendar(apiKey, from, to) {
  const url = `https://finnhub.io/api/v1/calendar/economic?token=${apiKey}&from=${from}&to=${to}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Finnhub API error: ${resp.status}`);

  const data = await resp.json();
  const rawEvents = data.economicCalendar || [];

  return rawEvents.map(e => ({
    id: `fh-${e.time}-${e.event}`,
    title: e.event || 'Economic Event',
    currency: e.country || 'USD',
    impact: mapImpact(e.impact),
    forecast: e.estimate || '—',
    previous: e.prev || '—',
    actual: e.actual || undefined,
    date: e.time ? new Date(e.time * 1000).toISOString() : new Date().toISOString(),
    source: 'Finnhub',
    category: categorize(e.event),
    description: e.event || '',
    affectedPairs: guessPairs(e.country, e.event),
  }));
}

// ─── Finnhub Forex News ───────────────────────────

export async function fetchFinnhubForexNews(apiKey) {
  const url = `https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Finnhub news error: ${resp.status}`);

  const articles = await resp.json();
  return (articles || []).slice(0, 20).map(a => ({
    id: `fn-${a.id}`,
    title: a.headline,
    summary: a.summary,
    source: a.source,
    url: a.url,
    image: a.image,
    date: new Date(a.datetime * 1000).toISOString(),
    category: 'forex-news',
    currency: 'Multi',
    impact: 'medium',
  }));
}

// ─── ForexFactory Weekly JSON ─────────────────────

export async function fetchForexFactoryWeek() {
  try {
    const resp = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) throw new Error(`ForexFactory error: ${resp.status}`);

    const data = await resp.json();
    return (data || []).map(e => ({
      id: `ff-${e.date}-${e.title}`,
      title: e.title || 'Economic Event',
      currency: e.country || 'USD',
      impact: mapImpact(e.impact),
      forecast: e.forecast || '—',
      previous: e.previous || '—',
      actual: e.actual || undefined,
      date: parseFFDate(e.date),
      source: 'ForexFactory',
      category: categorize(e.title),
      description: e.title || '',
      affectedPairs: guessPairs(e.country, e.title),
    }));
  } catch (err) {
    console.error('ForexFactory fetch failed:', err.message);
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────

function mapImpact(impact) {
  if (!impact) return 'low';
  const v = String(impact).toLowerCase();
  if (v === 'high' || v === '3' || v === 'red') return 'high';
  if (v === 'medium' || v === '2' || v === 'orange' || v === 'med') return 'medium';
  return 'low';
}

function categorize(title) {
  if (!title) return 'economic';
  const t = title.toLowerCase();
  if (t.includes('rate') || t.includes('fomc') || t.includes('ecb') || t.includes('boe') || t.includes('boj') || t.includes('rba') || t.includes('snb') || t.includes('cbc')) return 'central-bank';
  if (t.includes('war') || t.includes('conflict') || t.includes('tension') || t.includes('sanction') || t.includes('geopolitical')) return 'geopolitical';
  if (t.includes('forecast') || t.includes('outlook') || t.includes('bias') || t.includes('prediction')) return 'forecast';
  return 'economic';
}

function guessPairs(country, _title) {
  const map = {
    USD: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'],
    EUR: ['EURUSD', 'EURJPY', 'EURGBP'],
    GBP: ['GBPUSD', 'GBPJPY', 'EURGBP'],
    JPY: ['USDJPY', 'EURJPY', 'GBPJPY'],
    AUD: ['AUDUSD', 'AUDJPY'],
    NZD: ['NZDUSD', 'NZDJPY'],
    CAD: ['USDCAD', 'AUDCAD'],
    CHF: ['USDCHF', 'EURCHF'],
    CNY: ['AUDUSD', 'XAUUSD'],
  };
  return map[country] || ['EURUSD', 'XAUUSD'];
}

function parseFFDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}
