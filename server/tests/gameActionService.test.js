const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  GameActionError,
  performAction,
} = require("../services/gameActionService");

const createGame = (overrides = {}) => ({
  currentLocationId: "forum",
  discoveredLocationIds: ["forum"],
  scenarioId: {
    locations: [
      { id: "forum" },
      { id: "market" },
      { id: "harbor" },
    ],
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
});
