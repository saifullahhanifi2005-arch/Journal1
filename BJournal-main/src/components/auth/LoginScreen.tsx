import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LogIn, Shield, User } from 'lucide-react';
import type { AuthHook } from '../../hooks/useAuth';
import { WaterButton } from '../ui/WaterButton';

interface Props { auth: AuthHook; }

export function LoginScreen({ auth }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true); setError('');
    try {
      await auth.login(username.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050a14] p-4">
      <img src="/images/trading-anime-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <img src="/images/hero-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-luminosity" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.07),transparent_55%),linear-gradient(180deg,#050a14,#07101e_50%,#050a14)]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-amber-400/8 blur-3xl" />
      <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-cyan-500/8 blur-3xl" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute -inset-5 animate-pulse-glow rounded-3xl bg-amber-400/20 blur-3xl" />
            <img src="/images/app-icon.png" alt="The Fools Hunting Room"
              className="relative h-24 w-24 rounded-3xl object-cover shadow-2xl ring-2 ring-amber-300/60" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-300/60" />
            <span className="text-amber-300">♦</span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-300/60" />
          </div>
          <h1 className="text-4xl font-extrabold text-white" style={{ textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
            The Fools
          </h1>
          <h1 className="text-4xl font-extrabold" style={{ color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,0.7)' }}>
            Hunting Room
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.32em] text-slate-500">Elite Forex Trading Journal</p>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-[#060c17]/95 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.07),transparent_60%)]" />
          <div className="relative px-7 py-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/10">
                <KeyRound className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Secure Login</h2>
                <p className="text-xs text-slate-500">End-to-end encrypted · Zero knowledge</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Username</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input className="glass-input pl-10" type="text" placeholder="your.username"
                    autoComplete="username" value={username}
                    onChange={(e) => setUsername(e.target.value)} autoFocus />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Password</span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input className="glass-input pl-10 pr-12" type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
                  ⚠ {error}
                </div>
              )}

              <WaterButton type="submit" variant="gold" fullWidth size="lg"
                disabled={loading || !username.trim() || !password}>
                {loading
                  ? <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Unlocking Vault…
                    </span>
                  : <><LogIn className="h-4 w-4" /> Enter the Hunting Room</>}
              </WaterButton>
            </form>

            {/* Quick user list */}
            {auth.accounts.filter(a => a.status === 'active').length > 0 && (
              <div className="border-t border-white/8 pt-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Active Hunters — click to fill username
                </p>
                <div className="flex flex-wrap gap-2">
                  {auth.accounts.filter(a => a.status === 'active').map(acc => (
                    <button key={acc.id} type="button" onClick={() => setUsername(acc.username)}
                      className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 transition hover:border-amber-300/30 hover:bg-amber-300/[0.06]">
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10"
                        style={{ boxShadow: `0 0 10px ${acc.accentColor}40` }}>
                        {acc.avatarUrl
                          ? <img src={acc.avatarUrl} alt="" className="h-full w-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          : <div className="flex h-full w-full items-center justify-center text-xs font-black"
                              style={{ background: acc.accentColor + '20', color: acc.accentColor }}>
                              {acc.displayName.charAt(0)}
                            </div>}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white leading-tight">{acc.displayName}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{acc.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-emerald-400/60" />
          <p className="text-[11px] text-slate-600">AES-256 encrypted · Zero-knowledge vault · Session expires in 8h</p>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-700">
          © {new Date().getFullYear()} The Fools Hunting Room · Built by Saifullah Hanifi
        </p>
      </div>
    </div>
  );
}
