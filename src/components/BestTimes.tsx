import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { SectionTitle } from './ui/SectionTitle';
import { Segmented } from './ui/Segmented';
import type { View } from '../types';
import { byVotes, fmtCol, fmtDuration, fmtTime, slotKey, VOTE_LIMIT, voteKey, type Ranked, type Window } from '../utilities/slots';

interface Props {
  ranked: Ranked;
  view: View;
  duration: number;
  /** Null hides the toggle: no optional person has answered. */
  withOptional: boolean | null;
  onWithOptional: (on: boolean) => void;
  votable: boolean;
  tallies: Map<string, number>;
  /** Names that picked each open window, in join order. */
  voters: Map<string, string[]>;
  myVotes: string[];
  /** Your name, so your face reads as you. Null before you join. */
  me: string | null;
  /** True once every counted person has at least one open vote. */
  allVoted: boolean;
  /** Null when you have not joined yet. */
  onVote: ((key: string) => void) | null;
  onHover: (w: Window | null) => void;
}

const label = (w: Window, view: View) => {
  const placed = view.place(slotKey(w.date, w.start));
  if (!placed) return { day: fmtCol(w.date), time: `${fmtTime(w.start)} – ${fmtTime(w.end)}` };
  const cell = view.when(placed);
  return { day: fmtCol(cell.col), time: `${fmtTime(cell.min)} – ${fmtTime(cell.min + w.end - w.start)}` };
};

const names = (list: string[]) => (list.length <= 2 ? list.join(' and ') : `${list.slice(0, 2).join(', ')} +${list.length - 2}`);

const you = (name: string, me: string | null) => me !== null && name.toLowerCase() === me.toLowerCase();

export const BestTimes = ({
  ranked,
  view,
  duration,
  withOptional,
  onWithOptional,
  votable,
  tallies,
  voters,
  myVotes,
  me,
  allVoted,
  onVote,
  onHover,
}: Props) => {
  const { size, complete } = ranked;
  const windows = byVotes(ranked.windows, (w) => tallies.get(voteKey(w)) ?? 0, allVoted);
  const top = Math.max(0, ...windows.map((w) => tallies.get(voteKey(w)) ?? 0));
  const mine = myVotes.length;
  const voteHint = !votable ? '' : !onVote ? 'Join to vote' : mine === 0 ? `Pick up to ${VOTE_LIMIT} times` : `${mine} of ${VOTE_LIMIT} votes`;

  const note = !size
    ? 'Shows up once people add times'
    : !windows.length
      ? `No one is free for ${fmtDuration(duration)} yet`
      : !complete
        ? 'No time works for everyone'
        : votable
          ? allVoted
            ? `${windows.length} times, ordered by votes`
            : `${windows.length} times work for everyone`
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
        const picked = votable && myVotes.includes(key);
        const tally = tallies.get(key) ?? 0;
        const who = voters.get(key) ?? [];
        const faces = who.slice(0, 3);
        const extra = who.length - faces.length;
        const leader = votable && top > 0 && tally === top;
        const hover = {
          onMouseEnter: () => onHover(w),
          onMouseLeave: () => onHover(null),
          onFocus: () => onHover(w),
          onBlur: () => onHover(null),
        };
        const body = (
          <>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate text-[13px] font-medium text-ink">{day}</span>
                {leader && <span className="shrink-0 text-[11px] font-medium text-heat">Most</span>}
              </span>
              <span className="block truncate text-[12px] tabular-nums text-ink-2">{time}</span>
              {!complete && <span className="block truncate text-[12px] text-ink-3">Missing {names(w.out)}</span>}
            </span>
            {votable ? (
              <span className="flex shrink-0 items-center gap-1.5">
                {faces.length > 0 && (
                  <span className="flex -space-x-1.5" title={who.join(', ')}>
                    {faces.map((name) => (
                      <Avatar key={name} name={name} you={you(name, me)} className="size-5 text-[9px] ring-2 ring-surface" />
                    ))}
                    {extra > 0 && (
                      <span className="grid size-5 place-items-center rounded-full bg-sunken text-[9px] font-semibold text-ink-2 ring-2 ring-surface">
                        +{extra}
                      </span>
                    )}
                  </span>
                )}
                <span
                  className={`flex h-6 items-center gap-1 rounded-md px-1.5 text-[12px] font-semibold tabular-nums transition-colors duration-150 ease-[var(--ease-soft)] motion-reduce:transition-none ${
                    picked ? 'bg-brand text-brand-ink' : 'bg-sunken text-ink-1'
                  }`}
                >
                  <Icon name="thumb" className="size-3" />
                  {tally}
                </span>
              </span>
            ) : (
              <span className="text-[12px] font-semibold tabular-nums">
                {w.names.length}
                <span className="font-normal text-ink-3">/{size}</span>
              </span>
            )}
          </>
        );
        const cls = `flex shrink-0 items-center gap-2 rounded-lg border bg-surface px-2.5 py-2 text-left transition-colors duration-150 ${
          picked && leader
            ? 'border-ink shadow-[inset_0_0_0_1px_var(--color-heat)]'
            : picked
              ? 'border-ink'
              : leader
                ? 'border-heat'
                : 'border-line'
        }`;
        const voted = `${tally} ${tally === 1 ? 'vote' : 'votes'}${who.length ? `, ${who.join(', ')}` : ''}${leader ? ', most votes' : ''}`;
        return votable && onVote ? (
          <button
            key={key}
            {...hover}
            aria-pressed={picked}
            aria-label={`${day}, ${time}, ${voted}`}
            onClick={() => onVote(key)}
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
