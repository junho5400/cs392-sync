import { useState } from 'react';
import { IconButton } from './ui/IconButton';
import { cellAt } from '../utilities/cellAt';
import { toDate, toIso } from '../utilities/slots';

const WEEKS = 5;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

interface Props {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

/** Rolling 5-week picker like When2meet (no month flipping for most events), styled like cal.com. */
export const MonthPicker = ({ selected, onChange }: Props) => {
  const today = toIso(new Date());
  const [first, setFirst] = useState(() => addDays(new Date(), -new Date().getDay()));
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<boolean | null>(null);
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => toIso(addDays(first, i)));
  const last = toDate(days[days.length - 1]);

  const apply = (date: string, on: boolean, base = selected) => {
    if (date < today || base.has(date) === on) return;
    const next = new Set(base);
    if (on) next.add(date);
    else next.delete(date);
    onChange(next);
  };

  const label = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p key={page} className={`text-[13px] font-semibold text-ink ${page ? 'fade-in' : ''}`}>
          {label(first)}
          <span className="mx-2 font-normal text-ink-3">to</span>
          {label(last)}
        </p>
        <div className="-mr-1.5 flex">
          {([-4, 4] as const).map((n) => (
            <IconButton
              key={n}
              icon={n < 0 ? 'left' : 'right'}
              label={n < 0 ? 'Earlier weeks' : 'Later weeks'}
              onClick={() => {
                setFirst(addDays(first, n * 7));
                setPage((p) => p + 1);
              }}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DOW.map((d) => (
          <span key={d} className="pb-1.5 text-center text-[12px] text-ink-3">
            {d}
          </span>
        ))}
      </div>
      <div
        key={page}
        className={`grid touch-none select-none grid-cols-7 gap-1 ${page ? 'fade-in' : ''}`}
        onPointerDown={(e) => {
          const date = cellAt(e, 'date');
          if (!date || date < today) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const on = !selected.has(date);
          setMode(on);
          apply(date, on);
        }}
        onPointerMove={(e) => {
          const date = cellAt(e, 'date');
          if (mode !== null && date) apply(date, mode);
        }}
        onPointerUp={() => setMode(null)}
        onPointerCancel={() => setMode(null)}
      >
        {days.map((date) => {
          const d = toDate(date);
          const past = date < today;
          const on = selected.has(date);
          return (
            <button
              key={date}
              data-date={date}
              disabled={past}
              aria-pressed={on}
              aria-label={d.toDateString()}
              onClick={(e) => e.detail === 0 && apply(date, !on)}
              className={`relative grid h-10 place-items-center rounded-lg text-[13px] tabular-nums transition-colors duration-150 ${
                past ? 'text-ink-3/60' : on ? 'bg-brand font-medium text-brand-ink' : 'font-medium text-ink-1 hover:bg-sunken'
              }`}
            >
              {d.getDate() === 1 && (
                <span className="absolute top-0.5 text-[9px] font-medium opacity-60">
                  {d.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              )}
              {d.getDate()}
              {date === today && (
                <span className={`absolute bottom-1 size-1 rounded-full ${on ? 'bg-brand-ink' : 'bg-ink'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
