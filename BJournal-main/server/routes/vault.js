import express from 'express';
import { getVaultByUserId, saveVaultForUserId } from '../models/dbAdapter.js';

const router = express.Router();

// ─── Get User Vault ────────────────────────────────
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const encryptedData = await getVaultByUserId(userId);
    res.json({ userId, encryptedData: encryptedData || null });
  } catch (err) {
    console.error('Error loading vault:', err);
    res.status(500).json({ error: 'Failed to load encrypted vault from cloud' });
  }
});

// ─── Save User Vault ───────────────────────────────
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { encryptedData } = req.body;
    if (!encryptedData) {
      return res.status(400).json({ error: 'Missing encryptedData in request body' });
    }
    const result = await saveVaultForUserId(userId, encryptedData);
    res.json(result);
  } catch (err) {
    console.error('Error saving vault:', err);
    res.status(500).json({ error: 'Failed to save encrypted vault to cloud' });
  }
});

export default router;
