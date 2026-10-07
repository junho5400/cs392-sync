import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { SurfaceProps } from '../types';
import { cellAt } from '../utilities/cellAt';
import { FAINT, HEAT, STEP, colHead, fmtCol, fmtTime, heat, parseKey, rectKeys, slotKey } from '../utilities/slots';

interface Drag {
  anchor: string;
  current: string;
  on: boolean;
}

/**
 * One grid, two emphases. "mine": your marks are solid and the group shows faintly
 * underneath, so you can paint toward popular times. "group": full heat with counts.
 */
export const HeatGrid = ({ view, mode, counts, total, mine, highlight, spotlight, onPaint, onHover }: SurfaceProps) => {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const { cols, rows, keyAt } = view;
  const painting = onPaint !== null;
  const preview = drag ? new Set(rectKeys(view, drag.anchor, drag.current)) : null;
  const isMine = (k: string) => (drag && preview?.has(k) ? drag.on : mine.has(k));
  const hovered = hover ? parseKey(hover) : null;
  const firstCell = cols.flatMap((c) => rows.map((m) => (keyAt(c, m) ? slotKey(c, m) : null))).find(Boolean);

  const toggleAll = (keys: (string | null)[]) => {
    const real = keys.filter((k): k is string => k !== null);
    onPaint?.(real, !real.every((k) => mine.has(k)));
  };

  const point = (cell: string | null) => {
    if (cell === hover) return;
    setHover(cell);
    const { date, min } = cell ? parseKey(cell) : { date: '', min: 0 };
    onHover(cell ? keyAt(date, min) : null);
  };

  const moveFocus = (e: KeyboardEvent, cell: string) => {
    const { date, min } = parseKey(cell);
    const d = cols.indexOf(date);
    const next = {
      ArrowUp: [d, min - STEP],
      ArrowDown: [d, min + STEP],
      ArrowLeft: [d - 1, min],
      ArrowRight: [d + 1, min],
    }[e.key] as [number, number] | undefined;
    if (!next || !cols[next[0]] || !keyAt(cols[next[0]], next[1])) return;
    e.preventDefault();
    document.querySelector<HTMLElement>(`[data-cell="${slotKey(cols[next[0]], next[1])}"]`)?.focus();
  };

  const down = (e: PointerEvent) => {
    const cell = cellAt(e, 'cell');
    if (!cell || e.button !== 0) return;
    if (!painting) {
      point(cell);
      return;
    }
    point(null);
    const { date, min } = parseKey(cell);
    const key = keyAt(date, min);
    if (!key) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ anchor: cell, current: cell, on: !mine.has(key) });
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
      <div className="grid min-w-fit grid-cols-[46px_1fr] pb-1">
        <span className="sticky top-0 left-0 z-30 bg-surface" />
        <div className="sticky top-0 z-20 grid auto-cols-[minmax(44px,1fr)] grid-flow-col gap-0.5 bg-surface pb-1">
          {cols.map((col) => {
            const h = colHead(view.when({ col, min: rows.find((m) => keyAt(col, m)) ?? 0 }).col);
            const label = (
              <>
                <span className="text-[11px] text-ink-3">{h.top}</span>
                <span className="mt-1 text-[13px] font-semibold tabular-nums text-ink">{h.bottom}</span>
              </>
            );
            const cls = `flex h-9 flex-col items-center justify-center rounded-md leading-none transition-colors ${
              hovered?.date === col ? 'bg-sunken' : ''
            }`;
            return painting ? (
              <button
                key={col}
                onClick={() => toggleAll(rows.map((m) => keyAt(col, m)))}
                aria-label={`Toggle all of ${fmtCol(col)}`}
                className={`${cls} hover:bg-sunken`}
              >
                {label}
              </button>
            ) : (
              <div key={col} className={cls}>
                {label}
              </div>
            );
          })}
        </div>

        <div className="sticky left-0 z-10 grid auto-rows-[22px] gap-y-0.5 bg-surface pr-1.5">
          {rows.map((m) => {
            const cls = `flex items-center justify-end text-[11px] leading-[14px] tabular-nums transition-colors ${
              hovered?.min === m ? 'text-ink' : m % 60 ? 'text-transparent' : 'text-ink-3'
            }`;
            return painting ? (
              <button
                key={m}
                onClick={() => toggleAll(cols.map((d) => keyAt(d, m)))}
                aria-label={`Toggle ${fmtTime(m)} on every day`}
                className={`${cls} hover:text-ink`}
              >
                {fmtTime(m, true)}
              </button>
            ) : (
              <span key={m} className={cls}>
                {fmtTime(m, true)}
              </span>
            );
          })}
        </div>

        <div
          role="grid"
          aria-label={mode === 'mine' ? 'Your availability' : 'Group availability'}
          className={`grid select-none auto-cols-[minmax(44px,1fr)] grid-flow-col gap-0.5 ${painting ? 'touch-none' : ''}`}
          onPointerDown={down}
          onPointerMove={(e) => {
            const cell = cellAt(e, 'cell');
            if (drag && cell && cell !== drag.current) setDrag({ ...drag, current: cell });
            // The gaps between cells have no cell; keep the last one so the readout doesn't blink.
            if (!drag && cell && e.pointerType !== 'touch') point(cell);
          }}
          onPointerUp={() => {
            if (preview && drag) onPaint?.([...preview], drag.on);
            setDrag(null);
          }}
          onPointerCancel={() => setDrag(null)}
          onPointerLeave={(e) => e.pointerType !== 'touch' && point(null)}
        >
          {cols.map((col) => (
            <div key={col} role="row" className="grid auto-rows-[22px] gap-y-0.5">
              {rows.map((m) => {
                const cell = slotKey(col, m);
                const key = keyAt(col, m);
                if (!key) return <span key={cell} aria-hidden="true" className="hatch rounded-[5px]" />;
                const on = isMine(key);
                const at = view.when({ col, min: m });
                const others = (counts.get(key)?.length ?? 0) - (mine.has(key) ? 1 : 0);
                // Live count while dragging: your preview replaces your saved mark.
                const count = others + (on ? 1 : 0);
                const outside = highlight !== null && !highlight.has(key);
                const erased = outside && spotlight === 'person' && mode === 'group';
                const dim = outside && !erased ? 'opacity-30' : '';
                const ring = hover === cell ? 'outline outline-1 -outline-offset-1 outline-ink-3' : '';
                const fill =
                  mode === 'mine'
                    ? on
                      ? 'bg-brand text-brand-ink'
                      : others
                        ? FAINT[heat(others, total)]
                        : 'bg-sunken/60'
                    : count && !erased
                      ? HEAT[heat(count, total)]
                      : 'bg-sunken/60';
                return (
                  <button
                    key={cell}
                    role="gridcell"
                    data-cell={cell}
                    aria-pressed={painting ? on : undefined}
                    aria-label={`${fmtCol(at.col)}, ${fmtTime(at.min)}, ${count} of ${total} free${on ? ', you' : ''}`}
                    tabIndex={cell === firstCell ? 0 : -1}
                    onKeyDown={(e) => moveFocus(e, cell)}
                    onClick={(e) => painting && e.detail === 0 && onPaint?.([key], !mine.has(key))}
                    onFocus={() => point(cell)}
                    className={`grid place-items-center rounded-[5px] text-[11px] font-semibold tabular-nums transition-[background-color,opacity] duration-150 ${fill} ${dim} ${ring}`}
                  >
                    {mode === 'group' && <span className="text-ink-1/80">{erased ? '' : count || ''}</span>}
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
