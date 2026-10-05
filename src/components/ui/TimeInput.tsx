import { useState } from 'react';
import { STEP } from '../../utilities/slots';

interface Props {
  label: string;
  /** Minutes from midnight. */
  value: number;
  onChange: (min: number) => void;
  /** Reads 00:00 as midnight at the end of the day. */
  end?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toText = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

/** Typed or picked time, snapped to the grid step. */
export const TimeInput = ({ label, value, onChange, end = false }: Props) => {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (text: string) => {
    const match = /^(\d{2}):(\d{2})/.exec(text);
    if (!match) return;
    const min = Math.round((Number(match[1]) * 60 + Number(match[2])) / STEP) * STEP;
    onChange(end && min === 0 ? 1440 : Math.min(min, end ? 1440 : 1440 - STEP));
  };

  return (
    <input
      type="time"
      step={STEP * 60}
      aria-label={label}
      value={draft ?? toText(value)}
      onChange={(e) => {
        setDraft(e.target.value);
        commit(e.target.value);
      }}
      onBlur={() => setDraft(null)}
      className="control tabular-nums [&::-webkit-calendar-picker-indicator]:hidden"
    />
  );
};
