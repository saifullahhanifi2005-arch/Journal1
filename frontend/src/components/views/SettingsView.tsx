import { useRef, useState } from 'react';
import { Crown, Database, Download, FileSpreadsheet, KeyRound, LogOut, Mail, Shield, Trash2, Upload } from 'lucide-react';
import { emailExcelViaBackend } from '../../utils/newsStore';
import type { JournalStore } from '../../hooks/useJournalStore';
import type { AuthHook } from '../../hooks/useAuth';
import { GlassCard } from '../ui/GlassCard';
import { WaterButton } from '../ui/WaterButton';
import { MyProfileSection } from '../profile/MyProfileSection';
import { AdminPanel } from '../auth/AdminPanel';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { MT5ImportModal } from '../trades/MT5ImportModal';
import { Modal } from '../ui/Modal';

interface Props {
  store: JournalStore;
  auth: AuthHook;
}

export function SettingsView({ store, auth }: Props) {
  const { settings, updateSettings, exportJson, exportExcel, importJson, addTrades, clearAllData, trades, serializeVault } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [adminOpen, setAdminOpen]       = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [mt5Open, setMt5Open]           = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [emailExcelOpen, setEmailExcelOpen] = useState(false);
  const [emailExcelTo, setEmailExcelTo]     = useState('');
  const [emailSending, setEmailSending]     = useState(false);
  const [emailResult, setEmailResult]       = useState<{ success: boolean; message: string } | null>(null);

  const handleExcel = async (period: 'all' | 'week' | 'month' | 'year' = 'all') => {
    if (!auth.session) return;
    setExporting(true);
    try {
      await exportExcel(
        { username: auth.session.username, displayName: auth.session.displayName, email: auth.session.email },
        period
      );
    } catch (e) {
      console.error(e);
      alert('Export failed — please try again.');
    } finally { setExporting(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Account Security Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-[#060c17]/90">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_60%)]" />
        <div className="relative p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 shadow-xl"
                style={{ borderColor: (auth.session?.accentColor || '#fbbf24') + '60',
                         boxShadow: `0 0 28px ${auth.session?.accentColor || '#fbbf24'}30` }}>
                {auth.session?.avatarUrl
                  ? <img src={auth.session.avatarUrl} alt="" className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                  : <div className="flex h-full w-full items-center justify-center text-2xl font-black"
                      style={{ background: (auth.session?.accentColor||'#fbbf24')+'18',
                               color: auth.session?.accentColor||'#fbbf24' }}>
                      {auth.session?.displayName?.charAt(0) || '?'}
                    </div>}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-white">{auth.session?.displayName}</h3>
                  {auth.isAdmin && (
                    <span className="flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
                      <Crown className="h-3 w-3" />
                      {auth.isSuperAdmin ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">@{auth.session?.username}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{auth.session?.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <WaterButton variant="secondary" size="sm" onClick={() => setChangePwOpen(true)}>
                <KeyRound className="h-3.5 w-3.5" /> Change Password
              </WaterButton>
              {auth.isAdmin && (
                <WaterButton variant="gold" size="sm" onClick={() => setAdminOpen(true)}>
                  <Shield className="h-3.5 w-3.5" /> Admin Panel
                </WaterButton>
              )}
              <WaterButton variant="danger" size="sm" onClick={auth.logout}>
                <LogOut className="h-3.5 w-3.5" /> Logout
              </WaterButton>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Encryption</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">AES-256</p>
            </div>
            <div className="text-center border-x border-white/8">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Key Derivation</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">PBKDF2·310k</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Zero-Knowledge</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">✓ Only You</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trader Profile ── */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-white">Trader Profile</h3>
        <p className="mt-1 text-sm text-slate-400">Identity used across your local vault</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Hunter Name</span>
            <input className="glass-input" value={settings.traderName}
              onChange={(e) => updateSettings({ traderName: e.target.value })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Broker</span>
            <input className="glass-input" value={settings.broker}
              onChange={(e) => updateSettings({ broker: e.target.value })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Account Currency</span>
            <select className="glass-input" value={settings.accountCurrency}
              onChange={(e) => updateSettings({ accountCurrency: e.target.value })}>
              {['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Starting Balance</span>
            <input className="glass-input" type="number" value={settings.accountBalance}
              onChange={(e) => updateSettings({ accountBalance: Number(e.target.value) || 0 })} />
          </label>
        </div>
      </GlassCard>

      {/* ── Risk Model ── */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-white">Risk Model</h3>
        <p className="mt-1 text-sm text-slate-400">Defaults applied when logging new hunts</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Risk / Hunt %</span>
            <input className="glass-input" type="number" step="0.1" value={settings.riskPerTrade}
              onChange={(e) => updateSettings({ riskPerTrade: Number(e.target.value) || 0 })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Default Lot Size</span>
            <input className="glass-input" type="number" step="0.01" value={settings.defaultLotSize}
              onChange={(e) => updateSettings({ defaultLotSize: Number(e.target.value) || 0 })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Accent Theme</span>
            <select className="glass-input" value={settings.themeAccent}
              onChange={(e) => updateSettings({ themeAccent: e.target.value as typeof settings.themeAccent })}>
              <option value="cyan">Cyan Glass</option>
              <option value="gold">Gold Luxury</option>
              <option value="emerald">Emerald Edge</option>
              <option value="violet">Violet Night</option>
            </select>
          </label>
        </div>
      </GlassCard>

      {/* ── Data Vault ── */}
      <GlassCard>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10">
            <Database className="h-5 w-5 text-amber-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Data Vault</h3>
            <p className="mt-1 text-sm text-slate-400">
              Your vault is AES-256 encrypted with your password — only you can read it.
              Currently holding <span className="font-bold text-amber-300">{trades.length}</span> trades.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <WaterButton variant="gold" onClick={() => setMt5Open(true)}>
                <FileSpreadsheet className="h-4 w-4" /> Import MT5
              </WaterButton>
              <WaterButton variant="gold" onClick={() => handleExcel('all')} disabled={exporting}>
                <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export Excel'}
              </WaterButton>
              <WaterButton variant="secondary" onClick={() => setEmailExcelOpen(true)}>
                <Mail className="h-4 w-4" /> Email Excel
              </WaterButton>
              <WaterButton variant="secondary" onClick={exportJson}>
                <Download className="h-4 w-4" /> JSON
              </WaterButton>
              <WaterButton variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Import JSON
              </WaterButton>
              <WaterButton variant="danger" onClick={() => {
                if (confirm('Clear ALL your journal data? This cannot be undone.')) clearAllData();
              }}>
                <Trash2 className="h-4 w-4" /> Clear All
              </WaterButton>
              <input ref={fileRef} type="file" accept="application/json" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  try { await importJson(file); alert('Import successful'); }
                  catch { alert('Import failed — invalid file'); }
                  e.target.value = '';
                }} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Team & About ── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/20">
        <img src="/images/trading-anime-bg.jpg" alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060c17]/96 via-[#08111e]/94 to-[#060c17]/96" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.10),transparent_50%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/20 to-transparent" />
        <div className="relative px-6 py-10 sm:px-8">
          <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="relative shrink-0">
              <div className="absolute -inset-3 animate-pulse-glow rounded-3xl bg-amber-400/20 blur-2xl" />
              <img src="/images/app-icon.png" alt="The Fools Hunting Room"
                className="relative h-20 w-20 rounded-3xl object-cover shadow-2xl ring-2 ring-amber-300/60" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 0 24px rgba(251,191,36,0.3)' }}>
                The Fools
              </h2>
              <h2 className="text-3xl font-extrabold" style={{ color: '#fbbf24', textShadow: '0 0 24px rgba(251,191,36,0.55)' }}>
                Hunting Room
              </h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300">v1.0</span>
                <span className="text-xs text-slate-500">Hunt · Master · Compound</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">React 19 · TypeScript · Vite 7 · Tailwind CSS · AES-256 Encrypted</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-300/25 to-transparent mb-8" />
          <MyProfileSection auth={auth} />
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-amber-300/20 to-transparent" />
          <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()}{' '}
              <span className="font-bold text-amber-300/70">The Fools Hunting Room</span>
              {' '}· All rights reserved
            </p>
            <p className="text-[11px] font-semibold text-amber-300/60">
              Built with precision by Saifullah Hanifi
            </p>
          </div>
        </div>
      </div>

      {/* ── Admin Panel Modal ── */}
      <Modal open={adminOpen} onClose={() => setAdminOpen(false)}
        title="Admin Panel" subtitle="Create and manage hunter accounts" wide>
        <AdminPanel auth={auth} />
      </Modal>

      {/* ── Change Password Modal ── */}
      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        auth={auth}
        vaultJson={serializeVault()}
      />

      {/* ── Email Excel Modal ── */}
      <Modal open={emailExcelOpen} onClose={() => { setEmailExcelOpen(false); setEmailResult(null); }}
        title="📧 Email Excel Report" subtitle="Auto-send your trade data as an Excel attachment">
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.14em] text-slate-400 mb-1.5">Recipient email(s)</label>
            <input className="glass-input w-full" type="email" placeholder="trader1@gmail.com, trader2@gmail.com"
              value={emailExcelTo} onChange={e => setEmailExcelTo(e.target.value)} />
          </div>
          {emailResult && (
            <div className={`flex items-start gap-2 rounded-xl border p-3 ${emailResult.success ? 'border-emerald-400/30 bg-emerald-400/[0.08]' : 'border-rose-400/30 bg-rose-400/[0.08]'}`}>
              <p className={`text-sm ${emailResult.success ? 'text-emerald-300' : 'text-rose-300'}`}>{emailResult.message}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <WaterButton variant="secondary" onClick={() => { setEmailExcelOpen(false); setEmailResult(null); }}>Cancel</WaterButton>
            <WaterButton variant="gold" onClick={async () => {
              if (!auth.session || !emailExcelTo.trim()) return;
              setEmailSending(true); setEmailResult(null);
              try {
                const ExcelJS = (await import('exceljs')).default;
                const wb = new ExcelJS.Workbook(); wb.creator = 'The Fools Hunting Room'; wb.created = new Date();
                const ws1 = wb.addWorksheet('Summary');
                ws1.getCell('A1').value = '⚔️ THE FOOLS HUNTING ROOM — TRADE DATA';
                ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFBBF24' } };
                ws1.getCell('A3').value = 'Trader'; ws1.getCell('B3').value = auth.session.displayName;
                ws1.getCell('A4').value = 'Total Trades'; ws1.getCell('B4').value = trades.length;
                const ws2 = wb.addWorksheet('Trade Journal');
                ws2.columns = [
                  { header: 'Pair', key: 'pair', width: 14 }, { header: 'Direction', key: 'direction', width: 12 },
                  { header: 'Result', key: 'result', width: 12 }, { header: 'Entry', key: 'entry', width: 12 },
                  { header: 'Exit', key: 'exit', width: 12 }, { header: 'Lots', key: 'lots', width: 8 },
                  { header: 'PnL', key: 'pnl', width: 12 }, { header: 'Session', key: 'session', width: 12 },
                  { header: 'Strategy', key: 'strategy', width: 16 }, { header: 'Notes', key: 'notes', width: 30 },
                ];
                for (let i = 1; i <= 10; i++) { const cell = ws2.getRow(1).getCell(i); cell.font = { bold: true, color: { argb: 'FF050A14' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } }; }
                trades.forEach(t => { ws2.addRow({ pair: t.pair, direction: t.direction, result: t.result || '—', entry: t.entryPrice, exit: t.exitPrice ?? '—', lots: t.lotSize, pnl: t.pnl ?? '—', session: t.session, strategy: t.strategy, notes: t.notes }); });
                const buf = await wb.xlsx.writeBuffer();
                const base64 = Buffer.from(buf).toString('base64');
                const filename = `FHR-Trades-${auth.session.username}-${new Date().toISOString().slice(0, 10)}.xlsx`;
                const result = await emailExcelViaBackend(emailExcelTo, base64, filename, `Trade Report (Excel) — ${auth.session.displayName}`);
                setEmailResult(result);
              } catch (e: any) { setEmailResult({ success: false, message: e.message || 'Failed' }); }
              finally { setEmailSending(false); }
            }} disabled={emailSending || !emailExcelTo.trim()}>
              <Mail className="h-4 w-4" /> {emailSending ? 'Sending…' : 'Send Excel'}
            </WaterButton>
          </div>
        </div>
      </Modal>

      {/* ── MT5 Import Modal ── */}
      <MT5ImportModal
        open={mt5Open}
        onClose={() => setMt5Open(false)}
        onImport={(importedTrades) => {
          addTrades(importedTrades);
          alert(`✓ Successfully imported ${importedTrades.length} trades from MetaTrader 5!`);
        }}
        currency={settings.accountCurrency}
      />
    </div>
  );
}
