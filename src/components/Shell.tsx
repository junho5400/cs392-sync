import type { PropsWithChildren } from 'react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';

export const Shell = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
    <header className="mx-auto flex h-14 w-full max-w-[1200px] shrink-0 items-center justify-between px-4 sm:px-6">
      <Brand />
      <ThemeToggle />
    </header>
    <main className="flex min-h-0 flex-1 flex-col px-3 pt-4 pb-6 sm:px-6">
      {/* Free space splits 35:65 so the card sits a little above true center. */}
      <span aria-hidden="true" className="flex-[35]" />
      {children}
      <span aria-hidden="true" className="flex-[65]" />
    </main>
  </div>
);
