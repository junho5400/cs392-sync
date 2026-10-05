import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
}

export const IconButton = ({ icon, label, className = '', ...rest }: Props) => (
  <button
    {...rest}
    aria-label={label}
    title={rest.title ?? label}
    className={`grid size-7 shrink-0 place-items-center rounded-lg text-ink-2 transition-[color,background-color,transform] duration-150 ease-[var(--ease-soft)] hover:bg-sunken hover:text-ink active:enabled:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none motion-reduce:active:scale-100 ${className}`}
  >
    <Icon name={icon} />
  </button>
);
