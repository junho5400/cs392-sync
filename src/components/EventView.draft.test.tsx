import { vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../services/meet', () => ({
  join: vi.fn(async () => 'Zed'),
  saveSlots: vi.fn(async () => {}),
  saveVote: vi.fn(async () => {}),
  watchBoard: vi.fn(() => () => {}),
}));

import { EventView } from './EventView';
import { join, saveSlots, watchBoard, type Board } from '../services/meet';
import type { SyncEvent } from '../types';
import { BROWSER_ZONE } from '../utilities/zones';

const event: SyncEvent = {
  kind: 'dates',
  title: 'Retro',
  dates: ['2026-10-05'],
  start: 540,
  end: 600,
  timeZone: BROWSER_ZONE,
  duration: 60,
};

const boardOf = (people: Board['people'], me: string | null): Board => ({ event, people, me });

const emit = (board: Board | null) => {
  const calls = vi.mocked(watchBoard).mock.calls;
  act(() => calls[calls.length - 1][1](board));
};

const cell = (key: string) => document.querySelector(`[data-cell="${key}"]`) as HTMLElement;

const paint = (key: string) => fireEvent.click(cell(key), { detail: 0 });

const joinAs = (name: string) => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Join' }));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

test('visitors paint the group grid and see their draft as You, without any save', async () => {
  vi.useFakeTimers();
  render(<EventView id="e1" onNew={vi.fn()} />);
  emit(boardOf([], null));
  expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
  paint('2026-10-05|540');
  expect(cell('2026-10-05|540').getAttribute('aria-pressed')).toBe('true');
  expect(cell('2026-10-05|540')).toHaveTextContent('1');
  expect(screen.queryByText('You')).toBeNull();
  await act(async () => void (await vi.advanceTimersByTimeAsync(3000)));
  expect(saveSlots).not.toHaveBeenCalled();
});

test('joining commits the draft at once', async () => {
  render(<EventView id="e1" onNew={vi.fn()} />);
  emit(boardOf([], null));
  paint('2026-10-05|540');
  joinAs('Zed');
  emit(boardOf([{ name: 'Zed', slots: new Set<string>(), optional: false, votes: [] }], 'Zed'));
  await screen.findByText('My times');
  expect(join).toHaveBeenCalledWith('e1', { name: 'Zed', password: '', optional: false });
  expect(saveSlots).toHaveBeenCalledTimes(1);
  expect(saveSlots).toHaveBeenCalledWith('e1', 'Zed', new Set(['2026-10-05|540']));
});

test('joining with an empty draft writes nothing', async () => {
  render(<EventView id="e1" onNew={vi.fn()} />);
  emit(boardOf([], null));
  joinAs('Zed');
  emit(boardOf([{ name: 'Zed', slots: new Set<string>(), optional: false, votes: [] }], 'Zed'));
  await screen.findByText('My times');
  expect(join).toHaveBeenCalledTimes(1);
  expect(saveSlots).not.toHaveBeenCalled();
});

test('joining an existing name saves the union of draft and stored slots', async () => {
  vi.mocked(join).mockResolvedValueOnce('Ava Chen');
  render(<EventView id="e1" onNew={vi.fn()} />);
  const ava = { name: 'Ava Chen', slots: new Set(['2026-10-05|540']), optional: false, votes: [] };
  emit(boardOf([ava], null));
  paint('2026-10-05|570');
  joinAs('Ava Chen');
  emit(boardOf([ava], 'Ava Chen'));
  await screen.findByText('My times');
  expect(saveSlots).toHaveBeenCalledWith('e1', 'Ava Chen', new Set(['2026-10-05|540', '2026-10-05|570']));
});

test('the union commit is the only write: no stale autosave follows the join', async () => {
  vi.mocked(join).mockResolvedValueOnce('Ava Chen');
  render(<EventView id="e1" onNew={vi.fn()} />);
  const ava = { name: 'Ava Chen', slots: new Set(['2026-10-05|540']), optional: false, votes: [] };
  emit(boardOf([ava], null));
  paint('2026-10-05|570');
  joinAs('Ava Chen');
  emit(boardOf([ava], 'Ava Chen'));
  await screen.findByText('My times');
  // Real timers: wait past the autosave debounce so a stale queued write would land.
  await act(async () => void (await new Promise((r) => setTimeout(r, 1000))));
  expect(saveSlots).toHaveBeenCalledTimes(1);
  expect(saveSlots).toHaveBeenCalledWith('e1', 'Ava Chen', new Set(['2026-10-05|540', '2026-10-05|570']));
});

test('painting then clearing before join never wipes stored slots', async () => {
  vi.mocked(join).mockResolvedValueOnce('Ava Chen');
  render(<EventView id="e1" onNew={vi.fn()} />);
  const ava = { name: 'Ava Chen', slots: new Set(['2026-10-05|540']), optional: false, votes: [] };
  emit(boardOf([ava], null));
  paint('2026-10-05|570');
  paint('2026-10-05|570');
  expect(cell('2026-10-05|570').getAttribute('aria-pressed')).toBe('false');
  joinAs('Ava Chen');
  emit(boardOf([ava], 'Ava Chen'));
  await screen.findByText('My times');
  await act(async () => void (await new Promise((r) => setTimeout(r, 1000))));
  expect(saveSlots).not.toHaveBeenCalled();
  expect(cell('2026-10-05|540')).toHaveTextContent('1');
});

test('closing with a draft warns; without one it does not', async () => {
  render(<EventView id="e1" onNew={vi.fn()} />);
  emit(boardOf([], null));
  const closing = () => {
    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  };
  expect(closing()).toBe(false);
  paint('2026-10-05|540');
  expect(closing()).toBe(true);
  paint('2026-10-05|540');
  expect(closing()).toBe(false);
});

test('closing after joining never warns', async () => {
  render(<EventView id="e1" onNew={vi.fn()} />);
  emit(boardOf([], null));
  paint('2026-10-05|540');
  joinAs('Zed');
  emit(boardOf([{ name: 'Zed', slots: new Set<string>(), optional: false, votes: [] }], 'Zed'));
  await screen.findByText('My times');
  const e = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(e);
  expect(e.defaultPrevented).toBe(false);
});

test('a remembered name loads stored slots instead of a draft', async () => {
  render(<EventView id="e1" onNew={vi.fn()} />);
  emit(
    boardOf(
      [{ name: 'Ava Chen', slots: new Set(['2026-10-05|540']), optional: false, votes: [] }],
      'Ava Chen',
    ),
  );
  await screen.findByText('My times');
  expect(cell('2026-10-05|540')).toHaveTextContent('1');
  expect(saveSlots).not.toHaveBeenCalled();
});
