// Motion values measured on noechague-site.vercel.app/ui/pending-transactions and beautifului.dev.
export const CARD_SPRING = { type: 'spring', duration: 0.42, bounce: 0.28 } as const;
export const SOFT_SPRING = { type: 'spring', duration: 0.3, bounce: 0 } as const;
export const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

/** Noe's card entrance: rises 20px out of a 2px blur. */
export const ENTER = {
  initial: { opacity: 0.2, y: 20, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.3, ease: EASE_OUT_STRONG },
} as const;

/** beautifului pop-in for chips and small pills. */
export const POP = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.22, ease: EASE_OUT_STRONG },
} as const;
