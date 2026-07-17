import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  accent?: string;
}

export function StatCard({ label, value, hint, icon: Icon, trend = 'neutral', accent }: StatCardProps) {
  return (
    <GlassCard hover className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p
            className={cn(
              'truncate text-2xl font-semibold tracking-tight',
              trend === 'up' && 'text-emerald-300',
              trend === 'down' && 'text-rose-300',
              trend === 'neutral' && 'text-white'
            )}
          >
            {value}
          </p>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"
          style={{ boxShadow: accent ? `0 0 24px ${accent}33` : undefined }}
        >
          <Icon className="h-5 w-5" style={{ color: accent || '#67e8f9' }} />
        </div>
      </div>
    </GlassCard>
  );
}
