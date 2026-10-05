import { useEffect, useState } from 'react';
import { CreateCard } from './components/CreateCard';
import { EventView } from './components/EventView';
import { NotFound } from './components/NotFound';
import { Shell } from './components/Shell';

const eventIdOf = (path: string) => /^\/e\/([a-z0-9]+)\/?$/.exec(path)?.[1] ?? null;

export const App = () => {
  const [path, setPath] = useState(() => location.pathname);

  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next: string) => {
    history.pushState(null, '', next);
    setPath(next);
  };

  const id = eventIdOf(path);
  return (
    <Shell>
      {id ? (
        <EventView key={id} id={id} onNew={() => go('/')} />
      ) : path === '/' ? (
        <CreateCard onCreated={(newId) => go(`/e/${newId}`)} />
      ) : (
        <NotFound onNew={() => go('/')} />
      )}
    </Shell>
  );
};
