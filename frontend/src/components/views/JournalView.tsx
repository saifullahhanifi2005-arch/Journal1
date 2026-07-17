import { useMemo, useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { PAIRS } from '../../data/sampleData';
import type { JournalStore } from '../../hooks/useJournalStore';
import type { Trade, TradeDirection, TradeResult, SessionType } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { WaterButton } from '../ui/WaterButton';
import { TradeTable } from '../trades/TradeTable';
import { Modal } from '../ui/Modal';
import { TradeForm } from '../trades/TradeForm';
import { TradeDetail } from '../trades/TradeDetail';

interface Props {
  store: JournalStore;
  search: string;
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  editing: Trade | null;
  setEditing: (t: Trade | null) => void;
}

export function JournalView({
  store,
  search,
  formOpen,
  setFormOpen,
  editing,
  setEditing,
}: Props) {
  const { trades, strategies, settings, addTrade, updateTrade, deleteTrade } = store;
  const [pair, setPair] = useState('all');
  const [direction, setDirection] = useState<'all' | TradeDirection>('all');
  const [result, setResult] = useState<'all' | TradeResult>('all');
  const [session, setSession] = useState<'all' | SessionType>('all');
  const [strategy, setStrategy] = useState('all');
  const [viewing, setViewing] = useState<Trade | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trades
      .filter((t) => {
        if (pair !== 'all' && t.pair !== pair) return false;
        if (direction !== 'all' && t.direction !== direction) return false;
        if (result !== 'all' && t.result !== result) return false;
        if (session !== 'all' && t.session !== session) return false;
        if (strategy !== 'all' && t.strategy !== strategy) return false;
        if (!q) return true;
        const hay = [t.pair, t.strategy, t.setup, t.notes, t.lessons, t.tags.join(' '), t.ticket || '']
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
  }, [trades, search, pair, direction, result, session, strategy]);

  const resetFilters = () => {
    setPair('all');
    setDirection('all');
    setResult('all');
    setSession('all');
    setStrategy('all');
  };

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-300" />
            <h3 className="font-semibold text-white">Smart Filters</h3>
          </div>
          <WaterButton variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </WaterButton>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select className="glass-input" value={pair} onChange={(e) => setPair(e.target.value)}>
            <option value="all">All pairs</option>
            {PAIRS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className="glass-input"
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'all' | TradeDirection)}
          >
            <option value="all">All directions</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <select
            className="glass-input"
            value={result}
            onChange={(e) => setResult(e.target.value as 'all' | TradeResult)}
          >
            <option value="all">All results</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="breakeven">Breakeven</option>
          </select>
          <select
            className="glass-input"
            value={session}
            onChange={(e) => setSession(e.target.value as 'all' | SessionType)}
          >
            <option value="all">All sessions</option>
            <option value="asian">Asian</option>
            <option value="london">London</option>
            <option value="newyork">New York</option>
            <option value="overlap">Overlap</option>
          </select>
          <select className="glass-input" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="all">All strategies</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="text-cyan-300">{filtered.length}</span> of {trades.length} trades
        </p>
      </GlassCard>

      <TradeTable
        trades={filtered}
        currency={settings.accountCurrency}
        onView={setViewing}
        onEdit={(t) => {
          setEditing(t);
          setFormOpen(true);
        }}
        onDelete={(id) => {
          if (confirm('Delete this trade permanently?')) deleteTrade(id);
        }}
      />

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Trade' : 'Log New Trade'}
        subtitle="Capture execution quality, psychology and outcome"
        wide
      >
        <TradeForm
          initial={editing}
          strategies={strategies}
          defaultLot={settings.defaultLotSize}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={(trade) => {
            if (editing) updateTrade(editing.id, trade);
            else addTrade(trade);
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Trade Review"
        subtitle="Full post-trade breakdown"
        wide
      >
        {viewing && <TradeDetail trade={viewing} currency={settings.accountCurrency} />}
      </Modal>
    </div>
  );
}
