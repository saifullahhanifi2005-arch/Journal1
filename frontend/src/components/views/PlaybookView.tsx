import { useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import type { JournalStore } from '../../hooks/useJournalStore';
import type { Strategy } from '../../types';
import { pnlByStrategy, uid } from '../../utils/stats';
import { GlassCard } from '../ui/GlassCard';
import { WaterButton } from '../ui/WaterButton';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatMoney, formatPercent } from '../../utils/stats';

interface Props {
  store: JournalStore;
}

const COLORS = ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399', '#fb7185', '#60a5fa'];

export function PlaybookView({ store }: Props) {
  const { strategies, trades, settings, addStrategy, deleteStrategy } = store;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [timeframes, setTimeframes] = useState('15M, 1H');
  const [pairs, setPairs] = useState('EURUSD, GBPUSD');

  const stats = pnlByStrategy(trades);

  const handleCreate = () => {
    if (!name.trim()) return;
    const strategy: Strategy = {
      id: uid('strat'),
      name: name.trim(),
      description: description.trim(),
      rules: rulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      timeframes: timeframes.split(',').map((t) => t.trim()).filter(Boolean),
      pairs: pairs.split(',').map((p) => p.trim()).filter(Boolean),
      color: COLORS[strategies.length % COLORS.length],
    };
    addStrategy(strategy);
    setOpen(false);
    setName('');
    setDescription('');
    setRulesText('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Your Edge Playbook</h3>
          <p className="text-sm text-slate-400">Codify setups so discipline becomes automatic</p>
        </div>
        <WaterButton variant="primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Strategy
        </WaterButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {strategies.map((s) => {
          const sStat = stats.find((x) => x.strategy === s.name);
          return (
            <GlassCard key={s.id} hover className="relative">
              <div className="absolute right-4 top-4">
                <WaterButton
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete strategy "${s.name}"?`)) deleteStrategy(s.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-rose-300" />
                </WaterButton>
              </div>
              <div className="flex items-start gap-3 pr-10">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
                  style={{ background: `${s.color}22`, boxShadow: `0 0 24px ${s.color}33` }}
                >
                  <BookOpen className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{s.name}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.description}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {s.timeframes.map((t) => (
                  <Badge key={t} tone="info">
                    {t}
                  </Badge>
                ))}
                {s.pairs.map((p) => (
                  <Badge key={p} tone="gold">
                    {p}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <MiniStat
                  label="Trades"
                  value={String(sStat?.count ?? 0)}
                />
                <MiniStat
                  label="Win Rate"
                  value={sStat ? formatPercent(sStat.winRate) : '—'}
                />
                <MiniStat
                  label="PnL"
                  value={sStat ? formatMoney(sStat.pnl, settings.accountCurrency) : '—'}
                  positive={(sStat?.pnl ?? 0) >= 0}
                />
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Rules</p>
                <ol className="mt-2 space-y-2">
                  {s.rules.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                        style={{ background: `${s.color}22`, color: s.color }}
                      >
                        {i + 1}
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {!strategies.length && (
        <GlassCard className="py-16 text-center">
          <img src="/images/empty-state.jpg" alt="" className="mx-auto h-36 w-56 rounded-2xl object-cover opacity-80" />
          <p className="mt-4 text-lg font-semibold text-white">No strategies yet</p>
          <p className="text-sm text-slate-400">Build your first playbook rule set</p>
        </GlassCard>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Strategy"
        subtitle="Define rules you can actually follow"
        footer={
          <>
            <WaterButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </WaterButton>
            <WaterButton variant="primary" onClick={handleCreate}>
              Save Strategy
            </WaterButton>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Name</span>
            <input className="glass-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Description</span>
            <textarea
              className="glass-input min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Rules (one per line)</span>
            <textarea
              className="glass-input min-h-[120px]"
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder={'Wait for confirmation\nMinimum RR 1:2\nNo news trading'}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Timeframes</span>
              <input className="glass-input" value={timeframes} onChange={(e) => setTimeframes(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Pairs</span>
              <input className="glass-input" value={pairs} onChange={(e) => setPairs(e.target.value)} />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MiniStat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          positive === undefined ? 'text-white' : positive ? 'text-emerald-300' : 'text-rose-300'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
