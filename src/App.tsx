import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { CreateCard } from './components/CreateCard';
import { EventView } from './components/EventView';
import { Shell } from './components/Shell';
import { samplePeople, sampleEvent } from './services/sample';
import type { Person, SyncEvent } from './types';

export const App = () => {
  const [open, setOpen] = useState<{ event: SyncEvent; people: Person[] } | null>(null);

  return (
    <MotionConfig reducedMotion="user">
      <Shell>
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <EventView key="event" event={open.event} initialPeople={open.people} onNew={() => setOpen(null)} />
          ) : (
            <CreateCard
              key="create"
              onCreate={(event) => setOpen({ event, people: [] })}
              onSample={() => setOpen({ event: sampleEvent, people: samplePeople })}
            />
          )}
        </AnimatePresence>
      </Shell>
    </MotionConfig>
  );
};
