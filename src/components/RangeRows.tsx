import { useState, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './Icon';
import type { SurfaceProps } from '../types';
import { cellAt } from '../utilities/cellAt';
import { CARD_SPRING, POP } from '../utilities/motion';
import { resize, runs, type Run, type Span } from '../utilities/runs';
import { HEAT, STEP, fmtDay, fmtTime, heat, parseKey, slotKey, times } from '../utilities/slots';

interface Drag {
  date: string;
  from: number;
  to: number;
  on: boolean;
  /** Set when a bar edge is dragged instead of the track. */
  edge?: { run: Run; side: 'start' | 'end' };
}

const pending = (d: Drag): Span | null =>
  d.edge ? resize(d.edge.run, d.edge.side, d.to) : { lo: Math.min(d.from, d.to), hi: Math.max(d.from, d.to), on: d.on };

// Slot count and bar spans come from data, so they ride on CSS custom properties: the one allowed `style` use.
const vars = (v: Record<string, number>) => v as CSSProperties;

const ROW = 'grid grid-cols-[var(--g)_minmax(0,1fr)_24px] gap-x-1.5 sm:gap-x-2';
const COLS = 'grid grid-cols-[repeat(var(--n),minmax(0,1fr))]';
const clock = (m: number) => fmtTime(m).slice(0, -2);

/** Your availability as bars on one timeline per date, with the group's count per slot underneath. */
export const RangeRows = ({ event, counts, total, mine, highlight, onPaint, onReplace, onHover }: SurfaceProps) => {
  const ts = times(event);
  const n = ts.length;
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [focus, setFocus] = useState(() => slotKey(event.dates[0], event.start));
  const span = drag && pending(drag);
  const hotAt = hot ? parseKey(hot) : null;
  const hotIdx = hotAt ? ts.indexOf(hotAt.min) : -1;

  const hover = (key: string | null) => {
    setHot(key);
    onHover(key);
  };
  const keysOf = (date: string, lo: number, hi: number) => ts.slice(lo, hi + 1).map((m) => slotKey(date, m));
  const indexAt = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
  };

  return (
    <div
      className="relative select-none [--g:44px] sm:[--g:64px]"
      style={vars({ '--n': n })}
      onPointerMove={(e) => hover(cellAt(e))}
      onPointerDown={(e) => hover(cellAt(e))}
      onPointerLeave={(e) => e.pointerType !== 'touch' && hover(null)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && hover(null)}
      onKeyDown={(e) => {
        const key = e.target instanceof HTMLButtonElement ? e.target.dataset.key : undefined;
        const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        const dx = e.key === 'ArrowLeft' ? -STEP : e.key === 'ArrowRight' ? STEP : 0;
        if (!key || !(dx || dy)) return;
        e.preventDefault();
        const { date, min } = parseKey(key);
        const next = slotKey(event.dates[event.dates.indexOf(date) + dy], min + dx);
        e.currentTarget.querySelector<HTMLButtonElement>(`button[data-key="${next}"]`)?.focus();
      }}
    >
      <div className={ROW} aria-hidden="true">
        <span />
        <div className={`${COLS} h-5 text-[10.5px] tabular-nums`}>
          {ts.map((m, i) => (
            <span key={m} className="relative">
              {(m % 60 === 0 || i === hotIdx) && (
                <span
                  className={`absolute bottom-1 left-0 -translate-x-1/2 whitespace-nowrap rounded px-0.5 leading-none ${
                    i === hotIdx
                      ? 'bg-surface text-ink'
                      : `text-ink-3 ${m % 120 && n > 8 ? 'max-sm:hidden' : ''} ${Math.abs(i - hotIdx) === 1 ? 'max-sm:invisible' : ''}`
                  }`}
                >
                  {fmtTime(m, true)}
                </span>
              )}
              {i === n - 1 && (
                <span className="absolute bottom-1 right-0 translate-x-1/2 leading-none text-ink-3">
                  {fmtTime(event.end, true)}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        {event.dates.map((date) => {
          const d = fmtDay(date);
          const rs = runs(event, date, mine);
          const all = rs.length === 1 && rs[0][0] === 0 && rs[0][1] === n - 1;
          const preview = drag?.date === date ? span : null;
          const hotSlot = !drag && hotAt?.date === date ? hotIdx : -1;
          return (
            <div key={date} className={`group ${ROW} py-1`}>
              <button
                onClick={() => onPaint(keysOf(date, 0, n - 1), !all)}
                aria-pressed={all}
                aria-label={`Whole day, ${d.dow} ${d.mon} ${d.day}`}
                className="-ml-1.5 flex flex-col justify-center rounded-lg pl-1.5 text-left transition-colors hover:bg-sunken active:scale-[0.97]"
              >
                <span className="text-[10.5px] font-medium uppercase leading-tight tracking-[0.1em] text-ink-2">{d.dow}</span>
                <span className="text-[12.5px] font-medium leading-tight text-ink">
                  {d.mon} {d.day}
                </span>
              </button>

              <div className="flex min-w-0 flex-col gap-0.5">
                <div
                  className="relative isolate h-[26px] touch-pan-y rounded-lg bg-sunken"
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    const i = indexAt(e);
                    const side = (e.target as HTMLElement).closest<HTMLElement>('[data-edge]')?.dataset.edge as
                      | 'start'
                      | 'end'
                      | undefined;
                    const run = side && rs.find((r) => r[side === 'start' ? 0 : 1] === i);
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDrag({ date, from: i, to: i, on: !mine.has(slotKey(date, ts[i])), edge: run ? { run, side } : undefined });
                  }}
                  onPointerMove={(e) => {
                    const i = indexAt(e);
                    if (drag && drag.to !== i) setDrag({ ...drag, to: i });
                  }}
                  onPointerUp={() => {
                    if (drag && span) onPaint(keysOf(date, span.lo, span.hi), span.on);
                    setDrag(null);
                  }}
                  onPointerCancel={() => setDrag(null)}
                >
                  <div className={`${COLS} h-full`}>
                    {ts.map((m, i) => {
                      const k = slotKey(date, m);
                      const on = mine.has(k);
                      return (
                        <button
                          key={m}
                          data-key={k}
                          tabIndex={k === focus ? 0 : -1}
                          aria-pressed={on}
                          aria-label={`${d.dow} ${d.mon} ${d.day}, ${fmtTime(m)}, ${counts.get(k)?.length ?? 0} of ${total} free`}
                          onFocus={() => {
                            setFocus(k);
                            hover(k);
                          }}
                          onClick={(e) => e.detail === 0 && onPaint([k], !on)}
                          className={`relative outline-none focus-visible:z-20 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-accent ${
                            i && m % 60 === 0 ? 'border-l border-dashed border-line-strong' : ''
                          }`}
                        />
                      );
                    })}
                  </div>

                  <div className={`${COLS} pointer-events-none absolute inset-0 z-10`}>
                    <AnimatePresence initial={false}>
                      {rs.map(([s, e]) => {
                        const on = hotSlot >= s && hotSlot <= e;
                        return (
                          <motion.div
                            key={s}
                            layout
                            {...POP}
                            transition={{ ...POP.transition, layout: CARD_SPRING }}
                            style={vars({ '--s': s + 1, '--e': e + 2 })}
                            className="@container relative col-[var(--s)/var(--e)] row-start-1 m-0.5 flex items-center rounded-md bg-brand px-1.5 text-brand-ink"
                          >
                            <motion.span
                              layout
                              className={`hidden truncate text-[11px] font-semibold tabular-nums @[72px]:block ${on ? 'mr-4' : ''}`}
                            >
                              {clock(ts[s])} – {clock(ts[e] + STEP)}
                            </motion.span>
                            {(['start', 'end'] as const).map((side) => (
                              <span
                                key={side}
                                aria-hidden="true"
                                data-edge={side}
                                data-key={slotKey(date, ts[side === 'start' ? s : e])}
                                className={`absolute inset-y-0 grid w-1.5 cursor-ew-resize place-items-center pointer-coarse:hidden ${
                                  side === 'start' ? 'left-0' : 'right-0'
                                } ${on ? 'pointer-events-auto' : ''}`}
                              >
                                <span
                                  className={`h-2.5 w-0.5 rounded-full bg-brand-ink/70 transition-opacity ${on ? '' : 'opacity-0'}`}
                                />
                              </span>
                            ))}
                            <button
                              data-key={slotKey(date, ts[e])}
                              aria-label={`Remove ${d.dow} ${fmtTime(ts[s])} – ${fmtTime(ts[e] + STEP)}`}
                              onPointerDown={(ev) => ev.stopPropagation()}
                              onClick={() => onPaint(keysOf(date, s, e), false)}
                              className={`absolute right-1.5 hidden size-4 place-items-center rounded bg-brand-ink/15 transition-opacity hover:bg-brand-ink/30 focus-visible:opacity-100 @[44px]:grid ${
                                on ? 'pointer-events-auto' : 'opacity-0'
                              }`}
                            >
                              <Icon name="x" className="size-2.5" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {preview && (
                      <div
                        style={vars({ '--s': preview.lo + 1, '--e': preview.hi + 2 })}
                        className={`relative z-10 col-[var(--s)/var(--e)] row-start-1 m-0.5 rounded-md ${
                          preview.on ? 'bg-brand/40' : 'hatch ring-1 ring-inset ring-line-strong'
                        }`}
                      />
                    )}
                  </div>
                </div>

                <div aria-hidden="true" className={`${COLS} h-4 overflow-hidden rounded-[5px] bg-sunken`}>
                  {ts.map((m, i) => {
                    const k = slotKey(date, m);
                    const c = counts.get(k)?.length ?? 0;
                    return (
                      <div
                        key={m}
                        data-key={k}
                        className={`@container grid place-items-center text-[10px] font-semibold leading-none tabular-nums text-ink-1 ${
                          HEAT[heat(c, total)]
                        } ${i ? 'border-l border-surface' : ''} ${highlight?.has(k) ? 'ring-1 ring-inset ring-ink' : ''}`}
                      >
                        {c > 0 && <span className="hidden @[14px]:block">{c}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {rs.length > 0 && event.dates.length > 1 && (
                <button
                  onClick={() => onReplace(new Set(event.dates.flatMap((o) => rs.flatMap(([s, e]) => keysOf(o, s, e)))))}
                  className="group/copy relative mt-px grid size-6 place-items-center self-start rounded-md text-ink-2 opacity-0 transition-[opacity,color,background-color] hover:bg-sunken hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
                >
                  <Icon name="copy" className="size-3" />
                  <span className="pointer-events-none absolute right-full mr-1 whitespace-nowrap rounded-md bg-surface px-1.5 py-0.5 text-[11.5px] font-medium text-ink shadow-pop opacity-0 transition-opacity group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100">
                    Copy to all days
                  </span>
                </button>
              )}
            </div>
          );
        })}

        {hotIdx >= 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-[calc(var(--g)+0.375rem)] right-[calc(24px+0.375rem)] sm:left-[calc(var(--g)+0.5rem)] sm:right-[calc(24px+0.5rem)]"
          >
            <div style={vars({ '--h': hotIdx })} className="absolute inset-y-0 left-[calc(var(--h)*100%/var(--n))] w-px bg-ink/30" />
          </div>
        )}
      </div>
    </div>
  );
};
