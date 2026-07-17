import { useEffect, useState } from 'react';
import { Calendar, Globe, Newspaper, RefreshCw, Zap, Wifi, WifiOff, Server } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { ForexNewsItem, WeeklyForecast } from '../../types';
import { getLastFetch, loadForecast, loadNews, refreshForecast, refreshNews, checkBackendHealth } from '../../utils/newsStore';
import { WaterButton } from '../ui/WaterButton';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

export function NewsView() {
  const [news, setNews] = useState<ForexNewsItem[]>([]);
  const [forecast, setForecast] = useState<WeeklyForecast | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'today'>('all');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { news, live } = await loadNews();
      setNews(news); setIsLive(live);
      setForecast(loadForecast()); setLastFetch(getLastFetch());
      const health = await checkBackendHealth();
      setBackendOnline(health?.status === 'ok');
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = isLive ? 300_000 : 60_000;
    const id = window.setInterval(async () => {
      if (isLive) { const { news, live } = await refreshNews(); setNews(news); setIsLive(live); }
      else { setNews(prev => [...prev].sort(() => Math.random() - 0.5)); }
      setLastFetch(new Date().toISOString());
    }, interval);
    return () => window.clearInterval(id);
  }, [autoRefresh, isLive]);

  const handleRefresh = async () => {
    setLoading(true);
    const { news, live } = await refreshNews();
    setNews(news); setIsLive(live);
    setForecast(refreshForecast()); setLastFetch(new Date().toISOString());
    const health = await checkBackendHealth();
    setBackendOnline(health?.status === 'ok');
    setLoading(false);
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const filtered = news.filter(n => {
    if (filter === 'high') return n.impact === 'high';
    if (filter === 'today') { const d = new Date(n.date); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime(); }
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const impactColor = (impact: ForexNewsItem['impact']) => {
    if (impact === 'high')   return { dot: 'bg-rose-400',    text: 'text-rose-300',    border: 'border-rose-400/30',    bg: 'bg-rose-400/[0.08]' };
    if (impact === 'medium') return { dot: 'bg-amber-400',   text: 'text-amber-300',   border: 'border-amber-400/30',   bg: 'bg-amber-400/[0.08]' };
    return                        { dot: 'bg-slate-400',  text: 'text-slate-300',  border: 'border-slate-400/30',  bg: 'bg-slate-400/[0.08]' };
  };
  const isToday = (iso: string) => { const d = new Date(iso); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime(); };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/20">
        <img src="/images/trading-anime-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a14] via-[#050a14]/85 to-[#050a14]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a14]/80 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
        <div className="absolute -left-10 top-4 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Newspaper className="h-5 w-5 text-cyan-300" />
                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300/70">Live Economic Calendar</span>
                {isLive ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <WifiOff className="h-3 w-3" /> OFFLINE
                  </span>
                )}
              </div>
              <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 0 30px rgba(34,211,238,0.3)' }}>Forex News & Forecasts</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                {isLive ? '✅ Connected to live data source. Events update automatically.' : '📡 Offline mode — showing cached/seed data. Start the backend for live news.'}
              </p>
              {lastFetch && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Last updated {formatDistanceToNow(new Date(lastFetch), { addSuffix: true })} ·
                  {' '}<button onClick={() => setAutoRefresh(a => !a)} className={cn('underline', autoRefresh ? 'text-emerald-300' : 'text-rose-300')}>
                    auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                  </button>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <WaterButton variant="secondary" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> {loading ? 'Loading…' : 'Refresh Now'}
              </WaterButton>
              <div className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                backendOnline ? 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300' : 'border-rose-400/30 bg-rose-400/[0.08] text-rose-300')}>
                <Server className="h-3 w-3" />
                {backendOnline ? <><Wifi className="h-3 w-3" /> Backend Connected</> : <><WifiOff className="h-3 w-3" /> Backend Offline</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Forecast */}
      {forecast && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-gradient-to-br from-amber-300/[0.06] via-[#060c17] to-[#060c17]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-300" />
              <span className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300/70">This Week's Outlook</span>
              <Badge tone="info">{isLive ? 'AI + Live Data' : 'Auto-Generated'}</Badge>
            </div>
            <h4 className="text-2xl font-extrabold text-white">Week of {format(new Date(forecast.weekOf), 'PP')}</h4>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{forecast.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">{forecast.keyEvents.map((e, i) => (<Badge key={i} tone="warning">📅 {e}</Badge>))}</div>
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Pair Bias</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {forecast.topPairs.map(p => {
                  const bc = p.bias === 'bullish' ? { dot: 'bg-emerald-400', border: 'border-emerald-400/25', bg: 'bg-emerald-400/[0.06]' } : p.bias === 'bearish' ? { dot: 'bg-rose-400', border: 'border-rose-400/25', bg: 'bg-rose-400/[0.06]' } : { dot: 'bg-amber-400', border: 'border-amber-400/25', bg: 'bg-amber-400/[0.06]' };
                  return (
                    <div key={p.pair} className={cn('rounded-2xl border p-3', bc.border, bc.bg)}>
                      <div className="flex items-center gap-2 mb-1"><span className={cn('h-2 w-2 rounded-full', bc.dot)} /><p className="font-bold text-white text-sm">{p.pair}</p><span className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400">{p.bias}</span></div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{p.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {([['all', '📋 All Events', news.length], ['high', '🔴 High Impact', news.filter(n => n.impact === 'high').length], ['today', '📅 Today', news.filter(n => isToday(n.date)).length]] as const).map(([f, label, count]) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('rounded-xl border px-3 py-2 text-xs font-bold transition', filter === f ? 'border-amber-400/40 bg-amber-400/12 text-amber-300' : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-white')}>
              {label} <span className="text-slate-500">({count})</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">{isLive ? '⚡ Live — auto-refreshes every 5 min' : '🔄 Cached — start backend for live'}</p>
      </div>

      {/* News list */}
      <div className="grid gap-3">
        {filtered.map(item => {
          const c = impactColor(item.impact); const todayFlag = isToday(item.date);
          return (
            <div key={item.id} className={cn('group relative overflow-hidden rounded-2xl border bg-white/[0.02] p-5 transition hover:border-white/15', c.border, todayFlag && 'ring-1 ring-amber-400/30')}>
              {todayFlag && <div className="absolute right-3 top-3"><Badge tone="warning">TODAY</Badge></div>}
              <div className="flex flex-wrap items-start gap-4">
                <div className="shrink-0 w-16 text-center">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{format(new Date(item.date), 'MMM d')}</p>
                  <p className="text-2xl font-extrabold text-white">{format(new Date(item.date), 'HH:mm')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={cn('h-2 w-2 rounded-full', c.dot)} />
                    <span className={cn('text-[10px] font-black uppercase tracking-widest', c.text)}>{item.impact} impact</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-xs text-slate-300 font-bold">{item.currency}</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-[11px] text-slate-500">{item.source}</span>
                  </div>
                  <h4 className="text-lg font-extrabold text-white leading-tight">{item.title}</h4>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <div className="rounded-lg border border-white/8 bg-black/30 px-2.5 py-1.5"><span className="text-slate-500">Forecast:</span> <span className="text-cyan-300 font-bold">{item.forecast}</span></div>
                    <div className="rounded-lg border border-white/8 bg-black/30 px-2.5 py-1.5"><span className="text-slate-500">Previous:</span> <span className="text-slate-300 font-bold">{item.previous}</span></div>
                    {item.actual && <div className="rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-2.5 py-1.5"><span className="text-amber-300/70">Actual:</span> <span className="text-amber-300 font-bold">{item.actual}</span></div>}
                  </div>
                  {item.affectedPairs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-500 mr-1">Affected:</span>
                      {item.affectedPairs.map(p => (<span key={p} className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-2 py-0.5 text-[10px] font-bold text-cyan-300">{p}</span>))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!filtered.length && !loading && (<div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><Calendar className="mx-auto h-12 w-12 text-amber-300/30 mb-3" /><p className="text-slate-400">No events match this filter.</p></div>)}
        {loading && (<div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><RefreshCw className="mx-auto h-12 w-12 text-amber-300/30 mb-3 animate-spin" /><p className="text-slate-400">Loading news…</p></div>)}
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <p className="text-sm text-cyan-300 font-bold mb-1">📡 About this data</p>
            {isLive ? (
              <p>Live data powered by your backend server. Events fetched from Finnhub and ForexFactory. Updates every 5 minutes.</p>
            ) : (
              <p>Showing offline/seed data. To get <strong>live news</strong>:<br />
              1. Get a free Finnhub API key at <span className="text-cyan-300">https://finnhub.io/register</span><br />
              2. Add it to <code className="text-amber-300">server/.env</code> as <code className="text-amber-300">FINNHUB_API_KEY=your_key</code><br />
              3. Start the backend: <code className="text-amber-300">cd server && npm run dev</code><br />
              Even without Finnhub, the backend provides ForexFactory calendar data for free.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
