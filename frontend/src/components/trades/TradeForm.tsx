import { useEffect, useMemo, useState } from 'react';
import { EMOTION_OPTIONS, PAIRS, TIMEFRAMES } from '../../data/sampleData';
import type { EmotionTag, SessionType, Strategy, Trade, TradeDirection, TradeStatus } from '../../types';
import { calcPips, calcRR, uid } from '../../utils/stats';
import { WaterButton } from '../ui/WaterButton';

interface TradeFormProps {
  initial?: Trade | null;
  strategies: Strategy[];
  defaultLot: number;
  onSubmit: (trade: Trade) => void;
  onCancel: () => void;
}

const emptyForm = {
  pair: 'EURUSD',
  direction: 'long' as TradeDirection,
  status: 'closed' as TradeStatus,
  entryPrice: '',
  exitPrice: '',
  stopLoss: '',
  takeProfit: '',
  lotSize: '',
  riskAmount: '250',
  commission: '0',
  swap: '0',
  openTime: new Date().toISOString().slice(0, 16),
  closeTime: new Date().toISOString().slice(0, 16),
  session: 'london' as SessionType,
  strategy: '',
  setup: '',
  timeframe: '15M',
  emotions: [] as EmotionTag[],
  tags: '',
  notes: '',
  lessons: '',
  rating: 4,
  followedPlan: true,
  ticket: '',
  pnl: '',
};

