import { Bell, Download, LogOut, PanelLeftClose, PanelLeftOpen, Plus, Search } from 'lucide-react';
import type { ViewId } from '../../types';
import type { Session } from '../../utils/authStore';
import { WaterButton } from '../ui/WaterButton';

const TITLES: Record<ViewId, { title: string; subtitle: string; icon: string }> = {
  dashboard:  { title: 'Command Center',         subtitle: 'Full hunting overview — equity, sessions, instruments', icon: '⚔️' },
  journal:    { title: 'Trade Journal',           subtitle: 'Log, filter and review every execution',               icon: '📖' },
  analytics:  { title: 'Performance Analytics',  subtitle: 'Edge discovery across pairs, sessions & setups',       icon: '📊' },
  calendar:   { title: 'Trade Calendar',         subtitle: 'Daily PnL heatmap and session hunting rhythm',          icon: '📅' },
  playbook:   { title: 'Strategy Playbook',      subtitle: 'Codify the rules that actually print',                 icon: '📜' },
  psychology: { title: 'Mindset Lab',            subtitle: 'Emotion patterns that move your equity curve',          icon: '🧠' },
  arena:      { title: "Hunter's Arena",          subtitle: 'Compare all hunters — leaderboard, stats & timelines', icon: '🏆' },
  chat:       { title: 'Trading Room Chat',       subtitle: 'Real-time group chat · auto-join all hunters',          icon: '💬' },
  reports:    { title: 'Weekly & Monthly Reports',subtitle: 'Auto-generated performance reports · email delivery',  icon: '📧' },
  news:       { title: 'Forex News & Forecasts',  subtitle: 'Live economic calendar · weekly outlook · instant updates', icon: '📰' },
  settings:   { title: 'Workspace Settings',     subtitle: 'Account, risk model, team and data vault',             icon: '⚙️' },
};

interface TopBarProps {
  view: ViewId;
  collapsed: boolean;
  onToggleSidebar: () => void;
  onNewTrade: () => void;
  onExport: () => void;
  search: string;
  onSearch: (v: string) => void;
  session?: Session | null;
  onLogout?: () => void;
}

export function TopBar({
  view, collapsed, onToggleSidebar, onNewTrade, onExport,
  search, onSearch, session, onLogout,
}: TopBarProps) {
  const meta = TITLES[view];

  return (
    <header className="sticky top-0 z-30 border-b border-amber-300/10 bg-[#060c17]/65 px-5 py-3.5 backdrop-blur-2xl sm:px-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Left — title */}
        <div className="flex min-w-0 items-center gap-3">
          <WaterButton variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </WaterButton>
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/[0.07] text-xl shrink-0">
              {meta.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-extrabold tracking-tight text-white sm:text-xl">{meta.title}</h2>
                <span className="hidden text-amber-400/60 text-xs sm:inline">♦</span>
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/50 sm:inline">
                  Fools Hunting Room
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">{meta.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-2.5">
          <div className="relative hidden min-w-[200px] max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => onSearch(e.target.value)}
              placeholder="Hunt by pair, tag, note…"
              className="glass-input w-full pl-9 text-xs" />
          </div>

          <WaterButton variant="secondary" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </WaterButton>

          <WaterButton variant="secondary" size="sm" onClick={onExport} className="hidden sm:inline-flex">
            <Download className="h-3.5 w-3.5" /> Export
          </WaterButton>

          <WaterButton variant="gold" size="sm" onClick={onNewTrade}>
            <Plus className="h-4 w-4" /> Log Trade
          </WaterButton>

          {/* Session user pill */}
          {session && (
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 lg:flex">
              <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white/15"
                style={{ boxShadow: `0 0 8px ${session.accentColor}50` }}>
                {session.avatarUrl
                  ? <img src={session.avatarUrl} alt="" className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  : <div className="flex h-full w-full items-center justify-center text-[10px] font-black"
                      style={{ background: session.accentColor + '20', color: session.accentColor }}>
                      {session.displayName.charAt(0)}
                    </div>}
              </div>
              <p className="text-xs font-bold text-white">{session.displayName}</p>
              {onLogout && (
                <button onClick={onLogout} title="Logout"
                  className="ml-1 text-slate-500 hover:text-rose-300 transition">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
