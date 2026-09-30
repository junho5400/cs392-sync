import { useState } from 'react';
import { motion } from 'motion/react';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import type { SurfaceProps } from '../types';
import { cellAt } from '../utilities/cellAt';
import { CARD_SPRING, ENTER } from '../utilities/motion';
import { HEAT, extendPath, fmtDay, fmtTime, heat, paint, slotKey, times } from '../utilities/slots';

const MOVES: Record<string, [day: number, row: number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};
const STACK = 4;
const SPREAD = 5;

/** One card per date, one row per slot: count and who is free always visible. */
export const Agenda = ({ event, counts, total, mine, highlight, onPaint, onHover }: SurfaceProps) => {
  const [drag, setDrag] = useState<{ on: boolean; path: string[] } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const ts = times(event);
  const shown = drag ? paint(mine, drag.path, drag.on) : mine;
  const tabbable = active ?? slotKey(event.dates[0], ts[0]);

  const hoverTo = (key: string | null) => {
    if (key === hover) return;
    setHover(key);
    onHover(key);
  };

  const focusSlot = (di: number, ti: number) => {
    const date = event.dates[di];
    const m = ts[ti];
    if (date && m !== undefined)
      document.querySelector<HTMLElement>(`[data-key="${slotKey(date, m)}"] [data-toggle]`)?.focus();
  };

  return (
    <div
      className="grid select-none gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))]"
      onPointerDown={(e) => {
        const key = cellAt(e);
        // Touch paints only from the toggle column so the rest of the row still scrolls the page.
        if (!key || e.button || (e.pointerType === 'touch' && !cellAt(e, 'toggle'))) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({ on: !mine.has(key), path: [key] });
      }}
      onPointerMove={(e) => {
        const key = cellAt(e);
        hoverTo(key);
        if (drag && key && key !== drag.path[drag.path.length - 1])
          setDrag({ ...drag, path: extendPath(event, drag.path, key) });
      }}
      onPointerUp={() => {
        if (!drag) return;
        onPaint(drag.path, drag.on);
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
      onPointerLeave={() => hoverTo(null)}
    >
      {event.dates.map((date, di) => {
        const d = fmtDay(date);
        const day = `${d.dow} ${d.mon} ${d.day}`;
        const keys = ts.map((m) => slotKey(date, m));
        const allOn = keys.every((k) => mine.has(k));
        const peak = Math.max(...keys.map((k) => counts.get(k)?.length ?? 0));
        return (
          <motion.section
            key={date}
            aria-label={day}
            {...ENTER}
            transition={{ ...ENTER.transition, delay: di * 0.04 }}
            className="overflow-hidden rounded-xl border border-line bg-surface"
          >
            <button
              onClick={() => onPaint(keys, !allOn)}
              title={allOn ? 'Unmark the whole day' : 'Mark the whole day'}
              aria-label={`${allOn ? 'Unmark' : 'Mark'} all of ${day}, up to ${peak} of ${total} free`}
              className="flex h-8 w-full items-center gap-1.5 border-b border-dashed border-line px-2 text-left transition-colors hover:bg-sunken"
            >
              <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-2">{d.dow}</span>
              <span className="text-[12.5px] font-semibold text-ink">
                {d.mon} {d.day}
              </span>
              <span className="ml-auto flex items-center gap-1 text-[11px] font-medium tabular-nums text-ink-1">
                <span className={`size-1.5 rounded-full shadow-[inset_0_0_0_1px_var(--color-line-strong)] ${HEAT[heat(peak, total)]}`} />
                {peak}
                <span className="-ml-1 text-ink-3">/{total}</span>
              </span>
            </button>
            {ts.map((m, ti) => {
              const key = keys[ti];
              const names = counts.get(key) ?? [];
              const h = heat(names.length, total);
              const on = shown.has(key);
              const spread = !drag && hover === key;
              return (
                <div
                  key={key}
                  data-key={key}
                  className={`relative flex h-[26px] cursor-pointer touch-pan-y items-center gap-1 px-2 text-ink transition-colors duration-150 ${
                    HEAT[h]
                  } ${h === 5 ? 'dark:text-brand-ink' : ''} ${highlight?.has(key) ? 'ring-1 ring-inset ring-ink' : ''}`}
                >
                  {on && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-brand" />}
                  <span className={`w-8 shrink-0 text-[11.5px] tabular-nums ${m % 60 ? 'opacity-45' : 'opacity-80'}`}>
                    {fmtTime(m, true)}
                  </span>
                  <button
                    data-toggle
                    aria-pressed={on}
                    aria-label={`${day}, ${fmtTime(m)}, ${names.length} of ${total} free`}
                    tabIndex={key === tabbable ? 0 : -1}
                    onFocus={() => {
                      setActive(key);
                      hoverTo(key);
                    }}
                    onBlur={() => hoverTo(null)}
                    onClick={(e) => e.detail === 0 && onPaint([key], !on)}
                    onKeyDown={(e) => {
                      const move = MOVES[e.key];
                      if (!move) return;
                      e.preventDefault();
                      focusSlot(di + move[0], ti + move[1]);
                    }}
                    className="grid h-full w-5 shrink-0 touch-none place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <motion.span
                      key={String(on)}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={CARD_SPRING}
                      className={`grid size-3.5 place-items-center rounded-[4px] ${
                        on ? 'bg-brand text-brand-ink' : 'bg-surface ring-1 ring-line-strong'
                      }`}
                    >
                      {on && <Icon name="check" className="size-2.5" />}
                    </motion.span>
                  </button>
                  <span aria-hidden="true" className="flex h-full min-w-0 flex-1 items-center overflow-hidden pl-1">
                    {names.slice(0, STACK).map((n, i) => (
                      <motion.span
                        key={n}
                        animate={{ x: spread ? i * SPREAD : 0 }}
                        transition={CARD_SPRING}
                        className={`rounded-full bg-surface ${i ? '-ml-1.5' : ''}`}
                      >
                        <Avatar name={n} className="size-4 text-[7px]" />
                      </motion.span>
                    ))}
                    {names.length > STACK && (
                      <motion.span
                        animate={{ x: spread ? STACK * SPREAD : 0 }}
                        transition={CARD_SPRING}
                        className="pl-1 text-[10.5px] font-medium tabular-nums opacity-60"
                      >
                        +{names.length - STACK}
                      </motion.span>
                    )}
                  </span>
                  <span className={`shrink-0 text-[11.5px] font-semibold tabular-nums ${names.length ? '' : 'opacity-40'}`}>
                    {names.length}
                    <span className={`font-normal ${names.length ? 'opacity-45' : ''}`}>/{total}</span>
                  </span>
                </div>
              );
            })}
          </motion.section>
        );
      })}
    </div>
  );
};
