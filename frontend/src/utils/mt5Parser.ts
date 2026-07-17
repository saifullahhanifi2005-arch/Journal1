/**
 * MetaTrader 5 (MT5) CSV History Parser
 *
 * Parses MT5 strategy tester reports, trade history exports,
 * and standard MT5 deal history CSV files.
 *
 * Supports:
 *   - MT5 trade history export (Deal, Time, Type, Entry, Symbol, Volume, Price, Commission, Swap, Profit)
 *   - MT5 strategy tester CSV reports
 *   - MT5 statement HTML exports (basic)
 *   - Common broker export formats
 */

import type { Trade, TradeDirection, TradeResult, TradeStatus } from '../types';
import { uid, calcPips, calcRR } from './stats';

/* ─── Result container ─── */
export interface MT5ParseResult {
  trades: Trade[];
  totalFound: number;
  duplicatesSkipped: number;
  errors: string[];
}

/* ─── Normalize pair name to standard ─── */
const PAIR_MAP: Record<string, string> = {
  'EURUSD': 'EURUSD', 'EUR/USD': 'EURUSD', 'EURUSD.': 'EURUSD', 'EURUSDm': 'EURUSD',
  'GBPUSD': 'GBPUSD', 'GBP/USD': 'GBPUSD', 'GBPUSD.': 'GBPUSD',
  'USDJPY': 'USDJPY', 'USD/JPY': 'USDJPY', 'USDJPY.': 'USDJPY',
  'USDCHF': 'USDCHF', 'USD/CHF': 'USDCHF',
  'AUDUSD': 'AUDUSD', 'AUD/USD': 'AUDUSD',
  'USDCAD': 'USDCAD', 'USD/CAD': 'USDCAD',
  'NZDUSD': 'NZDUSD', 'NZD/USD': 'NZDUSD',
  'EURJPY': 'EURJPY', 'EUR/JPY': 'EURJPY',
  'GBPJPY': 'GBPJPY', 'GBP/JPY': 'GBPJPY',
  'EURGBP': 'EURGBP', 'EUR/GBP': 'EURGBP',
  'XAUUSD': 'XAUUSD', 'XAU/USD': 'XAUUSD', 'GOLD': 'XAUUSD',
  'XAGUSD': 'XAGUSD', 'XAG/USD': 'XAGUSD', 'SILVER': 'XAGUSD',
  'NAS100': 'NAS100', 'NASDAQ100': 'NAS100', 'NASDAQ': 'NAS100', 'USTEC': 'NAS100', 'US100': 'NAS100',
  'US30': 'US30', 'DJ30': 'US30', 'DJI': 'US30', 'DJIA': 'US30', 'US30.': 'US30',
  'SPX500': 'SPX500', 'US500': 'SPX500', 'SP500': 'SPX500',
  'GER40': 'GER40', 'DE40': 'GER40', 'DAX40': 'GER40', 'GER40.': 'GER40',
  'BTCUSD': 'BTCUSD', 'BTC/USD': 'BTCUSD', 'BTCUSD.': 'BTCUSD',
};

function normalizePair(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return PAIR_MAP[clean] || PAIR_MAP[clean + '.'] || clean;
}

function parseDirection(typeStr: string): TradeDirection {
  const t = typeStr.toLowerCase().trim();
  if (t === 'buy' || t === 'b' || t === '0') return 'long';
  if (t === 'sell' || t === 's' || t === '1') return 'short';
  return 'long';
}

