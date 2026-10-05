import { Icon } from './Icon';
import { SectionTitle } from './ui/SectionTitle';
import { Segmented } from './ui/Segmented';
import type { View } from '../types';
import { fmtCol, fmtDuration, fmtTime, slotKey, voteKey, type Ranked, type Window } from '../utilities/slots';

interface Props {
  ranked: Ranked;
  view: View;
  duration: number;
  /** Null hides the toggle: no optional person has answered. */
  withOptional: boolean | null;
  onWithOptional: (on: boolean) => void;
  votable: boolean;
  tallies: Map<string, number>;
  myVote: string | null;
  /** Null when you have not joined yet. */
  onVote: ((key: string | null) => void) | null;
  onHover: (w: Window | null) => void;
}

const label = (w: Window, view: View) => {
  const placed = view.place(slotKey(w.date, w.start));
  if (!placed) return { day: fmtCol(w.date), time: `${fmtTime(w.start)} – ${fmtTime(w.end)}` };
  const cell = view.when(placed);
  return { day: fmtCol(cell.col), time: `${fmtTime(cell.min)} – ${fmtTime(cell.min + w.end - w.start)}` };
};

const names = (list: string[]) => (list.length <= 2 ? list.join(' and ') : `${list.slice(0, 2).join(', ')} +${list.length - 2}`);

export const BestTimes = ({ ranked, view, duration, withOptional, onWithOptional, votable, tallies, myVote, onVote, onHover }: Props) => {
  const { windows, size, complete } = ranked;
  const voteHint = votable && (!onVote || !myVote) ? (onVote ? 'Click a time to vote' : 'Join to vote') : '';

  const note = !size
    ? 'Shows up once people add times'
    : !windows.length
      ? `No one is free for ${fmtDuration(duration)} yet`
      : !complete
        ? 'No time works for everyone'
        : votable
          ? `${windows.length} times work for everyone`
          : 'Works for everyone';

  return (
    <div className="flex shrink-0 flex-col gap-3">
      <SectionTitle aside={fmtDuration(duration)}>Best times</SectionTitle>
      <Segmented
        label="Who counts"
        value={withOptional ? 'all' : 'required'}
        options={[
          { value: 'required', label: 'Required' },
          { value: 'all', label: 'With optional' },
        ]}
        onChange={(v) => onWithOptional(v === 'all')}
        disabled={withOptional === null}
      />
      <p className="truncate text-[13px] text-ink-2" title={note}>
        {note}
      </p>
      <div className="-mx-1 flex flex-col gap-2 overscroll-contain px-1 lg:h-[196px] lg:overflow-y-auto">
      {windows.map((w) => {
        const key = voteKey(w);
        const { day, time } = label(w, view);
        const picked = votable && myVote === key;
        const tally = tallies.get(key) ?? 0;
        const hover = {
          onMouseEnter: () => onHover(w),
          onMouseLeave: () => onHover(null),
          onFocus: () => onHover(w),
          onBlur: () => onHover(null),
        };
        const body = (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-ink">{day}</span>
              <span className="block text-[12px] tabular-nums text-ink-2">{time}</span>
              {!complete && <span className="block truncate text-[12px] text-ink-3">Missing {names(w.out)}</span>}
            </span>
            {votable ? (
              <span
                className={`flex h-6 items-center gap-1 rounded-md px-1.5 text-[12px] font-semibold tabular-nums transition-colors duration-150 ease-[var(--ease-soft)] motion-reduce:transition-none ${
                  picked ? 'bg-brand text-brand-ink' : 'bg-sunken text-ink-1'
                }`}
              >
                <Icon name="thumb" className="size-3" />
                {tally}
              </span>
            ) : (
              <span className="text-[12px] font-semibold tabular-nums">
                {w.names.length}
                <span className="font-normal text-ink-3">/{size}</span>
              </span>
            )}
          </>
        );
        const cls = `flex shrink-0 items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors duration-150 ${
          picked ? 'border-ink' : 'border-line'
        }`;
        return votable && onVote ? (
          <button
            key={key}
            {...hover}
            aria-pressed={picked}
            aria-label={`${day}, ${time}, ${tally} picked`}
            onClick={() => onVote(picked ? null : key)}
            className={`${cls} hover:border-ink-3`}
          >
            {body}
          </button>
        ) : (
          <div key={key} {...hover} tabIndex={0} className={cls}>
            {body}
          </div>
        );
      })}
      </div>
      <p className={`h-4 text-[12px] leading-4 text-ink-3 ${voteHint ? '' : 'hidden lg:block'}`}>{voteHint}</p>
    </div>
  );
};
