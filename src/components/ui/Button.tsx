import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon';

const VARIANTS = {
  primary: 'rounded-[10px] bg-brand text-brand-ink hover:opacity-90',
  secondary: 'rounded-[10px] bg-surface text-ink shadow-btn hover:bg-sunken',
  ghost: 'rounded-[10px] text-ink-2 hover:bg-sunken hover:text-ink',
  /** Shortcut that fills a value; outlined in ink when it matches. */
  preset:
    'rounded-lg font-medium! text-[13px]! tabular-nums text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--color-ink-3)] aria-pressed:bg-sunken aria-pressed:text-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-ink-2)]',
  /** Inline text action, underlined on hover. */
  text: 'text-ink-2 underline decoration-transparent underline-offset-[3px] hover:text-ink hover:decoration-current',
};

const SIZES = {
  sm: 'h-7 gap-1.5 px-2.5 text-[13px]',
  md: 'h-8 gap-2 px-3.5 text-[13px]',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: IconName;
}

export const Button = ({ variant = 'secondary', size = 'sm', icon, className = '', children, ...rest }: Props) => (
  <button
    {...rest}
    className={`inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-[color,background-color,opacity,text-decoration-color] duration-150 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${variant === 'text' ? 'text-[13px]' : SIZES[size]} ${className}`}
  >
    {icon && <Icon name={icon} className="size-3.5" />}
    {children}
  </button>
);
