import express from 'express';
import { getAllUsers, getUserById, getUserByUsername, upsertUser, deleteUserById } from '../models/dbAdapter.js';

const router = express.Router();

// ─── Get All Accounts ──────────────────────────────
router.get('/accounts', async (_req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ accounts: users });
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch user accounts' });
  }
});

// ─── Get Single Account ────────────────────────────
router.get('/accounts/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Account not found' });
    res.json({ account: user });
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ error: 'Failed to fetch account details' });
  }
});

// ─── Sync / Upsert Account ─────────────────────────
// Used when registering, changing password, updating profile, or bootstrapping superadmin
router.post('/sync-account', async (req, res) => {
  try {
    const { account } = req.body;
    if (!account || !account.id || !account.username) {
      return res.status(400).json({ error: 'Invalid account data provided' });
    }
    const saved = await upsertUser(account);
    res.json({ success: true, account: saved });
  } catch (err) {
    console.error('Error syncing account:', err);
    res.status(500).json({ error: 'Failed to sync account to cloud/database' });
  }
});

// ─── Delete Account ────────────────────────────────
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'superadmin-saifullah-001') {
      return res.status(403).json({ error: 'Cannot delete superadmin account' });
    }
    await deleteUserById(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
