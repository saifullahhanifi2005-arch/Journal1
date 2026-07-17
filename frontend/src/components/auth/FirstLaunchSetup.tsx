import { useRef, useState } from 'react';
import {
  Camera, Check, ChevronRight, Crown, Eye, EyeOff,
  KeyRound, Rocket, Shield, ShieldCheck, Sparkles, User,
} from 'lucide-react';
import type { AuthHook } from '../../hooks/useAuth';
import { WaterButton } from '../ui/WaterButton';
import { cn } from '../../utils/cn';

const ACCENT_COLORS = [
  { color: '#fbbf24', label: 'Gold' },
  { color: '#22d3ee', label: 'Cyan' },
  { color: '#a78bfa', label: 'Violet' },
  { color: '#34d399', label: 'Emerald' },
  { color: '#fb7185', label: 'Rose' },
  { color: '#60a5fa', label: 'Blue' },
];

const DEFAULT_AVATARS = [
  { src: '/images/member-saifullah.png', label: 'Hunter I' },
  { src: '/images/member-hussain.png',   label: 'Hunter II' },
  { src: '/images/member-musawer.png',   label: 'Hunter III' },
  { src: '/images/app-icon.png',         label: 'Classic' },
];

type Step = 'welcome' | 'profile' | 'password' | 'done';

interface Props { auth: AuthHook; }

