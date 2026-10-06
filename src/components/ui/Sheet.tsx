import { useEffect, type PropsWithChildren } from 'react';
import { IconButton } from './IconButton';

interface Props extends PropsWithChildren {
  label: string;
  onClose: () => void;
  className?: string;
}

/** Panel pinned to the bottom of small screens. */
export const Sheet = ({ label, onClose, className = '', children }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-label={label} className={`sheet-in fixed inset-x-3 bottom-3 z-20 rounded-xl bg-surface p-5 shadow-pop ${className}`}>
      <IconButton icon="x" label="Close" onClick={onClose} className="absolute top-2 right-2" />
      {children}
    </div>
  );
};
