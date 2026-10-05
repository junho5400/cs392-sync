const Section = ({ title, children }: { title: string; children: string }) => (
  <section className="flex flex-col gap-1.5">
    <h2 className="text-[15px] font-medium text-ink">{title}</h2>
    <p className="text-[13px] leading-relaxed text-ink-2">{children}</p>
  </section>
);

/** Public policy linked from the homepage. The wording matches what the app actually stores. */
export const Privacy = () => (
  <article className="rise-in mx-auto flex w-full max-w-[640px] flex-col gap-6 rounded-xl bg-surface p-6 shadow-card sm:p-8">
    <header className="flex flex-col gap-1.5">
      <h1 className="text-[22px] font-medium tracking-[-0.015em] text-ink">Privacy policy</h1>
      <p className="text-[13px] text-ink-3">October 5, 2026</p>
      <p className="text-[13px] leading-relaxed text-ink-2">
        Sync is a shared availability page. One person creates an event and shares the link. Everyone else marks when they are free. A person can also fill those marks from the busy times on their Google Calendar.
      </p>
    </header>

    <Section title="What Sync stores">
      Sync stores the event name, the dates or weekdays, the time range, the time zone, and the meeting length. It also stores the name you type, whether you are optional, the times you mark free, and up to three votes for suggested times if you cast them. Firebase Authentication gives the browser an anonymous id. Sync does not ask for your email address to use the page, and that id is not your Google account. If you set a password on your name, Sync stores only a hash of it and cannot read the password back. This browser remembers which name you used for an event.
    </Section>

    <Section title="Who can see an event">
      Anyone with the event link can see the event and the free times next to each name. Sync does not sell this information and does not use it for advertising.
    </Section>

    <Section title="Google Calendar">
      The Google Calendar button is optional. If you click it, Google asks you to let Sync see when you are busy. Sync reads busy intervals on your primary calendar for the dates on that event. It does not read event titles, locations, guests, or descriptions, and it does not change your calendar. The Google access token stays in your browser for that request and is not stored on Sync's server. Sync turns those busy intervals into free cells and saves the cells as your availability, the same as if you had painted them. The saved cells do not include the names of your calendar events. Sync's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.
    </Section>

    <Section title="Where it is kept">
      Event data is stored in Google Cloud Firestore. Sync does not give Google user data to any other app or company.
    </Section>

    <Section title="How long it stays">
      Sync has no account to delete. An event and the names on it stay available to anyone with the link. Closing the page does not erase what was already saved.
    </Section>

    <Section title="Contact">
      Questions about this policy, or about data on an event: realtonypark@gmail.com
    </Section>
  </article>
);
