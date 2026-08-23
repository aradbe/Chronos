const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  GameActionError,
  performAction,
} = require("../services/gameActionService");

const createGame = (overrides = {}) => ({
  status: "active",
  finishedAt: null,
  health: 100,
  score: 0,
  currentLocationId: "forum",
  currentTime: 0,
  discoveredLocationIds: ["forum"],
  objectives: [],
  triggeredEvents: [],
  scenarioId: {
    locations: [
      { id: "forum", connectedLocationIds: ["market"] },
      { id: "market", connectedLocationIds: ["forum", "harbor"] },
      { id: "harbor", connectedLocationIds: ["market"] },
    ],
    events: [],
  },
  ...overrides,
});

describe("MOVE action", () => {
  it("moves the player and discovers a new location", async () => {
    const game = createGame();

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.equal(game.currentLocationId, "market");
    assert.deepEqual(game.discoveredLocationIds, ["forum", "market"]);
  });

  it("completes a location objective after a successful move", async () => {
    const game = createGame({
      objectives: [{ objectiveId: "reach-market", status: "active" }],
    });
    game.scenarioId.objectives = [
      {
        id: "reach-market",
        type: "reach_location",
        targetId: "market",
      },
    ];

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.equal(game.objectives[0].status, "completed");
    assert.equal(game.status, "completed");
    assert.ok(game.finishedAt instanceof Date);
  });

  it("triggers eruption events that are due", async () => {
    const game = createGame({ currentTime: 55 });
    game.scenarioId.events = [
      { id: "first-tremor", triggerTime: 30 },
      { id: "ashfall", triggerTime: 60 },
      { id: "collapse", triggerTime: 120 },
    ];

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.deepEqual(game.triggeredEvents, ["first-tremor", "ashfall"]);
  });

  it("advances time for actions before checking the timeline", async () => {
    const game = createGame({ currentTime: 25 });
    game.scenarioId.events = [{ id: "first-tremor", triggerTime: 30 }];

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.equal(game.currentTime, 32);
    assert.deepEqual(game.triggeredEvents, ["first-tremor"]);
  });

  it("allows the player to wait", async () => {
    const game = createGame();

    await performAction(game, {
      type: "WAIT",
      payload: { minutes: 15 },
    });

    assert.equal(game.currentTime, 15);
  });

  it("does not duplicate an already discovered location", async () => {
    const game = createGame({
      discoveredLocationIds: ["forum", "market"],
    });

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.deepEqual(game.discoveredLocationIds, ["forum", "market"]);
  });

  it("requires a destination", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, { type: "MOVE", payload: {} }),
      (error) =>
        error instanceof GameActionError && error.code === "VALIDATION_ERROR",
    );
  });

  it("rejects a non-text destination", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: 123 },
      }),
      (error) =>
        error instanceof GameActionError && error.code === "VALIDATION_ERROR",
    );
  });

  it("rejects a location outside the scenario", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "rome" },
      }),
      (error) =>
        error instanceof GameActionError && error.code === "LOCATION_NOT_FOUND",
    );
  });

  it("rejects moving to the current location", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "forum" },
      }),
      (error) =>
        error instanceof GameActionError &&
        error.code === "ALREADY_AT_LOCATION",
    );
  });

  it("rejects movement between locations that are not connected", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "harbor" },
      }),
      (error) =>
        error instanceof GameActionError && error.code === "INVALID_MOVE",
    );

    assert.equal(game.currentLocationId, "forum");
    assert.deepEqual(game.discoveredLocationIds, ["forum"]);
  });

  it("rejects movement across a route blocked by an event", async () => {
    const game = createGame({ triggeredEvents: ["collapse"] });
    game.scenarioId.events = [
      {
        id: "collapse",
        triggerTime: 100,
        blockedRoutes: [
          { fromLocationId: "forum", toLocationId: "market" },
        ],
      },
    ];

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "market" },
      }),
      (error) =>
        error instanceof GameActionError && error.code === "ROUTE_BLOCKED",
    );

    assert.equal(game.currentLocationId, "forum");
    assert.equal(game.currentTime, 0);
  });

  it("rejects movement when the saved current location is invalid", async () => {
    const game = createGame({ currentLocationId: "missing" });

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "market" },
      }),
      (error) =>
        error instanceof GameActionError &&
        error.code === "INVALID_GAME_STATE",
    );
  });

  it("lets the player trade health for a faster route", async () => {
    const game = createGame();

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market", pace: "rush" },
    });

    assert.equal(game.currentTime, 4);
    assert.equal(game.health, 94);
  });

  it("charges time and explains a scenario-gated location", async () => {
    const game = createGame();
    game.scenarioId.locationGates = [
      {
        blockedAttemptPenaltyMinutes: 5,
        blockedFeedback: "You need a city map.",
        locationId: "market",
        requiresItems: ["city_map"],
      },
    ];

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "market" },
      }),
      (error) => {
        assert.equal(error.code, "LOCATION_LOCKED");
        assert.equal(error.gameChanged, true);
        assert.equal(error.guideEvent.minutesLost, 5);
        return true;
      },
    );

    assert.equal(game.currentLocationId, "forum");
    assert.equal(game.currentTime, 5);
  });

  it("opens a gated location after its requirements are met", async () => {
    const game = createGame({
      inventory: [{ itemId: "city_map", quantity: 1 }],
    });
    game.scenarioId.locationGates = [
      {
        blockedFeedback: "You need a city map.",
        locationId: "market",
        requiresItems: ["city_map"],
      },
    ];

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.equal(game.currentLocationId, "market");
  });
});
