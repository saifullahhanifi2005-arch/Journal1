import { format } from 'date-fns';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Trade } from '../../types';
import { formatMoney, formatPips } from '../../utils/stats';
import { Badge } from '../ui/Badge';
import { WaterButton } from '../ui/WaterButton';

interface TradeTableProps {
  trades: Trade[];
  currency: string;
  onView: (trade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

export function TradeTable({ trades, currency, onView, onEdit, onDelete }: TradeTableProps) {
  if (!trades.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <img src="/images/empty-state.jpg" alt="" className="h-40 w-64 rounded-2xl object-cover opacity-80" />
        <div>
          <h3 className="text-lg font-semibold text-white">No trades match your filters</h3>
          <p className="mt-1 text-sm text-slate-400">Log your first execution or reset filters to see sample data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto custom-scroll">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Pair</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Strategy</th>
              <th className="px-4 py-3 font-medium">R:R</th>
              <th className="px-4 py-3 font-medium">Pips</th>
              <th className="px-4 py-3 font-medium">PnL</th>
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr
                key={t.id}
                className="border-t border-white/5 transition hover:bg-white/[0.03]"
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                  {format(new Date(t.openTime), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 font-semibold text-white">{t.pair}</td>
                <td className="px-4 py-3">
                  <Badge tone={t.direction === 'long' ? 'success' : 'danger'}>{t.direction}</Badge>
                </td>
                <td className="max-w-[140px] truncate px-4 py-3 text-slate-300">{t.strategy}</td>
                <td className="px-4 py-3 text-slate-300">
                  {t.riskReward ? `1:${t.riskReward}` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {t.pips != null ? formatPips(t.pips) : '—'}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${
                    (t.pnl ?? 0) > 0
                      ? 'text-emerald-300'
                      : (t.pnl ?? 0) < 0
                        ? 'text-rose-300'
                        : 'text-slate-300'
                  }`}
                >
                  {t.pnl != null ? formatMoney(t.pnl, currency) : t.status === 'open' ? 'Open' : '—'}
                </td>
                <td className="px-4 py-3">
                  {t.status === 'open' ? (
                    <Badge tone="info">Open</Badge>
                  ) : t.result === 'win' ? (
                    <Badge tone="success">Win</Badge>
                  ) : t.result === 'loss' ? (
                    <Badge tone="danger">Loss</Badge>
                  ) : t.result === 'breakeven' ? (
                    <Badge tone="warning">BE</Badge>
                  ) : (
                    <Badge>Planned</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={t.followedPlan ? 'success' : 'danger'}>
                    {t.followedPlan ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <WaterButton variant="ghost" size="icon" onClick={() => onView(t)} aria-label="View">
                      <Eye className="h-4 w-4" />
                    </WaterButton>
                    <WaterButton variant="ghost" size="icon" onClick={() => onEdit(t)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </WaterButton>
                    <WaterButton
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(t.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-rose-300" />
                    </WaterButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
