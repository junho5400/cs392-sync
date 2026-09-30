import { useState } from 'react';
import { motion } from 'motion/react';
import { Icon } from './Icon';
import { CARD_SPRING } from '../utilities/motion';

type Theme = 'light' | 'dark';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  const choose = (t: Theme) => {
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    try {
      localStorage.setItem('sync-theme', t);
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
  };

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-full bg-sunken p-0.5">
      {(['light', 'dark'] as const).map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={theme === t}
          aria-label={`${t} theme`}
          onClick={() => choose(t)}
          className="relative grid size-6 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink aria-checked:text-ink"
        >
          {theme === t && (
            <motion.span
              layoutId="theme-pill"
              transition={CARD_SPRING}
              className="absolute inset-0 rounded-full bg-surface shadow-btn"
            />
          )}
          <span className="relative">
            <Icon name={t === 'light' ? 'sun' : 'moon'} className="size-3" />
          </span>
        </button>
      ))}
    </div>
  );
};
