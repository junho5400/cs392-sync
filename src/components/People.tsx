import { Avatar } from './Avatar';
import { Button } from './ui/Button';
import { SectionTitle } from './ui/SectionTitle';
import type { Person } from '../types';

interface Props {
  people: Person[];
  me: string | null;
  /** Picked names; the grid shows when they are all free. */
  selected: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
  onHover: (name: string | null) => void;
}

export const People = ({ people, me, selected, onToggle, onClear, onHover }: Props) => (
  <div className="flex min-h-0 flex-1 flex-col gap-2">
    <SectionTitle
      aside={
        selected.size ? (
          <Button variant="text" onClick={onClear} className="text-[12px]!">
            Clear
          </Button>
        ) : (
          people.length || undefined
        )
      }
    >
      People
    </SectionTitle>
    {people.length ? (
      <ul className="-mx-1.5 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain" onMouseLeave={() => onHover(null)}>
        {people.map((p) => {
          const you = me !== null && p.name.toLowerCase() === me.toLowerCase();
          return (
            <li key={p.name} className="shrink-0">
              <button
                type="button"
                aria-pressed={selected.has(p.name)}
                onClick={() => onToggle(p.name)}
                onMouseEnter={() => onHover(p.name)}
                onFocus={() => onHover(p.name)}
                onBlur={() => onHover(null)}
                className="flex h-7 w-full items-center gap-2 rounded-md px-1.5 text-left text-[13px] transition-colors duration-150 hover:bg-sunken aria-pressed:bg-sunken aria-pressed:shadow-[inset_0_0_0_1px_var(--color-line-strong)]"
              >
                <Avatar name={p.name} you={you} />
                <span className={`min-w-0 flex-1 truncate ${p.slots.size ? 'text-ink-1' : 'text-ink-3'}`}>
                  {p.name}
                  {you && <span className="text-ink-3"> (you)</span>}
                </span>
                <span className="shrink-0 text-[12px] text-ink-3">{!p.slots.size ? 'No times yet' : p.optional ? 'Optional' : ''}</span>
              </button>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="text-[13px] text-ink-3">No one has joined yet</p>
    )}
  </div>
);
