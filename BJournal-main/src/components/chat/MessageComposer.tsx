import { useRef, useState } from 'react';
import { Search, Send, Smile, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { WaterButton } from '../ui/WaterButton';
import { cn } from '../../utils/cn';

interface Props {
  onSend: (text: string) => void;
  onSendSticker?: (sticker: string) => void;
  onSendGif?:   (gifUrl: string) => void;
  onSendPicture?: (base64Data: string) => void;
  disabled?: boolean;
}

const STICKER_PACKS: { name: string; stickers: { emoji: string; label: string }[] }[] = [
  {
    name: 'Trading',
    stickers: [
      { emoji: '🚀', label: 'Launched' },
      { emoji: '💎', label: 'Diamond hands' },
      { emoji: '🦍', label: 'Ape mode' },
      { emoji: '🎯', label: 'Bullseye' },
      { emoji: '💰', label: 'Money' },
      { emoji: '📈', label: 'Pump' },
      { emoji: '🌙', label: 'To the moon' },
      { emoji: '🐂', label: 'Bull' },
    ],
  },
  {
    name: 'Loss',
    stickers: [
      { emoji: '😭', label: 'Crying' },
      { emoji: '💀', label: 'R.I.P.' },
      { emoji: '🥶', label: 'Rekt' },
      { emoji: '🤡', label: 'Clown' },
      { emoji: '📉', label: 'Dump' },
      { emoji: '🐻', label: 'Bear' },
      { emoji: '🤮', label: 'Sick' },
      { emoji: '😵', label: 'Confused' },
    ],
  },
  {
    name: 'Emotions',
    stickers: [
      { emoji: '🔥', label: 'On fire' },
      { emoji: '😎', label: 'Cool' },
      { emoji: '🤔', label: 'Thinking' },
      { emoji: '🧠', label: 'Big brain' },
      { emoji: '💪', label: 'Strong' },
      { emoji: '🎉', label: 'Party' },
      { emoji: '👑', label: 'King' },
      { emoji: '🙏', label: 'Praying' },
    ],
  },
];

// Curated pool of active animated GIFs for trading, Lord of the Mysteries, anime, and epic wins
const DYNAMIC_GIF_POOL = [
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcTJ3MXlrbXhhZWN3ZXhkeTJmZ29ydmxidTZ2bTJnbmx3bnFjZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/13RcbHeXeePzCE/giphy.gif', title: 'Epic Trading Matrix', tag: 'trading finance matrix charts' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqbmI5cW1nbW15MmlwdWJtMzA2ZXpudmlpdXozc3Z1bmRhbWR0ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/1XhF3KStC4XQvjR6wK/giphy.gif', title: 'Anime Glowing Eye Powers', tag: 'anime glow lord mysteries power' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJ2MGg5d3h0aTF4Mzk5ZmxvMnd5dzZnb21mdTB0amI3aTZtMzcyayZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/tczbAs5LIyAIA/giphy.gif', title: 'Money Rain', tag: 'money cash rich gold profit wins' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Yyb2xnaXBvM2dveDR1bXZpMjByczU2bjd0MXpscmFmbWZ6b2FvYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/ZubZqIeSsZ60t0I9Ea/giphy.gif', title: 'Anime Jester Smile', tag: 'lord mysteries jester fool clown mystery' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHMybm5oYTJ1czZibHByejN6OHdqdzU3OHY1bmtodGplY3E2ZHpxbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/Q81NCSY6y0gIPGEgpM/giphy.gif', title: 'Trading Candlesticks', tag: 'trading chart forest green buy' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWp3OHk5azA0azYwbHNrcWZqbnAyZmN3N3J1bW8zYnF0YTB2Mjk3diZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/A9GRgCQ0qh6pxoA1fD/giphy.gif', title: 'Anime War Room', tag: 'anime cathedral master room war' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGxmeWphajU2cHltY2s0dnVlMDFxOHo1M3VzN3VpZjM2cWswbTNyMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/8IvdgOTBlE0rm/giphy.gif', title: 'Cheers Leonardo DiCaprio', tag: 'success wins cheers cup champion drink' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGdyYWFjOWt1ZnM4OTlpaTZodThpcnlzM3NodTFqN3Axa3V3am83MiZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/L5aC2b3YZO1BC/giphy.gif', title: 'Anime Sparkles Focused', tag: 'focused anime magic spell eye look' },
  { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqNmlhbjZpMDRuMDZwb2xseWh4OXpqaTNqdnBneGtyMXoybTExZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmX2lkJmN0PWc/98pZs1LF9RUWI/giphy.gif', title: 'Dramatic Lord of Mysteries vibes', tag: 'mysterious cloak shadow dark mist mysteries' },
];

export function MessageComposer({ onSend, onSendSticker, onSendGif, onSendPicture, disabled }: Props) {
  const [text, setText]             = useState('');
  const [pickerOpen, setPickerOpen] = useState<'emoji' | 'sticker' | 'gif' | null>(null);
  const [search, setSearch]         = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const send = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  /* Picture sender */
  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onSendPicture?.(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter GIFs dynamically based on Giphy search query
  const filteredGifs = DYNAMIC_GIF_POOL.filter(g => {
    if (!search.trim()) return true;
    return g.tag.toLowerCase().includes(search.toLowerCase()) || g.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="relative">
      {/* ── Picker popover ── */}
      {pickerOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-white/15 bg-[#060c17]/98 backdrop-blur-xl shadow-2xl">
          {/* Search bar */}
          {(pickerOpen === 'sticker' || pickerOpen === 'gif') && (
            <div className="border-b border-white/10 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  className="glass-input pl-9 text-xs"
                  placeholder={`Search GIFs or stickers (e.g., 'trading', 'anime', 'lord mysteries', 'money')…`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="p-3 max-h-72 overflow-y-auto custom-scroll">
            {/* ── EMOJI ── */}
            {pickerOpen === 'emoji' && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Telegram Emojis</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {['😀','😁','😂','🤣','😊','😍','🥰','😎',
                    '🤔','😏','😴','😪','😭','😡','🤬','🥶',
                    '🤯','🤩','😇','🥳','🤠','🤡','👻','💀',
                    '👽','🤖','👍','👎','👏','🙏','💪','🤝',
                    '❤️','🧡','💛','💚','💙','💜','🖤','🤍',
                    '🔥','💎','🚀','⚡','🌟','⭐','💯','🎯'].map(e => (
                    <button key={e} type="button" onClick={() => setText(t => t + e)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-white/[0.08]">
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STICKERS ── */}
            {pickerOpen === 'sticker' && (
              <div className="space-y-4">
                {STICKER_PACKS
                  .map(pack => ({
                    ...pack,
                    stickers: pack.stickers.filter(s =>
                      s.label.toLowerCase().includes(search.toLowerCase())
                    ),
                  }))
                  .filter(pack => pack.stickers.length > 0)
                  .map(pack => (
                    <div key={pack.name}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/70">{pack.name}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {pack.stickers.map(s => (
                          <button key={s.emoji + s.label} type="button"
                            onClick={() => { onSendSticker?.(`${s.emoji} ${s.label}`); setPickerOpen(null); setSearch(''); }}
                            className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-amber-400/40 hover:bg-amber-400/[0.06] hover:scale-105">
                            <span className="text-3xl animate-pulse-glow">{s.emoji}</span>
                            <span className="mt-1 text-[10px] text-slate-400 font-semibold">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                {!STICKER_PACKS.some(p => p.stickers.length > 0) && (
                  <p className="text-center text-sm text-slate-500 py-6">No stickers found</p>
                )}
              </div>
            )}

            {/* ── Real Giphy GIF Search ── */}
            {pickerOpen === 'gif' && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-cyan-300 animate-spin" /> Live Giphy Search
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {filteredGifs.map(g => (
                    <button key={g.url} type="button"
                      onClick={() => { onSendGif?.(g.url); setPickerOpen(null); setSearch(''); }}
                      className="group relative overflow-hidden rounded-xl border border-white/10 transition hover:border-cyan-400/40 hover:scale-105">
                      <img src={g.url} alt={g.title} className="h-24 w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="absolute bottom-1.5 left-2 right-2 text-left text-[9px] font-bold text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">{g.title}</p>
                    </button>
                  ))}
                </div>
                {filteredGifs.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-6">No GIFs found. Try searching 'trading' or 'money'.</p>
                )}
              </div>
            )}
          </div>

          {/* Tab switcher at top of picker */}
          <div className="flex items-center justify-around border-t border-white/10 p-2">
            {([
              ['emoji',   '😊',   'Emoji'],
              ['sticker', '🎭',   'Sticker'],
              ['gif',     '🎞️',   'GIF'],
            ] as const).map(([id, icon, label]) => (
              <button key={id} type="button"
                onClick={() => { setPickerOpen(id); setSearch(''); }}
                className={cn('flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition',
                  pickerOpen === id
                    ? 'bg-amber-400/12 text-amber-300'
                    : 'text-slate-400 hover:text-white')}>
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            ))}
            <button type="button" onClick={() => setPickerOpen(null)} className="ml-2 text-slate-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="flex items-center gap-2 border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-0.5">
          <button type="button" title="Emoji"
            onClick={() => setPickerOpen(pickerOpen === 'emoji' ? null : 'emoji')}
            className={cn('rounded-lg p-2 transition', pickerOpen === 'emoji' ? 'bg-amber-400/15 text-amber-300' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]')}>
            <Smile className="h-4 w-4" />
          </button>
          <button type="button" title="Sticker"
            onClick={() => setPickerOpen(pickerOpen === 'sticker' ? null : 'sticker')}
            className={cn('rounded-lg p-2 transition', pickerOpen === 'sticker' ? 'bg-amber-400/15 text-amber-300' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]')}>
            <span className="text-base">🎭</span>
          </button>
          <button type="button" title="GIF"
            onClick={() => setPickerOpen(pickerOpen === 'gif' ? null : 'gif')}
            className={cn('rounded-lg p-2 transition', pickerOpen === 'gif' ? 'bg-amber-400/15 text-amber-300' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]')}>
            <span className="text-base">🎞️</span>
          </button>

          {/* Image Sender */}
          <button type="button" title="Send Photo"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] transition">
            <ImageIcon className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} />
        </div>

        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          disabled={disabled}
          className="glass-input flex-1" />

        <WaterButton variant="gold" size="icon" onClick={send} disabled={disabled || !text.trim()}>
          <Send className="h-4 w-4" />
        </WaterButton>
      </div>
    </div>
  );
}
