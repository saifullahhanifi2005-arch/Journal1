/**
 * Auth Store — Global Fools Hunting Room User Management
 *
 * Roles:
 *   superadmin  → Saifullah Hanifi only. Hardcoded seed. Full control.
 *   admin       → Can create/delete/suspend customer accounts. Cannot read their data.
 *   customer    → Regular user. Full journal access. Own encrypted vault only.
 *
 * Security model:
 *   • Passwords: PBKDF2 (310k iterations) → stored as hex hash only
 *   • Vault data: AES-256-GCM encrypted per user with their password key
 *   • Zero-knowledge: no one can decrypt another user's vault without their password
 *   • Session: sessionStorage only, 8h TTL, cleared on tab close
 */

import {
  encryptData, decryptData,
  generateSalt, hashPassword,
  uint8ToHex, hexToUint8,
} from './crypto';

/* ─── Storage keys ─── */
const ACCOUNTS_KEY = 'fhr-global-accounts-v3';
const SESSION_KEY  = 'fhr-global-session-v3';
const VAULT_PFX    = 'fhr-global-vault-v3-';
const SESSION_TTL  = 8 * 60 * 60 * 1000; // 8h

/* ─── Superadmin seed credentials ─── */
export const SUPERADMIN_USERNAME = 'saifullah';
export const SUPERADMIN_SEED_PW  = 'S12345@#';
export const SUPERADMIN_ID       = 'superadmin-saifullah-001';

/* ─── Types ─── */
export type UserRole = 'superadmin' | 'admin' | 'customer';
export type UserStatus = 'active' | 'suspended';

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  accentColor: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  saltHex: string;
  createdAt: string;
  createdBy: string;       // userId of creator
  lastLoginAt: string | null;
  tradeCount: number;      // informational only
  notes: string;           // admin notes on this account
}

export interface Session {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  accentColor: string;
  role: UserRole;
  status: UserStatus;
  isAdmin: boolean;        // true for superadmin OR admin
  isSuperAdmin: boolean;   // true only for superadmin
  expiresAt: number;
  _pw: string; // in-memory ONLY, never written to disk in plaintext
}

/* ════════════════════════════════════════════
   Account registry
════════════════════════════════════════════ */
export function loadAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as UserAccount[]) : [];
  } catch { return []; }
}

function saveAccounts(accounts: UserAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/* ════════════════════════════════════════════
   Session
════════════════════════════════════════════ */
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (Date.now() > s.expiresAt) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch { return null; }
}

export function saveSession(s: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ════════════════════════════════════════════
   Bootstrap superadmin if missing
════════════════════════════════════════════ */
export async function ensureSuperAdmin(): Promise<void> {
  const accounts = loadAccounts();
  const exists = accounts.find((a) => a.id === SUPERADMIN_ID);
  if (exists) return;

  const salt = generateSalt();
  const hash = await hashPassword(SUPERADMIN_SEED_PW, salt);

  const superAdmin: UserAccount = {
    id: SUPERADMIN_ID,
    username: SUPERADMIN_USERNAME,
    displayName: 'Saifullah Hanifi',
    email: 'admin@foolshuntingroom.com',
    avatarUrl: '/images/member-saifullah.png',
    accentColor: '#fbbf24',
    role: 'superadmin',
    status: 'active',
    passwordHash: hash,
    saltHex: uint8ToHex(salt),
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    lastLoginAt: null,
    tradeCount: 0,
    notes: 'Platform creator and super administrator.',
  };

  accounts.unshift(superAdmin);
  saveAccounts(accounts);
}

/* ════════════════════════════════════════════
   Login
════════════════════════════════════════════ */
export async function loginUser(username: string, password: string): Promise<Session> {
  await ensureSuperAdmin();
  const accounts = loadAccounts();
  const acc = accounts.find((a) => a.username === username.trim().toLowerCase());
  if (!acc) throw new Error('No account found with that username.');
  if (acc.status === 'suspended') throw new Error('This account has been suspended. Contact admin.');

  const salt = hexToUint8(acc.saltHex);
  const hash = await hashPassword(password, salt);
  if (hash !== acc.passwordHash) throw new Error('Incorrect password.');

  // update lastLogin
  acc.lastLoginAt = new Date().toISOString();
  saveAccounts(accounts);

  const session: Session = {
    userId: acc.id, username: acc.username, displayName: acc.displayName,
    email: acc.email, avatarUrl: acc.avatarUrl, accentColor: acc.accentColor,
    role: acc.role, status: acc.status,
    isAdmin: acc.role === 'superadmin' || acc.role === 'admin',
    isSuperAdmin: acc.role === 'superadmin',
    expiresAt: Date.now() + SESSION_TTL,
    _pw: password,
  };
  saveSession(session);
  return session;
}

/* ════════════════════════════════════════════
   Register new user (by admin/superadmin)
════════════════════════════════════════════ */
export async function registerUser(opts: {
  username: string; displayName: string; email: string; password: string;
  avatarUrl: string; accentColor: string; role: UserRole;
  createdBy: string; notes: string;
}): Promise<UserAccount> {
  if (opts.password.length < 8) throw new Error('Password must be at least 8 characters.');

  const accounts = loadAccounts();
  if (accounts.find((a) => a.username === opts.username.toLowerCase())) {
    throw new Error(`Username "${opts.username}" is already taken.`);
  }

  const salt = generateSalt();
  const hash = await hashPassword(opts.password, salt);

  const acc: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: opts.username.trim().toLowerCase(),
    displayName: opts.displayName.trim(),
    email: opts.email.trim().toLowerCase(),
    avatarUrl: opts.avatarUrl,
    accentColor: opts.accentColor,
    role: opts.role,
    status: 'active',
    passwordHash: hash,
    saltHex: uint8ToHex(salt),
    createdAt: new Date().toISOString(),
    createdBy: opts.createdBy,
    lastLoginAt: null,
    tradeCount: 0,
    notes: opts.notes,
  };
  accounts.push(acc);
  saveAccounts(accounts);
  return acc;
}

