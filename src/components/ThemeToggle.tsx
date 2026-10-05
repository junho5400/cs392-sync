import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { IconButton } from './ui/IconButton';

type Theme = 'light' | 'dark';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );
  const flipId = useRef(0);

  const flip = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const apply = () => {
      flushSync(() => setTheme(next));
      root.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem('sync-theme', next);
      } catch {
        // Private mode: the choice lasts for this visit only.
      }
    };

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !document.startViewTransition) {
      apply();
      return;
    }

    const id = ++flipId.current;
    const done = () => {
      if (id === flipId.current) root.classList.remove('theme-swap');
    };
    root.classList.add('theme-swap');
    document.startViewTransition(apply).finished.finally(done);
    window.setTimeout(done, 400);
  };

  return (
    <IconButton
      icon={theme === 'dark' ? 'sun' : 'moon'}
      label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={flip}
    />
  );
};
