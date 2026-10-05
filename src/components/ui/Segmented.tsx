interface Props<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

/** One choice out of a few, always visible. The thumb slides to the chosen option. */
export const Segmented = <T extends string | number>({ label, value, options, onChange, disabled = false, className = '' }: Props<T>) => {
  const index = options.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={`relative grid h-8 shrink-0 rounded-full bg-sunken p-[3px] shadow-[inset_0_0_0_1px_var(--color-line)] aria-disabled:opacity-50 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-[3px] left-[3px] rounded-full bg-raise shadow-raise transition-transform duration-200 ease-[cubic-bezier(0.3,0.7,0.4,1)] motion-reduce:transition-none"
        style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${Math.max(index, 0) * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className="relative truncate rounded-full px-2.5 pb-px text-[13px] font-semibold text-ink-2 transition-colors duration-200 hover:text-ink disabled:pointer-events-none aria-checked:text-ink"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};
