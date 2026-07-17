/**
 * Chat Groups + Messages store
 *
 * - New users are auto-added to the "General" group
 * - Admin can create new groups and assign members
 * - 15-day chat clean-up happens automatically to keep localStorage light
 */

import type { ChatGroup, ChatMessage } from '../types';
import type { UserAccount } from './authStore';

const GROUPS_KEY   = 'fhr-chat-groups-v1';
const MESSAGES_KEY = 'fhr-chat-messages-v1';
const DEFAULT_GENERAL_ID = 'group-general';

function uid(p = 'id') { return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

/* ─── Groups ─── */
export function loadGroups(): ChatGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? (JSON.parse(raw) as ChatGroup[]) : [];
  } catch { return []; }
}

export function saveGroups(groups: ChatGroup[]): void {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export function getGeneralGroup(accounts: UserAccount[]): ChatGroup {
  const allIds = accounts.map(a => a.id);
  return {
    id: DEFAULT_GENERAL_ID,
    name: 'General · The Hunting Room',
    description: 'Everyone is auto-added here. Main channel for all hunters.',
    icon: '🦊',
    color: '#fbbf24',
    memberIds: allIds,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    isDefault: true,
  };
}

export function ensureGeneralGroup(accounts: UserAccount[]): ChatGroup {
  const groups = loadGroups();
  let general = groups.find(g => g.id === DEFAULT_GENERAL_ID);
  if (!general) {
    general = getGeneralGroup(accounts);
    groups.push(general);
    saveGroups(groups);
  } else {
    // Sync member list — auto-add any new user
    const allIds = new Set([...general.memberIds, ...accounts.map(a => a.id)]);
    const updated = Array.from(allIds);
    if (updated.length !== general.memberIds.length) {
      general.memberIds = updated;
      saveGroups(groups);
    }
  }
  return general;
}

export function createGroup(opts: {
  name: string; description: string; icon: string; color: string;
  memberIds: string[]; createdBy: string;
}): ChatGroup {
  const groups = loadGroups();
  const g: ChatGroup = {
    id: uid('group'),
    name: opts.name,
    description: opts.description,
    icon: opts.icon,
    color: opts.color,
    memberIds: opts.memberIds,
    createdBy: opts.createdBy,
    createdAt: new Date().toISOString(),
    isDefault: false,
  };
  groups.push(g);
  saveGroups(groups);
  return g;
}

export function deleteGroup(id: string): void {
  if (id === DEFAULT_GENERAL_ID) return; // never delete general
  const groups = loadGroups().filter(g => g.id !== id);
  saveGroups(groups);
  // also clear messages
  const msgs = loadAllMessages().filter(m => m.groupId !== id);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
}

export function addMemberToGroup(groupId: string, userId: string): void {
  const groups = loadGroups();
  const g = groups.find(g => g.id === groupId);
  if (!g) return;
  if (!g.memberIds.includes(userId)) {
    g.memberIds.push(userId);
    saveGroups(groups);
  }
}

export function removeMemberFromGroup(groupId: string, userId: string): void {
  const groups = loadGroups();
  const g = groups.find(g => g.id === groupId);
  if (!g) return;
  g.memberIds = g.memberIds.filter(id => id !== userId);
  saveGroups(groups);
}

/* ─── Messages (Auto-clearing after 15 days) ─── */
export function loadAllMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];

    // ── Storage Optimization: Clear chats older than 15 days automatically ──
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const cleanList = parsed.filter(m => {
      const msgTime = new Date(m.createdAt).getTime();
      return msgTime >= fifteenDaysAgo;
    });

    if (cleanList.length !== parsed.length) {
      saveAllMessages(cleanList);
    }
    return cleanList;
  } catch {
    return [];
  }
}

export function loadMessages(groupId: string): ChatMessage[] {
  return loadAllMessages()
    .filter(m => m.groupId === groupId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function saveAllMessages(messages: ChatMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function sendMessage(opts: {
  groupId: string;
  author: { id: string; name: string; avatar: string; color: string };
  text: string;
  type?: ChatMessage['type'];
  tradeRef?: ChatMessage['tradeRef'];
  mediaUrl?: string;
}): ChatMessage {
  const msg: ChatMessage = {
    id: uid('msg'),
    groupId: opts.groupId,
    authorId: opts.author.id,
    authorName: opts.author.name,
    authorAvatar: opts.author.avatar,
    authorColor: opts.author.color,
    text: opts.text,
    type: opts.type || 'text',
    tradeRef: opts.tradeRef,
    mediaUrl: opts.mediaUrl,
    createdAt: new Date().toISOString(),
  };
  const all = loadAllMessages();
  all.push(msg);
  saveAllMessages(all);
  return msg;
}

export function deleteMessage(id: string): void {
  const all = loadAllMessages().filter(m => m.id !== id);
  saveAllMessages(all);
}
