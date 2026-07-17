import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  displayName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  avatarUrl: { type: String, default: '/images/creator-avatar.png' },
  accentColor: { type: String, default: '#fbbf24' },
  role: { type: String, enum: ['superadmin', 'admin', 'customer'], default: 'customer' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  passwordHash: { type: String, required: true },
  saltHex: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  createdBy: { type: String, default: 'system' },
  lastLoginAt: { type: String, default: null },
  tradeCount: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  versionKey: false
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
