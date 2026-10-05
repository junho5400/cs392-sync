import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { CreateCard } from './components/CreateCard';
import { EventPage } from './components/EventPage';
import { EventView } from './components/EventView';
import { NotFound } from './components/NotFound';
import { Shell } from './components/Shell';
import { samplePeople, sampleEvent } from './services/sample';
import { createEvent } from './services/meet';
import { eventPath, parseRoute, type Route } from './services/route';

export const App = () => {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));
  const [sample, setSample] = useState(false);

  useEffect(() => {
    const onPop = () => {
      setSample(false);
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    setSample(false);
    setRoute(parseRoute(path));
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell>
        <AnimatePresence mode="popLayout" initial={false}>
          {route.name === 'event' ? (
            <EventPage key={route.id} id={route.id} onNew={() => navigate('/')} />
          ) : route.name === 'missing' ? (
            <NotFound key="missing" onNew={() => navigate('/')} />
          ) : sample ? (
            <EventView
              key="sample"
              event={sampleEvent}
              eventId={null}
              initialPeople={samplePeople}
              onNew={() => setSample(false)}
            />
          ) : (
            <CreateCard
              key="create"
              onCreate={async (event) => {
                const id = await createEvent(event);
                navigate(eventPath(id));
              }}
              onSample={() => setSample(true)}
            />
          )}
        </AnimatePresence>
      </Shell>
    </MotionConfig>
  );
};
