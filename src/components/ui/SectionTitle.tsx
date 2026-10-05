import type { PropsWithChildren, ReactNode } from 'react';

interface Props extends PropsWithChildren {
  aside?: ReactNode;
}

export const SectionTitle = ({ aside, children }: Props) => (
  <div className="flex h-5 items-center justify-between gap-2">
    <h2 className="text-[14px] font-semibold text-ink">{children}</h2>
    {aside && <span className="text-[12px] text-ink-3">{aside}</span>}
  </div>
);
