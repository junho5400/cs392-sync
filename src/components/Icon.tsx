const paths = {
  sun: 'M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  moon: 'M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z',
  link: 'M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1',
  check: 'M3.5 8.5l3 3 6-7',
  left: 'M10 3.5 5.5 8l4.5 4.5',
  right: 'M6 3.5 10.5 8 6 12.5',
  globe: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM1.5 8h13M8 1.5c1.7 1.8 2.5 4 2.5 6.5S9.7 12.7 8 14.5C6.3 12.7 5.5 10.5 5.5 8S6.3 3.3 8 1.5Z',
  clock: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM8 4.5V8l2.5 1.5',
  x: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
  plus: 'M8 3.5v9M3.5 8h9',
  undo: 'M5.5 3.5 2.5 6.5l3 3M2.5 6.5h7a4 4 0 0 1 0 8h-2',
  copy: 'M5.5 5.5v-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M3.5 5.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z',
} as const;

export type IconName = keyof typeof paths;

export const Icon = ({ name, className = 'size-3.5' }: { name: IconName; className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={paths[name]} />
  </svg>
);
