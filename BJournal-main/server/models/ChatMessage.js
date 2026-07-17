import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  groupId: { type: String, default: 'group-general', index: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  authorColor: { type: String, default: '#fbbf24' },
  text: { type: String, default: '' },
  type: { type: String, enum: ['text', 'trade', 'pnl', 'sticker', 'gif', 'picture', 'system'], default: 'text' },
  tradeRef: { type: Object, default: null },
  mediaUrl: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true,
  versionKey: false
});

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
