import { useState } from 'react';
import { Button } from './ui/Button';

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
    <Button icon={copied ? 'check' : 'link'} onClick={copy}>
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
};
