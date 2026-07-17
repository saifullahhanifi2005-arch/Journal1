/**
 * Hybrid Cloud/Local Database Adapter
 *
 * Automatically checks if MongoDB Atlas connection is active (`mongoose.connection.readyState === 1`).
 * - If active: executes queries against MongoDB Atlas.
 * - If not active (e.g. running locally offline without MONGODB_URI set): falls back to local file storage `data/db.json`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { User } from './User.js';
import { Vault } from './Vault.js';
import { ChatMessage } from './ChatMessage.js';
import { ArenaSnapshot } from './ArenaSnapshot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/db.json');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function loadLocalDb() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { users: [], vaults: {}, chats: [], snapshots: {} };
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      vaults: parsed.vaults || {},
      chats: parsed.chats || [],
      snapshots: parsed.snapshots || {}
    };
  } catch (err) {
    console.error('Error reading local db.json:', err.message);
    return { users: [], vaults: {}, chats: [], snapshots: {} };
  }
}

function saveLocalDb(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local db.json:', err.message);
  }
}

// ─── User Accounts Operations ───────────────────────

export async function getAllUsers() {
  if (isMongoConnected()) {
    return await User.find({}).sort({ createdAt: -1 }).lean();
  }
  const db = loadLocalDb();
  return db.users;
}

export async function getUserById(id) {
  if (isMongoConnected()) {
    return await User.findOne({ id }).lean();
  }
  const db = loadLocalDb();
  return db.users.find(u => u.id === id) || null;
}

export async function getUserByUsername(username) {
  const uname = username.trim().toLowerCase();
  if (isMongoConnected()) {
    return await User.findOne({ username: uname }).lean();
  }
  const db = loadLocalDb();
  return db.users.find(u => u.username.toLowerCase() === uname) || null;
}

export async function upsertUser(userObj) {
  if (isMongoConnected()) {
    return await User.findOneAndUpdate(
      { id: userObj.id },
      { $set: userObj },
      { upsert: true, new: true }
    ).lean();
  }
  const db = loadLocalDb();
  const idx = db.users.findIndex(u => u.id === userObj.id);
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], ...userObj };
  } else {
    db.users.push(userObj);
  }
  saveLocalDb(db);
  return userObj;
}

export async function deleteUserById(id) {
  if (isMongoConnected()) {
    await User.deleteOne({ id });
    await Vault.deleteOne({ userId: id });
    await ArenaSnapshot.deleteOne({ userId: id });
    return true;
  }
  const db = loadLocalDb();
  db.users = db.users.filter(u => u.id !== id);
  delete db.vaults[id];
  delete db.snapshots[id];
  saveLocalDb(db);
  return true;
}

// ─── Encrypted Vault Operations ─────────────────────

export async function getVaultByUserId(userId) {
  if (isMongoConnected()) {
    const v = await Vault.findOne({ userId }).lean();
    return v ? v.encryptedData : null;
  }
  const db = loadLocalDb();
  return db.vaults[userId] || null;
}

export async function saveVaultForUserId(userId, encryptedData) {
  const updatedAt = new Date().toISOString();
  if (isMongoConnected()) {
    await Vault.findOneAndUpdate(
      { userId },
      { $set: { encryptedData, updatedAt } },
      { upsert: true, new: true }
    );
    return { success: true, updatedAt };
  }
  const db = loadLocalDb();
  db.vaults[userId] = encryptedData;
  saveLocalDb(db);
  return { success: true, updatedAt };
}

// ─── Chat Messages Operations ───────────────────────

export async function getChatMessages(limit = 100) {
  if (isMongoConnected()) {
    return await ChatMessage.find({}).sort({ createdAt: 1 }).limit(limit).lean();
  }
  const db = loadLocalDb();
  return db.chats.slice(-limit);
}

export async function saveChatMessage(msgObj) {
  if (isMongoConnected()) {
    return await ChatMessage.findOneAndUpdate(
      { id: msgObj.id },
      { $set: msgObj },
      { upsert: true, new: true }
    ).lean();
  }
  const db = loadLocalDb();
  db.chats.push(msgObj);
  if (db.chats.length > 500) {
    db.chats = db.chats.slice(-500);
  }
  saveLocalDb(db);
  return msgObj;
}

// ─── Arena Snapshots Operations ─────────────────────

export async function getAllSnapshots() {
  if (isMongoConnected()) {
    const list = await ArenaSnapshot.find({ shareEnabled: true }).lean();
    const map = {};
    list.forEach(s => { map[s.userId] = s; });
    return map;
  }
  const db = loadLocalDb();
  return db.snapshots || {};
}

export async function saveSnapshotData(snapshotObj) {
  if (isMongoConnected()) {
    await ArenaSnapshot.findOneAndUpdate(
      { userId: snapshotObj.userId },
      { $set: snapshotObj },
      { upsert: true, new: true }
    );
    return snapshotObj;
  }
  const db = loadLocalDb();
  if (!db.snapshots) db.snapshots = {};
  db.snapshots[snapshotObj.userId] = snapshotObj;
  saveLocalDb(db);
  return snapshotObj;
}
