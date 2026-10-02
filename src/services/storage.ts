const key = (eventId: string) => `sync:name:${eventId}`;

/**
 * Your name for an event on this device, or null when unset, blank, or
 * unreadable (private mode). Refresh keeps you as you.
 */
export const recallName = (eventId: string): string | null => {
  try {
    const v = localStorage.getItem(key(eventId));
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
};

/** Remember your name for an event on this device. Never throws. */
export const rememberName = (eventId: string, name: string): void => {
  try {
    localStorage.setItem(key(eventId), name);
  } catch {
    // Private mode: the name lasts for this visit only.
  }
};
