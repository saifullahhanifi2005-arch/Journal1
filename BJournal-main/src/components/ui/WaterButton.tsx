import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface WaterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export function WaterButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  onClick,
  ...props
}: WaterButtonProps) {
  const [filling, setFilling] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    setFilling(true);
    window.setTimeout(() => setFilling(false), 700);
    window.setTimeout(() => setRipples((r) => r.filter((item) => item.id !== id)), 800);
    onClick?.(e);
  };

  const sizes = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
    icon: 'h-10 w-10 p-0 justify-center',
  };

  const variants = {
    primary:
      'border-cyan-300/30 bg-gradient-to-b from-cyan-400/25 to-cyan-600/20 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.15)] hover:border-cyan-200/50',
    secondary:
      'border-white/15 bg-white/[0.06] text-slate-100 hover:border-white/25 hover:bg-white/[0.1]',
    danger:
      'border-rose-400/30 bg-gradient-to-b from-rose-400/20 to-rose-700/20 text-rose-50 hover:border-rose-300/50',
    ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white',
    gold:
      'border-amber-300/35 bg-gradient-to-b from-amber-300/25 to-amber-600/20 text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.15)] hover:border-amber-200/50',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden rounded-xl border font-semibold tracking-wide',
        'backdrop-blur-md transition-all duration-300 active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50',
        sizes[size],
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {/* Water fill layer */}
      <span
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-300/50 via-sky-400/30 to-transparent transition-all duration-700 ease-out',
          filling ? 'h-full opacity-100' : 'h-0 opacity-0'
        )}
      />
      {/* Surface shimmer */}
      <span
        className={cn(
          'pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-700',
          filling ? 'bottom-[calc(100%-4px)] opacity-90' : 'bottom-0 opacity-0'
        )}
      />
      {/* Glass top highlight */}
      <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-water-ripple rounded-full bg-white/40"
          style={{ left: r.x, top: r.y }}
        />
      ))}

      <span className="relative z-10 inline-flex items-center gap-inherit">{children}</span>
    </button>
  );
}
