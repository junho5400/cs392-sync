export interface SyncEvent {
  title: string;
  /** Local dates as YYYY-MM-DD, sorted. */
  dates: string[];
  /** Minutes from midnight. `start` is inclusive, `end` exclusive. */
  start: number;
  end: number;
}

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
  onPaint: (keys: string[], on: boolean) => void;
  onHover: (key: string | null) => void;
}
