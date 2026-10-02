import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Person, SyncEvent } from '../types';

/** Bounds mirrored in firestore.rules. */
export const MAX_TITLE = 200;
export const MAX_NAME = 80;
export const MAX_DATES = 366;
export const MAX_SLOTS = 20000;

const ISO_DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Case-insensitive lookup key: trimmed and lowercased, like the claim flow. */
export const nameKey = (name: string) => name.trim().toLowerCase();

/**
 * Response doc id for a name. Deterministic per {@link nameKey} so one name
 * maps to one doc. The `n_` prefix keeps reserved ids (`__*__`, `.`, `..`)
 * unreachable, and encoding keeps `/` in names from breaking the path.
 */
export const responseId = (name: string) => `n_${encodeURIComponent(nameKey(name))}`;

/** Find a person by name, case-insensitively, exactly like the claim flow. */
export const findPerson = (people: Person[], name: string) => {
  const key = nameKey(name);
  return people.find((p) => nameKey(p.name) === key);
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/**
 * Lenient read: malformed docs become null (an unknown or corrupt id shows
 * not-found). Extra keys are ignored; dates/days are deduped and sorted.
 */
export const parseEvent = (data: unknown): SyncEvent | null => {
  if (!isRecord(data)) return null;
  const { title, kind, start, end } = data;
  if (typeof title !== 'string' || !title.trim() || title.length > MAX_TITLE) return null;
  if (!isInt(start) || !isInt(end) || start < 0 || start >= end || end > 1440) return null;
  if (kind === 'dates') {
    const { dates } = data;
    if (!Array.isArray(dates) || !dates.length || dates.length > MAX_DATES) return null;
    if (!dates.every((d): d is string => typeof d === 'string' && ISO_DAY.test(d))) return null;
    return { kind: 'dates', title, dates: [...new Set(dates)].sort(), start, end };
  }
  if (kind === 'dow') {
    const { days } = data;
    if (!Array.isArray(days) || !days.length || days.length > 7) return null;
    if (!days.every((d): d is number => isInt(d) && d >= 0 && d <= 6)) return null;
    return { kind: 'dow', title, days: [...new Set(days)].sort((a, b) => a - b), start, end };
  }
  return null;
};

/**
 * Lenient read: docs without a usable name are skipped (null); non-string
 * slot entries are dropped so one corrupt entry cannot hide a response.
 */
export const parseResponse = (data: unknown): Person | null => {
  if (!isRecord(data)) return null;
  const { name, slots } = data;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > MAX_NAME) return null;
  if (!Array.isArray(slots) || slots.length > MAX_SLOTS) return null;
  return { name: name.trim(), slots: new Set(slots.filter((s): s is string => typeof s === 'string')) };
};

/** Create an event doc with an unguessable Firestore id. Resolves to the id. */
export const createEvent = async (event: SyncEvent): Promise<string> => {
  const base = { title: event.title, start: event.start, end: event.end, createdAt: serverTimestamp() };
  const ref = await addDoc(
    collection(db, 'events'),
    event.kind === 'dates'
      ? { ...base, kind: 'dates', dates: event.dates }
      : { ...base, kind: 'dow', days: event.days },
  );
  return ref.id;
};

/** Fetch an event by id. Null when missing, blank, or malformed. */
export const fetchEvent = async (id: string): Promise<SyncEvent | null> => {
  if (!id) return null;
  const snap = await getDoc(doc(db, 'events', id));
  if (!snap.exists()) return null;
  return parseEvent(snap.data());
};

/** Fetch every usable response, merged case-insensitively by name. */
export const fetchResponses = async (eventId: string): Promise<Person[]> => {
  const snap = await getDocs(collection(db, 'events', eventId, 'responses'));
  const merged = new Map<string, Person>();
  for (const d of snap.docs) {
    const p = parseResponse(d.data());
    if (!p) continue;
    const prev = merged.get(nameKey(p.name));
    if (prev) for (const s of p.slots) prev.slots.add(s);
    else merged.set(nameKey(p.name), p);
  }
  return [...merged.values()];
};

/** Create or overwrite the response keyed by name (case-insensitive). */
export const saveResponse = async (eventId: string, name: string, slots: Set<string> | string[]): Promise<void> => {
  const clean = name.trim();
  if (!clean) throw new Error('Cannot save a response without a name.');
  if (!eventId) throw new Error('Cannot save a response without an event id.');
  await setDoc(doc(db, 'events', eventId, 'responses', responseId(clean)), {
    name: clean,
    nameLower: nameKey(clean),
    slots: Array.isArray(slots) ? slots : [...slots],
    updatedAt: serverTimestamp(),
  });
};

/**
 * Best-effort cleanup for renames: removing the old name must never break
 * the rename flow, so bad input is a no-op and a missing doc still resolves.
 */
export const deleteResponse = async (eventId: string, name: string): Promise<void> => {
  if (!eventId || !name.trim()) return;
  await deleteDoc(doc(db, 'events', eventId, 'responses', responseId(name)));
};
