import express from 'express';
import { getChatMessages, saveChatMessage } from '../models/dbAdapter.js';

const router = express.Router();

// ─── Get Messages ──────────────────────────────────
router.get('/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const messages = await getChatMessages(limit);
    res.json({ messages });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// ─── Send/Sync Message ─────────────────────────────
router.post('/messages', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.id || !message.authorId) {
      return res.status(400).json({ error: 'Invalid chat message data' });
    }
    const saved = await saveChatMessage(message);
    res.json({ success: true, message: saved });
  } catch (err) {
    console.error('Error saving chat message:', err);
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

export default router;
