import { useRef, useState } from 'react';
import { AlertTriangle, Check, FileSpreadsheet, X } from 'lucide-react';
import type { Trade } from '../../types';
import { parseMT5CSV, type MT5ParseResult } from '../../utils/mt5Parser';
import { formatMoney } from '../../utils/stats';
import { Modal } from '../ui/Modal';
import { WaterButton } from '../ui/WaterButton';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (trades: Trade[]) => void;
  currency: string;
}

export function MT5ImportModal({ open, onClose, onImport, currency }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<MT5ParseResult | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setFile(null); setResult(null); setError(''); setParsing(false); setImporting(false);
  };

  const handleFile = async (f: File) => {
    setFile(f); setResult(null); setError(''); setParsing(true);
    try {
      const text = await f.text();
      const parsed = parseMT5CSV(text);
      if (parsed.trades.length === 0) {
        setError(parsed.errors.join(' ') || 'No trades found. Check the file format.');
      }
      setResult(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse file.');
    } finally { setParsing(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = () => {
    if (!result || result.trades.length === 0) return;
    setImporting(true);
    setTimeout(() => {
      onImport(result.trades);
      setImporting(false);
      reset();
      onClose();
    }, 300);
  };

  const wins = result?.trades.filter(t => t.result === 'win').length || 0;
  const losses = result?.trades.filter(t => t.result === 'loss').length || 0;
  const totalPnl = result?.trades.reduce((a, t) => a + (t.pnl || 0), 0) || 0;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Import MetaTrader 5 History"
      subtitle="Upload your MT5 CSV or HTML statement file to auto-import all trades"
      wide
    >
      <div className="space-y-6">

        {/* Upload zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-all',
            file
              ? 'border-amber-300/40 bg-amber-300/[0.06]'
              : 'border-white/15 bg-white/[0.03] hover:border-amber-300/30 hover:bg-amber-300/[0.04]'
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 transition group-hover:bg-amber-300/15">
            {parsing
              ? <svg className="h-7 w-7 animate-spin text-amber-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              : <FileSpreadsheet className="h-7 w-7 text-amber-300" />}
          </div>
          {file ? (
            <div className="text-center">
              <p className="font-bold text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-bold text-white">Drop your MT5 file here</p>
              <p className="mt-1 text-sm text-slate-400">or click to browse</p>
              <p className="mt-2 text-xs text-slate-500">
                Supports: .csv, .htm, .html from MetaTrader 5 Trade History, Statement, or Strategy Tester
              </p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".csv,.htm,.html,.txt" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        </div>

        {/* How to export from MT5 */}
        <details className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-white hover:text-amber-300 transition">
            📖 How to export from MetaTrader 5
          </summary>
          <div className="px-4 pb-4 text-sm text-slate-400 space-y-2">
            <p><strong className="text-white">Method 1 — Trade History tab:</strong></p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Open MT5 → bottom panel → <strong className="text-white">History</strong> tab (or press Ctrl+T)</li>
              <li>Right-click in the history tab → <strong className="text-white">Report → Save as Report (HTML)</strong></li>
              <li>Or select all trades → right-click → <strong className="text-white">Copy</strong> → paste into a .csv file</li>
            </ol>
            <p className="mt-3"><strong className="text-white">Method 2 — Detailed Statement:</strong></p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>MT5 → <strong className="text-white">Account History</strong> tab</li>
              <li>Right-click → <strong className="text-white">Save as Report</strong></li>
              <li>Choose HTML or CSV format</li>
            </ol>
            <p className="mt-3"><strong className="text-white">Method 3 — Strategy Tester:</strong></p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Strategy Tester → <strong className="text-white">Backtest</strong> results tab</li>
              <li>Right-click → <strong className="text-white">Export to CSV</strong></li>
            </ol>
            <p className="mt-2 text-amber-300 text-xs font-semibold">
              The importer auto-detects all MT5 column layouts. No need to edit the file.
            </p>
          </div>
        </details>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <p className="font-bold text-rose-300 text-sm">Parse Error</p>
              <p className="mt-1 text-xs text-slate-400">{error}</p>
            </div>
          </div>
        )}

        {/* Preview stats */}
        {result && result.trades.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Trades Found" value={String(result.trades.length)} />
              <Stat label="Wins" value={String(wins)} color="#34d399" />
              <Stat label="Losses" value={String(losses)} color="#f87171" />
              <Stat label="Total PnL" value={formatMoney(totalPnl, currency)}
                color={totalPnl >= 0 ? '#34d399' : '#f87171'} />
            </div>

            {result.duplicatesSkipped > 0 && (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-2 text-xs text-amber-300">
                {result.duplicatesSkipped} duplicate {result.duplicatesSkipped === 1 ? 'trade' : 'trades'} skipped
              </div>
            )}

            {/* Preview table */}
            <div className="max-h-[260px] overflow-y-auto custom-scroll rounded-2xl border border-white/10">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-[#0b1220] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Pair</th>
                    <th className="px-3 py-2 text-left font-medium">Side</th>
                    <th className="px-3 py-2 text-right font-medium">Lots</th>
                    <th className="px-3 py-2 text-right font-medium">Entry</th>
                    <th className="px-3 py-2 text-right font-medium">Exit</th>
                    <th className="px-3 py-2 text-right font-medium">PnL</th>
                    <th className="px-3 py-2 text-center font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.slice(0, 50).map((t, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-3 py-2 font-semibold text-white">{t.pair}</td>
                      <td className="px-3 py-2">
                        <Badge tone={t.direction === 'long' ? 'success' : 'danger'}>{t.direction}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-300">{t.lotSize}</td>
                      <td className="px-3 py-2 text-right text-slate-300">{t.entryPrice}</td>
                      <td className="px-3 py-2 text-right text-slate-300">{t.exitPrice || '—'}</td>
                      <td className={cn('px-3 py-2 text-right font-semibold',
                        (t.pnl ?? 0) > 0 ? 'text-emerald-300' : (t.pnl ?? 0) < 0 ? 'text-rose-300' : 'text-slate-300')}>
                        {t.pnl != null ? formatMoney(t.pnl, currency) : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {t.result === 'win' && <Badge tone="success">Win</Badge>}
                        {t.result === 'loss' && <Badge tone="danger">Loss</Badge>}
                        {t.result === 'breakeven' && <Badge tone="warning">BE</Badge>}
                        {t.status === 'open' && <Badge tone="info">Open</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.trades.length > 50 && (
                <p className="px-3 py-2 text-center text-[11px] text-slate-500">
                  Showing 50 of {result.trades.length} trades
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
          <WaterButton variant="secondary" onClick={() => { reset(); onClose(); }}>
            <X className="h-4 w-4" /> Cancel
          </WaterButton>
          {result && result.trades.length > 0 && (
            <WaterButton variant="gold" onClick={handleImport} disabled={importing}>
              {importing
                ? 'Importing…'
                : <><Check className="h-4 w-4" /> Import {result.trades.length} Trades</>}
            </WaterButton>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold" style={{ color: color || '#fff' }}>{value}</p>
    </div>
  );
}
