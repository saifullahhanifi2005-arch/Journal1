import { format } from 'date-fns';
import type { Trade } from '../../types';
import { formatMoney, formatPips } from '../../utils/stats';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

interface TradeDetailProps {
  trade: Trade;
  currency: string;
}

export function TradeDetail({ trade, currency }: TradeDetailProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-2xl font-bold text-white">{trade.pair}</h3>
        <Badge tone={trade.direction === 'long' ? 'success' : 'danger'}>{trade.direction}</Badge>
        {trade.result && (
          <Badge
            tone={
              trade.result === 'win' ? 'success' : trade.result === 'loss' ? 'danger' : 'warning'
            }
          >
            {trade.result}
          </Badge>
        )}
        <Badge tone="info">{trade.status}</Badge>
        {trade.ticket && <Badge tone="gold">{trade.ticket}</Badge>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Entry" value={String(trade.entryPrice)} />
        <Mini label="Exit" value={trade.exitPrice != null ? String(trade.exitPrice) : '—'} />
        <Mini label="Stop Loss" value={String(trade.stopLoss)} />
        <Mini label="Take Profit" value={String(trade.takeProfit)} />
        <Mini label="Lot Size" value={String(trade.lotSize)} />
        <Mini label="R:R" value={trade.riskReward ? `1:${trade.riskReward}` : '—'} />
        <Mini
          label="PnL"
          value={trade.pnl != null ? formatMoney(trade.pnl, currency) : '—'}
          tone={(trade.pnl ?? 0) >= 0 ? 'up' : 'down'}
        />
        <Mini label="Pips" value={trade.pips != null ? formatPips(trade.pips) : '—'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Execution</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Strategy" v={trade.strategy} />
            <Row k="Setup" v={trade.setup || '—'} />
            <Row k="Timeframe" v={trade.timeframe} />
            <Row k="Session" v={trade.session} />
            <Row k="Opened" v={format(new Date(trade.openTime), 'PPpp')} />
            <Row
              k="Closed"
              v={trade.closeTime ? format(new Date(trade.closeTime), 'PPpp') : '—'}
            />
            <Row k="Followed Plan" v={trade.followedPlan ? 'Yes' : 'No'} />
            <Row k="Rating" v={`${trade.rating}/5`} />
          </dl>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Psychology & Tags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {trade.emotions.map((e) => (
              <Badge key={e} tone="info">
                {e}
              </Badge>
            ))}
            {!trade.emotions.length && <span className="text-sm text-slate-500">No emotions logged</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {trade.tags.map((t) => (
              <Badge key={t} tone="gold">
                {t}
              </Badge>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Notes</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {trade.notes || 'No notes.'}
        </p>
      </GlassCard>
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Lessons</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {trade.lessons || 'No lessons captured yet.'}
        </p>
      </GlassCard>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'up' | 'down';
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          tone === 'up' ? 'text-emerald-300' : tone === 'down' ? 'text-rose-300' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium capitalize text-slate-200">{v}</dd>
    </div>
  );
}
