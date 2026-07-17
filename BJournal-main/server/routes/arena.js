import express from 'express';
import { getAllSnapshots, saveSnapshotData } from '../models/dbAdapter.js';

const router = express.Router();

// ─── Get All Public Snapshots ──────────────────────
router.get('/snapshots', async (_req, res) => {
  try {
    const snapshots = await getAllSnapshots();
    res.json({ snapshots });
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    res.status(500).json({ error: 'Failed to fetch public arena snapshots' });
  }
});

// ─── Save / Update Public Snapshot ─────────────────
router.post('/snapshots', async (req, res) => {
  try {
    const { snapshot } = req.body;
    if (!snapshot || !snapshot.userId) {
      return res.status(400).json({ error: 'Missing snapshot data or userId' });
    }
    const saved = await saveSnapshotData(snapshot);
    res.json({ success: true, snapshot: saved });
  } catch (err) {
    console.error('Error saving arena snapshot:', err);
    res.status(500).json({ error: 'Failed to save arena snapshot' });
  }
});

export default router;
