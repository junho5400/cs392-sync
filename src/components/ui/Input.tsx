import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  /** Unit shown inside the box on the right, like "min". */
  suffix?: string;
}

export const Input = ({ suffix, className = '', ...rest }: Props) =>
  suffix ? (
    <span className={`relative flex shrink-0 ${className}`}>
      <input {...rest} className="control pr-[34px] tabular-nums" />
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[13px] text-ink-3">
        {suffix}
      </span>
    </span>
  ) : (
    <input {...rest} className={`control ${className}`} />
  );
