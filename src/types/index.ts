export type SyncEvent = {
  id?: string;
  title: string;
  /** Minutes from midnight. `start` is inclusive, `end` exclusive. */
  start: number;
  end: number;
  /** IANA zone the slots are stored in. The creator's zone when omitted. */
  timeZone?: string;
  /** Meeting length in minutes. 60 when omitted. */
  duration?: number;
} & (
  | {
      kind: 'dates';
      /** Local dates as YYYY-MM-DD, sorted. */
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
  /** Slot keys from `slotKey`. */
  slots: Set<string>;
  /** Set when this person does not have to attend. */
  optional?: boolean;
  /** A vote key, or null. */
  vote?: string | null;
}

/** Props every availability surface (grid, bars, list) receives. */
export interface SurfaceProps {
  event: SyncEvent;
  /** Names free in each slot, you included. */
  counts: Map<string, string[]>;
  total: number;
  mine: Set<string>;
  /** Slots to spotlight: a hovered person or best time. */
  highlight: Set<string> | null;
  /** Where the spotlight comes from; a person turns other cells fully empty. */
  spotlight?: 'person' | 'window';
  onPaint: (keys: string[], on: boolean) => void;
  /** Replace all of your slots at once (one undo step). */
  onReplace: (slots: Set<string>) => void;
  onHover: (key: string | null) => void;
}
