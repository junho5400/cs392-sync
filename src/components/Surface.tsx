import type { SurfaceProps } from '../types';

// Placeholder: each proposal branch replaces this with its availability surface.
export const Surface = ({ event }: SurfaceProps) => (
  <div className="grid h-64 place-items-center rounded-xl hatch text-[12px] text-ink-3">
    {event.dates.length} dates
  </div>
);
