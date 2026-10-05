import type { Person, View } from '../types';
import { fmtCol, fmtTime, STEP } from '../utilities/slots';

interface Props {
  slot: string;
  view: View;
  /** The people who count right now (required, or everyone). */
  people: Person[];
}

/** When2meet's hover panel: how many can make this slot, and exactly who can't. */
export const Readout = ({ slot, view, people }: Props) => {
  const placed = view.place(slot);
  if (!placed) return null;
  const cell = view.when(placed);
  const free = people.filter((p) => p.slots.has(slot));
  const busy = people.filter((p) => !p.slots.has(slot));

  return (
    <div role="status" aria-live="polite" className="flex h-full min-h-0 flex-col gap-3">
      <div>
        <p className="text-[22px] font-medium leading-tight tracking-[-0.015em] tabular-nums text-ink">
          {people.length ? (
            <>
              {free.length}
              <span className="text-ink-3">/{people.length}</span> available
            </>
          ) : (
            'No responses yet'
          )}
        </p>
        <p className="text-[12px] text-ink-2">
          {fmtCol(cell.col)} · {fmtTime(cell.min)} – {fmtTime((cell.min + STEP) % 1440)}
        </p>
      </div>
      {people.length > 0 && (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          <Names title="Available" people={free} tone="text-heat" />
          <Names title="Unavailable" people={busy} tone="text-ink-3" />
        </div>
      )}
    </div>
  );
};

const Names = ({ title, people, tone }: { title: string; people: Person[]; tone: string }) => (
  <div className="flex min-h-0 min-w-0 flex-col">
    <p className={`mb-1 text-[12px] font-medium ${tone}`}>
      {title} <span className="tabular-nums">{people.length}</span>
    </p>
    <ul className="flex max-h-[45vh] min-h-0 flex-col overflow-y-auto overscroll-contain lg:max-h-none">
      {people.map((p) => (
        <li key={p.name} className="shrink-0 truncate text-[13px] leading-6 text-ink-1">
          {p.name}
          {p.optional && <span className="text-[11px] text-ink-3"> optional</span>}
        </li>
      ))}
      {!people.length && <li className="text-[13px] leading-6 text-ink-3">None</li>}
    </ul>
  </div>
);
