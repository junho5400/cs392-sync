const SCOPE = 'https://www.googleapis.com/auth/calendar.freebusy';

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface TokenError {
  type: string;
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (resp: TokenResponse) => void;
        error_callback: (err: TokenError) => void;
      }) => TokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let loading: Promise<void> | null = null;

const loadClient = () => {
  loading ??= new Promise((resolve, reject) => {
    if (window.google?.accounts.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => (window.google?.accounts.oauth2 ? resolve() : reject(new Error('Could not reach Google.')));
    script.onerror = () => reject(new Error('Could not reach Google.'));
    document.head.appendChild(script);
  });
  return loading;
};

/** Google account access for free/busy only. The popup is the user's consent. */
export const connectCalendar = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google Calendar is not configured.');
  await loadClient();
  const google = window.google;
  if (!google) throw new Error('Could not reach Google.');
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    };
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (settled) return;
        if (resp.access_token) {
          settled = true;
          resolve(resp.access_token);
        } else fail('Calendar access was dismissed.');
      },
      error_callback: (err) =>
        fail(err.type === 'popup_failed_to_open' ? 'Allow popups to open Google Calendar.' : 'Calendar access was dismissed.'),
    });
    client.requestAccessToken();
  });
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Busy intervals on the primary calendar, as epoch milliseconds. */
export const fetchBusy = async (token: string, timeMin: string, timeMax: string) => {
  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: 'primary' }] }),
  });
  if (!res.ok) throw new Error('Could not read your calendar.');
  const data: unknown = await res.json();
  if (!isRecord(data) || !isRecord(data.calendars)) throw new Error('Could not read your calendar.');
  const primary = data.calendars.primary;
  if (!isRecord(primary) || (Array.isArray(primary.errors) && primary.errors.length > 0)) {
    throw new Error('Could not read your calendar.');
  }
  if (!Array.isArray(primary.busy)) return [];
  return primary.busy.flatMap((block) => {
    if (!isRecord(block) || typeof block.start !== 'string' || typeof block.end !== 'string') return [];
    const start = Date.parse(block.start);
    const end = Date.parse(block.end);
    return Number.isNaN(start) || Number.isNaN(end) ? [] : [{ start, end }];
  });
};
