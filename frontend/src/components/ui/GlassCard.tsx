import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const padMap = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function GlassCard({
  children,
  className,
  glow = false,
  hover = false,
  padding = 'md',
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-glass backdrop-blur-xl',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] before:via-transparent before:to-transparent',
        glow && 'shadow-glow',
        hover &&
          'transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-white/[0.06] hover:shadow-glow',
        padMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
