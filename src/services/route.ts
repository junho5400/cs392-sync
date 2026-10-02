export type Route = { name: 'create' } | { name: 'event'; id: string } | { name: 'missing' };

/** Shareable link for an event. */
export const eventPath = (id: string) => `/e/${encodeURIComponent(id)}`;

const EVENT_RE = /^\/e\/([^/]+)\/?$/;

/**
 * Parse a pathname. `/` is create, `/e/:id` is an event (trailing slash
 * tolerated), and anything else — including an empty or undecodable id —
 * is missing.
 */
export const parseRoute = (pathname: string): Route => {
  if (pathname === '/' || pathname === '') return { name: 'create' };
  const m = EVENT_RE.exec(pathname);
  if (!m) return { name: 'missing' };
  try {
    return { name: 'event', id: decodeURIComponent(m[1]) };
  } catch {
    return { name: 'missing' };
  }
};
