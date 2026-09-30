import type { PropsWithChildren } from 'react';
import { ThemeToggle } from './ThemeToggle';

export const Shell = ({ children }: PropsWithChildren) => (
  <div className="min-h-dvh gutter-lines">
    <div className="mx-auto flex min-h-dvh max-w-[1200px] flex-col border-x border-dashed border-line bg-page">
      <header className="flex h-12 items-center justify-between border-b border-dashed border-line px-4 sm:px-6">
        <a href="/" className="flex items-center gap-1.5 text-[13px] font-semibold tracking-tight">
          <span aria-hidden="true" className="relative size-3.5">
            <span className="absolute left-0 top-0 size-2.5 rounded-[3px] bg-ink" />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-[3px] bg-heat mix-blend-multiply dark:mix-blend-screen" />
          </span>
          Sync
        </a>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col px-3 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  </div>
);
