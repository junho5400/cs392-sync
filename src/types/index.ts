export type SyncEvent = {
  id?: string;
  title: string;
  /** Minutes from midnight in `timeZone`. `start` is inclusive, `end` exclusive. */
  start: number;
  end: number;
  /** IANA zone the grid is defined in; viewers can see it in their own. */
  timeZone: string;
  /** Meeting length in minutes, a multiple of STEP. Best times are blocks this long. */
  duration: number;
} & (
  | {
      kind: 'dates';
      /** Dates as YYYY-MM-DD in `timeZone`, sorted. */
      dates: string[];
    }
  | {
      kind: 'dow';
      /** Weekdays as 0 (Sun) – 6 (Sat). */
      days: number[];
    }
);

/** An event before it has a link. `id` is already optional on SyncEvent. */
export type SyncEventDraft = SyncEvent;

export interface Person {
  name: string;
  /** Canonical slot keys from `slotKey`, in the event's zone. */
  slots: Set<string>;
  /** Picked by the person on joining: a time can be chosen without them. */
  optional: boolean;
  /** Up to three `voteKey`s, oldest first. */
  votes: string[];
}

/** A grid cell as shown to this viewer: column id and minutes in the view zone. */
export interface Cell {
  col: string;
  min: number;
}

/** The event's slots laid out in a viewer's zone. */
export interface View {
  zone: string;
  cols: string[];
  rows: number[];
  /** Canonical key at a view cell; null where the zone shift leaves a gap. */
  keyAt: (col: string, min: number) => string | null;
  /** Grid position of a canonical key. Row minutes may run past midnight. */
  place: (key: string) => Cell | null;
  /** The real wall-clock day and minute of a grid position, for labels. */
  when: (cell: Cell) => Cell;
}

/** Props every availability surface (grid, bars, list) receives. */
export interface SurfaceProps {
  view: View;
  mode: 'mine' | 'group';
  /** Names free in each slot, filtered by who counts. */
  counts: Map<string, string[]>;
  total: number;
  mine: Set<string>;
  /** Slots to spotlight: a hovered best time, or the people picked in the list. */
  highlight: Set<string> | null;
  /** A person spotlight empties other cells; a best-time spotlight only dims them. */
  spotlight: 'person' | 'window' | null;
  /** Null when painting is disabled. The grid paints in either mode when set. */
  onPaint: ((keys: string[], on: boolean) => void) | null;
  onHover: (key: string | null) => void;
}
