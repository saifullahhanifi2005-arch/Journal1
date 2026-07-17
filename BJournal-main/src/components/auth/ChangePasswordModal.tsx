import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import type { AuthHook } from '../../hooks/useAuth';
import { Modal } from '../ui/Modal';
import { WaterButton } from '../ui/WaterButton';

interface Props {
  open: boolean;
  onClose: () => void;
  auth: AuthHook;
  vaultJson: string; // current serialised vault to re-encrypt
}

export function ChangePasswordModal({ open, onClose, auth, vaultJson }: Props) {
  const [oldPw, setOldPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [conf, setConf]     = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy]     = useState(false);
  const [msg, setMsg]       = useState('');
  const [ok, setOk]         = useState(false);

  const strength = newPw.length >= 12 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^A-Za-z0-9]/.test(newPw)
    ? 'strong' : newPw.length >= 8 ? 'medium' : 'weak';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== conf) { setMsg('New passwords do not match.'); return; }
    if (newPw.length < 8) { setMsg('Password must be at least 8 characters.'); return; }
    setBusy(true); setMsg('');
    try {
      await auth.changePw(oldPw, newPw, vaultJson);
      setOk(true);
      setMsg('✓ Password changed! Your vault has been re-encrypted.');
      setOldPw(''); setNewPw(''); setConf('');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error changing password');
    } finally { setBusy(false); }
  };

  const handleClose = () => { setMsg(''); setOk(false); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Change Password"
      subtitle="Your vault will be re-encrypted with the new password immediately">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-xs leading-relaxed text-slate-400">
            Only <span className="font-bold text-white">you</span> can change your password. Nobody else — including admins — can access or reset it. If you forget your password, your encrypted data cannot be recovered.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Current Password</span>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="glass-input pl-10 pr-12" type={showOld ? 'text' : 'password'}
              value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="Current password" />
            <button type="button" onClick={() => setShowOld((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
              {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">New Password</span>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="glass-input pl-10 pr-12" type={showNew ? 'text' : 'password'}
              value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" />
            <button type="button" onClick={() => setShowNew((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPw && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strength === 'strong' ? 'w-full bg-emerald-400' : strength === 'medium' ? 'w-2/3 bg-amber-400' : 'w-1/3 bg-rose-400'}`} />
              </div>
              <span className={`text-[10px] font-bold uppercase ${strength === 'strong' ? 'text-emerald-400' : strength === 'medium' ? 'text-amber-400' : 'text-rose-400'}`}>
                {strength}
              </span>
            </div>
          )}
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Confirm New Password</span>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="glass-input pl-10" type="password"
              value={conf} onChange={(e) => setConf(e.target.value)} placeholder="Repeat new password" />
          </div>
          {conf && newPw && conf !== newPw && (
            <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
          )}
        </label>

        {msg && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${ok ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/25 bg-rose-400/10 text-rose-300'}`}>
            {msg}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <WaterButton type="button" variant="secondary" onClick={handleClose}>Cancel</WaterButton>
          <WaterButton type="submit" variant="gold" disabled={busy || !oldPw || !newPw || !conf}>
            {busy ? 'Re-encrypting…' : <><ShieldCheck className="h-4 w-4" /> Update Password</>}
          </WaterButton>
        </div>
      </form>
    </Modal>
  );
}
