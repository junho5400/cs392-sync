import { Button } from './ui/Button';

interface Props {
  title?: string;
  body?: string;
  onNew: () => void;
}

export const NotFound = ({ title = 'Event not found', body = 'Check the link or start a new event.', onNew }: Props) => (
  <section className="mx-auto flex w-full max-w-[400px] flex-col gap-4 rounded-xl bg-surface p-6 shadow-card">
    <div className="flex flex-col gap-1">
      <h1 className="text-[20px] font-medium tracking-[-0.015em] text-ink">{title}</h1>
      <p className="text-[13px] text-ink-2">{body}</p>
    </div>
    <Button variant="primary" size="md" onClick={onNew}>
      New event
    </Button>
  </section>
);
