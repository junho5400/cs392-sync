import type { Person, SyncEvent, View } from '../types';
import { instantOf, wallAt } from './zones';

export const STEP = 30;

export const DURATIONS = [30, 60, 90, 120];

export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monFirst = (a: number, b: number) => ((a + 6) % 7) - ((b + 6) % 7);

/** Grid columns: ISO dates in date mode, `dow:N` ids in weekday mode (Mon-first). */
export const columns = (event: SyncEvent): string[] =>
  event.kind === 'dates' ? event.dates : [...event.days].sort(monFirst).map((d) => `dow:${d}`);

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
    : `Every ${[...event.days].sort(monFirst).map((d) => DOW_SHORT[d]).join(', ')}`;

export const slotKey = (date: string, min: number) => `${date}|${min}`;

export const parseKey = (key: string) => {
  const [date, min] = key.split('|');
  return { date, min: Number(min) };
};

export const times = (event: SyncEvent) =>
  Array.from({ length: (event.end - event.start) / STEP }, (_, i) => event.start + i * STEP);

/** Every canonical slot key on the event's grid. */
export const allKeys = (event: SyncEvent) =>
  columns(event).flatMap((col) => times(event).map((m) => slotKey(col, m)));

/** Freebusy window covering every slot, in UTC. Weekday columns use this week. */
export const calendarBounds = (event: SyncEvent) => {
  const dates = coveredDates(event);
  const timeMin = instantOf(dates[0], event.start, event.timeZone);
  const timeMax = instantOf(dates[dates.length - 1], event.end, event.timeZone);
  if (timeMin === null || timeMax === null) throw new Error('Those times are not on the calendar.');
  return { timeMin: new Date(timeMin).toISOString(), timeMax: new Date(timeMax).toISOString() };
};

/** Slots whose wall-clock time does not overlap a busy instant. Busy times are epoch ms. */
export const freeKeys = (event: SyncEvent, busy: { start: number; end: number }[]) => {
  const free = new Set<string>();
  for (const key of allKeys(event)) {
    const { date, min } = parseKey(key);
    const start = instantOf(colDate(date), min, event.timeZone);
    if (start === null) continue;
    const end = start + STEP * 60_000;
    if (!busy.some((b) => b.start < end && b.end > start)) free.add(key);
  }
  return free;
};

export const countMap = (people: Pick<Person, 'name' | 'slots'>[]) => {
  const map = new Map<string, string[]>();
  for (const p of people) for (const k of p.slots) map.set(k, [...(map.get(k) ?? []), p.name]);
  return map;
};

export const paint = (slots: Set<string>, keys: string[], on: boolean) => {
  const next = new Set(slots);
  for (const k of keys) {
    if (on) next.add(k);
    else next.delete(k);
  }
  return next;
};

/** A Monday-first reference week so weekday columns can shift across zones. */
const refWeek = (() => {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => toIso(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
})();

const colDate = (col: string) => (col.startsWith('dow:') ? refWeek[(dowOf(col) + 6) % 7] : col);

/** Dates the grid stands for: the chosen dates, or this week's weekday columns. */
export const coveredDates = (event: SyncEvent) => columns(event).map(colDate).sort();
const dateCol = (iso: string, weekly: boolean) => (weekly ? `dow:${toDate(iso).getDay()}` : iso);

const dayDiff = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);

/**
 * The event's slots laid out in `zone`, like When2meet: columns stay the event's days and
 * rows are that day's slots shifted by the zone offset, so a 9–5 in Chicago reads
 * 11pm–7am in Seoul without wrapping. Row minutes can pass 1440; `when` gives the wall clock.
 */
export const viewOf = (event: SyncEvent, zone: string): View => {
  const cols = columns(event);
  const weekly = event.kind === 'dow';
  const slots = times(event);
  const offset = new Map<string, number>();
  for (const col of cols) {
    const ms = zone === event.timeZone ? null : instantOf(colDate(col), event.start, event.timeZone);
    const w = ms === null ? null : wallAt(ms, zone);
    offset.set(col, w ? dayDiff(colDate(col), w.date) * 1440 + w.min - event.start : 0);
  }
  const rows = [...new Set(cols.flatMap((col) => slots.map((m) => m + offset.get(col)!)))].sort((a, b) => a - b);
  const valid = (min: number) => min >= event.start && min < event.end && (min - event.start) % STEP === 0;
  return {
    zone,
    cols,
    rows,
    keyAt: (col, row) => {
      const off = offset.get(col);
      return off !== undefined && valid(row - off) ? slotKey(col, row - off) : null;
    },
    place: (key) => {
      const { date, min } = parseKey(key);
      const off = offset.get(date);
      return off === undefined ? null : { col: date, min: min + off };
    },
    when: (cell) => {
      const day = Math.floor(cell.min / 1440);
      const iso = toIso(new Date(toDate(colDate(cell.col)).getTime() + day * 86_400_000 + 3_600_000 * 12));
      return { col: day ? dateCol(iso, weekly) : cell.col, min: cell.min - day * 1440 };
    },
  };
};

