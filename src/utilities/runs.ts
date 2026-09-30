import type { SyncEvent } from '../types';
import { slotKey, times } from './slots';

/** Inclusive slot indices into `times(event)`. */
export type Run = [start: number, end: number];

/** Slots [lo, hi] to mark (`on`) or clear. */
export interface Span {
  lo: number;
  hi: number;
  on: boolean;
}

/** Your contiguous marked runs on one date. */
export const runs = (event: SyncEvent, date: string, mine: Set<string>) => {
  const out: Run[] = [];
  times(event).forEach((m, i) => {
    if (!mine.has(slotKey(date, m))) return;
    const last = out[out.length - 1];
    if (last?.[1] === i - 1) last[1] = i;
    else out.push([i, i]);
  });
  return out;
};

/** The slots gained or lost when one edge of `run` is dragged to `to`. A run never shrinks below one slot. */
export const resize = ([s, e]: Run, side: 'start' | 'end', to: number): Span | null => {
  const [a, b] = side === 'end' ? [s, Math.max(to, s)] : [Math.min(to, e), e];
  if (b - a === e - s) return null;
  const on = b - a > e - s;
  const [outer, inner] = on ? [[a, b], [s, e]] : [[s, e], [a, b]];
  return outer[0] < inner[0] ? { lo: outer[0], hi: inner[0] - 1, on } : { lo: inner[1] + 1, hi: outer[1], on };
};
