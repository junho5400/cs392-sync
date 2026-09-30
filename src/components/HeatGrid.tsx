import { useState, type KeyboardEvent } from 'react';
import type { SurfaceProps } from '../types';
import { cellAt } from '../utilities/cellAt';
import { HEAT, STEP, fmtDay, fmtTime, heat, parseKey, rectKeys, slotKey, times } from '../utilities/slots';

interface Drag {
  anchor: string;
  current: string;
  on: boolean;
}

/** One grid: the group heatmap and your marks share every cell. */
export const HeatGrid = ({ event, counts, total, mine, highlight, onPaint, onHover }: SurfaceProps) => {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const rows = times(event);
  const preview = drag ? new Set(rectKeys(event, drag.anchor, drag.current)) : null;
  const isMine = (k: string) => (drag && preview?.has(k) ? drag.on : mine.has(k));
  const hovered = hover ? parseKey(hover) : null;

  const toggleAll = (keys: string[]) => onPaint(keys, !keys.every((k) => mine.has(k)));

  const moveFocus = (e: KeyboardEvent, key: string) => {
    const { date, min } = parseKey(key);
    const d = event.dates.indexOf(date);
    const next = {
      ArrowUp: [d, min - STEP],
      ArrowDown: [d, min + STEP],
      ArrowLeft: [d - 1, min],
      ArrowRight: [d + 1, min],
    }[e.key] as [number, number] | undefined;
    if (!next || !event.dates[next[0]] || next[1] < event.start || next[1] >= event.end) return;
    e.preventDefault();
    document.querySelector<HTMLElement>(`[data-key="${slotKey(event.dates[next[0]], next[1])}"]`)?.focus();
  };

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="grid min-w-fit grid-cols-[40px_1fr] gap-x-1.5">
        <span />
        <div className="grid auto-cols-[minmax(44px,1fr)] grid-flow-col gap-0.5">
          {event.dates.map((date) => {
            const d = fmtDay(date);
            return (
              <button
                key={date}
                onClick={() => toggleAll(rows.map((m) => slotKey(date, m)))}
                aria-label={`Toggle all of ${d.dow} ${d.mon} ${d.day}`}
                className={`flex h-9 flex-col items-center justify-center rounded-md leading-none transition-colors hover:bg-sunken ${
                  hovered?.date === date ? 'bg-sunken' : ''
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-2">{d.dow}</span>
                <span className="mt-1 text-[13px] font-semibold tabular-nums text-ink-1">{d.day}</span>
              </button>
            );
          })}
        </div>

        <div className="grid auto-rows-[22px] gap-y-0.5">
          {rows.map((m) => (
            <button
              key={m}
              onClick={() => toggleAll(event.dates.map((d) => slotKey(d, m)))}
              aria-label={`Toggle ${fmtTime(m)} on every day`}
              className={`-mt-2.5 h-5 text-right text-[10.5px] tabular-nums transition-colors hover:text-ink ${
                hovered?.min === m ? 'text-ink' : m % 60 ? 'text-transparent' : 'text-ink-3'
              }`}
            >
              {fmtTime(m, true)}
            </button>
          ))}
        </div>

        <div
          role="grid"
          aria-label="Availability"
          className="grid touch-none select-none auto-cols-[minmax(44px,1fr)] grid-flow-col gap-0.5"
          onPointerDown={(e) => {
            const key = cellAt(e);
            if (!key || e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag({ anchor: key, current: key, on: !mine.has(key) });
          }}
          onPointerMove={(e) => {
            const key = cellAt(e);
            if (key && drag && key !== drag.current) setDrag({ ...drag, current: key });
            if (key !== hover) {
              setHover(key);
              onHover(key);
            }
          }}
          onPointerUp={() => {
            if (preview && drag) onPaint([...preview], drag.on);
            setDrag(null);
          }}
          onPointerCancel={() => setDrag(null)}
          onPointerLeave={() => {
            setHover(null);
            onHover(null);
          }}
        >
          {event.dates.map((date) => (
            <div key={date} role="row" className="grid auto-rows-[22px] gap-y-0.5">
              {rows.map((m) => {
                const key = slotKey(date, m);
                const on = isMine(key);
                // Live count: swap your saved mark for the drag preview.
                const count = (counts.get(key)?.length ?? 0) - (mine.has(key) ? 1 : 0) + (on ? 1 : 0);
                const d = fmtDay(date);
                return (
                  <button
                    key={key}
                    role="gridcell"
                    data-key={key}
                    aria-pressed={on}
                    aria-label={`${d.dow} ${d.mon} ${d.day}, ${fmtTime(m)}, ${count} of ${total} free`}
                    tabIndex={key === slotKey(event.dates[0], event.start) ? 0 : -1}
                    onKeyDown={(e) => moveFocus(e, key)}
                    onClick={(e) => e.detail === 0 && onPaint([key], !mine.has(key))}
                    onFocus={() => onHover(key)}
                    className={`grid place-items-center rounded-[5px] text-[10.5px] font-semibold tabular-nums transition-[background-color,opacity] duration-150 ${
                      count ? HEAT[heat(count, total)] : 'bg-sunken/60'
                    } ${highlight && !highlight.has(key) ? 'opacity-30' : ''} ${
                      hover === key ? 'outline outline-1 -outline-offset-1 outline-ink-3' : ''
                    }`}
                  >
                    <span
                      className={`grid h-4 min-w-5 place-items-center rounded-full px-1 leading-none transition-[background-color,color,transform] duration-150 ease-out-strong ${
                        on ? 'scale-100 bg-brand text-brand-ink' : 'scale-90 text-ink-1/80'
                      }`}
                    >
                      {count || ''}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