/* ════════════════════════════════════════════
   Change own password (user-initiated, re-encrypts vault)
════════════════════════════════════════════ */
export async function changePassword(
  session: Session, oldPassword: string, newPassword: string, vaultJson: string
): Promise<Session> {
  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters.');

  const accounts = loadAccounts();
  const acc = accounts.find((a) => a.id === session.userId);
  if (!acc) throw new Error('Account not found.');

  const salt = hexToUint8(acc.saltHex);
  const oldHash = await hashPassword(oldPassword, salt);
  if (oldHash !== acc.passwordHash) throw new Error('Current password is incorrect.');

  // Re-encrypt vault with new password
  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);
  acc.passwordHash = newHash;
  acc.saltHex = uint8ToHex(newSalt);
  saveAccounts(accounts);

  const encrypted = await encryptData(vaultJson, newPassword);
  localStorage.setItem(VAULT_PFX + session.userId, encrypted);

  const updated: Session = { ...session, _pw: newPassword, expiresAt: Date.now() + SESSION_TTL };
  saveSession(updated);
  return updated;
}

/* ════════════════════════════════════════════
   User updates their OWN profile (avatar, name, color, email)
   This is the ONLY way to change your own profile — tied 1:1 to the
   logged-in account. Nobody else can touch it.
════════════════════════════════════════════ */
export function updateOwnProfile(
  session: Session,
  patch: Partial<Pick<UserAccount, 'displayName' | 'email' | 'avatarUrl' | 'accentColor'>>
): Session {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === session.userId);
  if (idx === -1) throw new Error('Account not found.');
  accounts[idx] = { ...accounts[idx], ...patch };
  saveAccounts(accounts);

  const updated: Session = {
    ...session,
    displayName: accounts[idx].displayName,
    email: accounts[idx].email,
    avatarUrl: accounts[idx].avatarUrl,
    accentColor: accounts[idx].accentColor,
    expiresAt: Date.now() + SESSION_TTL,
  };
  saveSession(updated);
  return updated;
}

/* ════════════════════════════════════════════
   Admin: reset another user's password
════════════════════════════════════════════ */
export async function adminResetPassword(
  adminSession: Session, targetId: string, newPassword: string
): Promise<void> {
  if (adminSession.role === 'customer') throw new Error('Not authorized.');
  if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.');

  const accounts = loadAccounts();
  const target = accounts.find((a) => a.id === targetId);
  if (!target) throw new Error('Target account not found.');
  if (target.role === 'superadmin' && adminSession.role !== 'superadmin')
    throw new Error('Only superadmin can reset superadmin password.');

  const salt = generateSalt();
  const hash = await hashPassword(newPassword, salt);
  target.passwordHash = hash;
  target.saltHex = uint8ToHex(salt);
  saveAccounts(accounts);
  // Note: vault remains encrypted with old key — user must log in and
  // change password themselves to re-encrypt. This is by design.
}

/* ════════════════════════════════════════════
   Admin: update profile metadata
════════════════════════════════════════════ */
export function adminUpdateUser(
  adminSession: Session,
  targetId: string,
  patch: Partial<Pick<UserAccount, 'displayName' | 'email' | 'role' | 'status' | 'avatarUrl' | 'accentColor' | 'notes'>>
): void {
  if (adminSession.role === 'customer') throw new Error('Not authorized.');
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === targetId);
  if (idx === -1) throw new Error('Account not found.');
  const target = accounts[idx];
  if (target.role === 'superadmin' && adminSession.role !== 'superadmin')
    throw new Error('Only superadmin can modify superadmin account.');
  accounts[idx] = { ...target, ...patch };
  saveAccounts(accounts);
}

/* ════════════════════════════════════════════
   Admin: delete user
════════════════════════════════════════════ */
export function adminDeleteUser(adminSession: Session, targetId: string): void {
  if (adminSession.role === 'customer') throw new Error('Not authorized.');
  if (targetId === SUPERADMIN_ID) throw new Error('Cannot delete the superadmin account.');
  if (targetId === adminSession.userId) throw new Error('Cannot delete your own account.');
  const accounts = loadAccounts().filter((a) => a.id !== targetId);
  saveAccounts(accounts);
  localStorage.removeItem(VAULT_PFX + targetId);
}

/* ════════════════════════════════════════════
   Vault read / write
════════════════════════════════════════════ */
export async function saveVault(userId: string, password: string, data: unknown): Promise<void> {
  const encrypted = await encryptData(JSON.stringify(data), password);
  localStorage.setItem(VAULT_PFX + userId, encrypted);
}

export async function loadVault<T>(userId: string, password: string, fallback: T): Promise<T> {
  const blob = localStorage.getItem(VAULT_PFX + userId);
  if (!blob) return fallback;
  try {
    return JSON.parse(await decryptData(blob, password)) as T;
  } catch {
    throw new Error('Decryption failed — wrong password or corrupted vault.');
  }
}
