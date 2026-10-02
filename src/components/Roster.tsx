import { useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import type { Person } from '../types';
import { POP } from '../utilities/motion';

interface Props {
  /** Everyone except you. */
  people: Person[];
  myName: string | null;
  mineCount: number;
  /** Names free in the hovered slot; null when nothing is hovered. */
  free: string[] | null;
  total: number;
  /** Clicked people whose common availability is spotlighted. */
  selected: Set<string>;
  onSaveName: (name: string) => void;
  onClaim: (name: string) => void;
  onHoverPerson: (name: string | null) => void;
  onTogglePerson: (name: string) => void;
}

export const Roster = ({ people, myName, mineCount, free, total, selected, onSaveName, onClaim, onHoverPerson, onTogglePerson }: Props) => {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const me = myName ?? 'You';
  const needsName = !myName && mineCount > 0;
  const dim = (name: string) => free !== null && !free.includes(name);

  // Rows toggle selection; clicks into the name field or row buttons keep their own job.
  const toggleHandlers = (name: string) => ({
    onClick: (e: ReactMouseEvent) => {
      if ((e.target as HTMLElement).closest('input,button')) return;
      onTogglePerson(name);
    },
    onKeyDown: (e: ReactKeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,button')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTogglePerson(name);
      }
    },
  });

  const save = () => {
    const name = draft.trim();
    if (!name) return;
    onSaveName(name);
    setDraft('');
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-1 flex h-5 items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">People</p>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p key={free ? `f${free.length}` : 'all'} {...POP} className="text-[12px] font-medium tabular-nums text-ink-2">
            {free ? (
              <>
                <span className="text-ink">{free.length}</span>/{total} free
              </>
            ) : (
              `${total} ${total === 1 ? 'person' : 'people'}`
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        role="checkbox"
        aria-checked={selected.has(me)}
        tabIndex={0}
        onMouseEnter={() => onHoverPerson(me)}
        onMouseLeave={() => onHoverPerson(null)}
        {...toggleHandlers(me)}
        className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg px-1.5 transition-[opacity,box-shadow,background-color] duration-150 ${
          dim(me) ? 'opacity-35' : ''
        } ${needsName ? 'shadow-[0_0_0_1px_var(--color-accent)]' : ''} ${selected.has(me) ? 'bg-sunken' : ''}`}
      >
        {myName ? (
          <Avatar name={myName} you />
        ) : (
          <span aria-hidden="true" className="size-5 shrink-0 rounded-full border border-dashed border-ink-3" />
        )}
        {myName && !editing ? (
          <button onClick={() => { setDraft(myName); setEditing(true); }} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
            <span className="truncate text-[12.5px] font-medium">{myName}</span>
            <span className="rounded bg-sunken px-1 text-[10px] font-medium text-ink-2">you</span>
          </button>
        ) : (
          <input
            value={draft}
            autoFocus={editing}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            onBlur={() => (draft.trim() ? save() : setEditing(false))}
            placeholder="Add your name"
            aria-label="Your name"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] font-medium outline-none placeholder:text-ink-3"
          />
        )}
        {!myName && draft.trim() && (
          <button onClick={save} aria-label="Save name" className="grid size-5 place-items-center rounded-md bg-brand text-brand-ink active:scale-[0.96]">
            <Icon name="check" className="size-3" />
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {needsName && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-1.5 text-[11.5px] text-accent"
          >
            Add your name to save your times.
          </motion.p>
        )}
      </AnimatePresence>

      {people.map((p) => (
        <div
          key={p.name}
          role="checkbox"
          aria-checked={selected.has(p.name)}
          tabIndex={0}
          onMouseEnter={() => onHoverPerson(p.name)}
          onMouseLeave={() => onHoverPerson(null)}
          {...toggleHandlers(p.name)}
          className={`group flex h-8 cursor-pointer items-center gap-2 rounded-lg px-1.5 transition-[opacity,background-color] duration-150 hover:bg-sunken ${
            dim(p.name) ? 'opacity-35' : ''
          } ${selected.has(p.name) ? 'bg-sunken' : ''}`}
        >
          <Avatar name={p.name} />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-1">{p.name}</span>
          {!myName && (
            <button
              onClick={() => onClaim(p.name)}
              className="text-[11px] text-ink-3 opacity-0 transition-opacity hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
            >
              This is me
            </button>
          )}
          {free?.includes(p.name) && <span className="size-1.5 rounded-full bg-heat" aria-label="free" />}
        </div>
      ))}
    </div>
  );
};
