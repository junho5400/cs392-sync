import { initials } from '../utilities/slots';

const TINTS = [
  'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300',
  'bg-lime-100 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300',
];

const tint = (name: string) => TINTS[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % TINTS.length];

interface Props {
  name: string;
  you?: boolean;
  className?: string;
}

export const Avatar = ({ name, you = false, className = 'size-5 text-[9px]' }: Props) => (
  <span
    aria-hidden="true"
    className={`grid shrink-0 place-items-center rounded-full font-semibold ${
      you ? 'bg-brand text-brand-ink' : tint(name)
    } ${className}`}
  >
    {initials(name)}
  </span>
);
