import type { PropsWithChildren, ReactNode } from 'react';

interface Props extends PropsWithChildren {
  label: string;
  /** Right-aligned note next to the label, like "Optional". */
  aside?: ReactNode;
  hint?: ReactNode;
  /** Several controls (buttons, a pair of inputs) instead of one input. */
  group?: boolean;
}

export const Field = ({ label, aside, hint, group = false, children }: Props) => {
  const head = (
    <span className="flex items-baseline justify-between text-[13px] text-ink-2">
      {label}
      {aside && <span className="text-[12px] text-ink-3">{aside}</span>}
    </span>
  );
  const foot = hint && <span className="text-[12px] text-ink-3">{hint}</span>;
  return group ? (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      {head}
      {children}
      {foot}
    </div>
  ) : (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5">
        {head}
        {children}
      </label>
      {foot}
    </div>
  );
};
