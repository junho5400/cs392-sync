import { useState } from 'react';
import { motion } from 'motion/react';
import { Icon } from './Icon';
import { MonthPicker } from './MonthPicker';
import type { SyncEvent } from '../types';
import { STEP, TIME_ZONE, fmtTime, DOW_SHORT } from '../utilities/slots';
import { CARD_SPRING } from '../utilities/motion';

const OPTIONS = Array.from({ length: 1440 / STEP + 1 }, (_, i) => i * STEP);

interface Props {
  onCreate: (event: SyncEvent) => void | Promise<void>;
  onSample: () => void;
}

const TimeSelect = ({ label, value, options, onChange }: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) => (
  <select
    aria-label={label}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="h-7 flex-1 cursor-pointer rounded-lg border border-line-strong bg-surface px-2 text-[12.5px] font-medium text-ink-1 shadow-btn outline-none transition-colors hover:border-ink-3 focus-visible:border-ink"
  >
    {options.map((m) => (
      <option key={m} value={m}>
        {fmtTime(m)}
      </option>
    ))}
  </select>
);

export const CreateCard = ({ onCreate, onSample }: Props) => {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'dates' | 'dow'>('dates');
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<Set<number>>(new Set());
  const [start, setStart] = useState(9 * 60);
  const [end, setEnd] = useState(17 * 60);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const ready = mode === 'dates' ? dates.size > 0 : days.size > 0;

  const create = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await onCreate(
        mode === 'dates'
          ? { kind: 'dates', title: title.trim() || 'Untitled event', dates: [...dates].sort(), start, end }
          : { kind: 'dow', title: title.trim() || 'Untitled event', days: [...days].sort(), start, end },
      );
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (d: number) => {
    const next = new Set(days);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    setDays(next);
  };

  const hint = !ready
    ? ''
    : mode === 'dates'
      ? `${dates.size} date${dates.size > 1 ? 's' : ''} picked`
      : `Every ${days.size === 7 ? 'week' : [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DOW_SHORT[d]).join(', ')}`;

  return (
    <motion.section
      layoutId="sheet"
      transition={CARD_SPRING}
      className="mx-auto grid w-full max-w-[720px] overflow-hidden rounded-2xl bg-surface shadow-card md:grid-cols-[260px_1fr]"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col gap-5 border-b border-dashed border-line p-5 md:border-r md:border-b-0"
      >
        <div>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void create()}
            placeholder="Event name"
            aria-label="Event name"
            className="w-full bg-transparent text-[18px] font-semibold tracking-tight text-ink-1 outline-none placeholder:text-ink-3"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[12px] font-medium text-ink-2">Between</p>
          <div className="flex items-center gap-1.5">
            <TimeSelect label="Earliest time" value={start} options={OPTIONS.slice(0, -1)} onChange={(v) => { setStart(v); if (v >= end) setEnd(v + STEP); }} />
            <span className="text-ink-3">–</span>
            <TimeSelect label="Latest time" value={end} options={OPTIONS.slice(1)} onChange={(v) => { setEnd(v); if (v <= start) setStart(v - STEP); }} />
          </div>
          <p className="flex items-center gap-1.5 text-[12px] text-ink-2">
            <Icon name="globe" className="size-3" /> {TIME_ZONE.replace('_', ' ')}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <p className="text-[12px] text-ink-2">{hint || ' '}</p>
          {failed && (
            <p role="alert" className="text-[12px] text-red-500 dark:text-red-400">
              Couldn&apos;t create the event. Check your connection and try again.
            </p>
          )}
          <button
            disabled={!ready || busy}
            onClick={() => void create()}
            className="h-8 rounded-lg bg-brand text-[12.5px] font-medium text-brand-ink transition-[transform,opacity] duration-150 active:scale-[0.96] disabled:opacity-30"
          >
            {busy ? 'Creating…' : 'Create event'}
          </button>
          <button onClick={onSample} className="h-7 text-[12px] text-ink-2 transition-colors hover:text-ink">
            or open a sample event (dev)
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5">
        <div className="mb-3 flex gap-1 rounded-lg bg-sunken p-0.5" role="tablist" aria-label="Date type">
          {(['dates', 'dow'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`h-7 flex-1 rounded-md text-[12.5px] font-medium transition-colors ${
                mode === m ? 'bg-brand text-brand-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {m === 'dates' ? 'Specific dates' : 'Days of week'}
            </button>
          ))}
        </div>
        {mode === 'dates' ? (
          <MonthPicker selected={dates} onChange={setDates} />
        ) : (
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-1">Repeats weekly</p>
            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const on = days.has(d);
                return (
                  <button
                    key={d}
                    aria-pressed={on}
                    aria-label={DOW_SHORT[d]}
                    onClick={() => toggleDay(d)}
                    className={`grid h-9 place-items-center rounded-lg text-[12.5px] font-medium tabular-nums transition-colors duration-150 ${
                      on ? 'bg-brand text-brand-ink' : 'bg-sunken text-ink-1 hover:bg-line'
                    }`}
                  >
                    {DOW_SHORT[d].slice(0, 2)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
};
