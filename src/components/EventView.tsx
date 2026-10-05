import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { BestTimes } from './BestTimes';
import { HeatGrid } from './HeatGrid';
import { Icon } from './Icon';
import { JoinForm } from './JoinForm';
import { NotFound } from './NotFound';
import { People } from './People';
import { Readout } from './Readout';
import { ShareButton } from './ShareButton';
import { Button } from './ui/Button';
import { SectionTitle } from './ui/SectionTitle';
import { Segmented } from './ui/Segmented';
import { Combobox } from './ui/Combobox';
import { Sheet } from './ui/Sheet';
import { connectCalendar, fetchBusy } from '../services/calendar';
import { join, saveSlots, saveVote, watchBoard, type Board, type JoinInput } from '../services/meet';
import type { Person } from '../types';
import {
  HEAT,
  STEP,
  answered,
  bestWindows,
  calendarBounds,
  commonSlots,
  countMap,
  counted,
  fmtEventRange,
  fmtTime,
  freeKeys,
  paint,
  viewOf,
  voteKey,
  windowKeys,
  type Window,
} from '../utilities/slots';
import { BROWSER_ZONE, zoneChoices } from '../utilities/zones';

interface Props {
  id: string;
  onNew: () => void;
}

type Action = { type: 'paint'; keys: string[]; on: boolean } | { type: 'load'; slots: Set<string> };

const reduce = (slots: Set<string>, a: Action) => (a.type === 'load' ? a.slots : paint(slots, a.keys, a.on));

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Autosave fires this long after you stop painting. */
const AUTOSAVE_MS = 500;

const CARD = 'rise-in mx-auto w-full max-w-[1160px] rounded-xl bg-surface shadow-card';

