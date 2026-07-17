import { useRef, useState } from 'react';
import {
  Camera, Check, Crown, Plus, RefreshCw, Shield,
  ShieldOff, Trash2, Users, X,
} from 'lucide-react';
import type { AuthHook } from '../../hooks/useAuth';
import type { UserAccount, UserRole } from '../../utils/authStore';
import { WaterButton } from '../ui/WaterButton';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const ACCENT_COLORS = [
  '#fbbf24', '#22d3ee', '#a78bfa', '#34d399',
  '#fb7185', '#60a5fa', '#f97316', '#e879f9',
];

const DEFAULT_AVATARS = [
  '/images/member-saifullah.png',
  '/images/member-hussain.png',
  '/images/member-musawer.png',
  '/images/app-icon.png',
];

interface Props { auth: AuthHook; }

export function AdminPanel({ auth }: Props) {
  const [tab, setTab] = useState<'users' | 'create'>('users');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState('');
  const [form, setForm] = useState({
    username: '', displayName: '', email: '', password: '', confirm: '',
    role: 'customer' as UserRole, accentColor: '#22d3ee',
    avatarUrl: '', notes: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setF('avatarUrl', reader.result as string);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleCreate = async () => {
    if (!form.username || !form.displayName || !form.password) {
      setMsg('Username, display name and password are required.'); return;
    }
    if (form.password !== form.confirm) { setMsg('Passwords do not match.'); return; }
    if (form.password.length < 8) { setMsg('Password must be at least 8 characters.'); return; }
    setBusy(true); setMsg('');
    try {
      await auth.register({
        username: form.username, displayName: form.displayName,
        email: form.email, password: form.password,
        avatarUrl: form.avatarUrl, accentColor: form.accentColor,
        role: form.role, notes: form.notes,
      });
      setMsg(`✓ Account "${form.displayName}" created successfully!`);
      setForm({ username: '', displayName: '', email: '', password: '', confirm: '',
        role: 'customer', accentColor: '#22d3ee', avatarUrl: '', notes: '' });
      setTab('users');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed to create account');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
        {([['users', 'Manage Users', Users], ['create', 'Create Account', Plus]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setTab(id); setMsg(''); }}
            className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
              tab === id ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' : 'text-slate-400 hover:text-white')}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={cn('rounded-2xl border px-4 py-3 text-sm',
          msg.startsWith('✓')
            ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
            : 'border-rose-400/25 bg-rose-400/10 text-rose-300')}>
          {msg}
        </div>
      )}

      {/* ── MANAGE USERS ── */}
      {tab === 'users' && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
          {auth.accounts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-slate-500">No accounts yet.</p>
            </div>
          )}
          {auth.accounts.map(acc => (
            <UserRow key={acc.id} acc={acc} auth={auth} isSelf={acc.id === auth.session?.userId} />
          ))}
        </div>
      )}

      {/* ── CREATE USER ── */}
      {tab === 'create' && (
        <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="absolute -inset-2 rounded-full blur-xl" style={{ background: form.accentColor + '30' }} />
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 shadow-xl transition hover:scale-105"
                style={{ borderColor: form.accentColor + '60', boxShadow: `0 0 24px ${form.accentColor}30` }}>
                {form.avatarUrl
                  ? <img src={form.avatarUrl} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full flex-col items-center justify-center gap-1"
                      style={{ background: form.accentColor + '12' }}>
                      <Camera className="h-6 w-6" style={{ color: form.accentColor }} />
                    </div>}
              </div>
            </div>
            <div className="flex gap-2">
              {DEFAULT_AVATARS.map(src => (
                <button key={src} onClick={() => setF('avatarUrl', src)}
                  className={cn('h-9 w-9 overflow-hidden rounded-full border-2 transition hover:scale-110',
                    form.avatarUrl === src ? 'border-amber-300' : 'border-white/15')}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Color */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Accent Color</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(c => (
                <button key={c} onClick={() => setF('accentColor', c)}
                  className={cn('h-7 w-7 rounded-full border-2 transition hover:scale-110',
                    form.accentColor === c ? 'border-white scale-110' : 'border-transparent')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* Role selector */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Account Role</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['customer', '👤', 'Customer', 'Full journal access. Own data only.'],
                ['admin',    '🛡️', 'Admin',    'Can manage users. Cannot read their data.'],
                ...(auth.isSuperAdmin ? [['superadmin', '👑', 'Super Admin', 'Full platform control.']] : []),
              ] as const).map(([role, icon, label, desc]) => (
                <button key={role} onClick={() => setF('role', role as UserRole)}
                  className={cn('flex flex-col items-center rounded-2xl border p-3 text-center transition',
                    form.role === role
                      ? 'border-amber-400/50 bg-amber-400/12 text-white'
                      : 'border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/20')}>
                  <span className="text-2xl mb-1">{icon}</span>
                  <p className="text-xs font-bold">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Username *">
              <input className="glass-input" placeholder="hussain.sahibzada"
                value={form.username} onChange={e => setF('username', e.target.value.toLowerCase().replace(/\s/g, '.'))} />
            </F>
            <F label="Display Name *">
              <input className="glass-input" placeholder="Hussain Sahibzada"
                value={form.displayName} onChange={e => setF('displayName', e.target.value)} />
            </F>
            <F label="Email">
              <input className="glass-input" type="email" placeholder="user@email.com"
                value={form.email} onChange={e => setF('email', e.target.value)} />
            </F>
            <F label="Notes (admin only)">
              <input className="glass-input" placeholder="e.g. Joined Jan 2025"
                value={form.notes} onChange={e => setF('notes', e.target.value)} />
            </F>
            <F label="Password *">
              <input className="glass-input" type="password" placeholder="Min 8 characters"
                value={form.password} onChange={e => setF('password', e.target.value)} />
            </F>
            <F label="Confirm Password *">
              <input className="glass-input" type="password" placeholder="Repeat password"
                value={form.confirm} onChange={e => setF('confirm', e.target.value)} />
            </F>
          </div>

          <div className="flex justify-end pt-1">
            <WaterButton variant="gold" onClick={handleCreate} disabled={busy}>
              {busy ? 'Creating…' : <><Plus className="h-4 w-4" /> Create Account</>}
            </WaterButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Single user management row ─── */
function UserRow({ acc, auth, isSelf }: { acc: UserAccount; auth: AuthHook; isSelf: boolean }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [resetOpen,  setResetOpen]  = useState(false);
  const [newPw,      setNewPw]      = useState('');
  const [busy,       setBusy]       = useState(false);
  const [msg,        setMsg]        = useState('');

  const canModify = auth.isSuperAdmin || (auth.isAdmin && acc.role === 'customer');

  const handleSuspend = async () => {
    setBusy(true);
    try {
      auth.adminUpdate(acc.id, { status: acc.status === 'active' ? 'suspended' : 'active' });
      setMsg(acc.status === 'active' ? 'Account suspended.' : 'Account reactivated.');
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Error'); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    setBusy(true);
    try { auth.adminDelete(acc.id); }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Error'); setBusy(false); setConfirmDel(false); }
  };

  const handleResetPw = async () => {
    if (newPw.length < 8) { setMsg('Min 8 characters'); return; }
    setBusy(true); setMsg('');
    try {
      await auth.adminResetPw(acc.id, newPw);
      setMsg('✓ Password reset. User must log in with new password.');
      setResetOpen(false); setNewPw('');
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Error'); }
    finally { setBusy(false); }
  };

  const roleColor: Record<string, string> = {
    superadmin: '#fbbf24', admin: '#22d3ee', customer: '#a78bfa',
  };

  return (
    <div className={cn('rounded-2xl border p-4 transition',
      acc.status === 'suspended'
        ? 'border-rose-400/20 bg-rose-400/[0.04] opacity-70'
        : 'border-white/8 bg-white/[0.03] hover:border-white/15')}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Avatar */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2"
          style={{ borderColor: (roleColor[acc.role] || '#fff') + '50', boxShadow: `0 0 14px ${acc.accentColor}35` }}>
          {acc.avatarUrl
            ? <img src={acc.avatarUrl} alt="" className="h-full w-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            : <div className="flex h-full w-full items-center justify-center text-base font-black"
                style={{ background: acc.accentColor + '18', color: acc.accentColor }}>
                {acc.displayName.charAt(0)}
              </div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-white">{acc.displayName}</p>
            <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase"
              style={{ borderColor: (roleColor[acc.role]||'#fff')+'35', color: roleColor[acc.role]||'#fff', background: (roleColor[acc.role]||'#fff')+'12' }}>
              {acc.role === 'superadmin' ? <><Crown className="h-2.5 w-2.5"/>Super Admin</>
               : acc.role === 'admin'    ? <><Shield className="h-2.5 w-2.5"/>Admin</>
               : '👤 Customer'}
            </span>
            {acc.status === 'suspended' && <Badge tone="danger">Suspended</Badge>}
            {isSelf && <Badge tone="info">You</Badge>}
          </div>
          <p className="text-xs text-slate-500">@{acc.username}{acc.email ? ` · ${acc.email}` : ''}</p>
          <p className="text-[11px] text-slate-600">
            Created {new Date(acc.createdAt).toLocaleDateString()}
            {acc.lastLoginAt ? ` · Last login ${new Date(acc.lastLoginAt).toLocaleDateString()}` : ' · Never logged in'}
          </p>
          {acc.notes && <p className="mt-1 text-[11px] italic text-slate-600">📝 {acc.notes}</p>}
        </div>

        {/* Actions */}
        {canModify && !isSelf && (
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {/* Suspend/Activate */}
            <WaterButton variant="secondary" size="sm" onClick={handleSuspend} disabled={busy || acc.role === 'superadmin'}>
              {acc.status === 'active'
                ? <><ShieldOff className="h-3.5 w-3.5 text-amber-300"/> Suspend</>
                : <><Shield className="h-3.5 w-3.5 text-emerald-300"/> Activate</>}
            </WaterButton>

            {/* Reset password */}
            <WaterButton variant="secondary" size="sm" onClick={() => { setResetOpen(r => !r); setMsg(''); }}>
              <RefreshCw className="h-3.5 w-3.5 text-cyan-300" /> Reset PW
            </WaterButton>

            {/* Delete */}
            {!confirmDel
              ? <WaterButton variant="danger" size="sm" onClick={() => setConfirmDel(true)} disabled={acc.role === 'superadmin'}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </WaterButton>
              : <div className="flex gap-1">
                  <WaterButton variant="danger" size="sm" onClick={handleDelete} disabled={busy}>
                    <Check className="h-3.5 w-3.5" /> Confirm
                  </WaterButton>
                  <WaterButton variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>
                    <X className="h-3.5 w-3.5" />
                  </WaterButton>
                </div>}
          </div>
        )}
      </div>

      {/* Inline password reset */}
      {resetOpen && (
        <div className="mt-4 flex gap-2 items-center border-t border-white/8 pt-4">
          <input className="glass-input flex-1 text-sm" type="password"
            placeholder="New temporary password (min 8 chars)"
            value={newPw} onChange={e => setNewPw(e.target.value)} autoFocus />
          <WaterButton variant="gold" size="sm" onClick={handleResetPw} disabled={busy}>
            {busy ? '…' : 'Set'}
          </WaterButton>
          <WaterButton variant="ghost" size="sm" onClick={() => { setResetOpen(false); setNewPw(''); }}>
            <X className="h-3.5 w-3.5" />
          </WaterButton>
        </div>
      )}

      {msg && (
        <p className={cn('mt-2 text-xs', msg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400')}>
          {msg}
        </p>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
