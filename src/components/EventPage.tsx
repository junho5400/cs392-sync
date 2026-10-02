import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { EventView } from './EventView';
import { NotFound } from './NotFound';
import { fetchEvent, fetchResponses, findPerson } from '../services/events';
import { recallName } from '../services/storage';
import type { Person, SyncEvent } from '../types';
import { CARD_SPRING } from '../utilities/motion';

type State =
  | { status: 'loading' }
  | { status: 'ready'; event: SyncEvent; people: Person[]; mine: Set<string>; name: string | null }
  | { status: 'missing' }
  | { status: 'error' };

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

/** Load `/e/:id`: fetch once (refresh to see others), restore your name, or explain. */
export const EventPage = ({ id, onNew }: { id: string; onNew: () => void }) => {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([fetchEvent(id), fetchResponses(id)])
      .then(([event, responses]) => {
        if (!live) return;
        if (!event) {
          setState({ status: 'missing' });
          return;
        }
        const stored = recallName(id);
        const me = stored ? findPerson(responses, stored) : undefined;
        setState({
          status: 'ready',
          event,
          people: me ? responses.filter((p) => p !== me) : responses,
          mine: me ? new Set(me.slots) : new Set<string>(),
          name: me ? me.name : stored,
        });
      })
      .catch(() => {
        if (live) setState({ status: 'error' });
      });
    return () => {
      live = false;
    };
  }, [id, attempt]);

  if (state.status === 'missing') return <NotFound onNew={onNew} />;

  if (state.status === 'error')
    return (
      <Frame label="Load error">
        <h1 className="text-[18px] font-semibold tracking-tight text-ink-1">Couldn&apos;t load this event</h1>
        <p className="text-[13px] text-ink-2">Check your connection and try again.</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setState({ status: 'loading' });
              setAttempt((a) => a + 1);
            }}
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
    );

  if (state.status === 'loading')
    return (
      <Frame label="Loading event">
        <div className="flex w-full animate-pulse flex-col items-center gap-2" aria-hidden="true">
          <span className="h-5 w-40 rounded-md bg-sunken" />
          <span className="h-3 w-56 rounded-md bg-sunken" />
          <span className="mt-2 h-8 w-28 rounded-lg bg-sunken" />
        </div>
      </Frame>
    );

  return (
    <EventView
      event={state.event}
      eventId={id}
      initialPeople={state.people}
      initialMine={state.mine}
      initialName={state.name}
      onNew={onNew}
    />
  );
};
