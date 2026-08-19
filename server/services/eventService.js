const getPendingEvents = (game) => {
  const events = game.scenarioId?.events || [];
  const triggered = new Set(game.triggeredEvents || []);

  return events
    .filter(
      (event) =>
        event.triggerTime <= game.currentTime && !triggered.has(event.id),
    )
    .sort((first, second) => first.triggerTime - second.triggerTime);
};

const triggerPendingEvents = (game) => {
  const events = getPendingEvents(game);

  if (!Array.isArray(game.triggeredEvents)) {
    game.triggeredEvents = [];
  }

  for (const event of events) {
    game.triggeredEvents.push(event.id);

    if (event.healthChange) {
      game.health = Math.max(0, Math.min(100, game.health + event.healthChange));
    }
  }

  return events;
};

module.exports = {
  getPendingEvents,
  triggerPendingEvents,
};