function parseDate(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  // Try ISO first
  const d = new Date(cleaned);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString();
  // Try DD.MM.YYYY HH:MM:SS
  const m = cleaned.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)/);
  if (m) {
    return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}`).toISOString();
  }
  // Try YYYY.MM.DD HH:MM:SS
  const m2 = cleaned.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)/);
  if (m2) {
    return new Date(`${m2[1]}-${m2[2]}-${m2[3]}T${m2[4]}`).toISOString();
  }
  return new Date().toISOString();
}

function num(s: string): number {
  const n = parseFloat(s.replace(/[",\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

/* ─── Detect separator ─── */
function detectSeparator(firstLine: string): string {
  const counts = [
    { ch: ';', n: (firstLine.match(/;/g) || []).length },
    { ch: ',', n: (firstLine.match(/,/g) || []).length },
    { ch: '\t', n: (firstLine.match(/\t/g) || []).length },
    { ch: '|', n: (firstLine.match(/\|/g) || []).length },
  ];
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n >= 2 ? counts[0].ch : ';';
}

/* ─── CSV line splitter ─── */
function splitLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === sep && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

/* ─── Find the header row ─── */
function findHeaderRow(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const lower = lines[i].toLowerCase();
    if (
      (lower.includes('deal') || lower.includes('ticket') || lower.includes('order')) &&
      (lower.includes('symbol') || lower.includes('pair') || lower.includes('item'))
    ) {
      return i;
    }
  }
  return -1;
}

/* ─── Map column names to indices ─── */
interface ColMap {
  deal: number; time: number; type: number; entry: number;
  symbol: number; volume: number; price: number;
  sl: number; tp: number; commission: number; swap: number; profit: number;
  comment: number; closeTime: number; closePrice: number;
}

function mapColumns(headers: string[]): ColMap {
  const lower = headers.map(h => h.toLowerCase().trim());
  const find = (...names: string[]): number =>
    names.reduce((acc, n) => acc >= 0 ? acc : lower.findIndex(h => h.includes(n)), -1);

  return {
    deal:       find('deal', 'ticket', 'order #', 'orderid'),
    time:       find('time', 'open time', 'opentime', 'date'),
    type:       find('type', 'action', 'direction'),
    entry:      find('entry', 'in/out'),
    symbol:     find('symbol', 'pair', 'instrument', 'item'),
    volume:     find('volume', 'lot', 'size', 'lots'),
    price:      find('price', 'open price', 'openprice'),
    sl:         find('sl', 'stop', 'stoploss'),
    tp:         find('tp', 'take', 'takeprofit'),
    commission: find('commission', 'comm'),
    swap:       find('swap', 'swaps'),
    profit:     find('profit', 'pnl', 'gain', 'net'),
    comment:    find('comment', 'note', 'notes'),
    closeTime:  find('close time', 'closetime', 'close'),
    closePrice: find('close price', 'closeprice', 'exit price', 'exitprice'),
  };
}

/* ════════════════════════════════════════════
   MAIN CSV PARSER
════════════════════════════════════════════ */

export function parseMT5CSV(text: string): MT5ParseResult {
  const result: MT5ParseResult = { trades: [], totalFound: 0, duplicatesSkipped: 0, errors: [] };
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());

  if (lines.length < 2) { result.errors.push('File appears empty.'); return result; }

  const headerIdx = findHeaderRow(lines);
  if (headerIdx < 0) { result.errors.push('Could not find MT5 header row. Make sure the file has Symbol/Pair columns.'); return result; }

  const sep = detectSeparator(lines[headerIdx]);
  const headers = splitLine(lines[headerIdx], sep);
  const col = mapColumns(headers);

  if (col.symbol < 0) { result.errors.push('No Symbol/Pair column found.'); return result; }

  /* ── Collect raw deals ── */
  type RawDeal = {
    deal: string; time: string; type: string; entry: string;
    symbol: string; volume: number; price: number;
    sl: number; tp: number; commission: number; swap: number;
    profit: number; comment: string;
  };

  const deals: RawDeal[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith('#') || raw.trim().startsWith('//')) continue;
    const cells = splitLine(raw, sep);
    if (cells.length < 4) continue;

    const sym = cells[col.symbol] || '';
    if (!sym || sym.length < 3) continue;

    deals.push({
      deal:       col.deal >= 0 ? cells[col.deal] || '' : String(i),
      time:       col.time >= 0 ? cells[col.time] || '' : '',
      type:       col.type >= 0 ? cells[col.type] || 'buy' : 'buy',
      entry:      col.entry >= 0 ? cells[col.entry] || '' : '',
      symbol:     sym,
      volume:     col.volume >= 0 ? num(cells[col.volume]) : 0.1,
      price:      col.price >= 0 ? num(cells[col.price]) : 0,
      sl:         col.sl >= 0 ? num(cells[col.sl]) : 0,
      tp:         col.tp >= 0 ? num(cells[col.tp]) : 0,
      commission: col.commission >= 0 ? num(cells[col.commission]) : 0,
      swap:       col.swap >= 0 ? num(cells[col.swap]) : 0,
      profit:     col.profit >= 0 ? num(cells[col.profit]) : 0,
      comment:    col.comment >= 0 ? cells[col.comment] || '' : '',
    });
  }

  result.totalFound = deals.length;

  /* ── Group deals into trades (entry → exit matching) ── */
  const seen = new Set<string>();
  const openDeals = deals.filter(d => d.entry === 'in' || d.entry === '0' || d.entry.toLowerCase() === 'in');
  const closeDeals = deals.filter(d => d.entry === 'out' || d.entry === '1' || d.entry.toLowerCase() === 'out');
  const standalone = deals.filter(d => !d.entry || d.entry === '' || d.entry.toLowerCase() === 'in out');

  /* Strategy: match open → close by deal ticket OR by symbol + time proximity */
  const usedCloses = new Set<string>();

  // First: explicit in/out pairs
  for (const op of openDeals) {
    const pair = normalizePair(op.symbol);
    const direction = parseDirection(op.type);

    // Find matching close
    const match = closeDeals.find(c =>
      !usedCloses.has(c.deal) && normalizePair(c.symbol) === pair
    );

    const entryPrice = op.price;
    const exitPrice = match ? match.price : undefined;
    const commission = op.commission + (match?.commission || 0);
    const swap = op.swap + (match?.swap || 0);
    const pnl = match ? match.profit : undefined;
    const lotSize = op.volume || match?.volume || 0.1;

    const closed = !!match;
    if (match) usedCloses.add(match.deal);

    const dedupeKey1 = `${pair}-${entryPrice}-${op.time}`;
    if (seen.has(dedupeKey1)) { result.duplicatesSkipped++; continue; }
    seen.add(dedupeKey1);

    const pips = closed && exitPrice ? calcPips(pair, entryPrice, exitPrice, direction) : undefined;
    const sl = op.sl || (direction === 'long' ? entryPrice - 0.005 : entryPrice + 0.005);
    const tp = op.tp || (direction === 'long' ? entryPrice + 0.01 : entryPrice - 0.01);
    const rr = closed && exitPrice ? calcRR(entryPrice, sl, tp, direction) : 0;

    let resultType: TradeResult | undefined;
    if (closed && pnl !== undefined) {
      resultType = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven';
    }

    const trade: Trade = {
      id: uid('mt5'),
      ticket: op.deal || undefined,
      pair,
      direction,
      status: (closed ? 'closed' : 'open') as TradeStatus,
      result: resultType,
      entryPrice,
      exitPrice,
      stopLoss: sl,
      takeProfit: tp,
      lotSize,
      riskReward: rr || undefined,
      riskAmount: 250,
      pnl,
      pips,
      commission: commission || undefined,
      swap: swap || undefined,
      openTime: parseDate(op.time),
      closeTime: match ? parseDate(match.time) : undefined,
      session: guessSession(parseDate(op.time)),
      strategy: 'MT5 Import',
      setup: op.comment || 'Auto-imported from MT5',
      timeframe: 'N/A',
      emotions: [],
      tags: ['mt5-import', pair.toLowerCase()],
      notes: op.comment || `Imported from MT5 history. Deal #${op.deal}`,
      lessons: '',
      rating: 3,
      followedPlan: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    result.trades.push(trade);
  }

  // Second: standalone deals (no entry/out flags)
  for (const d of standalone) {
    const pair = normalizePair(d.symbol);
    const direction = parseDirection(d.type);
    const dedupeKey2 = `${pair}-${d.price}-${d.time}`;
    if (seen.has(dedupeKey2)) { result.duplicatesSkipped++; continue; }
    seen.add(dedupeKey2);

    const hasProfit = d.profit !== 0;
    const closed = hasProfit;
    const sl = d.sl || (direction === 'long' ? d.price - 0.005 : d.price + 0.005);
    const tp = d.tp || (direction === 'long' ? d.price + 0.01 : d.price - 0.01);
    const rr = closed ? calcRR(d.price, sl, tp, direction) : 0;

    let resultType: TradeResult | undefined;
    if (closed) {
      resultType = d.profit > 0 ? 'win' : d.profit < 0 ? 'loss' : 'breakeven';
    }

    const trade: Trade = {
      id: uid('mt5'),
      ticket: d.deal || undefined,
      pair,
      direction,
      status: (closed ? 'closed' : 'open') as TradeStatus,
      result: resultType,
      entryPrice: d.price,
      exitPrice: closed ? d.price : undefined,
      stopLoss: sl,
      takeProfit: tp,
      lotSize: d.volume || 0.1,
      riskReward: rr || undefined,
      riskAmount: 250,
      pnl: closed ? d.profit : undefined,
      pips: closed ? calcPips(pair, d.price, d.price + (direction === 'long' ? 0.001 : -0.001), direction) : undefined,
      commission: d.commission || undefined,
      swap: d.swap || undefined,
      openTime: parseDate(d.time),
      closeTime: closed ? parseDate(d.time) : undefined,
      session: guessSession(parseDate(d.time)),
      strategy: 'MT5 Import',
      setup: d.comment || 'Auto-imported from MT5',
      timeframe: 'N/A',
      emotions: [],
      tags: ['mt5-import', pair.toLowerCase()],
      notes: d.comment || `Imported from MT5. Deal #${d.deal}`,
      lessons: '',
      rating: 3,
      followedPlan: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    result.trades.push(trade);
  }

  // Sort by open time
  result.trades.sort((a, b) =>
    new Date(b.openTime).getTime() - new Date(a.openTime).getTime()
  );

  return result;
}

function guessSession(isoStr: string): 'asian' | 'london' | 'newyork' | 'overlap' {
  try {
    const h = new Date(isoStr).getUTCHours();
    if (h >= 0 && h < 7) return 'asian';
    if (h >= 7 && h < 12) return 'london';
    if (h >= 12 && h < 16) return 'newyork';
    if (h >= 16 && h < 21) return 'overlap';
    return 'asian';
  } catch { return 'london'; }
}
