import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './Icon';
import { POP } from '../utilities/motion';

export const ShareButton = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt('Copy this link', location.href);
    }
  };

  return (
    <button
      onClick={copy}
      className="flex h-7 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 text-[12px] font-medium text-ink-1 shadow-btn transition-[border-color,transform] duration-150 hover:border-ink active:scale-[0.96]"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={String(copied)} {...POP} className="flex items-center gap-1.5">
          <Icon name={copied ? 'check' : 'link'} className="size-3" />
          {copied ? 'Copied' : 'Copy link'}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
