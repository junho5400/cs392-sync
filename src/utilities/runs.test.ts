import { resize, runs } from './runs';
import { slotKey } from './slots';
import type { SyncEvent } from '../types';

const date = '2026-10-05';
const event: SyncEvent = { title: 'T', dates: [date], start: 540, end: 720 };

test('runs groups contiguous slots into index ranges', () => {
  const mine = new Set([540, 570, 630, 690].map((m) => slotKey(date, m)));
  expect(runs(event, date, mine)).toEqual([[0, 1], [3, 3], [5, 5]]);
  expect(runs(event, '2026-10-06', mine)).toEqual([]);
});

test('resize returns only the delta of the moved edge', () => {
  expect(resize([1, 3], 'end', 5)).toEqual({ lo: 4, hi: 5, on: true });
  expect(resize([1, 3], 'end', 0)).toEqual({ lo: 2, hi: 3, on: false });
  expect(resize([1, 3], 'start', 0)).toEqual({ lo: 0, hi: 0, on: true });
  expect(resize([1, 3], 'start', 2)).toEqual({ lo: 1, hi: 1, on: false });
  expect(resize([1, 3], 'end', 3)).toBeNull();
});
