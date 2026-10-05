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
    className={`grid size-7 shrink-0 place-items-center rounded-lg text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-35 ${className}`}
  >
    <Icon name={icon} />
  </button>
);
