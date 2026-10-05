import {
  bestWindows,
  columns,
  commonSlots,
  countMap,
  fmtCol,
  fmtEventRange,
  heat,
  openVoteKeys,
  paint,
  rectKeys,
  slotKey,
  viewOf,
  voteKey,
} from './slots';
import type { Person, SyncEvent } from '../types';

const base = { title: 'T', start: 540, end: 660, timeZone: 'America/Chicago', duration: 60 } as const;
const event: SyncEvent = { ...base, kind: 'dates', dates: ['2026-10-05', '2026-10-06'] };
const dowEvent: SyncEvent = { ...base, kind: 'dow', days: [1, 3] };
const k = slotKey;
const span = (date: string, from: number, to: number) =>
  Array.from({ length: (to - from) / 30 }, (_, i) => k(date, from + i * 30));
const who = (name: string, slots: string[], optional = false): Person => ({
  name,
  slots: new Set(slots),
  optional,
  vote: null,
});

test('countMap lists who is free per slot', () => {
  const counts = countMap([
    { name: 'Ava', slots: new Set([k('2026-10-05', 540)]) },
    { name: 'Ben', slots: new Set([k('2026-10-05', 540), k('2026-10-06', 600)]) },
  ]);
  expect(counts.get(k('2026-10-05', 540))).toEqual(['Ava', 'Ben']);
  expect(counts.get(k('2026-10-06', 600))).toEqual(['Ben']);
});

test('commonSlots keeps only slots everyone picked', () => {
  const ava = who('Ava', [k('2026-10-05', 540), k('2026-10-05', 570)]);
  const ben = who('Ben', [k('2026-10-05', 570), k('2026-10-06', 600)]);
  expect([...commonSlots([ava, ben])]).toEqual([k('2026-10-05', 570)]);
  expect(commonSlots([]).size).toBe(0);
});

test('rectKeys covers the rectangle in any drag direction', () => {
  const view = viewOf(event, event.timeZone);
  const keys = rectKeys(view, k('2026-10-06', 600), k('2026-10-05', 570));
  expect(keys).toEqual([k('2026-10-05', 570), k('2026-10-05', 600), k('2026-10-06', 570), k('2026-10-06', 600)]);
});

test('paint marks and erases', () => {
  const on = paint(new Set(), [k('2026-10-05', 540), k('2026-10-05', 570)], true);
  expect(on.size).toBe(2);
  expect([...paint(on, [k('2026-10-05', 540)], false)]).toEqual([k('2026-10-05', 570)]);
});

test('bestWindows keeps meeting-length blocks tied for the most people', () => {
  const ranked = bestWindows(event, [
    who('Ava', [...span('2026-10-05', 540, 660), ...span('2026-10-06', 600, 660)]),
    who('Ben', span('2026-10-05', 570, 660)),
  ]);
  expect(ranked.complete).toBe(true);
  expect(ranked.windows.map((w) => [w.date, w.start, w.end])).toEqual([
    ['2026-10-05', 570, 630],
    ['2026-10-05', 600, 660],
  ]);
});

test('bestWindows explains who is missing when no block fits everyone', () => {
  const ranked = bestWindows(event, [
    who('Ava', span('2026-10-05', 540, 600)),
    who('Ben', span('2026-10-05', 540, 600)),
    who('Cy', span('2026-10-06', 540, 600)),
  ]);
  expect(ranked.complete).toBe(false);
  expect(ranked.windows).toEqual([{ date: '2026-10-05', start: 540, end: 600, names: ['Ava', 'Ben'], out: ['Cy'] }]);
});

test('a 45-minute meeting needs two whole cells and ends at :45', () => {
  const short = { ...event, duration: 45 };
  expect(bestWindows(short, [who('Ava', span('2026-10-05', 540, 570))]).windows).toEqual([]);
  const ranked = bestWindows(short, [who('Ava', span('2026-10-05', 540, 600))]);
  expect(ranked.windows.map((w) => [w.start, w.end])).toEqual([[540, 585]]);
});

test('a single 30-minute overlap is not a 60-minute meeting', () => {
  const ranked = bestWindows(event, [who('Ava', span('2026-10-05', 540, 570))]);
  expect(ranked.windows).toEqual([]);
});

test('votes open only with two or more blocks everyone counted can make', () => {
  const one = [who('Ava', span('2026-10-05', 540, 600)), who('Ben', span('2026-10-05', 540, 600))];
  expect(openVoteKeys(event, one).size).toBe(0);

  const two = [who('Ava', span('2026-10-05', 540, 630)), who('Ben', span('2026-10-05', 540, 630))];
  expect([...openVoteKeys(event, two)]).toEqual([
    voteKey({ date: '2026-10-05', start: 540, end: 600 }),
    voteKey({ date: '2026-10-05', start: 570, end: 630 }),
  ]);
});

test('an optional person who cannot make it does not close required votes', () => {
  const people = [
    who('Ava', span('2026-10-05', 540, 630)),
    who('Ben', span('2026-10-05', 540, 630)),
    who('Opt', span('2026-10-06', 540, 600), true),
  ];
  expect(openVoteKeys(event, people).size).toBe(2);
});

test('viewOf shifts rows into another zone without wrapping past midnight', () => {
  const view = viewOf(event, 'Asia/Seoul');
  expect(view.cols).toEqual(['2026-10-05', '2026-10-06']);
  // 9:00am CDT is 11:00pm KST; the rows run on past midnight instead of wrapping.
  expect(view.rows).toEqual([1380, 1410, 1440, 1470]);
  expect(view.keyAt('2026-10-05', 1380)).toBe(k('2026-10-05', 540));
  const placed = view.place(k('2026-10-06', 600))!;
  expect(placed).toEqual({ col: '2026-10-06', min: 1440 });
  expect(view.when(placed)).toEqual({ col: '2026-10-07', min: 0 });
});

test('viewOf can shift rows back to the previous day', () => {
  const seoul: SyncEvent = { ...event, timeZone: 'Asia/Seoul' };
  const view = viewOf(seoul, 'America/Chicago');
  expect(view.rows[0]).toBe(-300);
  expect(view.when({ col: '2026-10-05', min: -300 })).toEqual({ col: '2026-10-04', min: 1140 });
});

test('heat maps share of people to 0–5', () => {
  expect([heat(0, 6), heat(1, 6), heat(6, 6), heat(0, 0)]).toEqual([0, 1, 5, 0]);
});

test('weekday columns sort Mon-first and key slots by dow id', () => {
  expect(columns(dowEvent)).toEqual(['dow:1', 'dow:3']);
  const keys = rectKeys(viewOf(dowEvent, dowEvent.timeZone), k('dow:3', 600), k('dow:1', 570));
  expect(keys).toEqual([k('dow:1', 570), k('dow:1', 600), k('dow:3', 570), k('dow:3', 600)]);
});

test('weekday best times and labels use Every-day names', () => {
  const ranked = bestWindows(dowEvent, [who('Ava', span('dow:3', 540, 600)), who('Ben', span('dow:3', 540, 600))]);
  expect(ranked.windows.map((w) => w.date)).toEqual(['dow:3']);
  expect(fmtCol('dow:1')).toBe('Every Mon');
  expect(fmtEventRange(dowEvent)).toBe('Every Mon, Wed');
});

test('weekday columns shift to the next weekday across midnight', () => {
  const view = viewOf(dowEvent, 'Asia/Seoul');
  expect(view.when(view.place(k('dow:1', 600))!)).toEqual({ col: 'dow:2', min: 0 });
});
