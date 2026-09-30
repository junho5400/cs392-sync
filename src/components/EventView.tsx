import { useEffect, useReducer, useState } from 'react';
import { motion } from 'motion/react';
import { BestTimes } from './BestTimes';
import { Icon } from './Icon';
import { Roster } from './Roster';
import { ShareButton } from './ShareButton';
import { Surface } from './Surface';
import type { Person, SyncEvent } from '../types';
import { CARD_SPRING } from '../utilities/motion';
import {
  HEAT,
  TIME_ZONE,
  bestWindows,
  countMap,
  fmtRange,
  fmtTime,
  paint,
  windowKeys,
  type Window,
} from '../utilities/slots';

interface Props {
  event: SyncEvent;
  initialPeople: Person[];
  onNew: () => void;
}

interface Mine {
  slots: Set<string>;
  history: Set<string>[];
}

type Action =
  | { type: 'paint'; keys: string[]; on: boolean }
  | { type: 'merge'; slots: Set<string> }
  | { type: 'set'; slots: Set<string> }
  | { type: 'undo' };

const reduce = ({ slots, history }: Mine, a: Action): Mine => {
  if (a.type === 'undo') return history.length ? { slots: history[history.length - 1], history: history.slice(0, -1) } : { slots, history };
  const next =
    a.type === 'paint' ? paint(slots, a.keys, a.on) : a.type === 'set' ? a.slots : new Set([...slots, ...a.slots]);
  return { slots: next, history: [...history.slice(-49), slots] };
};

export const EventView = ({ event, initialPeople, onNew }: Props) => {
  const [people, setPeople] = useState(initialPeople);
  const [{ slots: mine, history }, dispatch] = useReducer(reduce, { slots: new Set<string>(), history: [] });
  const [myName, setMyName] = useState<string | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [hoverPerson, setHoverPerson] = useState<string | null>(null);
  const [hoverWindow, setHoverWindow] = useState<Window | null>(null);

  const me = myName ?? 'You';
  const everyone = mine.size || myName ? [...people, { name: me, slots: mine }] : people;
  const counts = countMap(everyone);
  const total = everyone.length;
  const highlight = hoverWindow
    ? new Set(windowKeys(hoverWindow))
    : (everyone.find((p) => p.name === hoverPerson)?.slots ?? null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        dispatch({ type: 'undo' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const claim = (name: string) => {
    const person = people.find((p) => p.name === name);
    if (person) dispatch({ type: 'merge', slots: person.slots });
    setPeople(people.filter((p) => p.name !== name));
    setMyName(name);
  };

  const saveName = (name: string) => {
    const existing = people.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) claim(existing.name);
    else setMyName(name);
  };

  return (
    <motion.section
      layoutId="sheet"
      transition={CARD_SPRING}
      className="mx-auto flex w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl bg-surface shadow-card lg:grid lg:grid-cols-[232px_minmax(0,1fr)_224px] lg:grid-rows-[auto_1fr]"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="order-1 flex flex-col gap-3 p-4 lg:col-start-1 lg:row-start-1 lg:border-r lg:border-dashed lg:border-line"
      >
        <h1 className="text-[18px] font-semibold leading-tight tracking-tight text-ink-1">{event.title}</h1>
        <div className="flex flex-col gap-1 text-[12px] text-ink-2">
          <p className="flex items-center gap-1.5">
            <Icon name="clock" className="size-3" />
            {fmtRange(event.dates)} · {fmtTime(event.start)} – {fmtTime(event.end)}
          </p>
          <p className="flex items-center gap-1.5">
            <Icon name="globe" className="size-3" />
            {TIME_ZONE.replace('_', ' ')}
          </p>
        </div>
        <div className="flex gap-1.5">
          <ShareButton />
          <button
            onClick={onNew}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink active:scale-[0.96]"
          >
            <Icon name="plus" className="size-3" /> New
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="order-2 flex min-w-0 flex-col gap-2 border-t border-dashed border-line p-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-t-0"
      >
        <div className="flex h-7 items-center justify-between gap-2">
          <p className="text-[12px] text-ink-2">
            <span className="font-medium text-ink">Drag to mark when you're free.</span> Drag over marks to clear.
          </p>
          <div className="flex shrink-0 items-center">
            <button
              onClick={() => dispatch({ type: 'undo' })}
              disabled={!history.length}
              title="Undo (⌘Z)"
              aria-label="Undo"
              className="grid size-7 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink active:scale-[0.96] disabled:opacity-30"
            >
              <Icon name="undo" />
            </button>
            <button
              onClick={() => dispatch({ type: 'paint', keys: [...mine], on: false })}
              disabled={!mine.size}
              className="h-7 rounded-lg px-2 text-[12px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink disabled:opacity-30"
            >
              Clear
            </button>
          </div>
        </div>
        <Surface
          event={event}
          counts={counts}
          total={total}
          mine={mine}
          highlight={highlight}
          onPaint={(keys, on) => dispatch({ type: 'paint', keys, on })}
          onReplace={(slots) => dispatch({ type: 'set', slots })}
          onHover={setHoverSlot}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="order-3 flex flex-col gap-4 border-t border-dashed border-line p-4 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l"
      >
        <BestTimes windows={bestWindows(event, counts)} total={total} onHover={setHoverWindow} />
        <div className="flex items-center gap-1.5 text-[11px] tabular-nums text-ink-3">
          0
          <span className="flex gap-0.5">
            {HEAT.map((c) => (
              <span key={c} className={`size-2.5 rounded-[3px] shadow-[inset_0_0_0_1px_var(--color-line)] ${c}`} />
            ))}
          </span>
          {total} free
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="order-4 border-t border-dashed border-line p-4 lg:col-start-1 lg:row-start-2 lg:border-r"
      >
        <Roster
          people={people}
          myName={myName}
          mineCount={mine.size}
          free={hoverSlot ? (counts.get(hoverSlot) ?? []) : null}
          total={total}
          onSaveName={saveName}
          onClaim={claim}
          onHoverPerson={setHoverPerson}
        />
      </motion.div>
    </motion.section>
  );
};
