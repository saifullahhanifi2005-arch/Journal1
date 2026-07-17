import { useMemo, useState } from 'react';
import { Download, Send, FileText, Calendar, Zap, CheckCircle2, AlertCircle, Server } from 'lucide-react';
import type { AuthHook } from '../../hooks/useAuth';
import type { JournalStore } from '../../hooks/useJournalStore';
import { buildReportHTML, downloadReportHTML, emailReportLink, generateSummary, type ReportPeriod } from '../../utils/reportGenerator';
import { formatMoney, formatPercent } from '../../utils/stats';
import { emailReportViaBackend, checkBackendEmailStatus } from '../../utils/newsStore';
import { GlassCard } from '../ui/GlassCard';
import { WaterButton } from '../ui/WaterButton';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';

interface Props { store: JournalStore; auth: AuthHook; }

export function ReportsView({ store, auth }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [previewOpen, setPreview] = useState(false);
  const [emailPrompt, setEmailPrompt] = useState(false);
  const [autoEmailOpen, setAutoEmailOpen] = useState(false);
  const [autoEmailTo, setAutoEmailTo] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);

  useMemo(() => { checkBackendEmailStatus().then(r => setEmailConfigured(r.configured)); }, []);

  const makeUser = () => {
    if (!auth.session) return null;
    return { id: auth.session.userId, username: auth.session.username, displayName: auth.session.displayName, email: auth.session.email, avatarUrl: auth.session.avatarUrl, accentColor: auth.session.accentColor, role: auth.session.role, status: 'active' as const, passwordHash: '', saltHex: '', createdAt: new Date().toISOString(), createdBy: 'system', lastLoginAt: null, tradeCount: store.trades.length, notes: '' };
  };

  const summary = useMemo(() => {
    const u = makeUser(); if (!u) return null;
    return generateSummary({ user: u as any, trades: store.trades, period, brandColor: auth.session?.accentColor });
  }, [auth.session, store.trades, period]);

  const handleDownload = () => { const u = makeUser(); if (!u) return; downloadReportHTML({ user: u as any, trades: store.trades, period, brandColor: auth.session?.accentColor }); };
  const handleEmailClient = () => { const u = makeUser(); if (!u) return; if (!auth.session?.email) { setEmailPrompt(true); return; } window.location.href = emailReportLink({ user: u as any, trades: store.trades, period, brandColor: auth.session?.accentColor }); };

  const handleAutoEmail = async () => {
    const u = makeUser(); if (!u || !autoEmailTo.trim()) return;
    setSending(true); setSendResult(null);
    const html = buildReportHTML({ user: u as any, trades: store.trades, period, brandColor: auth.session?.accentColor });
    const result = await emailReportViaBackend(autoEmailTo, html, `${period === 'weekly' ? 'Weekly' : 'Monthly'} Trading Report — ${u.displayName}`);
    setSendResult(result); setSending(false);
  };

  const htmlPreview = auth.session ? buildReportHTML({ user: makeUser() as any, trades: store.trades, period, brandColor: auth.session?.accentColor }) : '';
  if (!summary || !auth.session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/20">
        <img src="/images/trading-anime-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a14] via-[#050a14]/90 to-[#050a14]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a14]/80 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2"><FileText className="h-5 w-5 text-amber-300" /><span className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300/70">Auto-Generated Reports</span></div>
          <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 0 30px rgba(251,191,36,0.3)' }}>Performance Reports</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">Download HTML reports, send via email client, or auto-send directly through Gmail.</p>
        </div>
      </div>

      {/* Period selector */}
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {(['weekly', 'monthly'] as ReportPeriod[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition', period === p ? 'border-amber-400/40 bg-amber-400/12 text-amber-300' : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-white')}>
                <Calendar className="h-4 w-4" />{p === 'weekly' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <WaterButton variant="secondary" onClick={() => setPreview(true)}><FileText className="h-4 w-4" /> Preview</WaterButton>
            <WaterButton variant="secondary" onClick={handleDownload}><Download className="h-4 w-4" /> Download HTML</WaterButton>
            <WaterButton variant="secondary" onClick={handleEmailClient}><Send className="h-4 w-4" /> Email (Client)</WaterButton>
            <WaterButton variant="gold" onClick={() => setAutoEmailOpen(true)}><Zap className="h-4 w-4" /> Auto-Send Gmail</WaterButton>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">📅 Period: {summary.period}</p>
      </GlassCard>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total PnL" value={formatMoney(summary.totalPnl)} positive={summary.isWin} />
        <Stat label="Win Rate" value={formatPercent(summary.winRate)} positive={summary.winRate >= 50} />
        <Stat label="Profit Factor" value={summary.profitFactor.toFixed(2)} positive={summary.profitFactor >= 1} />
        <Stat label="Trades" value={String(summary.trades)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {summary.pairs.length > 0 && (<GlassCard><h4 className="mb-3 font-bold text-white">Pairs Performance</h4><div className="space-y-2">{summary.pairs.slice(0, 5).map(p => (<div key={p.pair} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"><div><p className="font-bold text-white text-sm">{p.pair}</p><p className="text-[11px] text-slate-500">{p.count} trades</p></div><p className={cn('font-bold text-sm', p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{formatMoney(p.pnl)}</p></div>))}</div></GlassCard>)}
        {summary.sessions.length > 0 && (<GlassCard><h4 className="mb-3 font-bold text-white">Session Performance</h4><div className="space-y-2">{summary.sessions.map(s => (<div key={s.session} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"><div><p className="font-bold text-white text-sm capitalize">{s.session}</p><p className="text-[11px] text-slate-500">{s.count} trades</p></div><p className={cn('font-bold text-sm', s.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{formatMoney(s.pnl)}</p></div>))}</div></GlassCard>)}
      </div>

      {/* Gmail setup instructions */}
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
        <div className="flex items-start gap-3">
          <Server className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <h4 className="font-bold text-white">⚙️ Gmail Auto-Send Setup</h4>
            <div className="mt-2 text-sm text-slate-300 space-y-2">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Go to <a href="https://myaccount.google.com/security" target="_blank" className="text-cyan-300 underline">Google Account Security</a></li>
                <li>Enable <strong>2-Step Verification</strong></li>
                <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-cyan-300 underline">App Passwords</a></li>
                <li>Create a new App Password named "BJournal"</li>
                <li>Edit <code className="text-amber-300">server/.env</code> with <code className="text-amber-300">GMAIL_USER</code> and <code className="text-amber-300">GMAIL_APP_PASSWORD</code></li>
                <li>Start backend: <code className="text-amber-300">cd server && npm run dev</code></li>
              </ol>
              {emailConfigured === true && <p className="text-emerald-300 font-bold mt-2">✅ Gmail is configured!</p>}
              {emailConfigured === false && <p className="text-amber-300 font-bold mt-2">⚠️ Gmail not configured yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <Modal open={previewOpen} onClose={() => setPreview(false)} title="Email Preview" subtitle="Exactly what will be sent" wide>
        <div className="rounded-2xl border border-white/10 bg-white overflow-hidden"><iframe srcDoc={htmlPreview} className="w-full h-[600px] border-0" title="Report preview" /></div>
      </Modal>

      {/* No email prompt */}
      <Modal open={emailPrompt} onClose={() => setEmailPrompt(false)} title="Email Required" subtitle="Add an email to send reports">
        <div className="space-y-4 text-sm text-slate-300"><p>To email reports, add an email address to your profile first.</p><p className="text-xs text-slate-500">Go to Settings → My Profile → Edit → add your email.</p></div>
        <div className="mt-4 flex justify-end"><WaterButton variant="gold" onClick={() => setEmailPrompt(false)}>Got it</WaterButton></div>
      </Modal>

      {/* Auto-Send Gmail Modal */}
      <Modal open={autoEmailOpen} onClose={() => { setAutoEmailOpen(false); setSendResult(null); }} title="⚡ Auto-Send Report via Gmail" subtitle="Sends directly — no email client needed">
        <div className="space-y-4">
          <div><label className="block text-xs uppercase tracking-[0.14em] text-slate-400 mb-1.5">Send to (comma-separated)</label><input className="glass-input w-full" type="email" placeholder="trader1@gmail.com, trader2@gmail.com" value={autoEmailTo} onChange={e => setAutoEmailTo(e.target.value)} /></div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-slate-400"><p className="font-bold text-slate-300 mb-1">Report will include:</p><ul className="list-disc pl-4 space-y-0.5"><li>Period: {period === 'weekly' ? 'This Week' : 'This Month'}</li><li>Total PnL, Win Rate, Profit Factor</li><li>Equity curve chart</li><li>Top pairs & session breakdown</li></ul></div>
          {sendResult && (<div className={cn('flex items-start gap-2 rounded-xl border p-3', sendResult.success ? 'border-emerald-400/30 bg-emerald-400/[0.08]' : 'border-rose-400/30 bg-rose-400/[0.08]')}>
            {sendResult.success ? <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-300 shrink-0" />}
            <p className={cn('text-sm', sendResult.success ? 'text-emerald-300' : 'text-rose-300')}>{sendResult.message}</p>
          </div>)}
          <div className="flex justify-end gap-2">
            <WaterButton variant="secondary" onClick={() => { setAutoEmailOpen(false); setSendResult(null); }}>Cancel</WaterButton>
            <WaterButton variant="gold" onClick={handleAutoEmail} disabled={sending || !autoEmailTo.trim()}><Send className="h-4 w-4" />{sending ? 'Sending…' : 'Send Now'}</WaterButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p><p className={cn('mt-1 text-2xl font-bold', positive === undefined ? 'text-white' : positive ? 'text-emerald-300' : 'text-rose-300')}>{value}</p></div>);
}