export function TradeForm({ initial, strategies, defaultLot, onSubmit, onCancel }: TradeFormProps) {
  const [form, setForm] = useState({
    ...emptyForm,
    lotSize: String(defaultLot),
    strategy: strategies[0]?.name || '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        pair: initial.pair,
        direction: initial.direction,
        status: initial.status,
        entryPrice: String(initial.entryPrice),
        exitPrice: initial.exitPrice != null ? String(initial.exitPrice) : '',
        stopLoss: String(initial.stopLoss),
        takeProfit: String(initial.takeProfit),
        lotSize: String(initial.lotSize),
        riskAmount: String(initial.riskAmount),
        commission: String(initial.commission ?? 0),
        swap: String(initial.swap ?? 0),
        openTime: initial.openTime.slice(0, 16),
        closeTime: (initial.closeTime || new Date().toISOString()).slice(0, 16),
        session: initial.session,
        strategy: initial.strategy,
        setup: initial.setup,
        timeframe: initial.timeframe,
        emotions: initial.emotions,
        tags: initial.tags.join(', '),
        notes: initial.notes,
        lessons: initial.lessons,
        rating: initial.rating,
        followedPlan: initial.followedPlan,
        ticket: initial.ticket || '',
        pnl: initial.pnl != null ? String(initial.pnl) : '',
      });
    }
  }, [initial]);

  const derived = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const stop = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);
    const rr =
      !Number.isNaN(entry) && !Number.isNaN(stop) && !Number.isNaN(tp)
        ? calcRR(entry, stop, tp, form.direction)
        : 0;
    const pips =
      !Number.isNaN(entry) && !Number.isNaN(exit) && form.status === 'closed'
        ? calcPips(form.pair, entry, exit, form.direction)
        : undefined;
    return { rr, pips };
  }, [form]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEmotion = (e: EmotionTag) => {
    setForm((prev) => ({
      ...prev,
      emotions: prev.emotions.includes(e)
        ? prev.emotions.filter((x) => x !== e)
        : [...prev.emotions, e],
    }));
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const entry = parseFloat(form.entryPrice);
    const exit = form.exitPrice ? parseFloat(form.exitPrice) : undefined;
    const stop = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);
    const lot = parseFloat(form.lotSize);
    const risk = parseFloat(form.riskAmount);
    if ([entry, stop, tp, lot, risk].some((n) => Number.isNaN(n))) return;

    let result: Trade['result'];
    let pnl: number | undefined = form.pnl ? parseFloat(form.pnl) : undefined;
    let pips = derived.pips;

    if (form.status === 'closed') {
      if (pnl == null && exit != null && pips != null) {
        // rough default estimation if user left pnl blank
        pnl = pips * lot * (form.pair.includes('XAU') ? 1 : 1);
      }
      if (pnl != null) {
        if (pnl > 5) result = 'win';
        else if (pnl < -5) result = 'loss';
        else result = 'breakeven';
      }
    }

    const trade: Trade = {
      id: initial?.id || uid('trade'),
      ticket: form.ticket || undefined,
      pair: form.pair,
      direction: form.direction,
      status: form.status,
      result,
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: stop,
      takeProfit: tp,
      lotSize: lot,
      riskReward: derived.rr,
      riskAmount: risk,
      pnl,
      pips,
      commission: parseFloat(form.commission) || 0,
      swap: parseFloat(form.swap) || 0,
      openTime: new Date(form.openTime).toISOString(),
      closeTime: form.status === 'closed' ? new Date(form.closeTime).toISOString() : undefined,
      session: form.session,
      strategy: form.strategy,
      setup: form.setup,
      timeframe: form.timeframe,
      emotions: form.emotions,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes: form.notes,
      lessons: form.lessons,
      rating: form.rating,
      followedPlan: form.followedPlan,
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(trade);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Instrument">
          <select className="glass-input" value={form.pair} onChange={(e) => set('pair', e.target.value)}>
            {PAIRS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Direction">
          <div className="grid grid-cols-2 gap-2">
            {(['long', 'short'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set('direction', d)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                  form.direction === d
                    ? d === 'long'
                      ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                      : 'border-rose-400/40 bg-rose-400/15 text-rose-300'
                    : 'border-white/10 bg-white/[0.03] text-slate-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Status">
          <select
            className="glass-input"
            value={form.status}
            onChange={(e) => set('status', e.target.value as TradeStatus)}
          >
            <option value="closed">Closed</option>
            <option value="open">Open</option>
            <option value="planned">Planned</option>
          </select>
        </Field>

        <Field label="Entry Price">
          <input
            className="glass-input"
            type="number"
            step="any"
            required
            value={form.entryPrice}
            onChange={(e) => set('entryPrice', e.target.value)}
          />
        </Field>
        <Field label="Stop Loss">
          <input
            className="glass-input"
            type="number"
            step="any"
            required
            value={form.stopLoss}
            onChange={(e) => set('stopLoss', e.target.value)}
          />
        </Field>
        <Field label="Take Profit">
          <input
            className="glass-input"
            type="number"
            step="any"
            required
            value={form.takeProfit}
            onChange={(e) => set('takeProfit', e.target.value)}
          />
        </Field>

        {form.status === 'closed' && (
          <>
            <Field label="Exit Price">
              <input
                className="glass-input"
                type="number"
                step="any"
                value={form.exitPrice}
                onChange={(e) => set('exitPrice', e.target.value)}
              />
            </Field>
            <Field label="Realized PnL ($)">
              <input
                className="glass-input"
                type="number"
                step="any"
                value={form.pnl}
                onChange={(e) => set('pnl', e.target.value)}
                placeholder="Required for accurate stats"
              />
            </Field>
          </>
        )}

        <Field label="Lot Size">
          <input
            className="glass-input"
            type="number"
            step="any"
            required
            value={form.lotSize}
            onChange={(e) => set('lotSize', e.target.value)}
          />
        </Field>
        <Field label="Risk Amount ($)">
          <input
            className="glass-input"
            type="number"
            step="any"
            required
            value={form.riskAmount}
            onChange={(e) => set('riskAmount', e.target.value)}
          />
        </Field>
        <Field label="Ticket #">
          <input
            className="glass-input"
            value={form.ticket}
            onChange={(e) => set('ticket', e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Open Time">
          <input
            className="glass-input"
            type="datetime-local"
            value={form.openTime}
            onChange={(e) => set('openTime', e.target.value)}
          />
        </Field>
        {form.status === 'closed' && (
          <Field label="Close Time">
            <input
              className="glass-input"
              type="datetime-local"
              value={form.closeTime}
              onChange={(e) => set('closeTime', e.target.value)}
            />
          </Field>
        )}
        <Field label="Session">
          <select
            className="glass-input"
            value={form.session}
            onChange={(e) => set('session', e.target.value as SessionType)}
          >
            <option value="asian">Asian</option>
            <option value="london">London</option>
            <option value="newyork">New York</option>
            <option value="overlap">Overlap</option>
          </select>
        </Field>

        <Field label="Strategy">
          <select
            className="glass-input"
            value={form.strategy}
            onChange={(e) => set('strategy', e.target.value)}
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
            <option value="Discretionary">Discretionary</option>
          </select>
        </Field>
        <Field label="Timeframe">
          <select
            className="glass-input"
            value={form.timeframe}
            onChange={(e) => set('timeframe', e.target.value)}
          >
            {TIMEFRAMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Setup Name">
          <input
            className="glass-input"
            value={form.setup}
            onChange={(e) => set('setup', e.target.value)}
            placeholder="e.g. Asian range sweep"
          />
        </Field>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3">
        <Metric label="Planned R:R" value={derived.rr ? `1:${derived.rr}` : '—'} />
        <Metric label="Est. Pips" value={derived.pips != null ? String(derived.pips) : '—'} />
        <Metric
          label="Plan Followed"
          value={
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.followedPlan}
                onChange={(e) => set('followedPlan', e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              {form.followedPlan ? 'Yes' : 'No'}
            </label>
          }
        />
      </div>

      <Field label="Emotions During Trade">
        <div className="flex flex-wrap gap-2">
          {EMOTION_OPTIONS.map((e) => {
            const active = form.emotions.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => toggleEmotion(e.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  active
                    ? 'border-white/30 text-white'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                }`}
                style={
                  active
                    ? { background: `${e.color}22`, borderColor: `${e.color}66`, color: e.color }
                    : undefined
                }
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tags (comma separated)">
          <input
            className="glass-input"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="A+ setup, news, clean"
          />
        </Field>
        <Field label={`Trade Rating: ${form.rating}/5`}>
          <input
            type="range"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => set('rating', Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </Field>
      </div>

      <Field label="Trade Notes">
        <textarea
          className="glass-input min-h-[100px] resize-y"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="What did you see? Why this entry?"
        />
      </Field>
      <Field label="Lessons Learned">
        <textarea
          className="glass-input min-h-[80px] resize-y"
          value={form.lessons}
          onChange={(e) => set('lessons', e.target.value)}
          placeholder="What will you do differently?"
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
        <WaterButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </WaterButton>
        <WaterButton type="submit" variant="primary">
          {initial ? 'Update Trade' : 'Save Trade'}
        </WaterButton>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
