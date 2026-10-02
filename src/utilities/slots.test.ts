import { bestWindows, columns, countMap, fmtCol, fmtEventRange, heat, paint, rectKeys, slotKey } from './slots';
import type { SyncEvent } from '../types';

const event: SyncEvent = { kind: 'dates', title: 'T', dates: ['2026-10-05', '2026-10-06'], start: 540, end: 660 };
const dowEvent: SyncEvent = { kind: 'dow', title: 'W', days: [1, 3], start: 540, end: 660 };
const k = slotKey;

test('countMap lists who is free per slot', () => {
  const counts = countMap([
    { name: 'Ava', slots: new Set([k('2026-10-05', 540)]) },
    { name: 'Ben', slots: new Set([k('2026-10-05', 540), k('2026-10-06', 600)]) },
  ]);
  expect(counts.get(k('2026-10-05', 540))).toEqual(['Ava', 'Ben']);
  expect(counts.get(k('2026-10-06', 600))).toEqual(['Ben']);
});

test('rectKeys covers the rectangle in any drag direction', () => {
  const keys = rectKeys(event, k('2026-10-06', 600), k('2026-10-05', 570));
  expect(keys).toEqual([k('2026-10-05', 570), k('2026-10-05', 600), k('2026-10-06', 570), k('2026-10-06', 600)]);
});

test('paint marks and erases', () => {
  const on = paint(new Set(), [k('2026-10-05', 540), k('2026-10-05', 570)], true);
  expect(on.size).toBe(2);
  expect([...paint(on, [k('2026-10-05', 540)], false)]).toEqual([k('2026-10-05', 570)]);
});

test('bestWindows ranks by headcount, then length', () => {
  const counts = countMap([
    { name: 'Ava', slots: new Set([k('2026-10-05', 540), k('2026-10-05', 570), k('2026-10-06', 600)]) },
    { name: 'Ben', slots: new Set([k('2026-10-06', 600)]) },
  ]);
  const [first, second] = bestWindows(event, counts);
  expect(first).toEqual({ date: '2026-10-06', start: 600, end: 630, names: ['Ava', 'Ben'] });
  expect(second).toEqual({ date: '2026-10-05', start: 540, end: 600, names: ['Ava'] });
});

test('heat maps share of people to 0–5', () => {
  expect([heat(0, 6), heat(1, 6), heat(6, 6), heat(0, 0)]).toEqual([0, 1, 5, 0]);
});

test('weekday columns sort Mon-first and key slots by dow id', () => {
  expect(columns(dowEvent)).toEqual(['dow:1', 'dow:3']);
  const keys = rectKeys(dowEvent, k('dow:3', 600), k('dow:1', 570));
  expect(keys).toEqual([k('dow:1', 570), k('dow:1', 600), k('dow:3', 570), k('dow:3', 600)]);
});

test('weekday bestWindows and labels use Every-day names', () => {
  const counts = countMap([
    { name: 'Ava', slots: new Set([k('dow:1', 540), k('dow:1', 570), k('dow:3', 600)]) },
    { name: 'Ben', slots: new Set([k('dow:3', 600)]) },
  ]);
  const [first, second] = bestWindows(dowEvent, counts);
  expect(first).toEqual({ date: 'dow:3', start: 600, end: 630, names: ['Ava', 'Ben'] });
  expect(second).toEqual({ date: 'dow:1', start: 540, end: 600, names: ['Ava'] });
  expect(fmtCol('dow:1')).toBe('Every Mon');
  expect(fmtEventRange(dowEvent)).toBe('Every Mon, Wed');
});
