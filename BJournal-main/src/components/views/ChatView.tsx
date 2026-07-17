import { useEffect, useRef, useState } from 'react';
import {
  CheckCheck, Hash, MessageSquare, Plus, Search, Trash2, UserPlus, Users,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AuthHook } from '../../hooks/useAuth';
import type { ChatGroup, ChatMessage } from '../../types';
import type { UserAccount } from '../../utils/authStore';
import {
  addMemberToGroup, createGroup, deleteGroup, ensureGeneralGroup,
  loadAllMessages, loadGroups, removeMemberFromGroup, sendMessage,
} from '../../utils/chatStore';
import { formatMoney } from '../../utils/stats';
import { GlassCard } from '../ui/GlassCard';
import { WaterButton } from '../ui/WaterButton';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { MessageComposer } from '../chat/MessageComposer';
import { ChatSearch } from '../chat/ChatSearch';
import { cn } from '../../utils/cn';

interface Props { auth: AuthHook; }

const GROUP_ICONS = ['🦊', '💎', '⚔️', '📊', '🧠', '🎯', '🔥', '👑', '💰', '🌍', '🚀', '⚡'];
const GROUP_COLORS = ['#fbbf24', '#22d3ee', '#a78bfa', '#34d399', '#fb7185', '#60a5fa', '#f97316', '#e879f9'];

