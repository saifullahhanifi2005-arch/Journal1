import mongoose from 'mongoose';

const VaultSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  encryptedData: { type: String, required: true },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true,
  versionKey: false
});

export const Vault = mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
