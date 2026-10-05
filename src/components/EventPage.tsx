import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { EventView } from './EventView';
import { NotFound } from './NotFound';
import { watchBoard, type Board } from '../services/meet';
import { CARD_SPRING } from '../utilities/motion';

const Frame = ({ children, label }: { children: ReactNode; label: string }) => (
  <motion.section
    layoutId="sheet"
    transition={CARD_SPRING}
    aria-label={label}
    className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-2 rounded-2xl bg-surface px-6 py-10 text-center shadow-card"
  >
    {children}
  </motion.section>
);

/** Live `/e/:id` board. Anonymous auth owns each name; refresh is not required. */
export const EventPage = ({ id, onNew }: { id: string; onNew: () => void }) => {
  const [board, setBoard] = useState<Board | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => watchBoard(id, setBoard, setError), [id, attempt]);

  const retry = () => {
    setBoard(undefined);
    setError('');
    setAttempt((n) => n + 1);
  };

  if (board === undefined && !error)
    return (
      <Frame label="Loading event">
        <div className="flex w-full animate-pulse flex-col items-center gap-2" aria-hidden="true">
          <span className="h-5 w-40 rounded-md bg-sunken" />
          <span className="h-3 w-56 rounded-md bg-sunken" />
          <span className="mt-2 h-8 w-28 rounded-lg bg-sunken" />
        </div>
      </Frame>
    );

  if (!board)
    return error ? (
      <Frame label="Load error">
        <h1 className="text-[18px] font-semibold tracking-tight text-ink-1">Couldn&apos;t load this event</h1>
        <p className="text-[13px] text-ink-2">Check your connection and try again.</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={retry}
            className="h-8 rounded-lg bg-brand px-4 text-[12.5px] font-medium text-brand-ink transition-transform duration-150 active:scale-[0.96]"
          >
            Try again
          </button>
          <button
            onClick={onNew}
            className="h-8 rounded-lg px-3 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            New event
          </button>
        </div>
      </Frame>
    ) : (
      <NotFound onNew={onNew} />
    );

  const me = board.me ? board.people.find((p) => p.name === board.me) : undefined;
  return (
    <EventView
      event={board.event}
      eventId={id}
      initialPeople={board.people.filter((p) => p.name !== board.me)}
      initialMine={me ? new Set(me.slots) : new Set()}
      initialName={me?.name ?? null}
      onNew={onNew}
    />
  );
};
