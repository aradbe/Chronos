const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  getPendingEvents,
  triggerPendingEvents,
} = require("../services/eventService");

const createGame = (overrides = {}) => ({
  currentTime: 60,
  triggeredEvents: [],
  scenarioId: {
    events: [
      { id: "first-tremor", triggerTime: 30 },
      { id: "ashfall", triggerTime: 60 },
      { id: "collapse", triggerTime: 120 },
    ],
  },
  ...overrides,
});

describe("event service", () => {
  it("finds untriggered events whose time has arrived", () => {
    const game = createGame({ triggeredEvents: ["first-tremor"] });

    assert.deepEqual(
      getPendingEvents(game).map(({ id }) => id),
      ["ashfall"],
    );
  });

  it("records pending events in timeline order", () => {
    const game = createGame();

    const events = triggerPendingEvents(game);

    assert.deepEqual(
      events.map(({ id }) => id),
      ["first-tremor", "ashfall"],
    );
    assert.deepEqual(game.triggeredEvents, ["first-tremor", "ashfall"]);
  });

  it("does not trigger the same event twice", () => {
    const game = createGame();

    triggerPendingEvents(game);
    const secondRun = triggerPendingEvents(game);

    assert.deepEqual(secondRun, []);
    assert.deepEqual(game.triggeredEvents, ["first-tremor", "ashfall"]);
  });
});
