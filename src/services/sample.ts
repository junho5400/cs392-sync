import type { Person, SyncEvent } from '../types';
import { STEP, slotKey } from '../utilities/slots';

// ponytail: in-memory sample standing in for the backend; replace with a Firestore service.
const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];

export const sampleEvent: SyncEvent = {
  kind: 'dates',
  title: 'Team sync',
  dates,
  start: 9 * 60,
  end: 17 * 60,
};

type Span = [day: number, from: number, to: number];

const person = (name: string, spans: Span[]): Person => ({
  name,
  slots: new Set(
    spans.flatMap(([day, from, to]) =>
      Array.from({ length: ((to - from) * 60) / STEP }, (_, i) =>
        slotKey(dates[day], from * 60 + i * STEP),
      ),
    ),
  ),
});

export const samplePeople: Person[] = [
  person('Ava Chen', [[0, 9, 12], [1, 13, 17], [2, 9, 11], [3, 10, 16], [4, 9, 12]]),
  person('Ben Ortiz', [[0, 10, 13], [1, 9, 11], [2, 13, 17], [3, 13, 17], [4, 10, 15]]),
  person('Chloe Park', [[0, 9, 10.5], [1, 14, 17], [3, 9, 15], [4, 13, 17]]),
  person('Dev Rao', [[1, 10, 16], [2, 9, 13], [3, 14, 16], [4, 9, 11]]),
  person('Eli Moss', [[0, 11, 14], [2, 10, 12], [3, 12, 15.5], [4, 10, 12]]),
];
