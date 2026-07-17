import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { JournalStore } from '../../hooks/useJournalStore';
import { calendarHeatmap, formatMoney } from '../../utils/stats';
import { GlassCard } from '../ui/GlassCard';
import { WaterButton } from '../ui/WaterButton';
import { cn } from '../../utils/cn';

interface Props {
  store: JournalStore;
}

export function CalendarView({ store }: Props) {
  const [month, setMonth] = useState(new Date());
  const heat = useMemo(() => calendarHeatmap(store.trades), [store.trades]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const monthTotal = useMemo(() => {
    return Object.entries(heat)
      .filter(([d]) => d.startsWith(format(month, 'yyyy-MM')))
      .reduce((a, [, v]) => a + v, 0);
  }, [heat, month]);

  const monthTrades = store.trades.filter((t) =>
    (t.closeTime || t.openTime).startsWith(format(month, 'yyyy-MM'))
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Month PnL</p>
          <p className={`mt-2 text-3xl font-bold ${monthTotal >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {formatMoney(monthTotal, store.settings.accountCurrency)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Trades this month</p>
          <p className="mt-2 text-3xl font-bold text-white">{monthTrades.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Trading days</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {
              Object.keys(heat).filter((d) => d.startsWith(format(month, 'yyyy-MM'))).length
            }
          </p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">{format(month, 'MMMM yyyy')}</h3>
            <p className="text-sm text-slate-400">Daily realized PnL heatmap</p>
          </div>
          <div className="flex gap-2">
            <WaterButton variant="secondary" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </WaterButton>
            <WaterButton variant="secondary" size="sm" onClick={() => setMonth(new Date())}>
              Today
            </WaterButton>
            <WaterButton variant="secondary" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </WaterButton>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const pnl = heat[key];
            const inMonth = isSameMonth(day, month);
            const intensity = pnl == null ? 0 : Math.min(1, Math.abs(pnl) / 800);
            const bg =
              pnl == null
                ? 'bg-white/[0.02]'
                : pnl > 0
                  ? `rgba(52, 211, 153, ${0.12 + intensity * 0.45})`
                  : `rgba(248, 113, 113, ${0.12 + intensity * 0.45})`;

            return (
              <div
                key={key}
                className={cn(
                  'min-h-[84px] rounded-xl border border-white/5 p-2 transition hover:border-white/15',
                  !inMonth && 'opacity-35'
                )}
                style={{ background: typeof bg === 'string' && bg.startsWith('rgba') ? bg : undefined }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">{format(day, 'd')}</span>
                  {pnl != null && (
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        pnl > 0 ? 'text-emerald-300' : pnl < 0 ? 'text-rose-300' : 'text-slate-400'
                      )}
                    >
                      {pnl > 0 ? '+' : ''}
                      {Math.round(pnl)}
                    </span>
                  )}
                </div>
                {pnl != null && (
                  <div className="mt-3">
                    <div
                      className={cn(
                        'h-1 rounded-full',
                        pnl > 0 ? 'bg-emerald-400/70' : pnl < 0 ? 'bg-rose-400/70' : 'bg-slate-500/50'
                      )}
                      style={{ width: `${30 + intensity * 70}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
