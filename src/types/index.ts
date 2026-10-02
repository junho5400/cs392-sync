export type SyncEvent = {
  title: string;
  /** Minutes from midnight. `start` is inclusive, `end` exclusive. */
  start: number;
  end: number;
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

export interface Person {
  name: string;
  /** Slot keys from `slotKey`. */
  slots: Set<string>;
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
