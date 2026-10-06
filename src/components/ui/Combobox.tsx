import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon, type IconName } from '../Icon';

interface Option {
  value: string;
  label: string;
  /** Muted text on the right, also searchable. */
  detail?: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Leading icon that stands in for a visible label. */
  icon?: IconName;
}

const norm = (s: string) => s.toLowerCase().replace(/[\s_/]+/g, ' ');

/** A dropdown with a search box, for lists too long to scroll. */
export const Combobox = ({ label, value, options, onChange, placeholder = 'Search', icon }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value);
  const q = norm(query.trim());
  const shown = q ? options.filter((o) => norm(`${o.label} ${o.detail ?? ''}`).includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const show = () => {
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const pick = (o: Option | undefined) => {
    if (!o) return;
    onChange(o.value);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => Math.min(shown.length - 1, Math.max(0, a + step)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(shown[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : show())}
        className="control flex cursor-pointer items-center gap-2 pr-2 text-left"
      >
        {icon && <Icon name={icon} className="size-3.5 shrink-0 text-ink-3" />}
        <span className="min-w-0 flex-1 truncate">{current?.label ?? value}</span>
        {current?.detail && <span className="text-[12px] font-normal text-ink-3">{current.detail}</span>}
        <Icon
          name="down"
          className={`size-3.5 shrink-0 text-ink-3 transition-transform duration-200 ease-[var(--ease-soft)] motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="pop-in absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-[10px] bg-surface shadow-pop">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label={`Search ${label.toLowerCase()}`}
            aria-controls={id}
            aria-activedescendant={shown[active] ? `${id}-${active}` : undefined}
            className="h-8 w-full border-b border-line bg-transparent px-2.5 text-[13px] text-ink outline-none placeholder:text-ink-3"
          />
          <ul ref={list} id={id} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
            {shown.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-${i}`}
                data-index={i}
                role="option"
                aria-selected={o.value === value}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(o)}
                className={`flex h-8 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors duration-150 ease-[var(--ease-soft)] motion-reduce:transition-none ${
                  i === active ? 'bg-sunken text-ink' : 'text-ink-1'
                } ${o.value === value ? 'font-semibold' : ''}`}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.detail && <span className="text-[12px] text-ink-3">{o.detail}</span>}
              </li>
            ))}
            {!shown.length && <li className="px-2.5 py-2 text-[13px] text-ink-3">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
};
