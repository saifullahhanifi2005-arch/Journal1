import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { AnalyticsView } from './components/views/AnalyticsView';
import { CalendarView } from './components/views/CalendarView';
import { DashboardView } from './components/views/DashboardView';
import { JournalView } from './components/views/JournalView';
import { PlaybookView } from './components/views/PlaybookView';
import { PsychologyView } from './components/views/PsychologyView';
import { SettingsView } from './components/views/SettingsView';
import { ArenaView } from './components/views/ArenaView';
import { ChatView } from './components/views/ChatView';
import { ReportsView } from './components/views/ReportsView';
import { NewsView } from './components/views/NewsView';
import { LoginScreen } from './components/auth/LoginScreen';
import { useJournalStore } from './hooks/useJournalStore';
import { useAuth } from './hooks/useAuth';
import type { Trade, ViewId } from './types';
import { cn } from './utils/cn';

export default function App() {
  const auth  = useAuth();
  const store = useJournalStore(
    auth.session?.userId,
    auth.session?._pw
  );

  const [view, setView]         = useState<ViewId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch]     = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<Trade | null>(null);
  const [booting, setBooting]   = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setBooting(false), 1600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (search && view !== 'journal') setView('journal');
  }, [search, view]);

  /* ── Splash boot screen ── */
  if (booting) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050a14]">
        <img src="/images/trading-anime-bg.jpg" alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050a14]/30 via-[#050a14]/70 to-[#050a14]" />
        <div className="relative z-10 flex flex-col items-center px-6 text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute -inset-4 animate-pulse-glow rounded-full bg-amber-400/25 blur-3xl" />
            <div className="absolute -inset-2 animate-pulse-glow rounded-3xl bg-cyan-400/15 blur-2xl"
              style={{ animationDelay: '1s' }} />
            <img src="/images/app-icon.png" alt="The Fools Hunting Room"
              className="relative h-28 w-28 rounded-3xl object-cover shadow-2xl ring-2 ring-amber-300/50" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300/60" />
            <span className="text-amber-300 text-lg">♦</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300/60" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
            style={{ textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
            The Fools Hunting Room
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.38em] text-amber-200/70">
            Elite Forex Trading Journal
          </p>
          <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full origin-left animate-boot-bar rounded-full bg-gradient-to-r from-amber-300 via-cyan-400 to-amber-300" />
          </div>
          <p className="mt-4 text-xs text-slate-400 tracking-widest">Entering the hunting room…</p>
          <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-2.5 backdrop-blur-sm">
            <img src="/images/member-saifullah.png" alt="Saifullah Hanifi"
              className="h-7 w-7 rounded-full object-cover ring-1 ring-amber-300/60"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/app-icon.png'; }} />
            <div className="text-left">
              <p className="text-[11px] font-bold text-amber-200">Saifullah Hanifi</p>
              <p className="text-[10px] text-amber-300/50">Creator · The Fools Hunting Room</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Auth loading ── */
  if (auth.authState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050a14]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />
      </div>
    );
  }

  /* ── Login / unauthenticated ── */
  if (auth.authState === 'unauthenticated') {
    return <LoginScreen auth={auth} />;
  }

  /* ── Vault loading spinner ── */
  if (!store.vaultReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050a14]">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow rounded-3xl bg-amber-400/20 blur-2xl" />
          <img src="/images/app-icon.png" alt="" className="relative h-16 w-16 rounded-2xl object-cover ring-1 ring-amber-300/40" />
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full origin-left animate-boot-bar rounded-full bg-gradient-to-r from-amber-300 to-cyan-400" />
        </div>
        <p className="text-xs text-amber-300/60 tracking-widest">Decrypting your vault…</p>
      </div>
    );
  }

  /* ── Main App ── */
  return (
    <div className="relative flex h-screen overflow-hidden bg-[#050a14] text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <img src="/images/trading-anime-bg.jpg" alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.22]" />
        <img src="/images/hero-bg.jpg" alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.10]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.09),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.09),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(167,139,250,0.06),transparent_50%),linear-gradient(180deg,#050a14_0%,#070d18_40%,#050a14_100%)]" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-amber-400/6 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-cyan-500/6 blur-3xl" />
      </div>

      <Sidebar
        active={view}
        onChange={setView}
        traderName={auth.session?.displayName || store.settings.traderName}
        collapsed={collapsed}
        session={auth.session}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar
          view={view}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onNewTrade={() => { setEditing(null); setFormOpen(true); setView('journal'); }}
          onExport={store.exportJson}
          search={search}
          onSearch={setSearch}
          session={auth.session}
          onLogout={auth.logout}
        />

        <main className={cn('flex-1 overflow-y-auto px-4 py-5 custom-scroll sm:px-6 lg:px-8', 'animate-fade-in')}>
          {view === 'dashboard'   && <DashboardView store={store} />}
          {view === 'journal'     && (
            <JournalView store={store} search={search}
              formOpen={formOpen} setFormOpen={setFormOpen}
              editing={editing} setEditing={setEditing} />
          )}
          {view === 'analytics'   && <AnalyticsView store={store} />}
          {view === 'calendar'    && <CalendarView store={store} />}
          {view === 'playbook'    && <PlaybookView store={store} />}
          {view === 'psychology'  && <PsychologyView store={store} />}
          {view === 'arena'       && <ArenaView store={store} auth={auth} />}
          {view === 'chat'        && <ChatView auth={auth} />}
          {view === 'reports'     && <ReportsView store={store} auth={auth} />}
          {view === 'news'        && <NewsView />}
          {view === 'settings'    && <SettingsView store={store} auth={auth} />}

          {/* Persistent footer */}
          <div className="mt-10 border-t border-amber-300/10 pb-4 pt-4">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-3">
                {auth.session && (
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-sm" />
                    <img src={auth.session.avatarUrl} alt={auth.session.displayName}
                      className="relative h-8 w-8 rounded-full object-cover ring-2 ring-amber-300/40"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/member-saifullah.png'; }} />
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  <span className="font-bold text-amber-300">The Fools Hunting Room</span>
                  {' '}· Built by{' '}
                  <span className="font-semibold text-amber-200">Saifullah Hanifi</span>
                  {auth.session && (
                    <> · Logged in as <span className="font-semibold text-white">{auth.session.displayName}</span></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {auth.session && (
                  <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5">
                    <div className="h-5 w-5 overflow-hidden rounded-full"
                      style={{ boxShadow: `0 0 8px ${auth.session.accentColor}50` }}>
                      {auth.session.avatarUrl
                        ? <img src={auth.session.avatarUrl} alt="" className="h-full w-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                        : <div className="flex h-full w-full items-center justify-center text-[10px] font-black"
                            style={{ background: auth.session.accentColor + '20', color: auth.session.accentColor }}>
                            {auth.session.displayName.charAt(0)}
                          </div>}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Logged in as <span className="font-bold text-white">{auth.session.displayName}</span>
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-slate-600">v1.0 · © {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
