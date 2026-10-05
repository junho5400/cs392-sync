const formats = new Map<string, Intl.DateTimeFormat>();

const wallFormat = (zone: string) => {
  let f = formats.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    formats.set(zone, f);
  }
  return f;
};

export const BROWSER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const isZone = (zone: string) => {
  try {
    wallFormat(zone);
    return true;
  } catch {
    return false;
  }
};

export const ZONES: string[] = (() => {
  const all = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return all.includes(BROWSER_ZONE) ? all : [BROWSER_ZONE, ...all];
})();

/** Wall clock of an instant in `zone`: ISO date and minutes from midnight. */
export const wallAt = (ms: number, zone: string) => {
  const p = Object.fromEntries(wallFormat(zone).formatToParts(ms).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
};

const asUtc = (date: string, min: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) + min * 60_000;
};

/** The instant a wall clock names in `zone`, or null when that clock is skipped (spring forward). */
export const instantOf = (date: string, min: number, zone: string): number | null => {
  const target = asUtc(date, min);
  let ms = target;
  for (let i = 0; i < 3; i++) {
    const w = wallAt(ms, zone);
    ms = target - (asUtc(w.date, w.min) - ms);
  }
  const w = wallAt(ms, zone);
  return w.date === date && w.min === min ? ms : null;
};

let zoneOptions: { value: string; label: string; detail: string }[] | null = null;

/** Every zone as a pickable option, with its short name right now. Built on first use. */
export const zoneChoices = () => {
  const now = Date.now();
  zoneOptions ??= ZONES.map((z) => ({ value: z, label: z.replaceAll('_', ' '), detail: zoneAbbr(now, z) }));
  return zoneOptions;
};

/** "CDT", "GMT+9": the zone's short name at an instant. */
export const zoneAbbr = (ms: number, zone: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' })
    .formatToParts(ms)
    .find((p) => p.type === 'timeZoneName')?.value ?? '';