export function ChatView({ auth }: Props) {
  const [groups, setGroups]     = useState<ChatGroup[]>([]);
  const [active, setActive]     = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [createOpen, setCreate] = useState(false);
  const [membersOpen, setMembers] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const accounts = auth.accounts;
    const general = ensureGeneralGroup(accounts);
    const all = loadGroups();
    setGroups(all);
    if (!active && all.length) setActive(general.id);
  }, [auth.accounts.length]);

  useEffect(() => {
    if (!active) return;
    setMessages(loadAllMessages().filter(m => m.groupId === active));
  }, [active, groups.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (highlightIdx !== null) {
      messageRefs.current[highlightIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightIdx(null);
    }
  }, [highlightIdx]);

  const refresh = () => {
    setGroups(loadGroups());
    if (active) setMessages(loadAllMessages().filter(m => m.groupId === active));
  };

  const sendText = (text: string) => {
    if (!auth.session) return;
    sendMessage({
      groupId: active,
      author: { id: auth.session.userId, name: auth.session.displayName, avatar: auth.session.avatarUrl, color: auth.session.accentColor },
      text,
    });
    setMessages(loadAllMessages().filter(m => m.groupId === active));
  };

  const sendSticker = (sticker: string) => {
    if (!auth.session) return;
    sendMessage({
      groupId: active,
      author: { id: auth.session.userId, name: auth.session.displayName, avatar: auth.session.avatarUrl, color: auth.session.accentColor },
      text: sticker, type: 'sticker',
    });
    setMessages(loadAllMessages().filter(m => m.groupId === active));
  };

  const sendGif = (gifUrl: string) => {
    if (!auth.session) return;
    sendMessage({
      groupId: active,
      author: { id: auth.session.userId, name: auth.session.displayName, avatar: auth.session.avatarUrl, color: auth.session.accentColor },
      text: '🎞️ GIF', type: 'gif', mediaUrl: gifUrl,
    });
    setMessages(loadAllMessages().filter(m => m.groupId === active));
  };

  const sendPicture = (base64Data: string) => {
    if (!auth.session) return;
    sendMessage({
      groupId: active,
      author: { id: auth.session.userId, name: auth.session.displayName, avatar: auth.session.avatarUrl, color: auth.session.accentColor },
      text: '📷 Photo Shared', type: 'picture', mediaUrl: base64Data,
    });
    setMessages(loadAllMessages().filter(m => m.groupId === active));
  };

  const activeGroup = groups.find(g => g.id === active);
  const myGroups    = groups.filter(g => g.memberIds.includes(auth.session?.userId || ''));
  const visibleGroups = auth.isSuperAdmin ? groups : myGroups;

  return (
    <div className="grid h-[calc(100vh-180px)] min-h-[600px] gap-4 lg:grid-cols-[280px_1fr]">

      {/* ── Sidebar ── */}
      <GlassCard padding="none" className="flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-300" />
            <h3 className="font-bold text-white">Chat Groups</h3>
          </div>
          <WaterButton variant="gold" size="sm" onClick={() => setCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
          </WaterButton>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
          {visibleGroups.map(g => {
            const isActive = active === g.id;
            const memberCount = g.memberIds.length;
            return (
              <button key={g.id} onClick={() => setActive(g.id)}
                className={cn('group flex w-full items-center gap-3 rounded-xl p-3 text-left transition',
                  isActive
                    ? 'bg-amber-400/12 text-white border border-amber-400/30'
                    : 'text-slate-300 hover:bg-white/[0.04] border border-transparent')}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg shrink-0 border"
                  style={{ background: g.color + '18', borderColor: g.color + '40' }}>
                  {g.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{g.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {memberCount} member{memberCount !== 1 ? 's' : ''}
                    {g.isDefault && <span className="ml-1">· auto</span>}
                  </p>
                </div>
                {g.isDefault && <span title="Default group">📌</span>}
              </button>
            );
          })}
          {!visibleGroups.length && (
            <p className="px-3 py-6 text-center text-sm text-slate-500">No groups yet.</p>
          )}
        </div>
      </GlassCard>

      {/* ── Main chat ── */}
      <GlassCard padding="none" className="flex flex-col overflow-hidden">
        {activeGroup ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg shrink-0 border"
                  style={{ background: activeGroup.color + '18', borderColor: activeGroup.color + '40' }}>
                  {activeGroup.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-white">{activeGroup.name}</h3>
                  <p className="text-[11px] text-slate-500">{activeGroup.memberIds.length} members</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <WaterButton variant="ghost" size="icon" onClick={() => setSearchOpen(s => !s)} aria-label="Search">
                  <Search className="h-4 w-4" />
                </WaterButton>
                {auth.isAdmin && (
                  <WaterButton variant="secondary" size="sm" onClick={() => setMembers(true)}>
                    <UserPlus className="h-3.5 w-3.5" /> Members
                  </WaterButton>
                )}
              </div>
            </div>

            {searchOpen && (
              <ChatSearch
                messages={messages}
                onJump={(idx) => setHighlightIdx(idx)}
                onClose={() => setSearchOpen(false)}
              />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-3">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Hash className="h-12 w-12 text-amber-300/20 mb-3" />
                  <p className="text-slate-400">No messages yet</p>
                  <p className="text-sm text-slate-600">Be the first to say hello! Use 😊 🎭 🎞️ 📷 below</p>
                </div>
              )}
              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  m={m}
                  isMe={m.authorId === auth.session?.userId}
                  prev={messages[i - 1]}
                  highlighted={highlightIdx === i}
                  registerRef={(el) => { messageRefs.current[i] = el; }}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <MessageComposer
              onSend={sendText}
              onSendSticker={sendSticker}
              onSendGif={sendGif}
              onSendPicture={sendPicture}
              disabled={!auth.session}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <MessageSquare className="mx-auto h-12 w-12 text-amber-300/20 mb-3" />
              <p className="text-slate-400">Select a group to start chatting</p>
            </div>
          </div>
        )}
      </GlassCard>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreate(false)}
        onCreated={() => { setCreate(false); refresh(); }}
        accounts={auth.accounts}
        currentUserId={auth.session?.userId || ''}
      />

      {activeGroup && (
        <MembersModal
          open={membersOpen}
          onClose={() => setMembers(false)}
          group={activeGroup}
          accounts={auth.accounts}
          isAdmin={auth.isAdmin}
          onChange={() => refresh()}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   Single message bubble (text/sticker/gif/picture/trade)
════════════════════════════════════════ */
function MessageBubble({ m, isMe, prev, highlighted, registerRef }: {
  m: ChatMessage; isMe: boolean; prev?: ChatMessage;
  highlighted: boolean; registerRef: (el: HTMLDivElement | null) => void;
}) {
  const showAvatar = !prev || prev.authorId !== m.authorId;

  return (
    <div ref={registerRef}
      className={cn('flex gap-3 transition-all rounded-xl',
        isMe ? 'flex-row-reverse' : '',
        highlighted && 'bg-amber-400/10 ring-2 ring-amber-400/40 p-2 -m-2')}
    >
      {showAvatar ? (
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 shadow"
          style={{ borderColor: m.authorColor + '40', boxShadow: `0 0 8px ${m.authorColor}30` }}>
          {m.authorAvatar
            ? <img src={m.authorAvatar} alt="" className="h-full w-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            : <div className="flex h-full w-full items-center justify-center text-xs font-black"
                style={{ background: m.authorColor + '18', color: m.authorColor }}>
              {m.authorName.charAt(0)}
            </div>}
        </div>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className={cn('min-w-0 max-w-[75%]', isMe ? 'items-end text-right' : '')}>
        {showAvatar && (
          <div className={cn('mb-1 flex items-center gap-2 text-[11px]', isMe && 'justify-end')}>
            <span className="font-bold" style={{ color: m.authorColor }}>{m.authorName}</span>
            <span className="text-slate-500">{format(new Date(m.createdAt), 'HH:mm')}</span>
          </div>
        )}

        {/* Local Picture uploaded */}
        {m.type === 'picture' && m.mediaUrl && (
          <div className="overflow-hidden rounded-2xl border border-amber-300/30 shadow-lg max-w-sm">
            <img src={m.mediaUrl} alt="Photo Uploaded" className="max-h-64 object-cover" />
          </div>
        )}

        {/* GIF from Giphy */}
        {m.type === 'gif' && m.mediaUrl && (
          <div className="overflow-hidden rounded-2xl border border-cyan-400/30">
            <img src={m.mediaUrl} alt="GIF" className="max-h-64 w-auto" />
          </div>
        )}

        {/* Sticker */}
        {m.type === 'sticker' && (
          <div className="rounded-2xl bg-white/[0.04] border border-amber-300/20 px-4 py-3 text-center">
            <p className="text-3xl">{m.text.split(' ')[0]}</p>
            <p className="text-[11px] text-slate-500 mt-1">{m.text.split(' ').slice(1).join(' ')}</p>
          </div>
        )}

        {/* Text */}
        {m.type === 'text' && (
          <div className={cn('inline-block rounded-2xl px-4 py-2.5 text-sm shadow-lg',
            isMe
              ? 'rounded-tr-sm bg-amber-400/15 text-white border border-amber-400/30'
              : 'rounded-tl-sm bg-white/[0.05] text-slate-100 border border-white/8')}>
            <p className="whitespace-pre-wrap break-words">{m.text}</p>
          </div>
        )}

        {/* Trade share */}
        {m.type === 'trade' && m.tradeRef && (
          <div className={cn('inline-block rounded-2xl px-4 py-2.5 text-sm shadow-lg',
            isMe
              ? 'rounded-tr-sm bg-amber-400/15 text-white border border-amber-400/30'
              : 'rounded-tl-sm bg-white/[0.05] text-slate-100 border border-white/8')}>
            <p className="whitespace-pre-wrap break-words">{m.text}</p>
            <div className="rounded-lg bg-black/30 p-2 mt-2 text-xs flex items-center justify-between gap-3">
              <span className="font-bold">{m.tradeRef.pair}</span>
              <Badge tone={m.tradeRef.result === 'win' ? 'success' : m.tradeRef.result === 'loss' ? 'danger' : 'warning'}>
                {m.tradeRef.result}
              </Badge>
              <span className={m.tradeRef.pnl >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                {m.tradeRef.pnl >= 0 ? '+' : ''}{formatMoney(m.tradeRef.pnl)}
              </span>
            </div>
          </div>
        )}

        {isMe && m.type === 'text' && (
          <div className="mt-1 flex justify-end text-[10px] text-slate-500">
            <CheckCheck className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Create Group Modal
════════════════════════════════════════ */
function CreateGroupModal({ open, onClose, onCreated, accounts, currentUserId }: {
  open: boolean; onClose: () => void; onCreated: () => void;
  accounts: UserAccount[]; currentUserId: string;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('⚔️');
  const [color, setColor] = useState('#22d3ee');
  const [selectedIds, setSelectedIds] = useState<string[]>([currentUserId]);

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = () => {
    if (!name.trim() || selectedIds.length < 2) return;
    createGroup({
      name: name.trim(), description: desc.trim(), icon, color,
      memberIds: Array.from(new Set([...selectedIds, currentUserId])),
      createdBy: currentUserId,
    });
    setName(''); setDesc(''); setSelectedIds([currentUserId]);
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Group"
      subtitle="Add a private channel for your team"
      footer={
        <>
          <WaterButton variant="secondary" onClick={onClose}>Cancel</WaterButton>
          <WaterButton variant="gold" onClick={submit} disabled={!name.trim() || selectedIds.length < 2}>
            <Plus className="h-4 w-4" /> Create Group
          </WaterButton>
        </>
      }>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Group Name *</span>
            <input className="glass-input" placeholder="e.g. London Killzone"
              value={name} onChange={e => setName(e.target.value)} autoFocus />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Description</span>
            <input className="glass-input" placeholder="What's this group about?"
              value={desc} onChange={e => setDesc(e.target.value)} />
          </label>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Icon</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GROUP_ICONS.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={cn('h-9 w-9 rounded-xl border text-base transition',
                    icon === i ? 'border-amber-400 bg-amber-400/12' : 'border-white/10 bg-white/[0.03]')}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Color</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GROUP_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('h-7 w-7 rounded-full border-2 transition hover:scale-110',
                    color === c ? 'border-white scale-110' : 'border-transparent')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Add Members * ({selectedIds.length} selected)
          </p>
          <div className="max-h-60 overflow-y-auto custom-scroll space-y-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-2">
            {accounts.filter(a => a.status === 'active').map(acc => {
              const sel = selectedIds.includes(acc.id);
              const isSelf = acc.id === currentUserId;
              return (
                <button key={acc.id} type="button" onClick={() => !isSelf && toggle(acc.id)}
                  disabled={isSelf}
                  className={cn('flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition',
                    sel ? 'border-amber-400/40 bg-amber-400/[0.08]' : 'border-white/5 bg-white/[0.02]',
                    isSelf && 'opacity-70')}
                >
                  <input type="checkbox" checked={sel} disabled={isSelf} readOnly className="accent-amber-400" />
                  <div className="h-7 w-7 overflow-hidden rounded-full border"
                    style={{ borderColor: acc.accentColor + '40' }}>
                    {acc.avatarUrl
                      ? <img src={acc.avatarUrl} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-[10px] font-black"
                          style={{ color: acc.accentColor }}>{acc.displayName.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{acc.displayName} {isSelf && '(You)'}</p>
                    <p className="text-[10px] text-slate-500 capitalize">@{acc.username} · {acc.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════
   Members Manager Modal
════════════════════════════════════════ */
function MembersModal({ open, onClose, group, accounts, isAdmin, onChange }: {
  open: boolean; onClose: () => void; group: ChatGroup;
  accounts: UserAccount[]; isAdmin: boolean;
  onChange: () => void;
}) {
  const memberObjs = accounts.filter(a => group.memberIds.includes(a.id));
  const notMembers = accounts.filter(a => !group.memberIds.includes(a.id) && a.status === 'active');

  return (
    <Modal open={open} onClose={onClose} title={group.name} subtitle={`${group.memberIds.length} members`}>
      <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Current Members</p>
          <div className="space-y-1.5">
            {memberObjs.map(acc => {
              const isCreator = acc.id === group.createdBy;
              return (
                <div key={acc.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div className="h-9 w-9 overflow-hidden rounded-full border"
                    style={{ borderColor: acc.accentColor + '50' }}>
                    {acc.avatarUrl
                      ? <img src={acc.avatarUrl} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-xs font-black"
                          style={{ color: acc.accentColor }}>{acc.displayName.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{acc.displayName}</p>
                    <p className="text-[10px] text-slate-500 capitalize">@{acc.username} · {acc.role}</p>
                  </div>
                  {isCreator && <Badge tone="gold">Creator</Badge>}
                  {isAdmin && !isCreator && (
                    <button onClick={() => { removeMemberFromGroup(group.id, acc.id); onChange(); }}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isAdmin && notMembers.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Add Members</p>
            <div className="space-y-1.5">
              {notMembers.map(acc => (
                <button key={acc.id} onClick={() => { addMemberToGroup(group.id, acc.id); onChange(); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition hover:border-amber-400/30">
                  <UserPlus className="h-4 w-4 text-amber-300/50" />
                  <div className="h-8 w-8 overflow-hidden rounded-full border"
                    style={{ borderColor: acc.accentColor + '50' }}>
                    {acc.avatarUrl
                      ? <img src={acc.avatarUrl} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-xs font-black"
                          style={{ color: acc.accentColor }}>{acc.displayName.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{acc.displayName}</p>
                    <p className="text-[10px] text-slate-500 capitalize">@{acc.username}</p>
                  </div>
                  <Plus className="h-4 w-4 text-amber-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {isAdmin && !group.isDefault && (
          <div className="border-t border-white/10 pt-4">
            <WaterButton variant="danger" onClick={() => {
              if (confirm(`Delete group "${group.name}"?`)) { deleteGroup(group.id); onChange(); onClose(); }
            }}>
              <Trash2 className="h-4 w-4" /> Delete Group
            </WaterButton>
          </div>
        )}
      </div>
    </Modal>
  );
}