export const EventView = ({ id, onNew }: Props) => {
  const [board, setBoard] = useState<Board | null | undefined>(undefined);
  const [error, setError] = useState('');
  /** "Not you?" hides your person on this device until you join again. */
  const [away, setAway] = useState(false);
  const myName = board && !away ? board.me : null;
  const [mine, dispatch] = useReducer(reduce, new Set<string>());
  const [mode, setMode] = useState<'mine' | 'group'>('group');
  const [zone, setZone] = useState(BROWSER_ZONE);
  const [withOptional, setWithOptional] = useState(false);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [hoverWindow, setHoverWindow] = useState<Window | null>(null);
  const [hoverPerson, setHoverPerson] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [save, setSave] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [cal, setCal] = useState<'idle' | 'loading'>('idle');
  const [calError, setCalError] = useState('');
  const loadedFor = useRef<string | null>(null);
  const dirty = useRef(false);
  const pending = useRef<{ name: string; slots: Set<string> } | null>(null);

  useEffect(() => watchBoard(id, setBoard, setError), [id]);

  const stored = board && myName ? board.people.find((p) => sameName(p.name, myName)) : undefined;

  useEffect(() => {
    if (!stored || loadedFor.current === stored.name) return;
    loadedFor.current = stored.name;
    dispatch({ type: 'load', slots: stored.slots });
    setMode(stored.slots.size ? 'group' : 'mine');
  }, [stored]);

  const flush = useCallback(() => {
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    saveSlots(id, next.name, next.slots).then(
      () => {
        setError('');
        if (!pending.current) setSave('saved');
      },
      (err: Error) => {
        setError(err.message);
        setSave('failed');
      },
    );
  }, [id]);

  useEffect(() => {
    if (!myName) return;
    if (dirty.current) {
      dirty.current = false;
      pending.current = { name: myName, slots: mine };
    }
    if (!pending.current) return;
    const t = setTimeout(flush, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [myName, mine, flush]);

  // Leaving before the debounce fires still saves.
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  if (board === undefined && !error) return <section aria-busy="true" className={`${CARD} h-[640px] max-h-full`} />;
  if (!board) {
    return error ? (
      <NotFound title="Could not open this event" body="Check your connection and reload." onNew={onNew} />
    ) : (
      <NotFound onNew={onNew} />
    );
  }

  const { event } = board;
  const me: Person | null = stored ? { ...stored, slots: mine } : null;
  const everyone = board.people.map((p) => (me && sameName(p.name, me.name) ? me : p));
  const responders = answered(everyone);
  const hasOptional = responders.some((p) => p.optional);
  const includeOptional = hasOptional && withOptional;
  const group = counted(responders, includeOptional);
  const counts = countMap(group);
  const view = viewOf(event, zone);
  const ranked = bestWindows(event, group);
  const votable = ranked.complete && ranked.windows.length >= 2;
  const open = new Set(votable ? ranked.windows.map(voteKey) : []);
  const tallies = new Map<string, number>();
  for (const p of group) if (p.vote && open.has(p.vote)) tallies.set(p.vote, (tallies.get(p.vote) ?? 0) + 1);
  const slotsOf = (name: string) => everyone.find((p) => p.name === name)?.slots ?? new Set<string>();
  const highlight = hoverWindow
    ? new Set(windowKeys(hoverWindow))
    : hoverPerson
      ? slotsOf(hoverPerson)
      : picked.size
        ? commonSlots(everyone.filter((p) => picked.has(p.name)))
        : null;
  const spotlight = hoverWindow ? 'window' : highlight ? 'person' : null;
  const painting = mode === 'mine' && me !== null;

  const fillCalendar = async () => {
    if (!board || cal === 'loading') return;
    setCal('loading');
    setCalError('');
    try {
      const token = await connectCalendar();
      const { timeMin, timeMax } = calendarBounds(board.event);
      const free = freeKeys(board.event, await fetchBusy(token, timeMin, timeMax));
      dirty.current = true;
      setSave('saving');
      setMode('mine');
      dispatch({ type: 'load', slots: free });
    } catch (err) {
      setCalError(err instanceof Error ? err.message : 'Could not read your calendar.');
    } finally {
      setCal('idle');
    }
  };

  const onPaint = (keys: string[], on: boolean) => {
    dirty.current = true;
    setSave('saving');
    dispatch({ type: 'paint', keys, on });
  };

  const retry = () => {
    if (!me) return;
    pending.current = { name: me.name, slots: mine };
    setSave('saving');
    flush();
  };

  const togglePicked = (name: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const onJoin = async (input: JoinInput) => {
    // Reset before the write: the local snapshot can arrive before `join` resolves.
    loadedFor.current = null;
    await join(id, input);
    setAway(false);
  };

  const notMe = () => {
    flush();
    loadedFor.current = null;
    dispatch({ type: 'load', slots: new Set() });
    setAway(true);
    setMode('group');
  };

  const onVote = (vote: string | null) =>
    me &&
    saveVote(id, me.name, vote).then(
      () => setError(''),
      (err: Error) => setError(err.message),
    );

  const readout = hoverSlot && <Readout slot={hoverSlot} view={view} people={group} />;

  return (
    <>
    <section className={`${CARD} flex flex-col lg:grid lg:h-[640px] lg:max-h-full lg:min-h-0 lg:grid-cols-[264px_minmax(0,1fr)_256px] lg:grid-rows-[auto_minmax(0,1fr)]`}>
      <div className="order-1 flex flex-col gap-3 p-5 lg:col-start-1 lg:row-start-1 lg:border-r lg:border-line">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="truncate text-[22px] leading-tight font-medium tracking-[-0.015em] text-ink" title={event.title}>
            {event.title}
          </h1>
          <p className="flex items-center gap-1.5 text-[13px] text-ink-2">
            <Icon name="clock" className="size-3 shrink-0" />
            <span className="truncate">
              {fmtEventRange(event)} ·{' '}
              {view.rows[view.rows.length - 1] + STEP - view.rows[0] >= 1440
                ? 'All day'
                : `${fmtTime(view.rows[0])} – ${fmtTime(view.rows[view.rows.length - 1] + STEP)}`}
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Combobox icon="globe" label="Time zone" value={zone} options={zoneChoices()} onChange={setZone} placeholder="Search city or GMT+9" />
          <p className="truncate text-[12px] text-ink-3">Created in {event.timeZone.replaceAll('_', ' ')}</p>
        </div>
        <div className="flex gap-2">
          <ShareButton />
          <Button variant="ghost" icon="plus" onClick={onNew}>
            New event
          </Button>
        </div>
      </div>

      <div className="order-4 min-h-0 border-t border-line p-5 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-r">
        {readout && <div className="fade-in hidden h-full lg:block">{readout}</div>}
        <div className={readout ? 'lg:hidden' : ''}>
          {me ? (
            <div className="flex flex-col gap-3">
              <SectionTitle aside={save === 'saving' ? 'Saving…' : save === 'saved' ? 'Saved' : undefined}>You</SectionTitle>
              <div className="flex items-center gap-2.5">
                <Avatar name={me.name} you className="size-7 text-[11px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{me.name}</span>
                  <span className="block text-[12px] text-ink-3">{me.optional ? 'Optional' : 'Required'}</span>
                </span>
                <Button variant="text" onClick={notMe}>
                  Not you?
                </Button>
              </div>
              <p className="text-[13px] text-ink-3">
                <span className="lg:hidden">Tap</span>
                <span className="hidden lg:inline">Hover</span> a time to see who’s free
              </p>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <div className="flex flex-col gap-1.5">
                  <Button variant="google" size="md" disabled={cal === 'loading'} onClick={() => void fillCalendar()}>
                    {cal === 'loading' ? 'Opening…' : 'Fill from Google Calendar'}
                  </Button>
                  <p className={`truncate text-[12px] text-ink-3 ${event.kind === 'dow' ? '' : 'hidden'}`}>From this week</p>
                  {calError && (
                    <p role="alert" className="truncate text-[12px] text-red-600 dark:text-red-400" title={calError}>
                      {calError}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <JoinForm onJoin={onJoin} />
          )}
        </div>
      </div>

      <div className="order-2 flex min-h-0 min-w-0 flex-col gap-3 border-t border-line p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-t-0">
        <div className="flex h-8 shrink-0 items-center justify-between gap-2">
          {me ? (
            <Segmented
              label="Grid shows"
              value={mode}
              options={[
                { value: 'mine', label: 'My times' },
                { value: 'group', label: 'Group' },
              ]}
              onChange={setMode}
              className="w-[200px]"
            />
          ) : (
            <SectionTitle>Group availability</SectionTitle>
          )}
          <div className="flex min-w-0 items-center gap-1">
            {error ? (
              <>
                <p role="alert" className="truncate text-[13px] text-red-600 dark:text-red-400" title={error}>
                  {error}
                </p>
                {save === 'failed' && (
                  <Button variant="ghost" onClick={retry}>
                    Retry
                  </Button>
                )}
              </>
            ) : (
              painting && <span className="mr-1 hidden truncate text-[13px] text-ink-3 sm:inline">Drag to mark when you’re free</span>
            )}
            {painting && (
              <Button variant="ghost" disabled={!mine.size} onClick={() => onPaint([...mine], false)}>
                Clear
              </Button>
            )}
          </div>
        </div>
        <HeatGrid
          view={view}
          mode={painting ? 'mine' : 'group'}
          counts={counts}
          total={group.length}
          mine={mine}
          highlight={highlight}
          spotlight={spotlight}
          onPaint={painting ? onPaint : null}
          onHover={setHoverSlot}
        />
      </div>

      <div className="order-3 flex min-h-0 flex-col gap-4 overflow-y-auto border-t border-line p-5 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l">
        <BestTimes
          ranked={ranked}
          view={view}
          duration={event.duration}
          withOptional={hasOptional ? withOptional : null}
          onWithOptional={setWithOptional}
          votable={votable}
          tallies={tallies}
          myVote={me?.vote ?? null}
          onVote={me ? onVote : null}
          onHover={setHoverWindow}
        />
        <div className="flex h-4 shrink-0 items-center gap-1.5 text-[12px] text-ink-3 tabular-nums">
          0
          <span className="flex gap-0.5">
            {HEAT.map((c) => (
              <span key={c} className={`size-2.5 rounded-[3px] shadow-[inset_0_0_0_1px_var(--color-line)] ${c}`} />
            ))}
          </span>
          {group.length} free
        </div>
        <div className="flex min-h-0 flex-1 flex-col border-t border-line pt-4">
          <People
            people={everyone}
            me={me?.name ?? null}
            selected={picked}
            onToggle={togglePicked}
            onClear={() => setPicked(new Set())}
            onHover={setHoverPerson}
          />
        </div>
      </div>

    </section>
    {readout && (
      <Sheet label="Who’s free" onClose={() => setHoverSlot(null)} className="lg:hidden">
        {readout}
      </Sheet>
    )}
    </>
  );
};

