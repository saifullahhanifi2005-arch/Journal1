import { useCallback, useEffect, useState } from 'react';
import {
  type Session,
  type UserAccount,
  type UserRole,
  adminDeleteUser,
  adminResetPassword,
  adminUpdateUser,
  changePassword,
  clearSession,
  ensureSuperAdmin,
  loadAccounts,
  loadSession,
  loginUser,
  registerUser,
  saveSession,
  updateOwnProfile,
} from '../utils/authStore';

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

export function useAuth() {
  const [session, setSession]   = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);

  /* ── bootstrap ── */
  useEffect(() => {
    ensureSuperAdmin().then(() => {
      const s = loadSession();
      setSession(s);
      setAuthState(s ? 'authenticated' : 'unauthenticated');
      setAccounts(loadAccounts());
    });
  }, []);

  const refreshAccounts = useCallback(() => setAccounts(loadAccounts()), []);

  /* ── login ── */
  const login = useCallback(async (username: string, password: string) => {
    const s = await loginUser(username, password);
    setSession(s);
    setAuthState('authenticated');
    refreshAccounts();
    return s;
  }, [refreshAccounts]);

  /* ── logout ── */
  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setAuthState('unauthenticated');
    refreshAccounts();
  }, [refreshAccounts]);

  /* ── register (admin/superadmin creates accounts) ── */
  const register = useCallback(async (opts: {
    username: string; displayName: string; email: string; password: string;
    avatarUrl: string; accentColor: string; role: UserRole; notes: string;
  }) => {
    if (!session) throw new Error('Not logged in.');
    const acc = await registerUser({ ...opts, createdBy: session.userId });
    refreshAccounts();
    return acc;
  }, [session, refreshAccounts]);

  /* ── change own password ── */
  const changePw = useCallback(async (oldPw: string, newPw: string, vaultJson: string) => {
    if (!session) throw new Error('Not logged in.');
    const updated = await changePassword(session, oldPw, newPw, vaultJson);
    setSession(updated);
    saveSession(updated);
    return updated;
  }, [session]);

  /* ── update own profile (avatar, name, color, email) ── */
  const updateProfile = useCallback((
    patch: Partial<Pick<UserAccount, 'displayName' | 'email' | 'avatarUrl' | 'accentColor'>>
  ) => {
    if (!session) throw new Error('Not logged in.');
    const updated = updateOwnProfile(session, patch);
    setSession(updated);
    saveSession(updated);
    return updated;
  }, [session]);

  /* ── admin: reset another user's password ── */
  const adminResetPw = useCallback(async (targetId: string, newPw: string) => {
    if (!session) throw new Error('Not logged in.');
    await adminResetPassword(session, targetId, newPw);
    refreshAccounts();
  }, [session, refreshAccounts]);

  /* ── admin: update user profile ── */
  const adminUpdate = useCallback((
    targetId: string,
    patch: Parameters<typeof adminUpdateUser>[2]
  ) => {
    if (!session) throw new Error('Not logged in.');
    adminUpdateUser(session, targetId, patch);
    refreshAccounts();
  }, [session, refreshAccounts]);

  /* ── admin: delete user ── */
  const adminDelete = useCallback((targetId: string) => {
    if (!session) throw new Error('Not logged in.');
    adminDeleteUser(session, targetId);
    refreshAccounts();
  }, [session, refreshAccounts]);

  const isSuperAdmin = session?.role === 'superadmin';
  const isAdmin      = session?.role === 'superadmin' || session?.role === 'admin';
  const isCustomer   = session?.role === 'customer';

  return {
    session, authState, accounts,
    login, logout, register,
    changePw, updateProfile, adminResetPw, adminUpdate, adminDelete,
    refreshAccounts,
    isSuperAdmin, isAdmin, isCustomer,
    userId: session?.userId ?? null,
  };
}

export type AuthHook = ReturnType<typeof useAuth>;
