import { useState } from 'react';
import { IconButton } from './ui/IconButton';

type Theme = 'light' | 'dark';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  const flip = () => {
    const t: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    try {
      localStorage.setItem('sync-theme', t);
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
  };

  return (
    <IconButton
      icon={theme === 'dark' ? 'sun' : 'moon'}
      label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={flip}
    />
  );
};
