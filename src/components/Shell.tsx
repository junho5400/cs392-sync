import type { PropsWithChildren } from 'react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';

export const Shell = ({ children, scroll = false }: PropsWithChildren<{ scroll?: boolean }>) => (
  <div className={`flex min-h-dvh flex-col ${scroll ? '' : 'lg:h-dvh lg:overflow-hidden'}`}>
    <header className="mx-auto flex h-14 w-full max-w-[1200px] shrink-0 items-center justify-between px-4 sm:px-6">
      <Brand />
      <div className="flex items-center gap-4">
        <a href="/privacy" className="text-[13px] text-ink-3 transition-colors duration-150 ease-[var(--ease-soft)] hover:text-ink motion-reduce:transition-none">
          Privacy
        </a>
        <ThemeToggle />
      </div>
    </header>
    <main className={scroll ? 'mx-auto w-full max-w-[720px] flex-1 px-4 pt-2 pb-10 sm:px-6' : 'flex min-h-0 flex-1 flex-col px-3 pt-4 pb-6 sm:px-6'}>
      {scroll ? (
        children
      ) : (
        <>
          {/* Free space splits 35:65 so the card sits a little above true center. */}
          <span aria-hidden="true" className="flex-[35]" />
          {children}
          <span aria-hidden="true" className="flex-[65]" />
        </>
      )}
    </main>
  </div>
);