/** Canonical keys in the rectangle spanned by two view cells, in any drag direction. */
export const rectKeys = (view: View, a: string, b: string) => {
  const A = parseKey(a);
  const B = parseKey(b);
  const [d0, d1] = [view.cols.indexOf(A.date), view.cols.indexOf(B.date)].sort((x, y) => x - y);
  const [m0, m1] = [A.min, B.min].sort((x, y) => x - y);
  return view.cols
    .slice(d0, d1 + 1)
    .flatMap((col) => view.rows.filter((m) => m >= m0 && m <= m1).map((m) => view.keyAt(col, m)))
    .filter((k): k is string => k !== null);
};

export interface Window {
  /** Grid column id in the event zone: ISO date, or `dow:N` in weekday mode. */
  date: string;
  start: number;
  end: number;
  /** Free for the whole block. */
  names: string[];
  /** Counted, but not free for the whole block. */
  out: string[];
}

export interface Ranked {
  windows: Window[];
  size: number;
  /** Every counted person can make the top windows. */
  complete: boolean;
}

/**
 * Meeting-length blocks with the most people free for all of it. Only the blocks tied
 * for the top headcount are kept, so "best" never means a block fewer people can make.
 */
export const bestWindows = (event: SyncEvent, people: Pick<Person, 'name' | 'slots'>[]): Ranked => {
  const size = people.length;
  const len = event.duration;
  const cells = Math.ceil(len / STEP);
  if (!size || !len || len > event.end - event.start) return { windows: [], size, complete: false };
  const found: Window[] = [];
  for (const date of columns(event)) {
    for (let start = event.start; start + cells * STEP <= event.end; start += STEP) {
      const keys = Array.from({ length: cells }, (_, i) => slotKey(date, start + i * STEP));
      const names: string[] = [];
      const out: string[] = [];
      for (const p of people) (keys.every((k) => p.slots.has(k)) ? names : out).push(p.name);
      if (names.length) found.push({ date, start, end: start + len, names, out });
    }
  }
  const top = Math.max(0, ...found.map((w) => w.names.length));
  return { windows: found.filter((w) => w.names.length === top), size, complete: top === size };
};

export const windowKeys = (w: Pick<Window, 'date' | 'start' | 'end'>) =>
  Array.from({ length: Math.ceil((w.end - w.start) / STEP) }, (_, i) => slotKey(w.date, w.start + i * STEP));

/** Slots every listed person picked (common availability). Empty in, empty out. */
export const commonSlots = (people: Person[]) => {
  if (!people.length) return new Set<string>();
  const [first, ...rest] = people;
  return new Set([...first.slots].filter((k) => rest.every((p) => p.slots.has(k))));
};

export const voteKey = (w: Pick<Window, 'date' | 'start' | 'end'>) => `${w.date}|${w.start}|${w.end}`;

/** How many times one person can pick. */
export const VOTE_LIMIT = 3;

/** Keep time order until `on`, then the most votes first. A tie stays in the earlier order. */
export const byVotes = <T>(items: T[], count: (item: T) => number, on: boolean) =>
  on
    ? items
        .map((item, i) => ({ item, i, n: count(item) }))
        .sort((a, b) => b.n - a.n || a.i - b.i)
        .map((row) => row.item)
    : items;

/** People who count for best times and the heatmap: the required ones, or everyone. */
export const counted = <P extends Pick<Person, 'optional'>>(people: P[], withOptional: boolean) =>
  people.filter((p) => withOptional || !p.optional);

/**
 * Vote keys that are open: blocks everyone counted can make, when there is more than
 * one to choose from. Either view (required, or with optional) can open a block.
 */
export const openVoteKeys = (event: SyncEvent, people: Person[]) => {
  const keys = new Set<string>();
  for (const withOptional of [false, true]) {
    const ranked = bestWindows(event, counted(answered(people), withOptional));
    if (!ranked.complete || ranked.windows.length < 2) continue;
    for (const w of ranked.windows) keys.add(voteKey(w));
  }
  return keys;
};

/** People who have marked at least one time. */
export const answered = (people: Person[]) => people.filter((p) => p.slots.size > 0);

/** 0–5 heat step for `count` of `total`. */
export const heat = (count: number, total: number) => (total ? Math.ceil((count / total) * 5) : 0);

/** Literal class names so Tailwind emits them; index with `heat()`. */
export const HEAT = ['heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-5'] as const;

/** The same steps at about half strength, under your marks while you paint. */
export const FAINT = ['heat-0', 'faint-1', 'faint-2', 'faint-3', 'faint-4', 'faint-5'] as const;

export const fmtTime = (min: number, short = false) => {
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 || 12;
  if (short) return m ? `${h12}:${String(m).padStart(2, '0')}` : `${h12}${ap}`;
  return `${h12}:${String(m).padStart(2, '0')}${ap}`;
};

export const fmtDuration = (min: number) =>
  min < 60 ? `${min} min` : min % 30 ? `${Math.floor(min / 60)} hr ${min % 60} min` : `${min / 60} hr`;

export function toDate(iso: string) {
  return new Date(`${iso}T00:00`);
}

export function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
