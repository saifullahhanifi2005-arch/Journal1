import { useState } from 'react';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface Props {
  messages: ChatMessage[];
  onJump: (index: number) => void;
  onClose: () => void;
}

export function ChatSearch({ messages, onJump, onClose }: Props) {
  const [query, setQuery]     = useState('');
  const [activeIdx, setActive] = useState(0);

  const results = query.trim().length >= 2
    ? messages
        .map((m, i) => ({ m, i }))
        .filter(({ m }) =>
          m.text.toLowerCase().includes(query.toLowerCase()) ||
          m.authorName.toLowerCase().includes(query.toLowerCase())
        )
        .reverse()
    : [];

  const jump = (dir: 1 | -1) => {
    if (!results.length) return;
    const next = (activeIdx + dir + results.length) % results.length;
    setActive(next);
    onJump(results[next].i);
  };

  return (
    <div className="border-b border-white/10 bg-black/40 p-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            className="glass-input pl-9 pr-3 text-sm"
            placeholder="Search messages, names…"
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            autoFocus
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">
            {query.length >= 2 ? `${results.length} found` : 'min 2 chars'}
          </span>
          <button onClick={() => jump(-1)} disabled={!results.length}
            className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => jump(1)} disabled={!results.length}
            className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {results.length > 0 && activeIdx < results.length && (
        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-2.5">
          <p className="text-[10px] uppercase tracking-widest text-amber-300/70 mb-1">Match {activeIdx + 1} of {results.length}</p>
          <p className="text-sm text-white">
            <span className="font-bold mr-1" style={{ color: results[activeIdx].m.authorColor }}>
              {results[activeIdx].m.authorName}:
            </span>
            {results[activeIdx].m.text.slice(0, 200)}
            {results[activeIdx].m.text.length > 200 && '…'}
          </p>
        </div>
      )}
    </div>
  );
}
