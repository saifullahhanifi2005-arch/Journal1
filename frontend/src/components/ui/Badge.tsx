import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'gold';
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        tone === 'neutral' && 'border-white/10 bg-white/5 text-slate-300',
        tone === 'success' && 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
        tone === 'danger' && 'border-rose-400/20 bg-rose-400/10 text-rose-300',
        tone === 'warning' && 'border-amber-400/20 bg-amber-400/10 text-amber-300',
        tone === 'info' && 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
        tone === 'gold' && 'border-amber-300/25 bg-amber-300/10 text-amber-200',
        className
      )}
    >
      {children}
    </span>
  );
}
