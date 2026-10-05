import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { currentUser, db } from './firebase';
import type { Person, SyncEvent, SyncEventDraft } from '../types';

// Layout: events/{id} (public, immutable), events/{id}/people/{key} (public; the owner's
// anonymous uid may edit), events/{id}/secrets/{key} (password hash, never readable),
// events/{id}/claims/{uid} (password proof for taking over a name, never readable).

export interface Board {
  event: SyncEvent;
  people: Person[];
  /** The person this browser owns on this board, if any. */
  me: string | null;
}

export interface JoinInput {
  name: string;
  password: string;
  optional: boolean;
}

export class MeetError extends Error {}

export const normalizeName = (raw: string) => raw.trim().replace(/\s+/g, ' ').slice(0, 30);

/** One document per name, case-insensitive. */
const personKey = (name: string) => encodeURIComponent(name.toLowerCase());

const eventRef = (id: string) => doc(db, 'events', id);
const personRef = (id: string, name: string) => doc(db, 'events', id, 'people', personKey(name));

const hash = async (id: string, name: string, password: string) => {
  const bytes = new TextEncoder().encode(`${id}:${name.toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const newId = () => {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => alphabet[b % alphabet.length]).join('');
};

/** One device can own several names on a board (shared laptop); this picks the latest. */
const lastName = (id: string) => {
  try {
    return localStorage.getItem(`sync:me:${id}`);
  } catch {
    return null;
  }
};

const rememberName = (id: string, name: string) => {
  try {
    localStorage.setItem(`sync:me:${id}`, name);
  } catch {
    // Private mode: the first name this device owns is used instead.
  }
};

const toPerson = (d: DocumentData): Person => ({
  name: d.name,
  slots: new Set(d.slots ?? []),
  optional: d.optional === true,
  vote: d.vote ?? null,
});

const fail = (err: unknown, fallback: string): never => {
  if (err instanceof MeetError) throw err;
  console.error(err);
  throw new MeetError(fallback);
};

export const createEvent = async (draft: SyncEventDraft): Promise<string> => {
  try {
    const { uid } = await currentUser();
    const id = newId();
    const event = {
      ...draft,
      timeZone: draft.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      duration: draft.duration ?? Math.min(60, draft.end - draft.start),
    };
    await writeBatch(db)
      .set(eventRef(id), { ...event, createdBy: uid, createdAt: serverTimestamp() })
      .commit();
    return id;
  } catch (err) {
    return fail(err, 'Could not create the event.');
  }
};

/** Live board updates. Calls `onChange(null)` when the link does not exist. */
export const watchBoard = (id: string, onChange: (board: Board | null) => void, onError: (message: string) => void) => {
  let event: SyncEvent | null | undefined;
  let people: DocumentData[] | undefined;
  let uid: string | null = null;
  const emit = () => {
    if (event === null) onChange(null);
    else if (event && people) {
      const owned = people.filter((p) => p.uid === uid);
      const hint = lastName(id);
      onChange({
        event,
        people: people.map(toPerson),
        me: (owned.find((p) => p.name === hint) ?? owned[0])?.name ?? null,
      });
    }
  };
  const report = (err: unknown) => {
    console.error(err);
    onError('Could not load this event.');
  };
  const stops: (() => void)[] = [];
  let stopped = false;
  currentUser()
    .then((user) => {
      if (stopped) return;
      uid = user.uid;
      stops.push(
        onSnapshot(
          eventRef(id),
          (snap) => {
            event = snap.exists() ? ({ ...(snap.data() as SyncEvent), id } as SyncEvent) : null;
            emit();
          },
          report,
        ),
        onSnapshot(
          collection(db, 'events', id, 'people'),
          (snap) => {
            people = snap.docs.map((d) => d.data());
            emit();
          },
          report,
        ),
      );
    })
    .catch(report);
  return () => {
    stopped = true;
    stops.forEach((stop) => stop());
  };
};

/**
 * Join as a new person, or come back as an existing one. A password, if the person
 * set one, must match; without one anyone can sign in as that name, like When2meet.
 */
export const join = async (id: string, input: JoinInput): Promise<string> => {
  const name = normalizeName(input.name);
  if (!name) throw new MeetError('Add your name.');
  try {
    const { uid } = await currentUser();
    const ref = personRef(id, name);
    const existing = await getDoc(ref);
    const batch = writeBatch(db);
    if (!existing.exists()) {
      const hasPassword = input.password.length > 0;
      batch.set(ref, { name, slots: [], optional: input.optional, vote: null, hasPassword, uid });
      if (hasPassword) {
        batch.set(doc(db, 'events', id, 'secrets', personKey(name)), { hash: await hash(id, name, input.password) });
      }
      rememberName(id, name);
      await batch.commit();
      return name;
    }
    const data = existing.data();
    rememberName(id, data.name);
    if (data.uid === uid) return data.name;
    if (data.hasPassword && !input.password) throw new MeetError(`${data.name} has a password. Enter it to continue.`);
    batch.set(doc(db, 'events', id, 'claims', uid), {
      key: personKey(name),
      proof: data.hasPassword ? await hash(id, data.name, input.password) : '',
    });
    batch.update(ref, { uid });
    try {
      await batch.commit();
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'permission-denied' && data.hasPassword) {
        throw new MeetError(`Wrong password for ${data.name}.`);
      }
      throw err;
    }
    return data.name;
  } catch (err) {
    return fail(err, 'Could not join.');
  }
};

export const saveSlots = async (id: string, name: string, slots: Set<string>) => {
  try {
    await updateDoc(personRef(id, name), { slots: [...slots].sort() });
  } catch (err) {
    fail(err, 'Could not save your times.');
  }
};

export const saveVote = async (id: string, name: string, vote: string | null) => {
  try {
    await updateDoc(personRef(id, name), { vote });
  } catch (err) {
    fail(err, 'Could not save your pick.');
  }
};
