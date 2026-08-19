import "./EventNotifications.css";

export function EventNotifications({ events, triggeredEventIds }) {
  const triggered = new Set(triggeredEventIds);
  const visibleEvents = events
    .filter((event) => triggered.has(event.id))
    .sort((first, second) => second.triggerTime - first.triggerTime);

  return (
    <section className="event-notifications" aria-labelledby="event-log-title">
      <h2 id="event-log-title">Event log</h2>
      {visibleEvents.length ? (
        <ol className="event-notifications__list" aria-live="polite">
          {visibleEvents.map((event) => (
            <li
              className={`event-notifications__event event-notifications__event--${event.type}`}
              key={event.id}
            >
              <time>{event.triggerTime} min</time>
              <p>{event.message}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="event-notifications__empty">
          The city is quiet—for now.
        </p>
      )}
    </section>
  );
}