export function FirstLaunchSetup({ auth }: Props) {
  const [step, setStep]           = useState<Step>('welcome');
  const [displayName, setDisplayName] = useState('Saifullah Hanifi');
  const [username, setUsername]   = useState('saifullah');
  const [role, setRole]           = useState('Creator · Lead Hunter · Head Trader');
  const [accentColor, setAccent]  = useState('#fbbf24');
  const [avatarUrl, setAvatarUrl] = useState('/images/member-saifullah.png');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /* password strength */
  const hasMin    = password.length >= 8;
  const hasUpper  = /[A-Z]/.test(password);
  const hasNum    = /[0-9]/.test(password);
  const hasSpecial= /[^A-Za-z0-9]/.test(password);
  const strength  = [hasMin, hasUpper, hasNum, hasSpecial].filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || '';
  const strengthColor = ['', '#f87171', '#fbbf24', '#34d399', '#22d3ee'][strength] || '#f87171';
  const matches = password === confirm && confirm.length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleCreate = async () => {
    if (!displayName.trim() || !username.trim()) { setError('Name and username are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      await auth.register({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: '',
        password,
        avatarUrl,
        accentColor,
        role: 'superadmin',
        notes: 'Platform creator and super administrator.',
      });
      await auth.login(username.trim().toLowerCase(), password);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Setup failed. Please try again.');
    } finally { setBusy(false); }
  };

  /* ─── shared page shell ─── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050a14] p-4">
      <img src="/images/trading-anime-bg.jpg" alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <img src="/images/hero-bg.jpg" alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.07),transparent_55%),linear-gradient(180deg,#050a14_0%,#07101e_50%,#050a14_100%)]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-cyan-500/8 blur-3xl" />
      <div className="relative z-10 w-full max-w-lg animate-fade-in">{children}</div>
    </div>
  );

  /* ─── step progress bar ─── */
  void step; // used via conditional renders below

  /* ════════════════════════════════════════
     STEP 1 — WELCOME
  ════════════════════════════════════════ */
  if (step === 'welcome') return (
    <Shell>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-6">
          <div className="absolute -inset-5 animate-pulse-glow rounded-full bg-amber-400/20 blur-3xl" />
          <img src="/images/app-icon.png" alt="The Fools Hunting Room"
            className="relative h-28 w-28 rounded-3xl object-cover shadow-2xl ring-2 ring-amber-300/60" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-300/60" />
          <Sparkles className="h-4 w-4 text-amber-300" />
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-300/60" />
        </div>
        <h1 className="text-4xl font-extrabold text-white"
          style={{ textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
          The Fools
        </h1>
        <h1 className="text-4xl font-extrabold"
          style={{ color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,0.7)' }}>
          Hunting Room
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.32em] text-slate-500">Elite Forex Trading Journal</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-[#060c17]/95 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.07),transparent_60%)]" />

        <div className="relative">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10">
              <Rocket className="h-7 w-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">First Launch!</h2>
              <p className="text-sm text-slate-400">Let's set up your Admin account</p>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            {[
              { icon: Crown,       color: '#fbbf24', title: 'You are the Admin',      desc: 'Your account controls who can join The Fools Hunting Room.' },
              { icon: Shield,      color: '#22d3ee', title: 'Zero-Knowledge Security', desc: 'AES-256 encrypted. Even the app cannot read your data without your password.' },
              { icon: ShieldCheck, color: '#34d399', title: 'Private Vault Per User',  desc: 'Each hunter has their own encrypted journal. Nobody can access another\'s data.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                  style={{ borderColor: color + '30', background: color + '12' }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <WaterButton variant="gold" fullWidth size="lg" onClick={() => setStep('profile')}>
            <span>Set Up My Admin Account</span>
            <ChevronRight className="h-4 w-4" />
          </WaterButton>
          <p className="mt-3 text-center text-[11px] text-slate-600">
            This runs only once. After this you'll use the login screen.
          </p>
        </div>
      </div>
    </Shell>
  );

  /* ════════════════════════════════════════
     STEP 2 — PROFILE
  ════════════════════════════════════════ */
  if (step === 'profile') return (
    <Shell>
      <StepBar current={1} total={3} />

      <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-[#060c17]/95 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

        <div className="relative p-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10">
              <User className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Your Profile</h2>
              <p className="text-xs text-slate-500">This is how you'll appear in the hunting room</p>
            </div>
          </div>

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full blur-2xl animate-pulse-glow"
                style={{ background: accentColor + '30' }} />
              <div
                className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 shadow-2xl transition hover:scale-105"
                style={{ borderColor: accentColor + '70', boxShadow: `0 0 32px ${accentColor}40` }}
                onClick={() => fileRef.current?.click()}
                title="Click to upload your own photo"
              >
                <img src={avatarUrl} alt="" className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <p className="text-[10px] text-white mt-1 font-bold">Upload</p>
                </div>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#060c17] text-black shadow-lg transition hover:scale-110"
                style={{ background: accentColor }}>
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {/* Quick avatar presets */}
            <div className="flex items-center gap-2">
              {DEFAULT_AVATARS.map((a) => (
                <button key={a.src} onClick={() => setAvatarUrl(a.src)} title={a.label}
                  className={cn('h-10 w-10 overflow-hidden rounded-full border-2 transition hover:scale-110',
                    avatarUrl === a.src ? 'border-amber-300 scale-110' : 'border-white/15')}>
                  <img src={a.src} alt={a.label} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-600">Click avatar to upload · or pick a preset above</p>
          </div>

          {/* Accent color */}
          <div>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Your Accent Color
            </p>
            <div className="flex flex-wrap gap-2.5">
              {ACCENT_COLORS.map(({ color, label }) => (
                <button key={color} onClick={() => setAccent(color)} title={label}
                  className={cn('h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                    accentColor === color ? 'border-white scale-110 ring-2 ring-white/30' : 'border-transparent')}
                  style={{ background: color, boxShadow: accentColor === color ? `0 0 16px ${color}90` : undefined }} />
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your Full Name *">
              <input className="glass-input" value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Saifullah Hanifi" autoFocus />
            </Field>
            <Field label="Username * (for login)">
              <input className="glass-input" value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="saifullah" />
              <p className="mt-1 text-[10px] text-slate-600">Lowercase only · used to log in</p>
            </Field>
            <Field label="Your Role / Title" cls="sm:col-span-2">
              <input className="glass-input" value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Creator · Lead Hunter" />
            </Field>
          </div>

          {/* Live preview */}
          <div className="overflow-hidden rounded-2xl border p-4"
            style={{ borderColor: accentColor + '30', background: `radial-gradient(ellipse at top, ${accentColor}10, transparent 70%)` }}>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">Preview</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2"
                style={{ borderColor: accentColor + '60', boxShadow: `0 0 18px ${accentColor}35` }}>
                <img src={avatarUrl} alt="" className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-white">{displayName || 'Your Name'}</p>
                  <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black"
                    style={{ borderColor: accentColor + '40', color: accentColor, background: accentColor + '12' }}>
                    <Crown className="h-2.5 w-2.5" /> Admin
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: accentColor + 'cc' }}>@{username || 'username'}</p>
                <p className="text-[11px] text-slate-500">{role || 'Your Role'}</p>
              </div>
            </div>
          </div>

          <WaterButton variant="gold" fullWidth size="lg"
            onClick={() => { if (!displayName.trim() || !username.trim()) { setError('Name and username are required.'); return; } setError(''); setStep('password'); }}
            disabled={!displayName.trim() || !username.trim()}>
            Continue to Password
            <ChevronRight className="h-4 w-4" />
          </WaterButton>
          {error && <p className="text-center text-sm text-rose-400">{error}</p>}
        </div>
      </div>
    </Shell>
  );

  /* ════════════════════════════════════════
     STEP 3 — PASSWORD
  ════════════════════════════════════════ */
  if (step === 'password') return (
    <Shell>
      <StepBar current={2} total={3} />

      <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-[#060c17]/95 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

        <div className="relative p-7 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10">
              <KeyRound className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Create Your Password</h2>
              <p className="text-xs text-slate-500">This encrypts your entire vault — never forget it</p>
            </div>
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-4">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-bold text-rose-300">⚠️ Critical — Read This</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Your password is the <span className="font-bold text-white">only key</span> to your encrypted vault.
                Nobody — including the app — can recover it if lost.{' '}
                <span className="font-bold text-rose-300">Write it down and store it safely.</span>
              </p>
            </div>
          </div>

          {/* Password field */}
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Password</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="glass-input pl-10 pr-12"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                      style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { ok: hasMin,     label: '8+ chars' },
                      { ok: hasUpper,   label: 'Uppercase' },
                      { ok: hasNum,     label: 'Number' },
                      { ok: hasSpecial, label: 'Symbol' },
                    ].map(({ ok, label }) => (
                      <span key={label} className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition',
                        ok ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-600'
                      )}>
                        {ok && <Check className="h-2.5 w-2.5" />}
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </label>

          {/* Confirm field */}
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Confirm Password</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="glass-input pl-10 pr-12"
                type={showCf ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
              />
              <button type="button" onClick={() => setShowCf(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm && (
              <p className={cn('mt-1 flex items-center gap-1.5 text-[11px] font-semibold',
                matches ? 'text-emerald-400' : 'text-rose-400')}>
                {matches
                  ? <><Check className="h-3 w-3" /> Passwords match</>
                  : '✗ Passwords do not match'}
              </p>
            )}
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <WaterButton variant="secondary" onClick={() => { setError(''); setStep('profile'); }}>
              ← Back
            </WaterButton>
            <WaterButton variant="gold" fullWidth size="lg"
              onClick={handleCreate}
              disabled={busy || !password || !matches || strength < 2}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating Vault…
                </span>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Create Admin Account</>
              )}
            </WaterButton>
          </div>
        </div>
      </div>
    </Shell>
  );

  /* ════════════════════════════════════════
     STEP 4 — DONE 🎉
  ════════════════════════════════════════ */
  return (
    <Shell>
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-[#060c17]/95 p-10 text-center shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.08),transparent_65%)]" />
        <div className="relative">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute -inset-3 animate-pulse-glow rounded-full bg-emerald-400/20 blur-2xl" />
            <img src={avatarUrl} alt="" className="relative h-full w-full rounded-full object-cover shadow-xl ring-2 ring-emerald-400/60"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/app-icon.png'; }} />
            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#060c17] bg-emerald-400 shadow-lg">
              <Check className="h-5 w-5 text-black font-black" />
            </div>
          </div>
          <div className="mb-1 text-3xl">🎉</div>
          <h2 className="text-2xl font-extrabold text-white">Welcome to the Room!</h2>
          <p className="mt-2 font-bold" style={{ color: accentColor }}>{displayName}</p>
          <p className="mt-1 text-sm text-slate-400">Admin account created · Vault encrypted · Ready to hunt</p>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Username</p>
              <p className="mt-1 text-sm font-bold text-white">@{username}</p>
            </div>
            <div className="text-center border-x border-white/8">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Role</p>
              <p className="mt-1 text-sm font-bold text-amber-300">Admin</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Vault</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">Encrypted ✓</p>
            </div>
          </div>

          <div className="mt-6 space-y-2 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-left">
            <p className="text-sm font-bold text-amber-200">Next Steps:</p>
            <p className="text-xs text-slate-400">
              1. <span className="font-semibold text-white">Settings → Admin Panel</span> → Create accounts for Hussain &amp; Musawer
            </p>
            <p className="text-xs text-slate-400">
              2. Share each person their <span className="font-semibold text-white">username</span> and a temporary password
            </p>
            <p className="text-xs text-slate-400">
              3. Each person logs in and <span className="font-semibold text-white">changes their own password</span> immediately
            </p>
          </div>

          <p className="mt-5 text-xs text-slate-600">
            The app will now load your journal. You are logged in automatically.
          </p>
        </div>
      </div>
    </Shell>
  );
}

/* ─── Step progress indicator ─── */
function StepBar({ current, total }: { current: number; total: number }) {
  const labels = ['Welcome', 'Profile', 'Password'];
  return (
    <div className="mb-5 flex items-center gap-0">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex flex-1 items-center">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-black transition-all',
            i < current  ? 'border-amber-300 bg-amber-300 text-black'
            : i === current ? 'border-amber-300 bg-amber-300/15 text-amber-300'
            : 'border-white/15 bg-white/[0.03] text-slate-600'
          )}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <p className={cn('ml-2 hidden text-[11px] font-bold sm:block',
            i <= current ? 'text-amber-300' : 'text-slate-600')}>
            {labels[i]}
          </p>
          {i < total - 1 && (
            <div className="mx-3 flex-1 h-px transition-all"
              style={{ background: i < current ? '#fbbf24' : 'rgba(255,255,255,0.08)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children, cls }: { label: string; children: React.ReactNode; cls?: string }) {
  return (
    <label className={cn('block space-y-1.5', cls)}>
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
