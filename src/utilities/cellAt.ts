/** The `data-key` of the element under a pointer. Works while the pointer is captured (touch drags). */
export const cellAt = (e: { clientX: number; clientY: number }, attr = 'key') =>
  (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>(
    `[data-${attr}]`,
  )?.dataset[attr] ?? null;
