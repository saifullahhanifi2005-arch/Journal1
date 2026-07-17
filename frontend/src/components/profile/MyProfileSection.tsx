import { useRef, useState } from 'react';
import { Camera, Check, Crown, Mail, Shield, User as UserIcon } from 'lucide-react';
import type { AuthHook } from '../../hooks/useAuth';
import { WaterButton } from '../ui/WaterButton';
import { cn } from '../../utils/cn';

const ACCENT_COLORS = [
  '#fbbf24', '#22d3ee', '#a78bfa', '#34d399',
  '#fb7185', '#60a5fa', '#f97316', '#e879f9',
];

interface Props { auth: AuthHook; }

export function MyProfileSection({ auth }: Props) {
  const { session, updateProfile } = auth;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    displayName: session?.displayName || '',
    email: session?.email || '',
    avatarUrl: session?.avatarUrl || '',
    accentColor: session?.accentColor || '#fbbf24',
  });
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!session) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setDraft(d => ({ ...d, avatarUrl: r.result as string }));
    r.readAsDataURL(f);
    e.target.value = '';
  };

  const handleSave = () => {
    if (!draft.displayName.trim()) { setMsg('Display name is required.'); return; }
    try {
      updateProfile({
        displayName: draft.displayName.trim(),
        email: draft.email.trim(),
        avatarUrl: draft.avatarUrl,
        accentColor: draft.accentColor,
      });
      setMsg('✓ Profile updated everywhere!');
      setEditing(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleCancel = () => {
    setDraft({
      displayName: session.displayName,
      email: session.email,
      avatarUrl: session.avatarUrl,
      accentColor: session.accentColor,
    });
    setEditing(false);
    setMsg('');
  };

  /* ── VIEW MODE ── */
  if (!editing) {
    return (
      <div className="relative overflow-hidden rounded-3xl border p-6"
        style={{
          borderColor: session.accentColor + '30',
          background: `radial-gradient(ellipse at top left, ${session.accentColor}10, transparent 60%)`,
        }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${session.accentColor}50, transparent)` }} />

        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full blur-xl animate-pulse-glow"
                style={{ background: session.accentColor + '30' }} />
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 shadow-xl"
                style={{ borderColor: session.accentColor + '60', boxShadow: `0 0 28px ${session.accentColor}40` }}>
                {session.avatarUrl
                  ? <img src={session.avatarUrl} alt={session.displayName} className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  : <div className="flex h-full w-full items-center justify-center text-3xl font-black"
                      style={{ background: session.accentColor + '18', color: session.accentColor }}>
                      {session.displayName.charAt(0)}
                    </div>}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-extrabold text-white">{session.displayName}</h3>
                {session.isSuperAdmin && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
                    <Crown className="h-2.5 w-2.5" /> Super Admin
                  </span>
                )}
                {auth.isAdmin && !session.isSuperAdmin && (
                  <span className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    <Shield className="h-2.5 w-2.5" /> Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">@{session.username}</p>
              {session.email && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3 w-3" /> {session.email}
                </p>
              )}
            </div>
          </div>

          <WaterButton variant="gold" onClick={() => setEditing(true)}>
            <UserIcon className="h-4 w-4" /> Edit My Profile
          </WaterButton>
        </div>

        {msg && (
          <p className={cn('mt-4 text-center text-sm font-semibold',
            msg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400')}>
            {msg}
          </p>
        )}
      </div>
    );
  }

  /* ── EDIT MODE ── */
  return (
    <div className="relative overflow-hidden rounded-3xl border p-6"
      style={{ borderColor: draft.accentColor + '30', background: `radial-gradient(ellipse at top left, ${draft.accentColor}10, transparent 60%)` }}>
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${draft.accentColor}50, transparent)` }} />

      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-amber-300" /> Edit My Profile
        </h3>
        <p className="text-xs text-slate-500">Changes sync everywhere instantly</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
          <div className="absolute -inset-2 rounded-full blur-xl"
            style={{ background: draft.accentColor + '30' }} />
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 shadow-xl transition hover:scale-105"
            style={{ borderColor: draft.accentColor + '60', boxShadow: `0 0 28px ${draft.accentColor}40` }}>
            {draft.avatarUrl
              ? <img src={draft.avatarUrl} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-3xl font-black"
                  style={{ background: draft.accentColor + '12', color: draft.accentColor }}>
                  {draft.displayName.charAt(0) || '?'}
                </div>}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
              <p className="text-[10px] text-white mt-1 font-bold">Change</p>
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <p className="text-[11px] text-slate-600">Click to upload a new photo</p>
      </div>

      {/* Accent color */}
      <div className="mb-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Your Accent Color</p>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_COLORS.map(c => (
            <button key={c} onClick={() => setDraft(d => ({ ...d, accentColor: c }))}
              className={cn('h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                draft.accentColor === c ? 'border-white scale-110' : 'border-transparent')}
              style={{ background: c, boxShadow: draft.accentColor === c ? `0 0 14px ${c}80` : undefined }} />
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Display Name *</span>
          <input className="glass-input" value={draft.displayName}
            onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Email (optional)</span>
          <input className="glass-input" type="email" value={draft.email}
            onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
            placeholder="you@example.com" />
        </label>
      </div>

      <p className="mt-3 text-[11px] text-slate-600 text-center">
        🔒 Only <strong className="text-white">you</strong> can edit your own profile — tied 1:1 to your account.
      </p>

      {msg && (
        <p className={cn('mt-2 text-center text-sm font-semibold',
          msg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400')}>
          {msg}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <WaterButton variant="ghost" onClick={handleCancel}>Cancel</WaterButton>
        <WaterButton variant="gold" onClick={handleSave}>
          <Check className="h-4 w-4" /> Save Profile
        </WaterButton>
      </div>
    </div>
  );
}
