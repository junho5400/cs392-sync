import { motion } from 'motion/react';
import { CARD_SPRING } from '../utilities/motion';

export const NotFound = ({ onNew }: { onNew: () => void }) => (
  <motion.section
    layoutId="sheet"
    transition={CARD_SPRING}
    className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-2 rounded-2xl bg-surface px-6 py-10 text-center shadow-card"
  >
    <h1 className="text-[18px] font-semibold tracking-tight text-ink-1">Event not found</h1>
    <p className="text-[13px] text-ink-2">This link is broken, or the event was removed.</p>
    <button
      onClick={onNew}
      className="mt-3 h-8 rounded-lg bg-brand px-4 text-[12.5px] font-medium text-brand-ink transition-transform duration-150 active:scale-[0.96]"
    >
      Create a new event
    </button>
  </motion.section>
);
