import type { Person, SyncEvent } from '../types';

export const STEP = 30;

export const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Grid columns: ISO dates in date mode, `dow:N` ids in weekday mode (Mon-first). */
export const columns = (event: SyncEvent): string[] =>
  event.kind === 'dates'
    ? event.dates
    : [...event.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => `dow:${d}`);

export const dowOf = (col: string) => Number(col.slice(4));

/** Header lines per column: dates show dow/day-number, weekdays show Every/day-name. */
export const colHead = (col: string): { top: string; bottom: string } => {
  if (!col.startsWith('dow:')) {
    const d = fmtDay(col);
    return { top: d.dow, bottom: String(d.day) };
  }
  return { top: 'Every', bottom: DOW_SHORT[dowOf(col)] };
};

/** One-line column label for aria text and best-times rows. */
export const fmtCol = (col: string): string => {
  if (!col.startsWith('dow:')) {
    const d = fmtDay(col);
    return `${d.dow}, ${d.mon} ${d.day}`;
  }
  return `Every ${DOW_SHORT[dowOf(col)]}`;
};

export const fmtEventRange = (event: SyncEvent): string =>
  event.kind === 'dates'
    ? fmtRange(event.dates)
    : `Every ${[...event.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DOW_SHORT[d]).join(', ')}`;

export const slotKey = (date: string, min: number) => `${date}|${min}`;

export const parseKey = (key: string) => {
  const [date, min] = key.split('|');
  return { date, min: Number(min) };
};

export const times = (event: SyncEvent) =>
  Array.from({ length: (event.end - event.start) / STEP }, (_, i) => event.start + i * STEP);

export const countMap = (people: Person[]) => {
  const map = new Map<string, string[]>();
  for (const p of people) for (const k of p.slots) map.set(k, [...(map.get(k) ?? []), p.name]);
  return map;
};

/** Every slot in the rectangle spanned by two slots, in any drag direction. */
export const rectKeys = (event: SyncEvent, a: string, b: string) => {
  const A = parseKey(a);
  const B = parseKey(b);
  const cols = columns(event);
  const [d0, d1] = [cols.indexOf(A.date), cols.indexOf(B.date)].sort((x, y) => x - y);
  const [m0, m1] = [A.min, B.min].sort((x, y) => x - y);
  return cols
    .slice(d0, d1 + 1)
    .flatMap((d) => times(event).filter((m) => m >= m0 && m <= m1).map((m) => slotKey(d, m)));
};

export const paint = (slots: Set<string>, keys: string[], on: boolean) => {
  const next = new Set(slots);
  for (const k of keys) {
    if (on) next.add(k);
    else next.delete(k);
  }
  return next;
};

export interface Window {
  /** Grid column id: ISO date in date mode, `dow:N` in weekday mode. */
  date: string;
  start: number;
  end: number;
  names: string[];
}

/** Longest runs where the same people are free, ranked by headcount then length. */
export const bestWindows = (event: SyncEvent, counts: Map<string, string[]>, n = 3) => {
  const found: Window[] = [];
  for (const date of columns(event)) {
    let cur: Window | null = null;
    for (const m of times(event)) {
      const names = counts.get(slotKey(date, m)) ?? [];
      if (cur && names.join() === cur.names.join()) cur.end = m + STEP;
      else {
        if (cur) found.push(cur);
        cur = names.length ? { date, start: m, end: m + STEP, names } : null;
      }
    }
    if (cur) found.push(cur);
  }
  return found
    .sort((a, b) => b.names.length - a.names.length || b.end - b.start - (a.end - a.start))
    .slice(0, n);
};

export const windowKeys = (w: Window) =>
  Array.from({ length: (w.end - w.start) / STEP }, (_, i) => slotKey(w.date, w.start + i * STEP));

/** Slots every listed person picked (common availability). Empty in, empty out. */
export const commonSlots = (people: Person[]) => {
  if (!people.length) return new Set<string>();
  const [first, ...rest] = people;
  return new Set([...first.slots].filter((k) => rest.every((p) => p.slots.has(k))));
};

/** 0–5 heat step for `count` of `total`. */
export const heat = (count: number, total: number) =>
  total ? Math.ceil((count / total) * 5) : 0;

/** Literal class names so Tailwind emits them; index with `heat()`. */
export const HEAT = ['heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-5'] as const;

export const fmtTime = (min: number, short = false) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ap = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 || 12;
  if (short) return m ? `${h12}:${String(m).padStart(2, '0')}` : `${h12}${ap}`;
  return `${h12}:${String(m).padStart(2, '0')}${ap}`;
};

export const toDate = (iso: string) => new Date(`${iso}T00:00`);

export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmtDay = (iso: string) => {
  const d = toDate(iso);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day: d.getDate(),
    mon: d.toLocaleDateString('en-US', { month: 'short' }),
  };
};

export const fmtRange = (dates: string[]) => {
  if (!dates.length) return '';
  const a = fmtDay(dates[0]);
  const b = fmtDay(dates[dates.length - 1]);
  if (dates.length === 1) return `${a.dow}, ${a.mon} ${a.day}`;
  return a.mon === b.mon ? `${a.mon} ${a.day} – ${b.day}` : `${a.mon} ${a.day} – ${b.mon} ${b.day}`;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
