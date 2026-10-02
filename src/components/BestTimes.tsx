import { AnimatePresence, motion } from 'motion/react';
import { CARD_SPRING, ENTER } from '../utilities/motion';
import { fmtCol, fmtTime, type Window } from '../utilities/slots';

interface Props {
  windows: Window[];
  total: number;
  onHover: (w: Window | null) => void;
}

export const BestTimes = ({ windows, total, onHover }: Props) => (
  <div className="flex flex-col gap-1">
    <p className="mb-1 flex h-5 items-center text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">Best times</p>
    {!windows.length && <p className="text-[12px] text-ink-3">Mark times to see overlaps.</p>}
    <AnimatePresence mode="popLayout" initial={false}>
      {windows.map((w, i) => {
        return (
          <motion.button
            key={`${w.date}${w.start}${w.end}${w.names.length}`}
            layout
            {...ENTER}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ ...ENTER.transition, delay: i * 0.04, layout: CARD_SPRING }}
            onMouseEnter={() => onHover(w)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(w)}
            onBlur={() => onHover(null)}
            className="group flex items-center gap-3 rounded-[10px] border border-line bg-surface px-2.5 py-2 text-left shadow-btn transition-colors hover:border-ink"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-medium text-ink">
                {fmtCol(w.date)}
              </span>
              <span className="block text-[12px] tabular-nums text-ink-2">
                {fmtTime(w.start)} – {fmtTime(w.end)}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="text-[12px] font-semibold tabular-nums">
                {w.names.length}
                <span className="font-normal text-ink-3">/{total}</span>
              </span>
              <span className="h-1 w-10 overflow-hidden rounded-full bg-line">
                <motion.span
                  className="block h-full rounded-full bg-heat"
                  initial={false}
                  animate={{ width: `${(w.names.length / total) * 100}%` }}
                  transition={CARD_SPRING}
                />
              </span>
            </span>
          </motion.button>
        );
      })}
    </AnimatePresence>
  </div>
);
