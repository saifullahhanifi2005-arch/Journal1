import mongoose from 'mongoose';

const ArenaSnapshotSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  accentColor: { type: String, default: '#fbbf24' },
  role: { type: String, default: 'customer' },
  shareEnabled: { type: Boolean, default: true },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  stats: { type: Object, default: {} },
  equityCurve: { type: Array, default: [] },
  monthly: { type: Array, default: [] },
  weekly: { type: Array, default: [] },
  topPairs: { type: Array, default: [] },
  strategies: { type: Array, default: [] },
  emotions: { type: Array, default: [] }
}, {
  timestamps: true,
  versionKey: false
});

export const ArenaSnapshot = mongoose.models.ArenaSnapshot || mongoose.model('ArenaSnapshot', ArenaSnapshotSchema);
