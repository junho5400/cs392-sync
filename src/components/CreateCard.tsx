import { useState } from 'react';
import { Icon } from './Icon';
import { MonthPicker } from './MonthPicker';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Input } from './ui/Input';
import { Segmented } from './ui/Segmented';
import { TimeInput } from './ui/TimeInput';
import { createEvent } from '../services/meet';
import type { SyncEventDraft } from '../types';
import { DOW_SHORT, DURATIONS, STEP } from '../utilities/slots';
import { BROWSER_ZONE } from '../utilities/zones';

const short = (min: number) => (min < 60 ? `${min}m` : `${min / 60}h`);

interface Props {
  onCreated: (id: string) => void;
}

export const CreateCard = ({ onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'dates' | 'dow'>('dates');
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<Set<number>>(new Set());
  const [start, setStart] = useState(9 * 60);
  const [end, setEnd] = useState(17 * 60);
  const [duration, setDuration] = useState(60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = (mode === 'dates' ? dates.size > 0 : days.size > 0) && duration > 0 && duration <= end - start;

  const create = async () => {
    if (!ready || busy) return;
    const shared = { title: title.trim() || 'Untitled event', start, end, duration, timeZone: BROWSER_ZONE };
    const draft: SyncEventDraft =
      mode === 'dates'
        ? { ...shared, kind: 'dates', dates: [...dates].sort() }
        : { ...shared, kind: 'dow', days: [...days].sort() };
    setBusy(true);
    setError('');
    try {
      onCreated(await createEvent(draft));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the event.');
      setBusy(false);
    }
  };

  const toggleDay = (d: number) => {
    const next = new Set(days);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    setDays(next);
  };

  const status = !duration
    ? 'Enter a meeting length'
    : duration > end - start
      ? 'Meeting is longer than the time range'
      : mode === 'dates'
        ? dates.size
          ? `${dates.size} date${dates.size > 1 ? 's' : ''} selected`
          : 'Click or drag to select dates'
        : days.size
          ? `Every ${days.size === 7 ? 'day' : [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DOW_SHORT[d]).join(', ')}`
          : 'Select days of the week';

  return (
    <section className="mx-auto grid w-full max-w-[800px] overflow-hidden rounded-xl bg-surface shadow-card md:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-6 border-b border-line p-6 md:border-r md:border-b-0">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="Event name"
          aria-label="Event name"
          maxLength={80}
          className="w-full bg-transparent text-[20px] font-medium tracking-[-0.01em] text-ink outline-none placeholder:text-ink-3"
        />

        <Field
          group
          label="Time range"
          hint={
            <span className="flex items-center gap-1.5">
              <Icon name="globe" className="size-3" /> {BROWSER_ZONE.replaceAll('_', ' ')}
            </span>
          }
        >
          <div className="flex items-center gap-2">
            <TimeInput
              label="From"
              value={start}
              onChange={(v) => {
                setStart(v);
                if (v >= end) setEnd(v + STEP);
              }}
            />
            <span className="text-[13px] text-ink-3">to</span>
            <TimeInput
              label="To"
              value={end}
              end
              onChange={(v) => {
                setEnd(Math.max(v, STEP));
                if (v <= start) setStart(Math.max(0, v - STEP));
              }}
            />
          </div>
        </Field>

        <Field group label="Meeting length">
          <div className="flex gap-2">
            <Input
              suffix="min"
              inputMode="numeric"
              aria-label="Meeting length in minutes"
              value={duration || ''}
              onChange={(e) => setDuration(Number(e.target.value.replace(/\D/g, '').slice(0, 4)))}
              className="w-[80px]"
            />
            <div className="grid flex-1 grid-cols-4 gap-1">
              {DURATIONS.map((m) => (
                <Button
                  key={m}
                  variant="preset"
                  size="md"
                  aria-pressed={duration === m}
                  aria-label={`${m} minutes`}
                  onClick={() => setDuration(m)}
                  className="px-0!"
                >
                  {short(m)}
                </Button>
              ))}
            </div>
          </div>
        </Field>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {error ? (
            <p role="alert" className="truncate text-[13px] text-red-600 dark:text-red-400" title={error}>
              {error}
            </p>
          ) : (
            <p className="truncate text-[13px] text-ink-2" title={status}>
              {status}
            </p>
          )}
          <Button variant="primary" size="md" disabled={!ready || busy} onClick={create}>
            Create event
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <Segmented
          label="Date type"
          value={mode}
          options={[
            { value: 'dates', label: 'Specific dates' },
            { value: 'dow', label: 'Days of the week' },
          ]}
          onChange={setMode}
        />
        <div className="relative">
          {/* Stays mounted so the card is the same height in both modes. */}
          <div className={mode === 'dates' ? '' : 'invisible'} inert={mode !== 'dates'}>
            <MonthPicker selected={dates} onChange={setDates} />
          </div>
          {mode === 'dow' && (
            <div className="absolute inset-x-0 top-0">
              <div className="grid w-full grid-cols-7 gap-1">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <button
                    key={d}
                    aria-pressed={days.has(d)}
                    aria-label={DOW_SHORT[d]}
                    onClick={() => toggleDay(d)}
                    className="grid h-10 place-items-center rounded-lg text-[13px] font-medium text-ink-1 transition-colors duration-150 hover:bg-sunken aria-pressed:bg-brand aria-pressed:text-brand-ink"
                  >
                    {DOW_SHORT[d]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
