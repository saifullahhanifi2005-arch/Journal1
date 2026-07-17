import {
  BookOpen, Brain, CalendarDays, FileText, LayoutDashboard, LineChart,
  MessageSquare, Newspaper, NotebookPen, Settings, Swords, Trophy,
} from 'lucide-react';
import type { ViewId } from '../../types';
import type { Session } from '../../utils/authStore';
import { cn } from '../../utils/cn';

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard; desc: string; highlight?: boolean }[] = [
  { id: 'dashboard',  label: 'Command Center',  icon: LayoutDashboard, desc: 'Overview' },
  { id: 'journal',    label: 'Trade Journal',   icon: NotebookPen,     desc: 'Log & review' },
  { id: 'analytics',  label: 'Analytics',       icon: LineChart,       desc: 'Deep stats' },
  { id: 'calendar',   label: 'Trade Calendar',  icon: CalendarDays,    desc: 'Daily PnL' },
  { id: 'playbook',   label: 'Playbook',        icon: BookOpen,        desc: 'Strategies' },
  { id: 'psychology', label: 'Mindset Lab',     icon: Brain,           desc: 'Emotions' },
  { id: 'arena',      label: "Hunter's Arena",  icon: Trophy,          desc: 'Compare all', highlight: true },
  { id: 'chat',       label: 'Room Chat',       icon: MessageSquare,   desc: 'Team chat',  highlight: true },
  { id: 'reports',    label: 'Reports',         icon: FileText,        desc: 'Weekly/monthly' },
  { id: 'news',       label: 'News & Forecast', icon: Newspaper,       desc: 'Live updates' },
  { id: 'settings',   label: 'Settings',        icon: Settings,        desc: 'Account' },
];

interface SidebarProps {
  active: ViewId;
  onChange: (id: ViewId) => void;
  traderName: string;
  collapsed?: boolean;
  session?: Session | null;
}

export function Sidebar({ active, onChange, traderName, collapsed, session }: SidebarProps) {
  const creatorAvatar = session?.avatarUrl || '/images/member-saifullah.png';
  const creatorName   = session?.displayName || 'Saifullah Hanifi';
  const creatorRole   = session?.role === 'superadmin' ? 'Super Admin · Lead Hunter' : (session?.role || 'Hunter');
  const creatorColor  = session?.accentColor || '#fbbf24';

  return (
    <aside
      className={cn(
        'relative z-20 flex h-full flex-col border-r border-amber-300/10 bg-[#060c17]/85 backdrop-blur-2xl transition-all duration-300',
        collapsed ? 'w-[84px]' : 'w-[288px]'
      )}
    >
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

      {/* ── Brand header ── */}
      <div className={cn(
        'flex items-center gap-3 border-b border-amber-300/10 px-4 py-5',
        collapsed && 'justify-center px-3'
      )}>
        <div className="relative shrink-0">
          <div className="absolute -inset-1.5 rounded-2xl bg-amber-400/20 blur-lg animate-pulse-glow" />
          <img
            src="/images/app-icon.png"
            alt="The Fools Hunting Room"
            className="relative h-12 w-12 rounded-2xl object-cover shadow-xl ring-2 ring-amber-300/50"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#060c17] bg-emerald-400 text-[7px] font-black text-black">
            ♦
          </span>
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <h1 className="truncate text-[13px] font-extrabold uppercase tracking-[0.08em] text-white leading-tight">
              The Fools
            </h1>
            <h2
              className="truncate text-[13px] font-extrabold uppercase tracking-[0.08em] leading-tight"
              style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.5)' }}
            >
              Hunting Room
            </h2>
            <p className="mt-0.5 truncate text-[10px] tracking-[0.18em] uppercase text-slate-500">
              Elite Forex Journal
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4 custom-scroll">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-2 px-3">
            <Swords className="h-3 w-3 text-amber-400/60" />
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-amber-400/50">
              Hunt Modules
            </p>
          </div>
        )}

        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const isArena = item.id === 'arena';
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition-all duration-300',
                isActive ? 'text-white'
                  : isArena ? 'text-amber-300/80 hover:bg-amber-400/[0.07] hover:text-amber-200'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100',
                collapsed && 'justify-center'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/12 via-amber-300/6 to-transparent" />
              )}
              {isActive && (
                <span
                  className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600"
                  style={{ boxShadow: '0 0 12px rgba(251,191,36,0.9)' }}
                />
              )}
              <span
                className={cn(
                  'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300',
                  isActive
                    ? 'border-amber-400/40 bg-amber-400/12 text-amber-300'
                    : 'border-white/5 bg-white/[0.03] text-slate-400 group-hover:border-white/10 group-hover:text-slate-200'
                )}
                style={isActive ? { boxShadow: '0 0 16px rgba(251,191,36,0.2)' } : undefined}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {!collapsed && (
                <span className="relative min-w-0">
                  <span className="block text-[13px] font-semibold tracking-wide">{item.label}</span>
                  <span className="block text-[11px] text-slate-500">{item.desc}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="border-t border-amber-300/10 p-3 space-y-2.5">

        {/* Active trader card */}
        <div
          className={cn(
            'rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.05] to-transparent p-3',
            collapsed && 'flex justify-center'
          )}
        >
          {!collapsed ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Active Hunter</p>
              <p className="mt-1 truncate text-sm font-bold text-white">{traderName}</p>
              <p className="mt-0.5 text-[11px] font-medium text-amber-300/70">
                ♦ Elite Edition · Local Vault
              </p>
            </>
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 text-sm font-black text-amber-300"
            >
              {traderName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Creator card — driven by live member data */}
        {!collapsed && (
          <div
            className="group relative overflow-hidden rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-400/[0.08] via-transparent to-cyan-400/[0.04] p-3 transition-all duration-300 hover:border-amber-300/35"
            style={{ boxShadow: `0 0 20px ${creatorColor}10` }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-sm" />
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="relative h-9 w-9 rounded-full object-cover ring-1 ring-amber-300/50"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/app-icon.png';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-amber-100">{creatorName}</p>
                <p className="truncate text-[10px] text-amber-400/60">{creatorRole.split('·')[0].trim()}</p>
              </div>
              <span className="text-amber-300/40 text-sm shrink-0">♦</span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md" />
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="relative h-8 w-8 rounded-full object-cover ring-1 ring-amber-300/50"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/app-icon.png';
                }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
